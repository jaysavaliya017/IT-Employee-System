import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { isAdmin } from '../middleware/role';
import {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
} from '../controllers/shiftController';

const router = Router();

router.get('/', authMiddleware, getShifts);
router.post('/', authMiddleware, isAdmin, createShift);
router.put('/:id', authMiddleware, isAdmin, updateShift);
router.delete('/:id', authMiddleware, isAdmin, deleteShift);

export default router;
