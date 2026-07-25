import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AuthRequest, ApiResponse } from '../types';
import { companyIdOf, findOwned, handleError } from '../utils/tenant';

const departmentSchema = z.object({
  name: z.string().trim().min(2, 'Department name must be at least 2 characters'),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
});

export const getDepartments = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const companyId = companyIdOf(req);

    const departments = await prisma.department.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { users: true, teams: true, shifts: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Departments loaded',
      data: { departments },
    });
  } catch (error) {
    return handleError(res, error, 'Could not load departments');
  }
};

export const getDepartment = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const companyId = companyIdOf(req);

    const department = await findOwned('department', req.params.id, companyId, {
      include: {
        users: {
          where: { status: 'ACTIVE' },
          select: { id: true, fullName: true, employeeCode: true, designation: true },
          orderBy: { fullName: 'asc' },
        },
        teams: { select: { id: true, name: true } },
        shifts: { select: { id: true, name: true, startTime: true, endTime: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Department loaded',
      data: { department },
    });
  } catch (error) {
    return handleError(res, error, 'Could not load the department');
  }
};

export const createDepartment = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const companyId = companyIdOf(req);
    const data = departmentSchema.parse(req.body);

    const duplicate = await prisma.department.findFirst({
      where: { companyId, name: { equals: data.name, mode: 'insensitive' } },
      select: { id: true },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'A department with this name already exists in your company',
      });
    }

    const department = await prisma.department.create({
      data: { ...data, companyId },
    });

    return res.status(201).json({
      success: true,
      message: 'Department created',
      data: { department },
    });
  } catch (error) {
    return handleError(res, error, 'Could not create the department');
  }
};

export const updateDepartment = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const companyId = companyIdOf(req);
    const data = departmentSchema.partial().parse(req.body);

    const existing = await findOwned<any>('department', req.params.id, companyId);

    if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await prisma.department.findFirst({
        where: {
          companyId,
          name: { equals: data.name, mode: 'insensitive' },
          id: { not: existing.id },
        },
        select: { id: true },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: 'A department with this name already exists in your company',
        });
      }
    }

    const department = await prisma.department.update({
      where: { id: existing.id },
      data,
    });

    return res.status(200).json({
      success: true,
      message: 'Department updated',
      data: { department },
    });
  } catch (error) {
    return handleError(res, error, 'Could not update the department');
  }
};

export const deleteDepartment = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const companyId = companyIdOf(req);
    const department = await findOwned<any>('department', req.params.id, companyId);

    const [employees, teams, shifts] = await Promise.all([
      prisma.user.count({ where: { departmentId: department.id } }),
      prisma.team.count({ where: { departmentId: department.id } }),
      prisma.shift.count({ where: { departmentId: department.id } }),
    ]);

    if (employees + teams + shifts > 0) {
      const parts = [
        employees ? `${employees} employee(s)` : null,
        teams ? `${teams} team(s)` : null,
        shifts ? `${shifts} shift(s)` : null,
      ].filter(Boolean);

      return res.status(409).json({
        success: false,
        message: `${parts.join(', ')} still belong to this department. Move them first.`,
      });
    }

    await prisma.department.delete({ where: { id: department.id } });

    return res.status(200).json({ success: true, message: 'Department deleted' });
  } catch (error) {
    return handleError(res, error, 'Could not delete the department');
  }
};
