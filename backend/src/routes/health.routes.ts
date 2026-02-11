import { Router, Request, Response } from 'express';
import { db } from '../database/postgres';
import { redis } from '../database/redis';
import { register } from '../utils/metrics';
import config from '../config';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  const dbHealthy = await db.healthCheck();
  const redisHealthy = await redis.healthCheck();
  
  const health = {
    status: dbHealthy && redisHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
    services: {
      database: dbHealthy ? 'up' : 'down',
      redis: redisHealthy ? 'up' : 'down',
    },
  };

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

router.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  const metrics = await register.metrics();
  res.send(metrics);
});

router.get('/readiness', async (req: Request, res: Response) => {
  const dbHealthy = await db.healthCheck();
  const redisHealthy = await redis.healthCheck();
  
  if (dbHealthy && redisHealthy) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});

router.get('/liveness', (req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

export default router;