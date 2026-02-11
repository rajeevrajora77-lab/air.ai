import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../middleware/errorHandler';

export class AuthController {
  register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password, firstName, lastName } = req.body;

    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  });

  login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.json({
      success: true,
      data: result,
    });
  });

  refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshTokens(refreshToken);

    res.json({
      success: true,
      data: { tokens },
    });
  });

  logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const token = req.headers.authorization!.substring(7);

    await authService.logout(userId, token);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  });

  changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(userId, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  });
}

export const authController = new AuthController();