import { Router } from 'express';
import { db } from '../database/postgres';
import { redis } from '../database/redis';
import logger from '../utils/logger';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const checks = await Promise.allSettled([
      db.healthCheck(),
      redis.healthCheck(),
    ]);

    const dbHealthy = checks[0].status === 'fulfilled' && checks[0].value;
    const redisHealthy = checks[1].status === 'fulfilled' && checks[1].value;

    const overallHealthy = dbHealthy && redisHealthy;

    const response = {
      status: overallHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: {
          status: dbHealthy ? 'up' : 'down',
          latency: null,
        },
        redis: {
          status: redisHealthy ? 'up' : 'down',
          latency: null,
        },
        memory: {
          usage: process.memoryUsage(),
        },
      },
    };

    const statusCode = overallHealthy ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

export default router;