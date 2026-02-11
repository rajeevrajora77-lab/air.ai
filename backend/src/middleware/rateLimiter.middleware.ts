import { Request, Response, NextFunction } from 'express';
import { redis } from '../database/redis';
import logger from '../utils/logger';
import config from '../config';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response) => void;
}

export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => req.ip || 'unknown',
    handler = defaultHandler,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!redis.isHealthy()) {
      // If Redis is down, allow requests (fail open)
      logger.warn('Rate limiter bypassed - Redis unavailable');
      return next();
    }

    try {
      const key = `ratelimit:${keyGenerator(req)}`;
      const current = await redis.get<number>(key);

      if (current === null) {
        // First request in window
        await redis.set(key, 1, Math.ceil(windowMs / 1000));
        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', (maxRequests - 1).toString());
        return next();
      }

      if (current >= maxRequests) {
        // Rate limit exceeded
        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        logger.warn('Rate limit exceeded:', {
          key,
          current,
          maxRequests,
          ip: req.ip,
          path: req.path,
        });
        return handler(req, res);
      }

      // Increment counter
      await redis.set(key, current + 1, Math.ceil(windowMs / 1000));
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - current - 1).toString());
      return next();
    } catch (error) {
      logger.error('Rate limiter error:', error);
      // Fail open on error
      return next();
    }
  };
};

const defaultHandler = (req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
  });
};

// Pre-configured rate limiters
export const generalRateLimiter = createRateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  maxRequests: config.RATE_LIMIT_MAX_REQUESTS,
});

export const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: config.RATE_LIMIT_REFRESH_MAX, // 5 requests
  keyGenerator: (req) => {
    // Rate limit by both IP and user ID for auth endpoints
    const userId = (req as any).user?.id || 'anonymous';
    return `${req.ip}:${userId}`;
  },
});

export default createRateLimiter;