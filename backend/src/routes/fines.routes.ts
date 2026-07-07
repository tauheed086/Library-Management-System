import { Router } from 'express';
import { getFines, waiveFine, recordPayment } from '../controllers/fines.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';

const router = Router();

router.get('/', authenticate, getFines);
router.post('/:id/waive', authenticate, authorize(['SUPER_ADMIN', 'LIBRARIAN']), waiveFine);
router.post('/:id/pay', authenticate, authorize(['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN']), recordPayment);

export default router;
