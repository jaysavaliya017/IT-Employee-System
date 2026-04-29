import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Get user notifications
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, isRead, type } = req.query;

    const where: any = { userId: req.user?.userId };
    if (isRead !== undefined) where.isRead = isRead === 'true';
    if (type) where.type = type;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user?.userId, isRead: false } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total, totalPages: Math.ceil(total / parseInt(limit as string)) },
      },
    });
  } catch (error) {
    console.error('Error in getNotifications:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Mark notification as read
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.userId !== req.user?.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in markAsRead:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user?.userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error in markAllAsRead:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete notification
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.userId !== req.user?.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await prisma.notification.delete({ where: { id } });

    return res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error in deleteNotification:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get unread count
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user?.userId, isRead: false },
    });

    return res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    console.error('Error in getUnreadCount:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update notification settings
export const updateNotificationSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { emailNotifications, pushNotifications, salaryNotifs, leaveNotifs, announcementNotifs, birthdayNotifs } = req.body;

    const settings = await prisma.notificationSettings.upsert({
      where: { userId: req.user?.userId },
      update: {
        emailNotifications,
        pushNotifications,
        salaryNotifs,
        leaveNotifs,
        announcementNotifs,
        birthdayNotifs,
      },
      create: {
        userId: req.user?.userId!,
        emailNotifications: emailNotifications ?? true,
        pushNotifications: pushNotifications ?? true,
        salaryNotifs: salaryNotifs ?? true,
        leaveNotifs: leaveNotifs ?? true,
        announcementNotifs: announcementNotifs ?? true,
        birthdayNotifs: birthdayNotifs ?? true,
      },
    });

    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error('Error in updateNotificationSettings:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get notification settings
export const getNotificationSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.notificationSettings.findUnique({
      where: { userId: req.user?.userId },
    });

    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error('Error in getNotificationSettings:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
