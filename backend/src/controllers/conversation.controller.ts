import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { conversationService } from '../services/conversation.service';
import { aiService } from '../services/ai.service';
import logger from '../utils/logger';

export class ConversationController {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { title, initialMessage, provider, model } = req.body;
      
      const result = await conversationService.createConversation(
        userId,
        title,
        initialMessage,
        provider,
        model
      );

      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { limit, offset, archived } = req.query;
      
      const result = await conversationService.getConversations(userId, {
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        archived: archived === 'true',
      });

      res.json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOne(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const conversationId = req.params.id;
      
      const result = await conversationService.getConversation(conversationId, userId);

      res.json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const conversationId = req.params.id;
      const { content } = req.body;
      
      const result = await conversationService.sendMessage(conversationId, userId, content);

      res.json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const conversationId = req.params.id;
      
      await conversationService.deleteConversation(conversationId, userId);

      res.json({
        status: 'success',
        message: 'Conversation deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getProviders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const providers = aiService.getAvailableProviders();

      res.json({
        status: 'success',
        data: { providers },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const conversationController = new ConversationController();