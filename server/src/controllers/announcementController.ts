import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Create announcement
export const createAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { title, message, priority, expiryDate, attachmentUrl, attachmentName, visibilityType, companyId, departmentId, teamId, targetEmployeeId } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        message,
        priority: priority || 'MEDIUM',
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        attachmentUrl,
        attachmentName,
        visibilityType: visibilityType || 'ALL',
        companyId: companyId || req.user?.companyId,
        departmentId: req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'HR' ? departmentId : req.user?.departmentId,
        teamId: req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'HR' ? teamId : req.user?.teamId,
        targetEmployeeId,
        createdBy: req.user?.userId!,
      },
      include: {
        creator: { select: { id: true, fullName: true, employeeCode: true } },
        company: true,
        department: true,
        team: true,
      },
    });

    // Create notifications for target audience
    await createAnnouncementNotifications(announcement);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'CREATE_ANNOUNCEMENT',
        entityType: 'ANNOUNCEMENT',
        entityId: announcement.id,
        description: `Announcement "${title}" created`,
        companyId: req.user?.companyId,
      },
    });

    return res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    console.error('Error in createAnnouncement:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get announcements
export const getAnnouncements = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, priority, visibilityType, search } = req.query;

    const where: any = {
      isActive: true,
      OR: [
        { expiryDate: null },
        { expiryDate: { gte: new Date() } },
      ],
    };

    // Role-based filtering
    if (req.user?.role === 'EMPLOYEE') {
      where.OR = [
        { visibilityType: 'ALL', companyId: req.user.companyId },
        { visibilityType: 'COMPANY', companyId: req.user.companyId },
        { visibilityType: 'DEPARTMENT', departmentId: req.user.departmentId },
        { visibilityType: 'TEAM', teamId: req.user.teamId },
        { visibilityType: 'EMPLOYEE', targetEmployeeId: req.user.userId },
        { createdBy: req.user.userId },
      ];
    } else if (req.user?.role === 'MANAGER' || req.user?.role === 'TEAM_LEADER') {
      where.companyId = req.user.companyId;
    } else {
      where.companyId = req.user?.companyId;
    }

    if (priority) where.priority = priority;
    if (visibilityType) where.visibilityType = visibilityType;
    if (search) where.title = { contains: search as string, mode: 'insensitive' };

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        include: {
          creator: { select: { id: true, fullName: true, employeeCode: true, profileImage: true } },
          company: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          team: { select: { id: true, name: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: parseInt(limit as string),
      }),
      prisma.announcement.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        announcements,
        pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total, totalPages: Math.ceil(total / parseInt(limit as string)) },
      },
    });
  } catch (error) {
    console.error('Error in getAnnouncements:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get single announcement
export const getAnnouncementById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, fullName: true, employeeCode: true, profileImage: true } },
        company: true,
        department: true,
        team: true,
      },
    });

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    return res.status(200).json({ success: true, data: announcement });
  } catch (error) {
    console.error('Error in getAnnouncementById:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update announcement
export const updateAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, message, priority, expiryDate, attachmentUrl, attachmentName, visibilityType, departmentId, teamId, targetEmployeeId, isActive } = req.body;

    const announcement = await prisma.announcement.findUnique({ where: { id } });

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    // Only creator or admin can update
    if (announcement.createdBy !== req.user?.userId && !['SUPER_ADMIN', 'ADMIN', 'HR'].includes(req.user?.role || '')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title,
        message,
        priority,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        attachmentUrl,
        attachmentName,
        visibilityType,
        departmentId,
        teamId,
        targetEmployeeId,
        isActive,
      },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in updateAnnouncement:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete announcement
export const deleteAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.findUnique({ where: { id } });

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    // Only creator or admin can delete
    if (announcement.createdBy !== req.user?.userId && !['SUPER_ADMIN', 'ADMIN', 'HR'].includes(req.user?.role || '')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await prisma.announcement.delete({ where: { id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'DELETE_ANNOUNCEMENT',
        entityType: 'ANNOUNCEMENT',
        entityId: id,
        description: `Announcement "${announcement.title}" deleted`,
        companyId: req.user?.companyId,
      },
    });

    return res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error in deleteAnnouncement:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Helper to create notifications for announcements
async function createAnnouncementNotifications(announcement: any) {
  let targetUsers: string[] = [];

  switch (announcement.visibilityType) {
    case 'ALL':
      const allUsers = await prisma.user.findMany({
        where: { companyId: announcement.companyId, status: 'ACTIVE' },
        select: { id: true },
      });
      targetUsers = allUsers.map((u: any) => u.id);
      break;
    case 'COMPANY':
      const companyUsers = await prisma.user.findMany({
        where: { companyId: announcement.companyId, status: 'ACTIVE' },
        select: { id: true },
      });
      targetUsers = companyUsers.map((u: any) => u.id);
      break;
    case 'DEPARTMENT':
      const deptUsers = await prisma.user.findMany({
        where: { departmentId: announcement.departmentId, status: 'ACTIVE' },
        select: { id: true },
      });
      targetUsers = deptUsers.map((u: any) => u.id);
      break;
    case 'TEAM':
      const teamUsers = await prisma.user.findMany({
        where: { teamId: announcement.teamId, status: 'ACTIVE' },
        select: { id: true },
      });
      targetUsers = teamUsers.map((u: any) => u.id);
      break;
    case 'EMPLOYEE':
      targetUsers = [announcement.targetEmployeeId];
      break;
  }

  // Remove creator from notifications
  targetUsers = targetUsers.filter((id) => id !== announcement.createdBy);

  await prisma.notification.createMany({
    data: targetUsers.map((userId) => ({
      userId,
      title: announcement.title,
      message: announcement.message.substring(0, 200),
      type: 'ANNOUNCEMENT',
      referenceId: announcement.id,
      referenceType: 'ANNOUNCEMENT',
    })),
  });
}
