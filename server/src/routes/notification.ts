import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  updateNotificationSettings,
  getNotificationSettings,
} from '../controllers/notificationController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);
router.get('/settings', getNotificationSettings);
router.put('/settings', updateNotificationSettings);

export default router;
