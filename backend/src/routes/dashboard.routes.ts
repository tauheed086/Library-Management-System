import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';

const router = Router();

// Dashboard data restricted to library managers/staff
router.get('/stats', authenticate, authorize(['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN']), getDashboardStats);

export default router;
