import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AuthRequest, ApiResponse } from '../types';
import { assertUsersInCompany, companyIdOf, findOwned, handleError } from '../utils/tenant';

const memberSelect = {
  id: true,
  fullName: true,
  employeeCode: true,
  email: true,
  designation: true,
  status: true,
};

const teamSchema = z.object({
  name: z.string().trim().min(2, 'Team name must be at least 2 characters'),
  teamLeaderId: z.string().uuid('Select a valid team leader').optional().nullable(),
  departmentId: z.string().uuid('Select a valid department').optional().nullable(),
});

const memberSchema = z.object({
  userId: z.string().uuid('Select a valid employee'),
});

export const getTeams = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const companyId = companyIdOf(req);
    const { departmentId, search } = req.query;

    const where: any = { companyId };
    if (departmentId) where.departmentId = String(departmentId);
    if (search) where.name = { contains: String(search), mode: 'insensitive' };

    const teams = await prisma.team.findMany({
      where,
      include: {
        teamLeader: { select: { id: true, fullName: true, email: true } },
        department: { select: { id: true, name: true } },
        members: { include: { user: { select: memberSelect } } },
        _count: { select: { members: true } },
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({
      success: true,
      message: 'Teams loaded',
      data: { teams },
    });
  } catch (error) {
    return handleError(res, error, 'Could not load teams');
  }
};

export const getTeam = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const companyId = companyIdOf(req);

    const team = await findOwned('team', req.params.id, companyId, {
      include: {
        teamLeader: { select: { id: true, fullName: true, email: true } },
        department: { select: { id: true, name: true } },
        members: {
          include: {
            user: {
              select: { ...memberSelect, phone: true, department: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Team loaded',
      data: { team },
    });
  } catch (error) {
    return handleError(res, error, 'Could not load the team');
  }
};

export const createTeam = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const companyId = companyIdOf(req);
    const data = teamSchema.parse(req.body);

    if (data.teamLeaderId) await assertUsersInCompany([data.teamLeaderId], companyId);
    if (data.departmentId) await findOwned('department', data.departmentId, companyId);

    const duplicate = await prisma.team.findFirst({
      where: {
        companyId,
        name: { equals: data.name, mode: 'insensitive' },
        departmentId: data.departmentId ?? null,
      },
      select: { id: true },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'A team with this name already exists in that department',
      });
    }

    const team = await prisma.team.create({
      data: {
        companyId,
        name: data.name,
        teamLeaderId: data.teamLeaderId ?? null,
        departmentId: data.departmentId ?? null,
      },
      include: {
        teamLeader: { select: { id: true, fullName: true } },
        department: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Team created',
      data: { team },
    });
  } catch (error) {
    return handleError(res, error, 'Could not create the team');
  }
};

export const updateTeam = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const companyId = companyIdOf(req);
    const data = teamSchema.partial().parse(req.body);

    const existing = await findOwned<any>('team', req.params.id, companyId);

    if (data.teamLeaderId) await assertUsersInCompany([data.teamLeaderId], companyId);
    if (data.departmentId) await findOwned('department', data.departmentId, companyId);

    const nextName = data.name ?? existing.name;
    const nextDepartment = data.departmentId !== undefined ? data.departmentId : existing.departmentId;

    if (nextName !== existing.name || nextDepartment !== existing.departmentId) {
      const duplicate = await prisma.team.findFirst({
        where: {
          companyId,
          name: { equals: nextName, mode: 'insensitive' },
          departmentId: nextDepartment ?? null,
          id: { not: existing.id },
        },
        select: { id: true },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: 'A team with this name already exists in that department',
        });
      }
    }

    const team = await prisma.team.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        teamLeaderId: data.teamLeaderId,
        departmentId: data.departmentId,
      },
      include: {
        teamLeader: { select: { id: true, fullName: true } },
        department: { select: { id: true, name: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Team updated',
      data: { team },
    });
  } catch (error) {
    return handleError(res, error, 'Could not update the team');
  }
};

export const deleteTeam = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const companyId = companyIdOf(req);
    const team = await findOwned<any>('team', req.params.id, companyId);

    await prisma.$transaction([
      prisma.user.updateMany({ where: { teamId: team.id }, data: { teamId: null } }),
      prisma.teamMember.deleteMany({ where: { teamId: team.id } }),
      prisma.team.delete({ where: { id: team.id } }),
    ]);

    return res.status(200).json({ success: true, message: 'Team deleted' });
  } catch (error) {
    return handleError(res, error, 'Could not delete the team');
  }
};

export const addTeamMember = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const companyId = companyIdOf(req);
    const { userId } = memberSchema.parse(req.body);

    const team = await findOwned<any>('team', req.params.id, companyId);
    await assertUsersInCompany([userId], companyId);

    const existingMember = await prisma.teamMember.findFirst({
      where: { teamId: team.id, userId },
      select: { id: true },
    });

    if (existingMember) {
      return res.status(409).json({
        success: false,
        message: 'This employee is already on the team',
      });
    }

    const [member] = await prisma.$transaction([
      prisma.teamMember.create({
        data: { teamId: team.id, userId },
        include: { user: { select: memberSelect } },
      }),
      prisma.user.update({ where: { id: userId }, data: { teamId: team.id } }),
    ]);

    return res.status(201).json({
      success: true,
      message: 'Employee added to the team',
      data: { member },
    });
  } catch (error) {
    return handleError(res, error, 'Could not add the employee');
  }
};

export const removeTeamMember = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const companyId = companyIdOf(req);
    const { userId } = req.params;

    const team = await findOwned<any>('team', req.params.id, companyId);

    const member = await prisma.teamMember.findFirst({
      where: { teamId: team.id, userId },
      select: { id: true },
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Employee is not on this team' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true },
    });

    await prisma.$transaction([
      prisma.teamMember.delete({ where: { id: member.id } }),

      ...(user?.teamId === team.id
        ? [prisma.user.update({ where: { id: userId }, data: { teamId: null } })]
        : []),
    ]);

    return res.status(200).json({ success: true, message: 'Employee removed from the team' });
  } catch (error) {
    return handleError(res, error, 'Could not remove the employee');
  }
};
