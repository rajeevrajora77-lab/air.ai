import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import { updateProfileSchema } from '../validators/user.validator';

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get('/profile', userController.getProfile.bind(userController));
router.patch('/profile', validate(updateProfileSchema), userController.updateProfile.bind(userController));
router.delete('/account', userController.deleteAccount.bind(userController));
router.get('/stats', userController.getStats.bind(userController));

export default router;