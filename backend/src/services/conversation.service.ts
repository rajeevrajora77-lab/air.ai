import { db } from '../database/postgres';
import { redis } from '../database/redis';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import logger from '../utils/logger';
import aiService, { AIMessage, AIProvider } from './ai.service';

interface Conversation {
  id: string;
  userid: string;
  title: string;
  isarchived: boolean;
  provider: string;
  model: string;
  createdat: Date;
  updatedat: Date;
}

interface Message {
  id: string;
  conversationid: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokensused?: number;
  model?: string;
  provider?: string;
  createdat: Date;
}

export class ConversationService {
  async createConversation(
    userId: string,
    title: string,
    initialMessage: string,
    provider?: AIProvider,
    model?: string
  ): Promise<{
    conversation: Conversation;
    message: Message;
    response: Message;
  }> {
    return db.transaction(async (client) => {
      // Create conversation
      const convResult = await client.query<Conversation>(
        `INSERT INTO conversations (userid, title, provider, model)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, title, provider || aiService.getDefaultProvider(), model || 'default']
      );
      const conversation = convResult.rows[0];

      // Create user message
      const userMsgResult = await client.query<Message>(
        `INSERT INTO messages (conversationid, role, content)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [conversation.id, 'user', initialMessage]
      );
      const userMessage = userMsgResult.rows[0];

      // Get AI response
      const aiResponse = await aiService.chat(
        [{ role: 'user', content: initialMessage }],
        provider,
        model
      );

      // Save AI response
      const aiMsgResult = await client.query<Message>(
        `INSERT INTO messages (conversationid, role, content, tokensused, model, provider)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          conversation.id,
          'assistant',
          aiResponse.content,
          aiResponse.tokensUsed,
          aiResponse.model,
          aiResponse.provider,
        ]
      );

      logger.info('Conversation created:', conversation.id);

      return {
        conversation,
        message: userMessage,
        response: aiMsgResult.rows[0],
      };
    });
  }

  async getConversations(
    userId: string,
    options: { limit?: number; offset?: number; archived?: boolean } = {}
  ): Promise<{ conversations: Conversation[]; total: number }> {
    const { limit = 20, offset = 0, archived = false } = options;

    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) FROM conversations WHERE userid = $1 AND isarchived = $2',
      [userId, archived]
    );
    const total = parseInt(countResult.rows[0].count);

    // Get conversations
    const result = await db.query<Conversation>(
      `SELECT * FROM conversations
       WHERE userid = $1 AND isarchived = $2
       ORDER BY updatedat DESC
       LIMIT $3 OFFSET $4`,
      [userId, archived, limit, offset]
    );

    return {
      conversations: result.rows,
      total,
    };
  }

  async getConversation(
    conversationId: string,
    userId: string
  ): Promise<{ conversation: Conversation; messages: Message[] }> {
    // Get conversation
    const convResult = await db.query<Conversation>(
      'SELECT * FROM conversations WHERE id = $1',
      [conversationId]
    );

    if (convResult.rows.length === 0) {
      throw new NotFoundError('Conversation');
    }

    const conversation = convResult.rows[0];

    // Check ownership
    if (conversation.userid !== userId) {
      throw new AuthorizationError('Not authorized to access this conversation');
    }

    // Get messages
    const msgResult = await db.query<Message>(
      'SELECT * FROM messages WHERE conversationid = $1 ORDER BY createdat ASC',
      [conversationId]
    );

    return {
      conversation,
      messages: msgResult.rows,
    };
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    content: string
  ): Promise<{ userMessage: Message; aiMessage: Message }> {
    // Verify conversation ownership
    const convResult = await db.query<Conversation>(
      'SELECT * FROM conversations WHERE id = $1',
      [conversationId]
    );

    if (convResult.rows.length === 0) {
      throw new NotFoundError('Conversation');
    }

    if (convResult.rows[0].userid !== userId) {
      throw new AuthorizationError('Not authorized');
    }

    const conversation = convResult.rows[0];

    return db.transaction(async (client) => {
      // Save user message
      const userMsgResult = await client.query<Message>(
        `INSERT INTO messages (conversationid, role, content)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [conversationId, 'user', content]
      );
      const userMessage = userMsgResult.rows[0];

      // Get conversation history
      const historyResult = await client.query<Message>(
        'SELECT role, content FROM messages WHERE conversationid = $1 ORDER BY createdat ASC',
        [conversationId]
      );
      const history: AIMessage[] = historyResult.rows.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Get AI response
      const aiResponse = await aiService.chat(
        history,
        conversation.provider as AIProvider,
        conversation.model !== 'default' ? conversation.model : undefined
      );

      // Save AI message
      const aiMsgResult = await client.query<Message>(
        `INSERT INTO messages (conversationid, role, content, tokensused, model, provider)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          conversationId,
          'assistant',
          aiResponse.content,
          aiResponse.tokensUsed,
          aiResponse.model,
          aiResponse.provider,
        ]
      );

      // Update conversation timestamp
      await client.query('UPDATE conversations SET updatedat = NOW() WHERE id = $1', [
        conversationId,
      ]);

      return {
        userMessage,
        aiMessage: aiMsgResult.rows[0],
      };
    });
  }

  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    const result = await db.query(
      'DELETE FROM conversations WHERE id = $1 AND userid = $2 RETURNING id',
      [conversationId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Conversation');
    }

    // Clear cache
    await redis.delPattern(`conv:${conversationId}*`);

    logger.info('Conversation deleted:', conversationId);
  }
}

export const conversationService = new ConversationService();