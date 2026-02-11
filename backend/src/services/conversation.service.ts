import axios from 'axios';
import { db } from '../database/postgres';
import { redis } from '../database/redis';
import config from '../config';
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
}

export class ConversationService {
  private readonly OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly DEFAULT_MODEL = 'openai/gpt-3.5-turbo';

  async createConversation(userId: string, title: string): Promise<Conversation> {
    const result = await db.query<Conversation>(
      `INSERT INTO conversations (user_id, title)
       VALUES ($1, $2)
       RETURNING id, user_id, title, is_archived, created_at, updated_at`,
      [userId, title]
    );

    // Clear stats cache
    await redis.del(`user:stats:${userId}`);

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

    const whereClause = includeArchived
      ? 'user_id = $1'
      : 'user_id = $1 AND is_archived = false';

    const [dataResult, countResult] = await Promise.all([
      db.query<Conversation>(
        `SELECT id, user_id, title, is_archived, created_at, updated_at
         FROM conversations
         WHERE ${whereClause}
         ORDER BY updated_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      ),
      db.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM conversations WHERE ${whereClause}`,
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
      // Delete conversation (cascades to messages)
      await client.query('DELETE FROM conversations WHERE id = $1', [conversationId]);
    });

    // Clear stats cache
    await redis.del(`user:stats:${userId}`);

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
      query += ' AND created_at < $2';
      params.push(before);
    }

    query += ' ORDER BY created_at ASC LIMIT $' + (params.length + 1);
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

    // Save user message
    const userMessageResult = await db.query<Message>(
      `INSERT INTO messages (conversation_id, role, content)
       VALUES ($1, $2, $3)
       RETURNING id, conversation_id, role, content, tokens_used, model, metadata, created_at`,
      [conversationId, 'user', data.content]
    );

    const userMessage = userMessageResult.rows[0];

    // Call AI API
    const startTime = Date.now();
    try {
      const aiResponse = await this.callAI(history, data.content, data.model);
      const duration = (Date.now() - startTime) / 1000;
      aiRequestDuration.observe({ model: aiResponse.model, status: 'success' }, duration);

      // Save assistant message
      const assistantMessageResult = await db.query<Message>(
        `INSERT INTO messages (conversation_id, role, content, tokens_used, model, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, conversation_id, role, content, tokens_used, model, metadata, created_at`,
        [
          conversationId,
          'assistant',
          aiResponse.content,
          aiResponse.tokensUsed,
          aiResponse.model,
          aiResponse.metadata,
        ]
      );

      const assistantMessage = assistantMessageResult.rows[0];

      // Update conversation updated_at
      await db.query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [
        conversationId,
      ]);

      // Clear stats cache
      await redis.del(`user:stats:${userId}`);

      logger.info('Messages created in conversation:', conversationId);

      return { userMessage, assistantMessage };
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      aiRequestDuration.observe(
        { model: data.model || this.DEFAULT_MODEL, status: 'error' },
        duration
      );
      throw error;
    }
  }

  private async callAI(
    history: Message[],
    userMessage: string,
    model?: string
  ): Promise<{ content: string; tokensUsed: number; model: string; metadata: any }> {
    const messages = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ];

    try {
      const response = await axios.post(
        this.OPENROUTER_URL,
        {
          model: model || this.DEFAULT_MODEL,
          messages,
        },
        {
          headers: {
            'Authorization': `Bearer ${config.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://air.ai',
            'X-Title': 'air.ai',
          },
          timeout: 30000,
        }
      );

      const { choices, usage, model: responseModel } = response.data;

      return {
        content: choices[0].message.content,
        tokensUsed: usage?.total_tokens || 0,
        model: responseModel,
        metadata: { usage, finish_reason: choices[0].finish_reason },
      };
    } catch (error: any) {
      logger.error('AI API error:', error.response?.data || error.message);
      throw new ValidationError('Failed to get AI response');
    }
  }
}

export const conversationService = new ConversationService();