import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  login,
  register,
  getMe,
  refreshToken,
  logout,
  validateCompany,
} from '../controllers/authController';

const router = Router();

router.get('/validate-company', validateCompany);
router.post('/validate-company', validateCompany);
router.post('/login', login);
router.post('/register', register);
router.get('/me', authMiddleware, getMe);
router.post('/refresh-token', refreshToken);
router.post('/logout', authMiddleware, logout);

export default router;
