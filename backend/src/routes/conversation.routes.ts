import { Router } from 'express';
import { conversationController } from '../controllers/conversation.controller';
import { validate } from '../middleware/validator';
import {
  createConversationSchema,
  updateConversationSchema,
  conversationParamsSchema,
  listConversationsSchema,
  createMessageSchema,
  getMessagesSchema,
} from '../validators/conversation.validator';
import { authenticate } from '../middleware/auth';
import { apiRateLimiter, messageRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// All conversation routes require authentication
router.use(authenticate);

// Conversations
router.post(
  '/',
  apiRateLimiter,
  validate(createConversationSchema),
  conversationController.createConversation
);

router.get(
  '/',
  apiRateLimiter,
  validate(listConversationsSchema),
  conversationController.listConversations
);

router.get(
  '/:conversationId',
  apiRateLimiter,
  validate(conversationParamsSchema),
  conversationController.getConversation
);

router.patch(
  '/:conversationId',
  apiRateLimiter,
  validate(updateConversationSchema),
  conversationController.updateConversation
);

router.delete(
  '/:conversationId',
  apiRateLimiter,
  validate(conversationParamsSchema),
  conversationController.deleteConversation
);

// Messages
router.get(
  '/:conversationId/messages',
  apiRateLimiter,
  validate(getMessagesSchema),
  conversationController.getMessages
);

router.post(
  '/:conversationId/messages',
  messageRateLimiter,
  validate(createMessageSchema),
  conversationController.createMessage
);

export default router;