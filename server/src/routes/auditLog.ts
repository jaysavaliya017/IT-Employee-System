import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { isAdmin } from '../middleware/role';
import {
  getAuditLogs,
  getAuditStats,
} from '../controllers/auditLogController';

const router = Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(isAdmin);

router.get('/', getAuditLogs);
router.get('/stats', getAuditStats);

export default router;
