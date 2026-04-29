import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { isAdmin } from '../middleware/role';
import {
  getEmployeesForSalaryGeneration,
  generateSalarySlip,
  generateBulkSalarySlips,
  getMySalarySlips,
  getAllSalarySlips,
  downloadSalarySlip,
  markSalaryAsPaid,
} from '../controllers/salarySlipController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get employees for salary generation (Admin/HR only)
router.get('/employees', isAdmin, getEmployeesForSalaryGeneration);

// Generate salary slip for one employee (Admin/HR only)
router.post('/generate', isAdmin, generateSalarySlip);

// Generate salary slips for multiple employees (Admin/HR only)
router.post('/generate-bulk', isAdmin, generateBulkSalarySlips);

// Employee view own salary slips
router.get('/my-slips', getMySalarySlips);

// Admin/HR view all salary slips
router.get('/slips', isAdmin, getAllSalarySlips);

// Download salary slip
router.get('/slips/:id/download', downloadSalarySlip);

// Mark salary as paid (Admin/HR only)
router.put('/slips/:id/mark-paid', isAdmin, markSalaryAsPaid);

export default router;
