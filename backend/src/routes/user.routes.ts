import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { updateUserSchema } from '../validators/user.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current user profile
router.get('/me', userController.getMe);

// Update current user profile
router.patch('/me', validateRequest(updateUserSchema), userController.updateMe);

// Get user stats
router.get('/me/stats', userController.getStats);

// Admin only routes
router.get('/', authorize('admin'), userController.listUsers);
router.get('/:id', authorize('admin'), userController.getUser);
router.patch('/:id', authorize('admin'), validateRequest(updateUserSchema), userController.updateUser);
router.delete('/:id', authorize('admin'), userController.deleteUser);

export default router;