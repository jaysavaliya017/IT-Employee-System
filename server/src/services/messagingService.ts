import prisma from '../config/database';
import { MessageCategory, MessagePriority, MessageConversationType, Role } from '@prisma/client';

type AttachmentInput = {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
};

type SendMessageInput = {
  conversationId: string;
  senderId: string;
  content: string;
  priority?: MessagePriority;
  category?: MessageCategory;
  attachments?: AttachmentInput[];
  isAnnouncement?: boolean;
  isBulkReminder?: boolean;
  courseCode?: string;
  courseTitle?: string;
};

type CreateBulkMessageInput = {
  companyId: string;
  creatorId: string;
  title: string;
  content: string;
  targetUserIds: string[];
  category: MessageCategory;
  priority: MessagePriority;
  courseCode?: string;
  courseTitle?: string;
  isAnnouncement: boolean;
  isBulkReminder: boolean;
};

const messageInclude = {
  sender: {
    select: {
      id: true,
      fullName: true,
      employeeCode: true,
      role: true,
    },
  },
  attachments: true,
  readReceipts: {
    select: {
      userId: true,
      readAt: true,
    },
  },
} as const;

export const canSendBroadcast = (role: string) => {
  const allowed: Role[] = ['SUPER_ADMIN', 'ADMIN', 'HR', 'TEAM_LEADER'];
  return allowed.includes(role as Role);
};

export const createOrGetDirectConversation = async (
  companyId: string,
  currentUserId: string,
  targetUserId: string
) => {
  if (currentUserId === targetUserId) {
    throw new Error('Cannot create direct conversation with yourself');
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      id: targetUserId,
      companyId,
      status: 'ACTIVE',
    },
    select: { id: true },
  });

  if (!targetUser) {
    throw new Error('Target user not found in your company');
  }

  const existing = await prisma.messageConversation.findFirst({
    where: {
      companyId,
      type: 'DIRECT',
      participants: {
        every: {
          userId: {
            in: [currentUserId, targetUserId],
          },
        },
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              employeeCode: true,
              role: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (existing && existing.participants.length === 2) {
    return existing;
  }

  return prisma.messageConversation.create({
    data: {
      companyId,
      type: 'DIRECT',
      createdBy: currentUserId,
      participants: {
        create: [
          { userId: currentUserId },
          { userId: targetUserId },
        ],
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              employeeCode: true,
              role: true,
              status: true,
            },
          },
        },
      },
    },
  });
};

export const listConversationsForUser = async (companyId: string, userId: string) => {
  const conversations = await prisma.messageConversation.findMany({
    where: {
      companyId,
      participants: {
        some: {
          userId,
        },
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              employeeCode: true,
              role: true,
              status: true,
            },
          },
        },
      },
      messages: {
        include: messageInclude,
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
  });

  const participantReads = await prisma.messageConversationParticipant.findMany({
    where: {
      userId,
      conversationId: {
        in: conversations.map((item) => item.id),
      },
    },
    select: {
      conversationId: true,
      lastReadAt: true,
    },
  });

  const readMap = new Map(participantReads.map((row) => [row.conversationId, row.lastReadAt]));

  const unreadCounts = await Promise.all(
    conversations.map(async (conversation) => {
      const lastReadAt = readMap.get(conversation.id) || new Date(0);
      const unread = await prisma.message.count({
        where: {
          conversationId: conversation.id,
          createdAt: {
            gt: lastReadAt,
          },
          senderId: {
            not: userId,
          },
          deletedAt: null,
        },
      });

      return [conversation.id, unread] as const;
    })
  );

  const unreadMap = new Map(unreadCounts);

  return conversations.map((conversation) => ({
    ...conversation,
    unreadCount: unreadMap.get(conversation.id) || 0,
    lastMessage: conversation.messages[0] || null,
    messages: undefined,
  }));
};

export const ensureConversationParticipant = async (
  conversationId: string,
  companyId: string,
  userId: string
) => {
  const participant = await prisma.messageConversationParticipant.findFirst({
    where: {
      conversationId,
      userId,
      conversation: {
        companyId,
      },
    },
    include: {
      conversation: true,
    },
  });

  if (!participant) {
    throw new Error('You are not a participant in this conversation');
  }

  return participant;
};

