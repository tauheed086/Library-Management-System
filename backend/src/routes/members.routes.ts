import { Router } from 'express';
import { getMembers, getMemberById, createMember, updateMember, suspendMember, renewMembership } from '../controllers/members.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';

const router = Router();

// Only library staff can manage and view full membership files
router.get('/', authenticate, authorize(['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN']), getMembers);
router.get('/:id', authenticate, getMemberById); // Allow users to view their own profile if authenticated (check inside controller or allow standard reading)
router.post('/', authenticate, authorize(['SUPER_ADMIN', 'LIBRARIAN']), createMember);
router.put('/:id', authenticate, authorize(['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN']), updateMember);
router.post('/:id/suspend', authenticate, authorize(['SUPER_ADMIN', 'LIBRARIAN']), suspendMember);
router.post('/:id/renew', authenticate, authorize(['SUPER_ADMIN', 'LIBRARIAN']), renewMembership);

export default router;
