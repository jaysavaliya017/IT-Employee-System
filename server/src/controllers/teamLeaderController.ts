import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, ApiResponse } from '../types';
import { AttendanceStatus } from '@prisma/client';

export const getTeamLeaderDashboard = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const teamLeaderId = req.user.userId;
    const companyId = req.user.companyId;

    const teamMembers = await prisma.user.findMany({
      where: {
        companyId,
        OR: [
          { teamLeaderId },
          { id: teamLeaderId },
        ],
        status: 'ACTIVE',
      },
      select: {
        id: true,
        fullName: true,
        employeeCode: true,
        designation: true,
        department: true,
        shift: true,
      },
    });

    const teamMemberIds = teamMembers.map((m) => m.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const todayAttendances = await prisma.attendance.findMany({
      where: {
        userId: { in: teamMemberIds },
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        user: {
          select: {
            fullName: true,
            employeeCode: true,
          },
        },
      },
    });

    const presentCount = todayAttendances.filter((a) =>
      ['PRESENT', 'HALF_DAY', 'PAID_LEAVE'].includes(a.status as AttendanceStatus)
    ).length;

    const absentCount = teamMembers.length - presentCount;

    const onLeaveToday = await prisma.leaveRequest.count({
      where: {
        userId: { in: teamMemberIds },
        status: 'APPROVED',
        fromDate: { lte: today },
        toDate: { gte: today },
      },
    });

    const lateArrivals = todayAttendances.filter((a) => a.isLate).length;

    const pendingLeaveRequests = await prisma.leaveRequest.count({
      where: {
        userId: { in: teamMemberIds },
        status: 'PENDING',
      },
    });

    const pendingLeaves = await prisma.leaveRequest.findMany({
      where: {
        userId: { in: teamMemberIds },
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            fullName: true,
            employeeCode: true,
            department: true,
          },
        },
        leaveType: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return res.status(200).json({
      success: true,
      data: {
        totalMembers: teamMembers.length,
        presentToday: presentCount,
        absentToday: absentCount,
        onLeaveToday,
        lateArrivals,
        pendingLeaveRequests,
        pendingLeaves,
        teamMembers,
      },
    });
  } catch (error) {
    console.error('Get Team Leader Dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getTeamMembers = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const teamLeaderId = req.user.userId;
    const companyId = req.user.companyId;

    const teamMembers = await prisma.user.findMany({
      where: {
        companyId,
        OR: [
          { teamLeaderId },
          { id: teamLeaderId },
        ],
        status: 'ACTIVE',
      },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        email: true,
        phone: true,
        designation: true,
        department: true,
        shift: true,
        team: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        teamMembers,
      },
    });
  } catch (error) {
    console.error('Get Team Members error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getTeamAttendanceToday = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const teamLeaderId = req.user.userId;
    const companyId = req.user.companyId;

    const teamMembers = await prisma.user.findMany({
      where: {
        companyId,
        OR: [
          { teamLeaderId },
          { id: teamLeaderId },
        ],
        status: 'ACTIVE',
      },
      select: {
        id: true,
        fullName: true,
        employeeCode: true,
        designation: true,
        department: true,
        shift: true,
      },
    });

    const teamMemberIds = teamMembers.map((m) => m.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const attendances = await prisma.attendance.findMany({
      where: {
        userId: { in: teamMemberIds },
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        user: {
          select: {
            fullName: true,
            employeeCode: true,
            designation: true,
            department: true,
          },
        },
      },
      orderBy: { punchInTime: 'asc' },
    });

    const teamLeaves = await prisma.leaveRequest.findMany({
      where: {
        userId: { in: teamMemberIds },
        status: 'APPROVED',
        fromDate: { lte: today },
        toDate: { gte: today },
      },
      include: {
        user: {
          select: {
            fullName: true,
            employeeCode: true,
            designation: true,
          },
        },
        leaveType: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        attendances,
        teamLeaves,
        teamMembers,
      },
    });
  } catch (error) {
    console.error('Get Team Attendance Today error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getTeamAttendanceMonthly = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { month, year, userId: filterUserId, status: filterStatus } = req.query;
    const teamLeaderId = req.user.userId;
    const companyId = req.user.companyId;

    const monthNum = parseInt(month as string) || new Date().getMonth() + 1;
    const yearNum = parseInt(year as string) || new Date().getFullYear();

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

    const teamMembers = await prisma.user.findMany({
      where: {
        companyId,
        OR: [
          { teamLeaderId },
          { id: teamLeaderId },
        ],
        status: 'ACTIVE',
      },
      select: {
        id: true,
        fullName: true,
        employeeCode: true,
        designation: true,
        department: true,
      },
    });

    const teamMemberIds = teamMembers.map((m) => m.id);

    const whereClause: any = {
      userId: { in: teamMemberIds },
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (filterUserId) {
      whereClause.userId = filterUserId;
    }

    if (filterStatus) {
      whereClause.status = filterStatus;
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            fullName: true,
            employeeCode: true,
            designation: true,
            department: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: {
        attendances,
        teamMembers,
      },
    });
  } catch (error) {
    console.error('Get Team Attendance Monthly error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getTeamLeaves = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { status, page = '1', limit = '10' } = req.query;
    const teamLeaderId = req.user.userId;
  const companyId = req.user.companyId;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const teamMembers = await prisma.user.findMany({
      where: {
        companyId,
        OR: [
          { teamLeaderId },
          { id: teamLeaderId },
        ],
      },
      select: { id: true },
    });

    const teamMemberIds = teamMembers.map((m) => m.id);

    const whereClause: any = {
      userId: { in: teamMemberIds },
    };

    if (status) {
      whereClause.status = status;
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
    console.error('Get Team Leaves error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const teamLeaderApproveLeave = async (req: AuthRequest, res: Response<ApiResponse>) => {
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

    const setting = await prisma.leaveApprovalSetting.findFirst();

    if (!setting || !setting.canTeamLeaderApproveLeave) {
      return res.status(403).json({
        success: false,
        message: 'Team leaders are not authorized to approve leave requests',
      });
    }

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

    if (leaveRequest.userId === approverId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot approve your own leave request',
      });
    }

    if (leaveRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Leave request is not pending',
      });
    }

    const teamLeader = await prisma.user.findUnique({
      where: { id: approverId },
    });

    const isTeamMember = await prisma.user.findFirst({
      where: {
        id: leaveRequest.userId,
        companyId,
        OR: [
          { teamLeaderId: approverId },
          { id: approverId },
        ],
      },
    });

    if (!isTeamMember && teamLeader?.role !== 'SUPER_ADMIN' && teamLeader?.role !== 'ADMIN' && teamLeader?.role !== 'HR') {
      return res.status(403).json({
        success: false,
        message: 'You can only approve leave for your team members',
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
    console.error('Team Leader Approve Leave error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const teamLeaderRejectLeave = async (req: AuthRequest, res: Response<ApiResponse>) => {
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

    const setting = await prisma.leaveApprovalSetting.findFirst();

    if (!setting || !setting.canTeamLeaderApproveLeave) {
      return res.status(403).json({
        success: false,
        message: 'Team leaders are not authorized to reject leave requests',
      });
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
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

    const teamLeader = await prisma.user.findUnique({
      where: { id: rejecterId },
    });

    const isTeamMember = await prisma.user.findFirst({
      where: {
        id: leaveRequest.userId,
        companyId,
        OR: [
          { teamLeaderId: rejecterId },
          { id: rejecterId },
        ],
      },
    });

    if (!isTeamMember && teamLeader?.role !== 'SUPER_ADMIN' && teamLeader?.role !== 'ADMIN' && teamLeader?.role !== 'HR') {
      return res.status(403).json({
        success: false,
        message: 'You can only reject leave for your team members',
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
    console.error('Team Leader Reject Leave error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
