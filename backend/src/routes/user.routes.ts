import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { validate } from '../middleware/validator';
import { updateProfileSchema } from '../validators/user.validator';
import { authenticate } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// All user routes require authentication
router.use(authenticate);
router.use(apiRateLimiter);

router.get('/profile', userController.getProfile);
router.patch('/profile', validate(updateProfileSchema), userController.updateProfile);
router.get('/stats', userController.getStats);
router.delete('/account', userController.deleteAccount);

export default router;