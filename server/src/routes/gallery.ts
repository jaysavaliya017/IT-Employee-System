import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth';
import { isAdmin, isTeamLeaderOrAdmin } from '../middleware/role';
import {
  uploadGalleryImage,
  getGalleryImages,
  getGalleryImageById,
  updateGalleryImage,
  deleteGalleryImage,
} from '../controllers/galleryController';

const router = Router();

// Ensure upload directories exist
const uploadDir = path.join(process.cwd(), 'uploads', 'gallery');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for gallery uploads
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
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPG, PNG, WEBP, GIF) are allowed'));
  },
});

// All routes require authentication
router.use(authMiddleware);

// Public routes (with role-based filtering)
router.get('/', getGalleryImages);
router.get('/:id', getGalleryImageById);

// Admin/Manager routes
router.post('/upload', upload.single('image'), uploadGalleryImage);
router.put('/:id', updateGalleryImage);
router.delete('/:id', deleteGalleryImage);

export default router;
