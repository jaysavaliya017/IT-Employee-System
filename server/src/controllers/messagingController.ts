import { Response } from 'express';
import { z } from 'zod';
import { MessageCategory, MessagePriority } from '@prisma/client';
import { AuthRequest, ApiResponse } from '../types';
import {
  canSendBroadcast,
  createBulkConversationAndMessage,
  createOrGetDirectConversation,
  ensureConversationParticipant,
  getConversationMessages,
  getTotalUnreadCount,
  getUsersForMessaging,
  listConversationsForUser,
  markConversationRead,
  sendMessage,
} from '../services/messagingService';
import { getMessagingIO } from '../socket/messagingSocket';

const createDirectSchema = z.object({
  targetUserId: z.string().uuid('Target user id must be valid'),
});

const sendMessageSchema = z.object({
  content: z.string().trim().min(1, 'Message content is required').max(5000),
  priority: z.nativeEnum(MessagePriority).optional(),
  category: z.nativeEnum(MessageCategory).optional(),
  courseCode: z.string().max(100).optional(),
  courseTitle: z.string().max(255).optional(),
  attachments: z
    .array(
      z.object({
        fileName: z.string().min(1),
        fileUrl: z.string().min(1),
        fileType: z.string().min(1),
        fileSize: z.number().int().nonnegative(),
      })
    )
    .optional(),
});

const bulkSchema = z.object({
  title: z.string().trim().min(1).max(255),
  content: z.string().trim().min(1).max(5000),
  targetUserIds: z.array(z.string().uuid()).min(1),
  category: z.nativeEnum(MessageCategory).default('ANNOUNCEMENT'),
  priority: z.nativeEnum(MessagePriority).default('HIGH'),
  courseCode: z.string().max(100).optional(),
  courseTitle: z.string().max(255).optional(),
  isAnnouncement: z.boolean().default(true),
  isBulkReminder: z.boolean().default(false),
});

const parsePagination = (page?: string | string[], limit?: string | string[]) => {
  const pageNum = Math.max(1, parseInt((page as string) || '1', 10));
  const limitNum = Math.min(100, Math.max(1, parseInt((limit as string) || '25', 10)));
  return { pageNum, limitNum };
};

export const listUsers = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const users = await getUsersForMessaging(
      req.user.companyId,
      req.user.userId,
      (req.query.search as string) || ''
    );

    return res.status(200).json({
      success: true,
      data: { users },
    });
  } catch (error) {
    console.error('Messaging list users error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createDirectConversation = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { targetUserId } = createDirectSchema.parse(req.body);
    const conversation = await createOrGetDirectConversation(
      req.user.companyId,
      req.user.userId,
      targetUserId
    );

    return res.status(201).json({
      success: true,
      data: { conversation },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
    }

    return res.status(400).json({ success: false, message: error.message || 'Unable to create conversation' });
  }
};

export const getMyConversations = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const conversations = await listConversationsForUser(req.user.companyId, req.user.userId);
    const unreadCount = conversations.reduce((sum, item) => sum + (item.unreadCount || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        conversations,
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Messaging get conversations error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getConversationMessagesHandler = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { pageNum, limitNum } = parsePagination(req.query.page as string, req.query.limit as string);
    const data = await getConversationMessages(
      req.params.conversationId,
      req.user.companyId,
      req.user.userId,
      pageNum,
      limitNum
    );

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(403).json({ success: false, message: error.message || 'Unable to load messages' });
  }
};

export const sendMessageHandler = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    await ensureConversationParticipant(req.params.conversationId, req.user.companyId, req.user.userId);
    const data = sendMessageSchema.parse(req.body);

    const message = await sendMessage({
      conversationId: req.params.conversationId,
      senderId: req.user.userId,
      content: data.content,
      priority: data.priority,
      category: data.category,
      attachments: data.attachments,
      courseCode: data.courseCode,
      courseTitle: data.courseTitle,
    });

    const io = getMessagingIO();
    io.to(`conversation:${req.params.conversationId}`).emit('message:new', {
      conversationId: req.params.conversationId,
      message,
    });

    return res.status(201).json({ success: true, data: { message } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
    }

    return res.status(400).json({ success: false, message: error.message || 'Unable to send message' });
  }
};

export const markReadHandler = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    await markConversationRead(req.params.conversationId, req.user.userId, req.user.companyId);
    const unreadCount = await getTotalUnreadCount(req.user.companyId, req.user.userId);

    const io = getMessagingIO();
    io.to(`conversation:${req.params.conversationId}`).emit('conversation:read', {
      conversationId: req.params.conversationId,
      userId: req.user.userId,
      readAt: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, data: { unreadCount } });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Unable to mark read' });
  }
};

export const getUnreadCountHandler = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const unreadCount = await getTotalUnreadCount(req.user.companyId, req.user.userId);
    return res.status(200).json({ success: true, data: { unreadCount } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const sendBulkAnnouncement = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!canSendBroadcast(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not allowed to send bulk announcements' });
    }

    const data = bulkSchema.parse(req.body);
    const payload = await createBulkConversationAndMessage({
      companyId: req.user.companyId,
      creatorId: req.user.userId,
      title: data.title,
      content: data.content,
      targetUserIds: data.targetUserIds,
      category: data.category,
      priority: data.priority,
      courseCode: data.courseCode,
      courseTitle: data.courseTitle,
      isAnnouncement: data.isAnnouncement,
      isBulkReminder: data.isBulkReminder,
    });

    const io = getMessagingIO();
    io.to(`company:${req.user.companyId}`).emit('announcement:new', {
      conversationId: payload.conversation.id,
      message: payload.message,
    });

    return res.status(201).json({ success: true, data: payload });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
    }

    return res.status(400).json({ success: false, message: error.message || 'Unable to send announcement' });
  }
};
