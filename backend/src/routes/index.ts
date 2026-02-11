import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import conversationRoutes from './conversation.routes';
import healthRoutes from './health.routes';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/conversations', conversationRoutes);

// Health & Monitoring
router.use(healthRoutes);

// API Info
router.get('/', (req, res) => {
  res.json({
    name: 'air.ai API',
    version: '1.0.0',
    status: 'running',
    docs: '/api/v1/docs',
  });
});

export default router;