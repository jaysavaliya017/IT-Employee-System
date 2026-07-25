import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AuthRequest, ApiResponse } from '../types';
import { companyIdOf, handleError } from '../utils/tenant';

const holidaySchema = z.object({
  title: z.string().trim().min(2, 'Holiday title is required'),
  date: z.coerce.date({ invalid_type_error: 'Enter a valid date' }),
  description: z.string().trim().max(500).optional(),
  holidayType: z.enum(['GENERAL', 'OPTIONAL', 'RESTRICTED', 'COMPANY']).default('GENERAL'),
  isActive: z.boolean().default(true),
});

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const getHolidays = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const companyId = companyIdOf(req);
    const year = parseInt(String(req.query.year), 10) || new Date().getFullYear();

    const holidays = await prisma.holiday.findMany({
      where: {
        companyId,
        date: {
          gte: new Date(year, 0, 1),

          lt: new Date(year + 1, 0, 1),
        },
        ...(req.query.includeInactive === 'true' ? {} : { isActive: true }),
      },
      orderBy: { date: 'asc' },
    });

    const today = startOfDay(new Date());
    const upcoming = holidays.filter((holiday) => holiday.date >= today);

    return res.status(200).json({
      success: true,
      message: 'Holidays loaded',
      data: {
        holidays,
        year,
        total: holidays.length,
        upcoming: upcoming.length,
        nextHoliday: upcoming[0] ?? null,
      },
    });
  } catch (error) {
    return handleError(res, error, 'Could not load holidays');
  }
};

export const createHoliday = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const companyId = companyIdOf(req);
    const data = holidaySchema.parse(req.body);
    const date = startOfDay(data.date);

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const duplicate = await prisma.holiday.findFirst({
      where: { companyId, date: { gte: date, lt: nextDay } },
      select: { id: true, title: true },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `${duplicate.title} is already marked as a holiday on this date`,
      });
    }

    const holiday = await prisma.holiday.create({
      data: { ...data, date, companyId },
    });

    return res.status(201).json({
      success: true,
      message: 'Holiday added',
      data: { holiday },
    });
  } catch (error) {
    return handleError(res, error, 'Could not add the holiday');
  }
};

export const updateHoliday = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const companyId = companyIdOf(req);
    const data = holidaySchema.partial().parse(req.body);

    const existing = await prisma.holiday.findFirst({
      where: { id: req.params.id, companyId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Holiday not found' });
    }

    const holiday = await prisma.holiday.update({
      where: { id: existing.id },
      data: {
        ...data,
        date: data.date ? startOfDay(data.date) : undefined,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Holiday updated',
      data: { holiday },
    });
  } catch (error) {
    return handleError(res, error, 'Could not update the holiday');
  }
};

export const deleteHoliday = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const companyId = companyIdOf(req);

    const existing = await prisma.holiday.findFirst({
      where: { id: req.params.id, companyId },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Holiday not found' });
    }

    await prisma.holiday.delete({ where: { id: existing.id } });

    return res.status(200).json({ success: true, message: 'Holiday deleted' });
  } catch (error) {
    return handleError(res, error, 'Could not delete the holiday');
  }
};
