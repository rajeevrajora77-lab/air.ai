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

interface ListUsersOptions {
  page: number;
  limit: number;
  search?: string;
}

export class UserService {
  async getUserById(userId: string): Promise<User> {
    // Try cache first
    if (redis.isHealthy()) {
      const cached = await redis.get<User>(`user:${userId}`);
      if (cached) {
        return cached;
      }
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
    if (redis.isHealthy()) {
      await redis.set(`user:${userId}`, user, 300);
    }

    return user;
  }

  async listUsers(options: ListUsersOptions): Promise<{ users: User[]; total: number }> {
    const { page, limit, search } = options;
    const offset = (page - 1) * limit;

    let query = `SELECT id, email, first_name, last_name, role, is_active, is_verified, created_at, updated_at
                 FROM users`;
    let countQuery = `SELECT COUNT(*) as count FROM users`;
    const params: any[] = [];

    if (search) {
      query += ` WHERE email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1`;
      countQuery += ` WHERE email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const [dataResult, countResult] = await Promise.all([
      db.query<User>(query, params),
      db.query<{ count: string }>(countQuery, search ? [`%${search}%`] : []),
    ]);

    return {
      users: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  async updateUser(
    userId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      role?: string;
      isActive?: boolean;
      isVerified?: boolean;
    }
  ): Promise<User> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.firstName !== undefined) {
      fields.push(`first_name = $${paramIndex}`);
      values.push(updates.firstName);
      paramIndex++;
    }

    if (updates.lastName !== undefined) {
      fields.push(`last_name = $${paramIndex}`);
      values.push(updates.lastName);
      paramIndex++;
    }

    if (updates.role !== undefined) {
      fields.push(`role = $${paramIndex}`);
      values.push(updates.role);
      paramIndex++;
    }

    if (updates.isActive !== undefined) {
      fields.push(`is_active = $${paramIndex}`);
      values.push(updates.isActive);
      paramIndex++;
    }

    if (updates.isVerified !== undefined) {
      fields.push(`is_verified = $${paramIndex}`);
      values.push(updates.isVerified);
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
    if (redis.isHealthy()) {
      await redis.set(`user:${userId}`, user, 300);
    }

    logger.info('User updated:', userId);

    return user;
  }

  async getUserStats(userId: string): Promise<UserStats> {
    // Try cache first
    if (redis.isHealthy()) {
      const cached = await redis.get<UserStats>(`user:stats:${userId}`);
      if (cached) {
        return cached;
      }
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
    if (redis.isHealthy()) {
      await redis.set(`user:stats:${userId}`, stats, 60);
    }

    return stats;
  }

  async deleteUser(userId: string): Promise<void> {
    await db.transaction(async (client) => {
      // Delete user's conversations and messages first
      await client.query(
        `DELETE FROM messages WHERE conversation_id IN 
         (SELECT id FROM conversations WHERE user_id = $1)`,
        [userId]
      );
      await client.query('DELETE FROM conversations WHERE user_id = $1', [userId]);
      // Delete user
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
    });

    // Clear cache
    if (redis.isHealthy()) {
      await redis.del(`user:${userId}`);
      await redis.del(`user:stats:${userId}`);
      await redis.del(`refresh:${userId}`);
    }

    logger.info('User deleted:', userId);
  }
}

export const userService = new UserService();