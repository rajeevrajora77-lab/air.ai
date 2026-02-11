import { Router } from 'express';
import { conversationController } from '../controllers/conversation.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  createConversationSchema,
  updateConversationSchema,
  createMessageSchema,
  getMessagesSchema,
} from '../validators/conversation.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Conversation routes
router.post('/', validateRequest(createConversationSchema), conversationController.create);
router.get('/', conversationController.list);
router.get('/:id', conversationController.get);
router.patch('/:id', validateRequest(updateConversationSchema), conversationController.update);
router.delete('/:id', conversationController.delete);

// Message routes
router.get('/:id/messages', validateRequest(getMessagesSchema), conversationController.getMessages);
router.post('/:id/messages', validateRequest(createMessageSchema), conversationController.createMessage);

export default router;