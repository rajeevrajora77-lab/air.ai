import { Request, Response } from 'express';
import { db } from '../database/postgres';
import { redis } from '../database/redis';
import { register } from '../utils/metrics';
import { asyncHandler } from '../middleware/errorHandler';

export class HealthController {
  health = asyncHandler(async (req: Request, res: Response) => {
    const dbHealthy = await db.healthCheck();
    const redisHealthy = await redis.healthCheck();

    const isHealthy = dbHealthy && redisHealthy;

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      data: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealthy ? 'healthy' : 'unhealthy',
          redis: redisHealthy ? 'healthy' : 'unhealthy',
        },
      },
    });
  });

  metrics = asyncHandler(async (req: Request, res: Response) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
}

export const healthController = new HealthController();