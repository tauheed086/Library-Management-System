import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';

const router = Router();

// Audit trails are highly sensitive, restricted to SUPER_ADMIN only
router.get('/', authenticate, authorize(['SUPER_ADMIN']), getAuditLogs);

export default router;
