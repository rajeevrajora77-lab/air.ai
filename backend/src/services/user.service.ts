import { db } from '../database/postgres';
import { redis } from '../database/redis';
import logger from '../utils/logger';
import { NotFoundError } from '../utils/errors';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

interface UserStats {
  totalConversations: number;
  totalMessages: number;
  tokensUsed: number;
}

export class UserService {
  async getUserById(userId: string): Promise<User> {
    // Try cache first
    const cached = await redis.get<User>(`user:${userId}`);
    if (cached) {
      return cached;
    }

    const result = await db.query<User>(
      `SELECT id, email, first_name, last_name, role, is_active, is_verified, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User');
    }

    const user = result.rows[0];

    // Cache for 5 minutes
    await redis.set(`user:${userId}`, user, 300);

    return user;
  }

  async updateProfile(
    userId: string,
    updates: { firstName?: string; lastName?: string }
  ): Promise<User> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.firstName) {
      fields.push(`first_name = $${paramIndex}`);
      values.push(updates.firstName);
      paramIndex++;
    }

    if (updates.lastName) {
      fields.push(`last_name = $${paramIndex}`);
      values.push(updates.lastName);
      paramIndex++;
    }

    if (fields.length === 0) {
      return this.getUserById(userId);
    }

    values.push(userId);

    const result = await db.query<User>(
      `UPDATE users
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING id, email, first_name, last_name, role, is_active, is_verified, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User');
    }

    const user = result.rows[0];

    // Update cache
    await redis.set(`user:${userId}`, user, 300);

    logger.info('User profile updated:', userId);

    return user;
  }

  async getUserStats(userId: string): Promise<UserStats> {
    // Try cache first
    const cached = await redis.get<UserStats>(`user:stats:${userId}`);
    if (cached) {
      return cached;
    }

    const result = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM conversations WHERE user_id = $1) as total_conversations,
        (SELECT COUNT(*) FROM messages m 
         JOIN conversations c ON m.conversation_id = c.id 
         WHERE c.user_id = $1) as total_messages,
        (SELECT COALESCE(SUM(tokens_used), 0) FROM messages m
         JOIN conversations c ON m.conversation_id = c.id
         WHERE c.user_id = $1) as tokens_used`,
      [userId]
    );

    const stats: UserStats = {
      totalConversations: parseInt(result.rows[0].total_conversations),
      totalMessages: parseInt(result.rows[0].total_messages),
      tokensUsed: parseInt(result.rows[0].tokens_used),
    };

    // Cache for 1 minute
    await redis.set(`user:stats:${userId}`, stats, 60);

    return stats;
  }

  async deleteUser(userId: string): Promise<void> {
    await db.transaction(async (client) => {
      // Delete user (cascades to conversations and messages)
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
    });

    // Clear cache
    await redis.del(`user:${userId}`);
    await redis.del(`user:stats:${userId}`);
    await redis.del(`refresh:${userId}`);

    logger.info('User deleted:', userId);
  }
}

export const userService = new UserService();