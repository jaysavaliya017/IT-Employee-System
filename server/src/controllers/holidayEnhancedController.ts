import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Create holiday
export const createHoliday = async (req: AuthRequest, res: Response) => {
  try {
    const { title, date, description, holidayType } = req.body;

    if (!title || !date) {
      return res.status(400).json({ success: false, message: 'Title and date are required' });
    }

    const holiday = await prisma.holiday.create({
      data: {
        title,
        date: new Date(date),
        description,
        holidayType: holidayType || 'GENERAL',
        companyId: req.user?.companyId,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'CREATE_HOLIDAY',
        entityType: 'HOLIDAY',
        entityId: holiday.id,
        description: `Holiday "${title}" created`,
        companyId: req.user?.companyId,
      },
    });

    return res.status(201).json({ success: true, data: holiday });
  } catch (error) {
    console.error('Error in createHoliday:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get holidays
export const getHolidays = async (req: AuthRequest, res: Response) => {
  try {
    const { year, month } = req.query;

    const where: any = { isActive: true };

    if (year) {
      const startDate = new Date(parseInt(year as string), 0, 1);
      const endDate = new Date(parseInt(year as string), 11, 31);
      where.date = { gte: startDate, lte: endDate };
    }

    if (month && year) {
      const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
      where.date = { gte: startDate, lte: endDate };
    }

    // Filter by company for non-admin
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role || '')) {
      where.OR = [
        { companyId: req.user?.companyId },
        { companyId: null },
      ];
    }

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return res.status(200).json({ success: true, data: holidays });
  } catch (error) {
    console.error('Error in getHolidays:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update holiday
export const updateHoliday = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, date, description, holidayType, isActive } = req.body;

    const holiday = await prisma.holiday.update({
      where: { id },
      data: {
        title,
        date: date ? new Date(date) : undefined,
        description,
        holidayType,
        isActive,
      },
    });

    return res.status(200).json({ success: true, data: holiday });
  } catch (error) {
    console.error('Error in updateHoliday:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete holiday
export const deleteHoliday = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.holiday.update({
      where: { id },
      data: { isActive: false },
    });

    return res.status(200).json({ success: true, message: 'Holiday deleted successfully' });
  } catch (error) {
    console.error('Error in deleteHoliday:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
