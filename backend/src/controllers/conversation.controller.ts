import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { conversationService } from '../services/conversation.service';
import { asyncHandler } from '../middleware/errorHandler';

export class ConversationController {
  createConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { title } = req.body;

    const conversation = await conversationService.createConversation(userId, title);

    res.status(201).json({
      success: true,
      data: { conversation },
    });
  });

  getConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;

    const conversation = await conversationService.getConversation(conversationId, userId);

    res.json({
      success: true,
      data: { conversation },
    });
  });

  listConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { includeArchived, limit, offset } = req.query;

    const result = await conversationService.listConversations(userId, {
      includeArchived: includeArchived as boolean | undefined,
      limit: limit as number | undefined,
      offset: offset as number | undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  });

  updateConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    const { title, isArchived } = req.body;

    const conversation = await conversationService.updateConversation(
      conversationId,
      userId,
      { title, isArchived }
    );

    res.json({
      success: true,
      data: { conversation },
    });
  });

  deleteConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;

    await conversationService.deleteConversation(conversationId, userId);

    res.json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  });

  getMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    const { limit, before } = req.query;

    const messages = await conversationService.getMessages(conversationId, userId, {
      limit: limit as number | undefined,
      before: before as string | undefined,
    });

    res.json({
      success: true,
      data: { messages },
    });
  });

  createMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    const { content, model } = req.body;

    const result = await conversationService.createMessage(conversationId, userId, {
      content,
      model,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  });
}

export const conversationController = new ConversationController();