import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AuthRequest, ApiResponse } from '../types';

const createHolidaySchema = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  description: z.string().optional(),
});

const updateHolidaySchema = z.object({
  title: z.string().min(1).optional(),
  date: z.string().optional(),
  description: z.string().optional(),
});

export const getHolidays = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { year } = req.query;
    const yearNum = parseInt(year as string) || new Date().getFullYear();

    const startDate = new Date(yearNum, 0, 1);
    const endDate = new Date(yearNum, 11, 31);

    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: {
        holidays,
      },
    });
  } catch (error) {
    console.error('Get Holidays error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createHoliday = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const data = createHolidaySchema.parse(req.body);

    const existingHoliday = await prisma.holiday.findFirst({
      where: {
        date: new Date(data.date),
      },
    });

    if (existingHoliday) {
      return res.status(400).json({
        success: false,
        message: 'Holiday already exists for this date',
      });
    }

    const holiday = await prisma.holiday.create({
      data: {
        title: data.title,
        date: new Date(data.date),
        description: data.description,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Holiday created successfully',
      data: {
        holiday,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    console.error('Create Holiday error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateHoliday = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { id } = req.params;
    const data = updateHolidaySchema.parse(req.body);

    const holiday = await prisma.holiday.update({
      where: { id },
      data: {
        title: data.title,
        date: data.date ? new Date(data.date) : undefined,
        description: data.description,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Holiday updated successfully',
      data: {
        holiday,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    console.error('Update Holiday error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteHoliday = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { id } = req.params;

    await prisma.holiday.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Holiday deleted successfully',
    });
  } catch (error) {
    console.error('Delete Holiday error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
