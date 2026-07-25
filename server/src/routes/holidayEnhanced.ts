import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { isAdmin } from '../middleware/role';
import {
  createHoliday,
  getHolidays,
  updateHoliday,
  deleteHoliday,
} from '../controllers/holidayEnhancedController';

const router = Router();

router.use(authMiddleware);

router.get('/', getHolidays);

router.post('/', isAdmin, createHoliday);
router.put('/:id', isAdmin, updateHoliday);
router.delete('/:id', isAdmin, deleteHoliday);

export default router;
