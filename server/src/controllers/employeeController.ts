import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AuthRequest, ApiResponse } from '../types';
import bcrypt from 'bcryptjs';

const createEmployeeSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
  employeeCode: z.string().min(1),
  phone: z.string().optional(),
  departmentId: z.string().optional(),
  designation: z.string().optional(),
  managerId: z.string().optional(),
  teamLeaderId: z.string().optional(),
  teamId: z.string().optional(),
  shiftId: z.string().optional(),
  joiningDate: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'TEAM_LEADER', 'EMPLOYEE']).optional(),
});

const updateEmployeeSchema = z.object({
  fullName: z.string().min(1).optional(),
  password: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().min(6).optional()
  ),
  phone: z.string().optional(),
  departmentId: z.string().optional(),
  designation: z.string().optional(),
  managerId: z.string().optional(),
  teamLeaderId: z.string().optional(),
  teamId: z.string().optional(),
  shiftId: z.string().optional(),
  joiningDate: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'TEAM_LEADER', 'EMPLOYEE']).optional(),
});

const transferEmployeeCompanySchema = z.object({
  targetCompanyId: z.string().min(1),
});

export const getEmployees = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const {
      page = '1',
      limit = '10',
      departmentId,
      teamId,
      status,
      search,
      role,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {
      companyId: req.user.companyId,
    };

    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    if (teamId) {
      whereClause.teamId = teamId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (role) {
      whereClause.role = role;
    }

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { employeeCode: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          profileImage: true,
          designation: true,
          joiningDate: true,
          createdAt: true,
          department: true,
          shift: true,
          manager: true,
          teamLeader: true,
          team: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        employees,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get Employees error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getEmployee = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { id } = req.params;

    const employee = await prisma.user.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        profileImage: true,
        designation: true,
        joiningDate: true,
        createdAt: true,
        department: true,
        shift: true,
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        teamLeader: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        team: true,
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        employee,
      },
    });
  } catch (error) {
    console.error('Get Employee error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createEmployee = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const data = createEmployeeSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: {
        companyId: req.user.companyId,
        OR: [{ email: data.email }, { employeeCode: data.employeeCode }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email or Employee Code already exists',
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const employee = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        companyId: req.user.companyId,
        fullName: data.fullName,
        employeeCode: data.employeeCode,
        phone: data.phone,
        departmentId: data.departmentId || null,
        designation: data.designation,
        managerId: data.managerId || null,
        teamLeaderId: data.teamLeaderId || null,
        teamId: data.teamId || null,
        shiftId: data.shiftId || null,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : null,
        role: data.role as any || 'EMPLOYEE',
      },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        designation: true,
        joiningDate: true,
        department: true,
        shift: true,
        manager: true,
        teamLeader: true,
        team: true,
      },
    });

    const currentYear = new Date().getFullYear();
    const leaveTypes = await prisma.leaveType.findMany();

    for (const leaveType of leaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          userId: employee.id,
          leaveTypeId: leaveType.id,
          totalLeaves: leaveType.defaultBalance,
          usedLeaves: 0,
          remainingLeaves: leaveType.defaultBalance,
          year: currentYear,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        employee,
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
    console.error('Create Employee error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateEmployee = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { id } = req.params;
    const data = updateEmployeeSchema.parse(req.body);
    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : undefined;

    const existingEmployee = await prisma.user.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
      select: { id: true },
    });

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const employee = await prisma.user.update({
      where: { id: existingEmployee.id },
      data: {
        fullName: data.fullName,
        passwordHash,
        phone: data.phone,
        departmentId: data.departmentId || null,
        designation: data.designation,
        managerId: data.managerId || null,
        teamLeaderId: data.teamLeaderId || null,
        teamId: data.teamId || null,
        shiftId: data.shiftId || null,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
        status: data.status,
        role: data.role as any,
      },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        designation: true,
        joiningDate: true,
        department: true,
        shift: true,
        manager: true,
        teamLeader: true,
        team: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: {
        employee,
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
    console.error('Update Employee error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteEmployee = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { id } = req.params;

    const existingEmployee = await prisma.user.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
      select: { id: true },
    });

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    await prisma.user.update({
      where: { id: existingEmployee.id },
      data: { status: 'INACTIVE' },
    });

    return res.status(200).json({
      success: true,
      message: 'Employee deactivated successfully',
    });
  } catch (error) {
    console.error('Delete Employee error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const transferEmployeeCompany = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { id } = req.params;
    const { targetCompanyId } = transferEmployeeCompanySchema.parse(req.body);

    const employee = await prisma.user.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
      select: {
        id: true,
        role: true,
        companyId: true,
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    if (employee.role === 'SUPER_ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'Super Admin cannot be transferred',
      });
    }

    if (employee.companyId === targetCompanyId) {
      return res.status(400).json({
        success: false,
        message: 'Employee already belongs to this company',
      });
    }

    const targetCompany = await prisma.company.findUnique({
      where: { id: targetCompanyId },
      select: { id: true, isActive: true, name: true },
    });

    if (!targetCompany || !targetCompany.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Target company is not active or does not exist',
      });
    }

    const updatedEmployee = await prisma.$transaction(async (tx) => {
      await tx.leaveBalance.deleteMany({ where: { userId: id } });
      await tx.teamMember.deleteMany({ where: { userId: id } });
      await tx.attendance.deleteMany({ where: { userId: id } });

      return tx.user.update({
        where: { id },
        data: {
          companyId: targetCompanyId,
          departmentId: null,
          teamId: null,
          shiftId: null,
          managerId: null,
          teamLeaderId: null,
        },
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
          email: true,
          role: true,
          company: true,
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: `Employee transferred to ${targetCompany.name} successfully`,
      data: { employee: updatedEmployee },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }

    console.error('Transfer Employee Company error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
