import { Router } from 'express';
import { conversationController } from '../controllers/conversation.controller';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';
import {
  createConversationSchema,
  sendMessageSchema,
  getConversationsSchema,
  conversationIdSchema,
} from '../validators/conversation.validator';

const router = Router();

// All conversation routes require authentication
router.use(authenticate);

// Get available AI providers
router.get('/providers', conversationController.getProviders.bind(conversationController));

// CRUD operations
router.post('/', aiRateLimiter, validate(createConversationSchema), conversationController.create.bind(conversationController));
router.get('/', validate(getConversationsSchema), conversationController.list.bind(conversationController));
router.get('/:id', validate(conversationIdSchema), conversationController.getOne.bind(conversationController));
router.post('/:id/messages', aiRateLimiter, validate(sendMessageSchema), conversationController.sendMessage.bind(conversationController));
router.delete('/:id', validate(conversationIdSchema), conversationController.delete.bind(conversationController));

export default router;