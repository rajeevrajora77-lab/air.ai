import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { db } from '../database/postgres';
import { redis } from '../database/redis';
import logger from '../utils/logger';
import { AuthenticationError, ConflictError, ValidationError } from '../utils/errors';

interface User {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  token_version: number; // For token invalidation
  created_at: Date;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse {
  user: Omit<User, 'password' | 'token_version'>;
  tokens: TokenPair;
}

export class AuthService {
  private generateAccessToken(payload: { id: string; email: string; role: string; version: number }): string {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_ACCESS_EXPIRATION,
      issuer: 'air-api',
      audience: 'air-client',
    });
  }

  private generateRefreshToken(userId: string, version: number): string {
    return jwt.sign(
      { id: userId, type: 'refresh', version },
      config.JWT_REFRESH_SECRET,
      {
        expiresIn: config.JWT_REFRESH_EXPIRATION,
        issuer: 'air-api',
      }
    );
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.BCRYPT_ROUNDS);
  }

  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = data;

    // Check if user exists
    const existingUser = await db.query<User>(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user in transaction
    const result = await db.transaction(async (client) => {
      const userResult = await client.query<User>(
        `INSERT INTO users (email, password, first_name, last_name, role, token_version)
         VALUES ($1, $2, $3, $4, $5, 0)
         RETURNING id, email, first_name, last_name, role, is_active, is_verified, token_version, created_at`,
        [email.toLowerCase(), hashedPassword, firstName, lastName, 'user']
      );
      return userResult.rows[0];
    });

    // Generate tokens
    const tokens = await this.generateTokens(result);

    // Cache user session (graceful degradation if Redis fails)
    await this.cacheUserSession(result.id, tokens.refreshToken);

    logger.info('User registered:', result.email);

    const { token_version, ...userWithoutSensitiveData } = result;

    return {
      user: userWithoutSensitiveData,
      tokens,
    };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    // Get user with password
    const result = await db.query<User>(
      `SELECT id, email, password, first_name, last_name, role, is_active, is_verified, token_version, created_at
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    const user = result.rows[0];
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Check if account is active
    if (!user.is_active) {
      throw new AuthenticationError('Account has been deactivated');
    }

    // Verify password
    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Cache user session (graceful degradation if Redis fails)
    await this.cacheUserSession(user.id, tokens.refreshToken);

    // Remove password and token_version from response
    const { password: _, token_version, ...userWithoutSensitiveData } = user;

    logger.info('User logged in:', user.email);

    return {
      user: userWithoutSensitiveData,
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as {
        id: string;
        type: string;
        version: number;
      };

      if (decoded.type !== 'refresh') {
        throw new AuthenticationError('Invalid token type');
      }

      // Get user with token version
      const result = await db.query<User>(
        'SELECT id, email, role, is_active, token_version FROM users WHERE id = $1',
        [decoded.id]
      );

      const user = result.rows[0];
      if (!user || !user.is_active) {
        throw new AuthenticationError('User not found or inactive');
      }

      // Validate token version (database-backed invalidation)
      if (decoded.version !== user.token_version) {
        throw new AuthenticationError('Token has been invalidated');
      }

      // Check if token is in cache (if Redis is available)
      if (redis.isHealthy()) {
        const cachedToken = await redis.get<string>(`refresh:${decoded.id}`);
        if (cachedToken && cachedToken !== refreshToken) {
          throw new AuthenticationError('Invalid refresh token');
        }
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Update cached session with new refresh token
      await this.cacheUserSession(user.id, tokens.refreshToken);

      logger.info('Tokens refreshed for user:', user.email);

      return tokens;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid refresh token');
      }
      throw error;
    }
  }

  async logout(userId: string, accessToken: string): Promise<void> {
    // Remove refresh token from cache (if Redis available)
    if (redis.isHealthy()) {
      await redis.del(`refresh:${userId}`);
    }

    // Don't blacklist access tokens - too memory intensive
    // Instead, rely on short TTL (15min) and token version for invalidation

    logger.info('User logged out:', userId);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Get user with password
    const result = await db.query<User>(
      'SELECT id, email, password, token_version FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Verify current password
    const isValidPassword = await this.comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password and increment token version (invalidates all tokens)
    await db.query(
      'UPDATE users SET password = $1, token_version = token_version + 1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );

    // Clear cached session (if Redis available)
    if (redis.isHealthy()) {
      await redis.del(`refresh:${userId}`);
    }

    logger.info('Password changed for user:', user.email);
  }

  async invalidateAllUserTokens(userId: string): Promise<void> {
    // Increment token version to invalidate all tokens
    await db.query(
      'UPDATE users SET token_version = token_version + 1 WHERE id = $1',
      [userId]
    );

    // Clear cached session (if Redis available)
    if (redis.isHealthy()) {
      await redis.del(`refresh:${userId}`);
    }

    logger.info('All tokens invalidated for user:', userId);
  }

  private async generateTokens(user: User): Promise<TokenPair> {
    const accessToken = this.generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      version: user.token_version,
    });

    const refreshToken = this.generateRefreshToken(user.id, user.token_version);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async cacheUserSession(userId: string, refreshToken: string): Promise<void> {
    if (!redis.isHealthy()) {
      logger.warn('Redis unavailable, skipping session cache');
      return;
    }

    try {
      // Cache only the refresh token for 7 days
      // This provides faster validation but gracefully degrades if Redis fails
      await redis.set(`refresh:${userId}`, refreshToken, 7 * 24 * 60 * 60);
    } catch (error) {
      // Log but don't fail - auth still works via DB token_version
      logger.warn('Failed to cache user session:', error);
    }
  }
}

export const authService = new AuthService();