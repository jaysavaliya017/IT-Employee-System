import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AuthRequest, ApiResponse } from '../types';

const createTeamSchema = z.object({
  name: z.string().min(1),
  teamLeaderId: z.string().optional(),
  departmentId: z.string().optional(),
});

const updateTeamSchema = z.object({
  name: z.string().min(1).optional(),
  teamLeaderId: z.string().optional(),
  departmentId: z.string().optional(),
});

const addMemberSchema = z.object({
  userId: z.string(),
});

export const getTeams = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { departmentId, search } = req.query;

    const whereClause: any = {};

    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    if (search) {
      whereClause.name = { contains: search as string, mode: 'insensitive' };
    }

    const teams = await prisma.team.findMany({
      where: whereClause,
      include: {
        teamLeader: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        department: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                employeeCode: true,
                email: true,
                designation: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        teams,
      },
    });
  } catch (error) {
    console.error('Get Teams error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getTeam = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { id } = req.params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        teamLeader: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        department: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                employeeCode: true,
                email: true,
                phone: true,
                designation: true,
                status: true,
                department: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        team,
      },
    });
  } catch (error) {
    console.error('Get Team error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createTeam = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const data = createTeamSchema.parse(req.body);

    const existingTeam = await prisma.team.findFirst({
      where: {
        name: data.name,
        departmentId: data.departmentId,
      },
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'Team with this name already exists in the department',
      });
    }

    const team = await prisma.team.create({
      data: {
        name: data.name,
        teamLeaderId: data.teamLeaderId,
        departmentId: data.departmentId,
      },
      include: {
        teamLeader: {
          select: {
            id: true,
            fullName: true,
          },
        },
        department: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: {
        team,
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
    console.error('Create Team error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateTeam = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { id } = req.params;
    const data = updateTeamSchema.parse(req.body);

    const team = await prisma.team.update({
      where: { id },
      data: {
        name: data.name,
        teamLeaderId: data.teamLeaderId,
        departmentId: data.departmentId,
      },
      include: {
        teamLeader: {
          select: {
            id: true,
            fullName: true,
          },
        },
        department: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                employeeCode: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      data: {
        team,
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
    console.error('Update Team error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteTeam = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { id } = req.params;

    await prisma.team.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    console.error('Delete Team error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const addTeamMember = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { id } = req.params;
    const data = addMemberSchema.parse(req.body);

    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId: data.userId,
      },
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this team',
      });
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId: id,
        userId: data.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            email: true,
          },
        },
      },
    });

    await prisma.user.update({
      where: { id: data.userId },
      data: { teamId: id },
    });

    return res.status(201).json({
      success: true,
      message: 'Team member added successfully',
      data: {
        member,
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
    console.error('Add Team Member error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const removeTeamMember = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { id, userId } = req.params;

    const member = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId,
      },
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found',
      });
    }

    await prisma.teamMember.delete({
      where: { id: member.id },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { teamId: null },
    });

    return res.status(200).json({
      success: true,
      message: 'Team member removed successfully',
    });
  } catch (error) {
    console.error('Remove Team Member error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
