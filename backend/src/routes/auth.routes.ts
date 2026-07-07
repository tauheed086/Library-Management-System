import { Router } from 'express';
import { register, login, getProfile, changePassword, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.post('/change-password', authenticate, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