export const getConversationMessages = async (
  conversationId: string,
  companyId: string,
  userId: string,
  page = 1,
  limit = 25
) => {
  await ensureConversationParticipant(conversationId, companyId, userId);

  const skip = (page - 1) * limit;
  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
      },
      include: messageInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.message.count({
      where: {
        conversationId,
        deletedAt: null,
      },
    }),
  ]);

  return {
    messages: messages.reverse(),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const sendMessage = async (input: SendMessageInput) => {
  const created = await prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: {
        conversationId: input.conversationId,
        senderId: input.senderId,
        content: input.content,
        priority: input.priority || 'NORMAL',
        category: input.category || 'GENERAL',
        isAnnouncement: !!input.isAnnouncement,
        isBulkReminder: !!input.isBulkReminder,
        courseCode: input.courseCode,
        courseTitle: input.courseTitle,
        attachments: input.attachments?.length
          ? {
              create: input.attachments,
            }
          : undefined,
      },
      include: messageInclude,
    });

    await tx.messageConversation.update({
      where: { id: input.conversationId },
      data: {
        lastMessageAt: new Date(),
      },
    });

    return message;
  });

  return created;
};

export const markConversationRead = async (conversationId: string, userId: string, companyId: string) => {
  await ensureConversationParticipant(conversationId, companyId, userId);

  await prisma.messageConversationParticipant.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
    data: {
      lastReadAt: new Date(),
    },
  });

  const messageIds = await prisma.message.findMany({
    where: {
      conversationId,
      senderId: {
        not: userId,
      },
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (messageIds.length) {
    await prisma.messageReadReceipt.createMany({
      data: messageIds.map((message) => ({
        messageId: message.id,
        userId,
      })),
      skipDuplicates: true,
    });
  }
};

export const getUsersForMessaging = async (companyId: string, currentUserId: string, search = '') => {
  return prisma.user.findMany({
    where: {
      companyId,
      status: 'ACTIVE',
      id: {
        not: currentUserId,
      },
      OR: search
        ? [
            { fullName: { contains: search, mode: 'insensitive' } },
            { employeeCode: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    },
    select: {
      id: true,
      fullName: true,
      employeeCode: true,
      email: true,
      role: true,
      department: {
        select: {
          name: true,
        },
      },
      team: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ fullName: 'asc' }],
    take: 30,
  });
};

export const createBulkConversationAndMessage = async (input: CreateBulkMessageInput) => {
  const uniqueUserIds = Array.from(new Set(input.targetUserIds.filter(Boolean)));
  const allParticipants = Array.from(new Set([input.creatorId, ...uniqueUserIds]));

  const users = await prisma.user.findMany({
    where: {
      id: { in: allParticipants },
      companyId: input.companyId,
      status: 'ACTIVE',
    },
    select: { id: true },
  });

  const validUserIds = users.map((u) => u.id);
  if (!validUserIds.includes(input.creatorId)) {
    throw new Error('Creator is not an active user in this company');
  }

  const conversation = await prisma.messageConversation.create({
    data: {
      companyId: input.companyId,
      type: input.isAnnouncement ? 'ANNOUNCEMENT' : 'COURSE',
      title: input.title,
      courseCode: input.courseCode,
      courseTitle: input.courseTitle,
      createdBy: input.creatorId,
      participants: {
        create: validUserIds.map((id) => ({ userId: id })),
      },
    },
  });

  const message = await sendMessage({
    conversationId: conversation.id,
    senderId: input.creatorId,
    content: input.content,
    category: input.category,
    priority: input.priority,
    isAnnouncement: input.isAnnouncement,
    isBulkReminder: input.isBulkReminder,
    courseCode: input.courseCode,
    courseTitle: input.courseTitle,
  });

  return {
    conversation,
    message,
  };
};

export const getTotalUnreadCount = async (companyId: string, userId: string) => {
  const conversations = await listConversationsForUser(companyId, userId);
  return conversations.reduce((sum, item) => sum + (item.unreadCount || 0), 0);
};
