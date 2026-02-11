import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { userService } from '../services/user.service';
import { asyncHandler } from '../middleware/errorHandler';

export class UserController {
  // Current user endpoints (match routes: /me)
  getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const user = await userService.getUserById(userId);

    res.json({
      success: true,
      data: { user },
    });
  });

  updateMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { firstName, lastName } = req.body;

    const user = await userService.updateUser(userId, {
      firstName,
      lastName,
    });

    res.json({
      success: true,
      data: { user },
    });
  });

  getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const stats = await userService.getUserStats(userId);

    res.json({
      success: true,
      data: { stats },
    });
  });

  // Admin endpoints
  listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20, search } = req.query;

    const result = await userService.listUsers({
      page: Number(page),
      limit: Number(limit),
      search: search as string | undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  });

  getUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const user = await userService.getUserById(id);

    res.json({
      success: true,
      data: { user },
    });
  });

  updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const user = await userService.updateUser(id, updates);

    res.json({
      success: true,
      data: { user },
    });
  });

  deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    await userService.deleteUser(id);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  });
}

export const userController = new UserController();