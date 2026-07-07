import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';

const router = Router();

router.get('/', authenticate, getSettings);
router.put('/', authenticate, authorize(['SUPER_ADMIN', 'LIBRARIAN']), updateSettings);

export default router;
