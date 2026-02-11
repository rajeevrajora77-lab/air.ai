import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { userService } from '../services/user.service';
import { asyncHandler } from '../middleware/errorHandler';

export class UserController {
  getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const user = await userService.getUserById(userId);

    res.json({
      success: true,
      data: { user },
    });
  });

  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { firstName, lastName } = req.body;

    const user = await userService.updateProfile(userId, {
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

  deleteAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    await userService.deleteUser(userId);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  });
}

export const userController = new UserController();