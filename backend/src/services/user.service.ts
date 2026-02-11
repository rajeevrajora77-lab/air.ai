import { db } from '../database/postgres';
import { redis } from '../database/redis';
import { NotFoundError, ConflictError } from '../utils/errors';
import logger from '../utils/logger';

interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: string;
  isactive: boolean;
  isverified: boolean;
  createdat: Date;
  updatedat: Date;
}

export class UserService {
  private readonly CACHE_TTL = 300; // 5 minutes

  async getProfile(userId: string): Promise<User> {
    // Try cache first
    const cached = await redis.get<User>(`user:${userId}`);
    if (cached) {
      return cached;
    }

    const result = await db.query<User>(
      `SELECT id, email, firstname, lastname, role, isactive, isverified, createdat, updatedat
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User');
    }

    const user = result.rows[0];

    // Cache user profile
    await redis.set(`user:${userId}`, user, this.CACHE_TTL);

    return user;
  }

  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; email?: string }
  ): Promise<User> {
    const { firstName, lastName, email } = data;

    // Check if email is already taken
    if (email) {
      const existing = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.toLowerCase(), userId]
      );

      if (existing.rows.length > 0) {
        throw new ConflictError('Email already in use');
      }
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (firstName) {
      updates.push(`firstname = $${paramCount++}`);
      values.push(firstName);
    }
    if (lastName) {
      updates.push(`lastname = $${paramCount++}`);
      values.push(lastName);
    }
    if (email) {
      updates.push(`email = $${paramCount++}`);
      values.push(email.toLowerCase());
    }

    updates.push('updatedat = NOW()');
    values.push(userId);

    const result = await db.query<User>(
      `UPDATE users SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, email, firstname, lastname, role, isactive, isverified, createdat, updatedat`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User');
    }

    const user = result.rows[0];

    // Invalidate cache
    await redis.del(`user:${userId}`);

    logger.info('User profile updated:', userId);

    return user;
  }

  async deleteAccount(userId: string): Promise<void> {
    await db.transaction(async (client) => {
      // Delete user (cascade will delete conversations and messages)
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
    });

    // Clear cache
    await redis.del(`user:${userId}`);
    await redis.del(`refresh:${userId}`);

    logger.info('User account deleted:', userId);
  }

  async getUserStats(userId: string): Promise<{
    totalConversations: number;
    totalMessages: number;
    accountAge: number;
  }> {
    const cacheKey = `stats:${userId}`;
    const cached = await redis.get<any>(cacheKey);
    if (cached) return cached;

    const result = await db.query(
      `SELECT
         (SELECT COUNT(*) FROM conversations WHERE userid = $1) as totalconversations,
         (SELECT COUNT(*) FROM messages m JOIN conversations c ON m.conversationid = c.id WHERE c.userid = $1) as totalmessages,
         EXTRACT(DAY FROM NOW() - (SELECT createdat FROM users WHERE id = $1)) as accountage`,
      [userId]
    );

    const stats = {
      totalConversations: parseInt(result.rows[0].totalconversations),
      totalMessages: parseInt(result.rows[0].totalmessages),
      accountAge: parseInt(result.rows[0].accountage),
    };

    // Cache for 1 hour
    await redis.set(cacheKey, stats, 3600);

    return stats;
  }
}

export const userService = new UserService();