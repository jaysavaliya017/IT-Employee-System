import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth';
import {
  createDirectConversation,
  getConversationMessagesHandler,
  getMyConversations,
  getUnreadCountHandler,
  listUsers,
  markReadHandler,
  sendBulkAnnouncement,
  sendMessageHandler,
} from '../controllers/messagingController';

const uploadsDir = path.resolve(process.cwd(), 'uploads', 'messages');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

const router = Router();

router.get('/users', authMiddleware, listUsers);
router.post('/conversations/direct', authMiddleware, createDirectConversation);
router.get('/conversations', authMiddleware, getMyConversations);
router.get('/conversations/:conversationId/messages', authMiddleware, getConversationMessagesHandler);
router.post('/conversations/:conversationId/messages', authMiddleware, sendMessageHandler);
router.post('/conversations/:conversationId/read', authMiddleware, markReadHandler);
router.get('/unread-count', authMiddleware, getUnreadCountHandler);
router.post('/bulk', authMiddleware, sendBulkAnnouncement);
router.post('/upload', authMiddleware, upload.array('files', 5), (req, res) => {
  const files = (req.files as Express.Multer.File[]) || [];
  const mapped = files.map((file) => ({
    fileName: file.originalname,
    fileUrl: `/uploads/messages/${file.filename}`,
    fileType: file.mimetype,
    fileSize: file.size,
  }));

  return res.status(201).json({
    success: true,
    data: {
      files: mapped,
    },
  });
});

export default router;
