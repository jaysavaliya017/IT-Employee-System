import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Get audit logs
export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, action, entityType, userId, fromDate, toDate, search } = req.query;

    // Only admin can view audit logs
    if (!['SUPER_ADMIN', 'ADMIN', 'HR'].includes(req.user?.role || '')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const where: any = { companyId: req.user?.companyId };

    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = userId;
    if (fromDate) where.createdAt = { ...where.createdAt, gte: new Date(fromDate as string) };
    if (toDate) where.createdAt = { ...where.createdAt, lte: new Date(toDate as string) };

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, employeeCode: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total, totalPages: Math.ceil(total / parseInt(limit as string)) },
      },
    });
  } catch (error) {
    console.error('Error in getAuditLogs:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Create audit log (internal function)
export const createAuditLog = async (data: {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  companyId?: string;
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValue: data.oldValue,
        newValue: data.newValue,
        description: data.description,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        companyId: data.companyId,
      },
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

// Get audit log statistics
export const getAuditStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!['SUPER_ADMIN', 'ADMIN', 'HR'].includes(req.user?.role || '')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const where = { companyId: req.user?.companyId };

    const [totalLogs, todayLogs, actionBreakdown, entityBreakdown] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.count({
        where: {
          ...where,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      prisma.auditLog.groupBy({
        by: ['entityType'],
        where,
        _count: true,
        orderBy: { _count: { entityType: 'desc' } },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalLogs,
        todayLogs,
        actionBreakdown: actionBreakdown.map((a) => ({ action: a.action, count: a._count })),
        entityBreakdown: entityBreakdown.map((e) => ({ entityType: e.entityType, count: e._count })),
      },
    });
  } catch (error) {
    console.error('Error in getAuditStats:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
