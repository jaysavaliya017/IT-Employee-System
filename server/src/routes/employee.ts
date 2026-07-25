import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { isAdmin } from '../middleware/role';
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  transferEmployeeCompany,
} from '../controllers/employeeController';

const router = Router();

router.get('/', authMiddleware, isAdmin, getEmployees);
router.get('/:id', authMiddleware, getEmployee);
router.post('/', authMiddleware, isAdmin, createEmployee);
router.put('/:id', authMiddleware, isAdmin, updateEmployee);
router.post('/:id/transfer-company', authMiddleware, isAdmin, transferEmployeeCompany);
router.delete('/:id', authMiddleware, isAdmin, deleteEmployee);

export default router;
