import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { isAdmin } from '../middleware/role';
import {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from '../controllers/holidayController';

const router = Router();

router.get('/', authMiddleware, getHolidays);
router.post('/', authMiddleware, isAdmin, createHoliday);
router.put('/:id', authMiddleware, isAdmin, updateHoliday);
router.delete('/:id', authMiddleware, isAdmin, deleteHoliday);

export default router;
