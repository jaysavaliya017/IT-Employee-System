import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { isAdmin } from '../middleware/role';
import {
  getMonthlyAttendanceReport,
  getEmployeeAttendanceReport,
  getDepartmentAttendanceReport,
  getTeamAttendanceReport,
  getLeaveReport,
  getLateArrivalsReport,
} from '../controllers/reportController';

const router = Router();

router.get('/monthly-attendance', authMiddleware, isAdmin, getMonthlyAttendanceReport);
router.get('/employee-attendance', authMiddleware, isAdmin, getEmployeeAttendanceReport);
router.get('/department-attendance', authMiddleware, isAdmin, getDepartmentAttendanceReport);
router.get('/team-attendance', authMiddleware, isAdmin, getTeamAttendanceReport);
router.get('/leave', authMiddleware, isAdmin, getLeaveReport);
router.get('/late-arrivals', authMiddleware, isAdmin, getLateArrivalsReport);

export default router;
