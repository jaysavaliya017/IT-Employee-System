import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AuthRequest, ApiResponse } from '../types';

const createShiftSchema = z.object({
  name: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  graceMinutes: z.number().int().min(0).optional(),
  halfDayHours: z.number().min(0).optional(),
  fullDayHours: z.number().min(0).optional(),
  departmentId: z.string().optional(),
});

const updateShiftSchema = z.object({
  name: z.string().min(1).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  graceMinutes: z.number().int().min(0).optional(),
  halfDayHours: z.number().min(0).optional(),
  fullDayHours: z.number().min(0).optional(),
  departmentId: z.string().optional(),
});

export const getShifts = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const shifts = await prisma.shift.findMany({
      include: {
        department: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: {
        shifts,
      },
    });
  } catch (error) {
    console.error('Get Shifts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createShift = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const data = createShiftSchema.parse(req.body);

    const existingShift = await prisma.shift.findUnique({
      where: { name: data.name },
    });

    if (existingShift) {
      return res.status(400).json({
        success: false,
        message: 'Shift with this name already exists',
      });
    }

    const shift = await prisma.shift.create({
      data: {
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        graceMinutes: data.graceMinutes || 0,
        halfDayHours: data.halfDayHours || 4,
        fullDayHours: data.fullDayHours || 8,
        departmentId: data.departmentId,
      },
      include: {
        department: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Shift created successfully',
      data: {
        shift,
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
    console.error('Create Shift error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateShift = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { id } = req.params;
    const data = updateShiftSchema.parse(req.body);

    const shift = await prisma.shift.update({
      where: { id },
      data: {
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        graceMinutes: data.graceMinutes,
        halfDayHours: data.halfDayHours,
        fullDayHours: data.fullDayHours,
        departmentId: data.departmentId,
      },
      include: {
        department: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Shift updated successfully',
      data: {
        shift,
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
    console.error('Update Shift error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteShift = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { id } = req.params;

    await prisma.shift.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Shift deleted successfully',
    });
  } catch (error) {
    console.error('Delete Shift error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
