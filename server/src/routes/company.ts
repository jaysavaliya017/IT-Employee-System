import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { isAdmin } from '../middleware/role';
import {
  getCompanies,
  createCompany,
  updateCompany,
  updateCompanyStatus,
} from '../controllers/companyController';

const router = Router();

router.get('/', authMiddleware, isAdmin, getCompanies);
router.post('/', authMiddleware, isAdmin, createCompany);
router.put('/:id', authMiddleware, isAdmin, updateCompany);
router.patch('/:id/status', authMiddleware, isAdmin, updateCompanyStatus);

export default router;
