import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth';
import { isAdmin, isTeamLeaderOrAdmin } from '../middleware/role';
import {
  createPolicy,
  getPolicies,
  getPolicyById,
  updatePolicy,
  deletePolicy,
  downloadPolicy,
} from '../controllers/policyController';

const router = Router();

// Ensure upload directories exist
const uploadDir = path.join(process.cwd(), 'uploads', 'policies');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for policy document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// All routes require authentication
router.use(authMiddleware);

// Public routes (with role-based filtering)
router.get('/', getPolicies);
router.get('/:id', getPolicyById);
router.get('/:id/download', downloadPolicy);

// Admin routes
router.post('/', isAdmin, upload.single('file'), createPolicy);
router.put('/:id', isAdmin, upload.single('file'), updatePolicy);
router.delete('/:id', isAdmin, deletePolicy);

export default router;
