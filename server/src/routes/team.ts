import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { isAdmin } from '../middleware/role';
import {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
} from '../controllers/teamController';

const router = Router();

router.get('/', authMiddleware, getTeams);
router.get('/:id', authMiddleware, getTeam);
router.post('/', authMiddleware, isAdmin, createTeam);
router.put('/:id', authMiddleware, isAdmin, updateTeam);
router.delete('/:id', authMiddleware, isAdmin, deleteTeam);
router.post('/:id/members', authMiddleware, isAdmin, addTeamMember);
router.delete('/:id/members/:userId', authMiddleware, isAdmin, removeTeamMember);

export default router;
