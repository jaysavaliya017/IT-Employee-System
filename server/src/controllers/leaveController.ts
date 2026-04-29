import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AuthRequest, ApiResponse } from '../types';
import { calculateLeaveDays } from '../utils';
import { LeaveStatus, AttendanceStatus } from '@prisma/client';

const applyLeaveSchema = z.object({
  leaveTypeId: z.string().min(1, 'Leave type is required'),
  fromDate: z.string().min(1, 'From date is required'),
  toDate: z.string().min(1, 'To date is required'),
  reason: z.string().optional(),
  attachmentUrl: z.string().optional(),
});

export const getLeaveBalance = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const userId = req.user.userId;
    const currentYear = new Date().getFullYear();

    const leaveBalances = await prisma.leaveBalance.findMany({
      where: {
        userId,
        year: currentYear,
      },
      include: {
        leaveType: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        leaveBalances,
      },
    });
  } catch (error) {
    console.error('Get Leave Balance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const applyLeave = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const data = applyLeaveSchema.parse(req.body);
    const userId = req.user.userId;

    const fromDate = new Date(data.fromDate);
    const toDate = new Date(data.toDate);

    if (toDate < fromDate) {
      return res.status(400).json({
        success: false,
        message: 'To date must be after from date',
      });
    }

    const totalDays = calculateLeaveDays(fromDate, toDate);

    const leaveType = await prisma.leaveType.findUnique({
      where: { id: data.leaveTypeId },
    });

    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: 'Leave type not found',
      });
    }

    if (leaveType.isPaid) {
      const currentYear = new Date().getFullYear();
      const leaveBalance = await prisma.leaveBalance.findUnique({
        where: {
          userId_leaveTypeId_year: {
            userId,
            leaveTypeId: data.leaveTypeId,
            year: currentYear,
          },
        },
      });

      if (!leaveBalance || leaveBalance.remainingLeaves < totalDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient leave balance. You have ${leaveBalance?.remainingLeaves || 0} days remaining.`,
        });
      }
    }

    const overlappingLeave = await prisma.leaveRequest.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            fromDate: { lte: toDate },
            toDate: { gte: fromDate },
          },
        ],
      },
    });

    if (overlappingLeave) {
      return res.status(400).json({
        success: false,
        message: 'You already have a leave request for this period',
      });
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId,
        leaveTypeId: data.leaveTypeId,
        fromDate,
        toDate,
        totalDays,
        reason: data.reason,
        attachmentUrl: data.attachmentUrl,
        status: 'PENDING',
      },
      include: {
        leaveType: true,
        user: {
          select: {
            fullName: true,
            employeeCode: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: {
        leaveRequest,
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
    console.error('Apply Leave error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getMyLeaveRequests = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const userId = req.user.userId;
    const { status, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = { userId };
    if (status) {
      whereClause.status = status;
    }

    const [leaveRequests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: whereClause,
        include: {
          leaveType: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.leaveRequest.count({ where: whereClause }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        leaveRequests,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get My Leave Requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getAdminLeaveRequests = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const companyId = req.user.companyId;

    const {
      status,
      departmentId,
      teamId,
      userId,
      page = '1',
      limit = '10',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {
      user: {
        companyId,
      },
    };

    if (status) {
      whereClause.status = status;
    }

    if (departmentId) {
      whereClause.user.departmentId = departmentId;
    }

    if (teamId) {
      whereClause.user.teamId = teamId;
    }

    if (userId) {
      whereClause.userId = userId;
    }

    const [leaveRequests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              fullName: true,
              employeeCode: true,
              department: true,
              team: true,
              teamLeader: true,
            },
          },
          leaveType: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.leaveRequest.count({ where: whereClause }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        leaveRequests,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get Admin Leave Requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const approveLeave = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { id } = req.params;
    const approverId = req.user.userId;
    const companyId = req.user.companyId;

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            companyId: true,
          },
        },
        leaveType: true,
      },
    });

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    if (leaveRequest.user.companyId !== companyId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to manage this leave request',
      });
    }

    if (leaveRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Leave request is not pending',
      });
    }

    if (leaveRequest.leaveType.isPaid) {
      const currentYear = new Date().getFullYear();
      const leaveBalance = await prisma.leaveBalance.findUnique({
        where: {
          userId_leaveTypeId_year: {
            userId: leaveRequest.userId,
            leaveTypeId: leaveRequest.leaveTypeId,
            year: currentYear,
          },
        },
      });

      if (!leaveBalance || leaveBalance.remainingLeaves < leaveRequest.totalDays) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient leave balance',
        });
      }

      await prisma.leaveBalance.update({
        where: {
          userId_leaveTypeId_year: {
            userId: leaveRequest.userId,
            leaveTypeId: leaveRequest.leaveTypeId,
            year: currentYear,
          },
        },
        data: {
          usedLeaves: { increment: leaveRequest.totalDays },
          remainingLeaves: { decrement: leaveRequest.totalDays },
        },
      });
    }

    const attendanceStatus: AttendanceStatus = leaveRequest.leaveType.isPaid
      ? 'PAID_LEAVE'
      : 'UNPAID_LEAVE';

    let currentDate = new Date(leaveRequest.fromDate);
    while (currentDate <= leaveRequest.toDate) {
      await prisma.attendance.upsert({
        where: {
          userId_date: {
            userId: leaveRequest.userId,
            date: currentDate,
          },
        },
        update: {
          status: attendanceStatus,
          notes: `Leave: ${leaveRequest.leaveType.name}`,
        },
        create: {
          userId: leaveRequest.userId,
          date: currentDate,
          status: attendanceStatus,
          notes: `Leave: ${leaveRequest.leaveType.name}`,
        },
      });

      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }

    const updatedLeaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: approverId,
      },
      include: {
        user: {
          select: {
            fullName: true,
            employeeCode: true,
          },
        },
        leaveType: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Leave request approved successfully',
      data: {
        leaveRequest: updatedLeaveRequest,
      },
    });
  } catch (error) {
    console.error('Approve Leave error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const rejectLeave = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { id } = req.params;
    const { rejectionReason } = req.body;
    const rejecterId = req.user.userId;
    const companyId = req.user.companyId;

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            companyId: true,
          },
        },
      },
    });

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    if (leaveRequest.user.companyId !== companyId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to manage this leave request',
      });
    }

    if (leaveRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Leave request is not pending',
      });
    }

    const updatedLeaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedBy: rejecterId,
        rejectionReason,
      },
      include: {
        user: {
          select: {
            fullName: true,
            employeeCode: true,
          },
        },
        leaveType: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Leave request rejected',
      data: {
        leaveRequest: updatedLeaveRequest,
      },
    });
  } catch (error) {
    console.error('Reject Leave error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
