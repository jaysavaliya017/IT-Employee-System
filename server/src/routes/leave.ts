import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { isAdmin } from '../middleware/role';
import {
  getLeaveBalance,
  applyLeave,
  getMyLeaveRequests,
  getAdminLeaveRequests,
  approveLeave,
  rejectLeave,
} from '../controllers/leaveController';

const router = Router();

router.get('/balance', authMiddleware, getLeaveBalance);
router.post('/apply', authMiddleware, applyLeave);
router.get('/my-requests', authMiddleware, getMyLeaveRequests);
router.get('/admin/requests', authMiddleware, isAdmin, getAdminLeaveRequests);
router.put('/:id/approve', authMiddleware, isAdmin, approveLeave);
router.put('/:id/reject', authMiddleware, isAdmin, rejectLeave);

export default router;
