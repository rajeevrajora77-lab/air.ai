import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { conversationService } from '../services/conversation.service';
import { asyncHandler } from '../middleware/errorHandler';

export class ConversationController {
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { title } = req.body;

    const conversation = await conversationService.createConversation(userId, title);

    res.status(201).json({
      success: true,
      data: { conversation },
    });
  });

  get = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const conversation = await conversationService.getConversation(id, userId);

    res.json({
      success: true,
      data: { conversation },
    });
  });

  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { includeArchived, limit, offset } = req.query;

    const result = await conversationService.listConversations(userId, {
      includeArchived: includeArchived === 'true',
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, isArchived } = req.body;

    const conversation = await conversationService.updateConversation(id, userId, {
      title,
      isArchived,
    });

    res.json({
      success: true,
      data: { conversation },
    });
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    await conversationService.deleteConversation(id, userId);

    res.json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  });

  getMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const { limit, before } = req.query;

    const messages = await conversationService.getMessages(id, userId, {
      limit: limit ? Number(limit) : undefined,
      before: before as string | undefined,
    });

    res.json({
      success: true,
      data: { messages },
    });
  });

  createMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const { content, model, provider } = req.body;

    const result = await conversationService.createMessage(id, userId, {
      content,
      model,
      provider,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  });
}

export const conversationController = new ConversationController();