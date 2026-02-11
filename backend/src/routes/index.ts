import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import conversationRoutes from './conversation.routes';
import healthRoutes from './health.routes';

const router = Router();

// API version 1 routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/conversations', conversationRoutes);

// Health and metrics (no version prefix)
router.use('/', healthRoutes);

export default router;