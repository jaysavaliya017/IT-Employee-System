import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getTeamLeaderDashboard,
  getTeamMembers,
  getTeamAttendanceToday,
  getTeamAttendanceMonthly,
  getTeamLeaves,
  teamLeaderApproveLeave,
  teamLeaderRejectLeave,
} from '../controllers/teamLeaderController';

const router = Router();

router.get('/dashboard', authMiddleware, getTeamLeaderDashboard);
router.get('/team-members', authMiddleware, getTeamMembers);
router.get('/team-attendance/today', authMiddleware, getTeamAttendanceToday);
router.get('/team-attendance/monthly', authMiddleware, getTeamAttendanceMonthly);
router.get('/team-leaves', authMiddleware, getTeamLeaves);
router.put('/leaves/:id/approve', authMiddleware, teamLeaderApproveLeave);
router.put('/leaves/:id/reject', authMiddleware, teamLeaderRejectLeave);

export default router;
