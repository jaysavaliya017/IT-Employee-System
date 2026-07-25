import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AuthRequest, ApiResponse } from '../types';
import { companyIdOf, findOwned, handleError, TenantError } from '../utils/tenant';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const shiftSchema = z.object({
  name: z.string().trim().min(1, 'Shift name is required'),
  startTime: z.string().regex(timePattern, 'Start time must be in HH:mm format'),
  endTime: z.string().regex(timePattern, 'End time must be in HH:mm format'),
  graceMinutes: z.coerce.number().int().min(0).max(240).optional(),
  halfDayHours: z.coerce.number().min(0).max(24).optional(),
  fullDayHours: z.coerce.number().min(0).max(24).optional(),
  departmentId: z.string().uuid().optional().nullable(),
});

const checkHourRules = (halfDayHours?: number, fullDayHours?: number) => {
  const half = halfDayHours ?? 4;
  const full = fullDayHours ?? 8;

  if (half >= full) {
    throw new TenantError('Half day hours must be less than full day hours', 400);
  }
  if (full <= 0) {
    throw new TenantError('Full day hours must be greater than zero', 400);
  }
};

export const getShifts = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const companyId = companyIdOf(req);

    const shifts = await prisma.shift.findMany({
      where: { companyId },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { shiftUsers: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    return res.status(200).json({
      success: true,
      message: 'Shifts loaded',
      data: { shifts },
    });
  } catch (error) {
    return handleError(res, error, 'Could not load shifts');
  }
};

export const createShift = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const companyId = companyIdOf(req);
    const data = shiftSchema.parse(req.body);

    checkHourRules(data.halfDayHours, data.fullDayHours);

    const duplicate = await prisma.shift.findFirst({
      where: { companyId, name: data.name },
      select: { id: true },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'A shift with this name already exists in your company',
      });
    }

    if (data.departmentId) {
      await findOwned('department', data.departmentId, companyId);
    }

    const shift = await prisma.shift.create({
      data: {
        companyId,
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        graceMinutes: data.graceMinutes ?? 0,
        halfDayHours: data.halfDayHours ?? 4,
        fullDayHours: data.fullDayHours ?? 8,
        departmentId: data.departmentId ?? null,
      },
      include: { department: { select: { id: true, name: true } } },
    });

    return res.status(201).json({
      success: true,
      message: 'Shift created',
      data: { shift },
    });
  } catch (error) {
    return handleError(res, error, 'Could not create the shift');
  }
};

export const updateShift = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const companyId = companyIdOf(req);
    const data = shiftSchema.partial().parse(req.body);

    const existing = await findOwned<any>('shift', req.params.id, companyId);

    checkHourRules(
      data.halfDayHours ?? existing.halfDayHours,
      data.fullDayHours ?? existing.fullDayHours
    );

    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.shift.findFirst({
        where: { companyId, name: data.name, id: { not: existing.id } },
        select: { id: true },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: 'A shift with this name already exists in your company',
        });
      }
    }

    if (data.departmentId) {
      await findOwned('department', data.departmentId, companyId);
    }

    const shift = await prisma.shift.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        graceMinutes: data.graceMinutes,
        halfDayHours: data.halfDayHours,
        fullDayHours: data.fullDayHours,
        departmentId: data.departmentId,
      },
      include: { department: { select: { id: true, name: true } } },
    });

    return res.status(200).json({
      success: true,
      message: 'Shift updated',
      data: { shift },
    });
  } catch (error) {
    return handleError(res, error, 'Could not update the shift');
  }
};

export const deleteShift = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const companyId = companyIdOf(req);
    const shift = await findOwned<any>('shift', req.params.id, companyId);

    const assigned = await prisma.user.count({ where: { shiftId: shift.id } });

    if (assigned > 0) {
      return res.status(409).json({
        success: false,
        message: `${assigned} employee(s) are on this shift. Move them to another shift first.`,
      });
    }

    await prisma.shift.delete({ where: { id: shift.id } });

    return res.status(200).json({ success: true, message: 'Shift deleted' });
  } catch (error) {
    return handleError(res, error, 'Could not delete the shift');
  }
};
