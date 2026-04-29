import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth';
import { isAdmin, isTeamLeaderOrAdmin } from '../middleware/role';
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController';

const router = Router();

// Ensure upload directories exist
const uploadDir = path.join(process.cwd(), 'uploads', 'announcements');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for announcement attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// All routes require authentication
router.use(authMiddleware);

// Public routes (with role-based filtering)
router.get('/', getAnnouncements);
router.get('/:id', getAnnouncementById);

// Admin/Manager routes
router.post('/', isTeamLeaderOrAdmin, upload.single('attachment'), createAnnouncement);
router.put('/:id', isTeamLeaderOrAdmin, updateAnnouncement);
router.delete('/:id', isAdmin, deleteAnnouncement);

export default router;
