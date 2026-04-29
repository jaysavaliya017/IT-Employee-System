import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { isAdmin } from '../middleware/role';
import {
  punchIn,
  punchOut,
  getTodayAttendance,
  getMonthlyAttendance,
  getUserAttendance,
  getAllAttendance,
  updateAttendance,
} from '../controllers/attendanceController';

const router = Router();

router.post('/punch-in', authMiddleware, punchIn);
router.post('/punch-out', authMiddleware, punchOut);
router.get('/today', authMiddleware, getTodayAttendance);
router.get('/monthly', authMiddleware, getMonthlyAttendance);
router.get('/user/:userId', authMiddleware, getUserAttendance);
router.get('/admin/all', authMiddleware, isAdmin, getAllAttendance);
router.put('/:id', authMiddleware, isAdmin, updateAttendance);

export default router;
