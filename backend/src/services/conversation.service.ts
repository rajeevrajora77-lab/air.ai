import { db } from '../database/postgres';
import { redis } from '../database/redis';
import { aiService } from './ai.service';
import logger from '../utils/logger';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors';
import { aiRequestDuration } from '../utils/metrics';

interface Conversation {
  id: string;
  user_id: string;
  title: string;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
}

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used?: number;
  model?: string;
  metadata?: any;
  created_at: Date;
}

interface CreateMessageData {
  content: string;
  model?: string;
  provider?: string;
}

export class ConversationService {
  async createConversation(userId: string, title: string): Promise<Conversation> {
    const result = await db.query<Conversation>(
      `INSERT INTO conversations (user_id, title)
       VALUES ($1, $2)
       RETURNING id, user_id, title, is_archived, created_at, updated_at`,
      [userId, title]
    );

    // Clear stats cache
    if (redis.isHealthy()) {
      await redis.del(`user:stats:${userId}`);
    }

    logger.info('Conversation created:', result.rows[0].id);

    return result.rows[0];
  }

  async getConversation(conversationId: string, userId: string): Promise<Conversation> {
    const result = await db.query<Conversation>(
      `SELECT id, user_id, title, is_archived, created_at, updated_at
       FROM conversations WHERE id = $1`,
      [conversationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Conversation');
    }

    const conversation = result.rows[0];

    // Check authorization
    if (conversation.user_id !== userId) {
      throw new AuthorizationError('Access denied');
    }

    return conversation;
  }

  async listConversations(
    userId: string,
    options: { includeArchived?: boolean; limit?: number; offset?: number } = {}
  ): Promise<{ conversations: Conversation[]; total: number }> {
    const { includeArchived = false, limit = 20, offset = 0 } = options;

    // Safe parameterized queries
    const [dataResult, countResult] = await Promise.all([
      includeArchived
        ? db.query<Conversation>(
            `SELECT id, user_id, title, is_archived, created_at, updated_at
             FROM conversations
             WHERE user_id = $1
             ORDER BY updated_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
          )
        : db.query<Conversation>(
            `SELECT id, user_id, title, is_archived, created_at, updated_at
             FROM conversations
             WHERE user_id = $1 AND is_archived = false
             ORDER BY updated_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
          ),
      includeArchived
        ? db.query<{ count: string }>(
            `SELECT COUNT(*) as count FROM conversations WHERE user_id = $1`,
            [userId]
          )
        : db.query<{ count: string }>(
            `SELECT COUNT(*) as count FROM conversations WHERE user_id = $1 AND is_archived = false`,
            [userId]
          ),
    ]);

    return {
      conversations: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  async updateConversation(
    conversationId: string,
    userId: string,
    updates: { title?: string; isArchived?: boolean }
  ): Promise<Conversation> {
    // Check authorization first
    await this.getConversation(conversationId, userId);

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${paramIndex}`);
      values.push(updates.title);
      paramIndex++;
    }

    if (updates.isArchived !== undefined) {
      fields.push(`is_archived = $${paramIndex}`);
      values.push(updates.isArchived);
      paramIndex++;
    }

    if (fields.length === 0) {
      return this.getConversation(conversationId, userId);
    }

    values.push(conversationId);

    const result = await db.query<Conversation>(
      `UPDATE conversations
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING id, user_id, title, is_archived, created_at, updated_at`,
      values
    );

    logger.info('Conversation updated:', conversationId);

    return result.rows[0];
  }

  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    // Check authorization
    await this.getConversation(conversationId, userId);

    await db.transaction(async (client) => {
      // Delete messages first (if no CASCADE)
      await client.query('DELETE FROM messages WHERE conversation_id = $1', [conversationId]);
      // Delete conversation
      await client.query('DELETE FROM conversations WHERE id = $1', [conversationId]);
    });

    // Clear stats cache
    if (redis.isHealthy()) {
      await redis.del(`user:stats:${userId}`);
    }

    logger.info('Conversation deleted:', conversationId);
  }

  async getMessages(
    conversationId: string,
    userId: string,
    options: { limit?: number; before?: string } = {}
  ): Promise<Message[]> {
    // Check authorization
    await this.getConversation(conversationId, userId);

    const { limit = 50, before } = options;

    let query = `SELECT id, conversation_id, role, content, tokens_used, model, metadata, created_at
                 FROM messages
                 WHERE conversation_id = $1`;
    const params: any[] = [conversationId];

    if (before) {
      query += ` AND created_at < $${params.length + 1}`;
      params.push(before);
    }

    query += ` ORDER BY created_at ASC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await db.query<Message>(query, params);

    return result.rows;
  }

  async createMessage(
    conversationId: string,
    userId: string,
    data: CreateMessageData
  ): Promise<{ userMessage: Message; assistantMessage: Message }> {
    // Check authorization
    await this.getConversation(conversationId, userId);

    // Get conversation history
    const history = await this.getMessages(conversationId, userId, { limit: 10 });

    // Use transaction to ensure atomicity
    return await db.transaction(async (client) => {
      // Save user message first
      const userMessageResult = await client.query<Message>(
        `INSERT INTO messages (conversation_id, role, content)
         VALUES ($1, $2, $3)
         RETURNING id, conversation_id, role, content, tokens_used, model, metadata, created_at`,
        [conversationId, 'user', data.content]
      );

      const userMessage = userMessageResult.rows[0];

      // Call AI service (outside transaction to avoid long-running transaction)
      // If this fails, user message is saved but we throw error
      // Client can retry and we'll have the user message in history
      const startTime = Date.now();
      try {
        const messages = [
          ...history.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user' as const, content: data.content },
        ];

        const aiResponse = await aiService.chat(
          messages,
          data.provider as any,
          data.model
        );

        const duration = (Date.now() - startTime) / 1000;
        aiRequestDuration.observe(
          { model: aiResponse.model, status: 'success' },
          duration
        );

        // Save assistant message
        const assistantMessageResult = await client.query<Message>(
          `INSERT INTO messages (conversation_id, role, content, tokens_used, model, metadata)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, conversation_id, role, content, tokens_used, model, metadata, created_at`,
          [
            conversationId,
            'assistant',
            aiResponse.content,
            aiResponse.tokensUsed,
            aiResponse.model,
            JSON.stringify({ provider: aiResponse.provider, finishReason: aiResponse.finishReason }),
          ]
        );

        const assistantMessage = assistantMessageResult.rows[0];

        // Update conversation updated_at
        await client.query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [
          conversationId,
        ]);

        // Clear stats cache
        if (redis.isHealthy()) {
          await redis.del(`user:stats:${userId}`);
        }

        logger.info('Messages created in conversation:', conversationId);

        return { userMessage, assistantMessage };
      } catch (error) {
        const duration = (Date.now() - startTime) / 1000;
        aiRequestDuration.observe(
          { model: data.model || 'unknown', status: 'error' },
          duration
        );
        
        logger.error('AI service error:', error);
        throw new ValidationError('Failed to get AI response. Your message was saved.');
      }
    });
  }
}

export const conversationService = new ConversationService();