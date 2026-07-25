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

router.use(authMiddleware);

router.get('/employees', isAdmin, getEmployeesForSalaryGeneration);

router.post('/generate', isAdmin, generateSalarySlip);

router.post('/generate-bulk', isAdmin, generateBulkSalarySlips);

router.get('/my-slips', getMySalarySlips);

router.get('/slips', isAdmin, getAllSalarySlips);

router.get('/slips/:id/download', downloadSalarySlip);

router.put('/slips/:id/mark-paid', isAdmin, markSalaryAsPaid);

export default router;
