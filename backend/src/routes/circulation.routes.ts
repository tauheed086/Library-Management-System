import { Router } from 'express';
import { issueBook, returnBook, renewBook, getTransactions } from '../controllers/circulation.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';

const router = Router();

router.get('/transactions', authenticate, getTransactions);
router.post('/issue', authenticate, authorize(['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN']), issueBook);
router.post('/return', authenticate, authorize(['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN']), returnBook);
router.post('/renew', authenticate, authorize(['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN']), renewBook);

export default router;
