import { Request, Response, NextFunction } from 'express';
import { redis } from '../database/redis';
import { RateLimitError } from '../utils/errors';
import config from '../config';
import logger from '../utils/logger';

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
}

export const rateLimiter = (options: RateLimitOptions = {}) => {
  const {
    windowMs = config.RATE_LIMIT_WINDOW_MS,
    maxRequests = config.RATE_LIMIT_MAX_REQUESTS,
    keyGenerator = (req: Request) => req.ip || 'unknown',
    skipSuccessfulRequests = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = `ratelimit:${keyGenerator(req)}`;
      const current = await redis.get<number>(key) || 0;

      if (current >= maxRequests) {
        throw new RateLimitError('Too many requests, please try again later');
      }

      // Increment counter
      const newCount = current + 1;
      await redis.set(key, newCount, Math.ceil(windowMs / 1000));

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - newCount);
      res.setHeader('X-RateLimit-Reset', Date.now() + windowMs);

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Stricter rate limit for auth endpoints
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyGenerator: (req: Request) => `auth:${req.ip}`,
});

// Rate limit per user for AI requests
export const aiRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20,
  keyGenerator: (req: any) => `ai:${req.user?.id || req.ip}`,
});