import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getDepartments } from '../controllers/departmentController';

const router = Router();

router.get('/', authMiddleware, getDepartments);

export default router;
