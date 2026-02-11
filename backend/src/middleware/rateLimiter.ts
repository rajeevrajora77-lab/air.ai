import { Request, Response, NextFunction } from 'express';
import { redis } from '../database/redis';
import { RateLimitError } from '../utils/errors';
import config from '../config';
import logger from '../utils/logger';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
}

const defaultOptions: RateLimitOptions = {
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  maxRequests: config.RATE_LIMIT_MAX_REQUESTS,
  keyGenerator: (req) => {
    const user = (req as any).user;
    return user ? `ratelimit:user:${user.id}` : `ratelimit:ip:${req.ip}`;
  },
  skipSuccessfulRequests: false,
};

export const rateLimiter = (options: Partial<RateLimitOptions> = {}) => {
  const opts = { ...defaultOptions, ...options };

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = opts.keyGenerator!(req);
      const windowKey = `${key}:${Math.floor(Date.now() / opts.windowMs)}`;

      // Get current count
      const current = await redis.getClient().incr(windowKey);

      // Set expiry on first request in window
      if (current === 1) {
        await redis.getClient().expire(windowKey, Math.ceil(opts.windowMs / 1000));
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', opts.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, opts.maxRequests - current));
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + opts.windowMs).toISOString());

      // Check if limit exceeded
      if (current > opts.maxRequests) {
        logger.warn('Rate limit exceeded:', { key, current, limit: opts.maxRequests });
        throw new RateLimitError('Too many requests, please try again later');
      }

      next();
    } catch (error) {
      if (error instanceof RateLimitError) {
        next(error);
      } else {
        logger.error('Rate limiter error:', error);
        // Continue on rate limiter errors to avoid blocking requests
        next();
      }
    }
  };
};

// Specific rate limiters
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyGenerator: (req) => `ratelimit:auth:${req.ip}`,
});

export const apiRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
});

export const messageRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  keyGenerator: (req) => {
    const user = (req as any).user;
    return `ratelimit:messages:${user?.id || req.ip}`;
  },
});