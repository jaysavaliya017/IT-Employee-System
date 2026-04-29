import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, ApiResponse } from '../types';
import { AttendanceStatus, Role } from '@prisma/client';

export const getEmployeeDashboard = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        shift: true,
        teamLeader: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const todayAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

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

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const monthlyAttendances = await prisma.attendance.findMany({
      where: {
        userId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: { date: 'asc' },
    });

    const upcomingHolidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: today,
        },
      },
      orderBy: { date: 'asc' },
      take: 5,
    });

    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        creator: {
          select: {
            fullName: true,
          },
        },
      },
    });

    const pendingLeaveRequests = await prisma.leaveRequest.count({
      where: {
        userId,
        status: 'PENDING',
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        user,
        todayAttendance,
        leaveBalances,
        monthlyAttendances,
        upcomingHolidays,
        announcements,
        pendingLeaveRequests,
      },
    });
  } catch (error) {
    console.error('Get Employee Dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getAdminDashboard = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const companyId = req.user.companyId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const totalEmployees = await prisma.user.count({
      where: {
        companyId,
        role: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });

    const todayAttendances = await prisma.attendance.findMany({
      where: {
        user: {
          companyId,
        },
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
            department: true,
          },
        },
      },
    });

    const presentCount = todayAttendances.filter((a) =>
      ['PRESENT', 'HALF_DAY', 'PAID_LEAVE', 'SICK_LEAVE', 'CASUAL_LEAVE'].includes(a.status as AttendanceStatus)
    ).length;

    const absentCount = totalEmployees - presentCount;

    const onLeaveToday = await prisma.leaveRequest.count({
      where: {
        user: {
          companyId,
        },
        status: 'APPROVED',
        fromDate: { lte: today },
        toDate: { gte: today },
      },
    });

    const lateArrivals = todayAttendances.filter((a) => a.isLate).length;

    const pendingLeaveRequests = await prisma.leaveRequest.count({
      where: {
        user: {
          companyId,
        },
        status: 'PENDING',
      },
    });

    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const monthlyAttendances = await prisma.attendance.groupBy({
      by: ['status'],
      where: {
        user: {
          companyId,
        },
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _count: true,
    });

    const departmentAttendance = await prisma.attendance.findMany({
      where: {
        user: {
          companyId,
        },
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        user: {
          select: {
            department: true,
          },
        },
      },
    });

    const departmentStats: Record<string, { present: number; absent: number; total: number }> = {};

    for (const att of departmentAttendance) {
      const deptName = att.user.department?.name || 'Unassigned';
      if (!departmentStats[deptName]) {
        departmentStats[deptName] = { present: 0, absent: 0, total: 0 };
      }
      departmentStats[deptName].total++;
      if (['PRESENT', 'HALF_DAY', 'PAID_LEAVE', 'SICK_LEAVE', 'CASUAL_LEAVE'].includes(att.status as AttendanceStatus)) {
        departmentStats[deptName].present++;
      }
    }

    const pendingLeaves = await prisma.leaveRequest.findMany({
      where: {
        user: {
          companyId,
        },
        status: 'PENDING',
      },
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
      take: 10,
    });

    return res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        presentToday: presentCount,
        absentToday: absentCount,
        onLeaveToday,
        lateArrivals,
        pendingLeaveRequests,
        departments: departments.map((d) => ({
          name: d.name,
          employeeCount: d._count.users,
        })),
        departmentStats,
        monthlyAttendendance: monthlyAttendances.map((a) => ({
          status: a.status,
          count: a._count,
        })),
        pendingLeaves,
      },
    });
  } catch (error) {
    console.error('Get Admin Dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getManagerDashboard = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const userId = req.user.userId;

    const subordinates = await prisma.user.findMany({
      where: {
        managerId: userId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        fullName: true,
        employeeCode: true,
        department: true,
      },
    });

    const subordinateIds = subordinates.map((s) => s.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const todayAttendances = await prisma.attendance.findMany({
      where: {
        userId: { in: subordinateIds },
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const presentCount = todayAttendances.filter((a) =>
      ['PRESENT', 'HALF_DAY', 'PAID_LEAVE'].includes(a.status as AttendanceStatus)
    ).length;

    const pendingLeaveRequests = await prisma.leaveRequest.count({
      where: {
        userId: { in: subordinateIds },
        status: 'PENDING',
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        totalSubordinates: subordinates.length,
        presentToday: presentCount,
        absentToday: subordinates.length - presentCount,
        pendingLeaveRequests,
        subordinates,
      },
    });
  } catch (error) {
    console.error('Get Manager Dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
