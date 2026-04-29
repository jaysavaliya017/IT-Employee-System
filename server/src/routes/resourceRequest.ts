import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { isAdmin, isTeamLeaderOrAdmin } from '../middleware/role';
import {
  createResourceRequest,
  getMyResourceRequests,
  getAllResourceRequests,
  approveResourceRequest,
  rejectResourceRequest,
} from '../controllers/resourceRequestController';

const router = Router();

router.post('/', authMiddleware, createResourceRequest);
router.get('/my-requests', authMiddleware, getMyResourceRequests);
router.get('/all', authMiddleware, isTeamLeaderOrAdmin, getAllResourceRequests);
router.put('/:id/approve', authMiddleware, isTeamLeaderOrAdmin, approveResourceRequest);
router.put('/:id/reject', authMiddleware, isTeamLeaderOrAdmin, rejectResourceRequest);

export default router;