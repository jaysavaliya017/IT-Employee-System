import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getEmployeeDashboard,
  getAdminDashboard,
  getManagerDashboard,
} from '../controllers/dashboardController';

const router = Router();

router.get('/employee', authMiddleware, getEmployeeDashboard);
router.get('/admin', authMiddleware, getAdminDashboard);
router.get('/manager', authMiddleware, getManagerDashboard);

export default router;
