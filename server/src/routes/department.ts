import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { isAdmin } from '../middleware/role';
import {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController';

const router = Router();

router.get('/', authMiddleware, getDepartments);
router.get('/:id', authMiddleware, getDepartment);

router.post('/', authMiddleware, isAdmin, createDepartment);
router.put('/:id', authMiddleware, isAdmin, updateDepartment);
router.delete('/:id', authMiddleware, isAdmin, deleteDepartment);

export default router;
