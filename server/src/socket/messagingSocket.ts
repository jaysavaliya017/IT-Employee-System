import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import {
  ensureConversationParticipant,
  markConversationRead,
  sendMessage,
} from '../services/messagingService';

type SocketUser = {
  userId: string;
  companyId: string;
  role: string;
  email: string;
};

const onlineUsers = new Map<string, Set<string>>();
let ioInstance: Server | null = null;

const broadcastPresence = (io: Server, companyId: string, userId: string, isOnline: boolean) => {
  io.to(`company:${companyId}`).emit('presence:update', {
    userId,
    isOnline,
    timestamp: new Date().toISOString(),
  });
};

export const initMessagingSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: config.frontendUrl,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Unauthorized'));
      }

      const decoded = jwt.verify(token, config.jwtSecret) as SocketUser;
      if (!decoded.userId || !decoded.companyId) {
        return next(new Error('Unauthorized'));
      }

      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const currentUser = socket.data.user as SocketUser;
    const userRoom = `user:${currentUser.userId}`;
    const companyRoom = `company:${currentUser.companyId}`;

    socket.join(userRoom);
    socket.join(companyRoom);

    const currentSockets = onlineUsers.get(currentUser.userId) || new Set<string>();
    currentSockets.add(socket.id);
    onlineUsers.set(currentUser.userId, currentSockets);

    broadcastPresence(io, currentUser.companyId, currentUser.userId, true);

    socket.on('conversation:join', async (payload: { conversationId: string }) => {
      try {
        await ensureConversationParticipant(payload.conversationId, currentUser.companyId, currentUser.userId);
        socket.join(`conversation:${payload.conversationId}`);
      } catch (error) {
        socket.emit('conversation:error', { message: 'Unable to join conversation' });
      }
    });

    socket.on('conversation:leave', (payload: { conversationId: string }) => {
      socket.leave(`conversation:${payload.conversationId}`);
    });

    socket.on(
      'message:send',
      async (payload: {
        conversationId: string;
        content: string;
        priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
        category?:
          | 'GENERAL'
          | 'COURSE'
          | 'LEAVE'
          | 'ATTENDANCE'
          | 'HR'
          | 'ANNOUNCEMENT'
          | 'REMINDER';
        attachments?: Array<{
          fileName: string;
          fileUrl: string;
          fileType: string;
          fileSize: number;
        }>;
      }
    ) => {
      try {
        await ensureConversationParticipant(payload.conversationId, currentUser.companyId, currentUser.userId);
        const message = await sendMessage({
          conversationId: payload.conversationId,
          senderId: currentUser.userId,
          content: payload.content,
          priority: payload.priority,
          category: payload.category,
          attachments: payload.attachments,
        });

        io.to(`conversation:${payload.conversationId}`).emit('message:new', {
          conversationId: payload.conversationId,
          message,
        });
      } catch (error: any) {
        socket.emit('message:error', {
          message: error.message || 'Unable to send message',
        });
      }
    }
    );

    socket.on('typing:start', async (payload: { conversationId: string }) => {
      try {
        await ensureConversationParticipant(payload.conversationId, currentUser.companyId, currentUser.userId);
        socket.to(`conversation:${payload.conversationId}`).emit('typing:update', {
          conversationId: payload.conversationId,
          userId: currentUser.userId,
          isTyping: true,
        });
      } catch (_error) {
      }
    });

    socket.on('typing:stop', async (payload: { conversationId: string }) => {
      try {
        await ensureConversationParticipant(payload.conversationId, currentUser.companyId, currentUser.userId);
        socket.to(`conversation:${payload.conversationId}`).emit('typing:update', {
          conversationId: payload.conversationId,
          userId: currentUser.userId,
          isTyping: false,
        });
      } catch (_error) {
      }
    });

    socket.on('message:read', async (payload: { conversationId: string }) => {
      try {
        await markConversationRead(payload.conversationId, currentUser.userId, currentUser.companyId);
        io.to(`conversation:${payload.conversationId}`).emit('conversation:read', {
          conversationId: payload.conversationId,
          userId: currentUser.userId,
          readAt: new Date().toISOString(),
        });
      } catch (_error) {
      }
    });

    socket.on('disconnect', () => {
      const sockets = onlineUsers.get(currentUser.userId);
      if (!sockets) {
        return;
      }

      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(currentUser.userId);
        broadcastPresence(io, currentUser.companyId, currentUser.userId, false);
      } else {
        onlineUsers.set(currentUser.userId, sockets);
      }
    });
  });

  ioInstance = io;
  return io;
};

export const getMessagingIO = () => {
  if (!ioInstance) {
    throw new Error('Messaging socket not initialized');
  }

  return ioInstance;
};

export const isUserOnline = (userId: string) => {
  return (onlineUsers.get(userId)?.size || 0) > 0;
};
