import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validator';
import { authenticate, authRateLimiter } from '../middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from '../validators/auth.validator';

const router = Router();

// Public routes
router.post('/register', authRateLimiter, validate(registerSchema), authController.register.bind(authController));
router.post('/login', authRateLimiter, validate(loginSchema), authController.login.bind(authController));
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken.bind(authController));

// Protected routes
router.use(authenticate);
router.get('/me', authController.me.bind(authController));
router.post('/logout', authController.logout.bind(authController));
router.post('/change-password', validate(changePasswordSchema), authController.changePassword.bind(authController));

export default router;