import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, ApiResponse } from '../types';
import { AttendanceStatus } from '@prisma/client';

export const getMonthlyAttendanceReport = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { month, year, departmentId, teamId } = req.query;

    const monthNum = parseInt(month as string) || new Date().getMonth() + 1;
    const yearNum = parseInt(year as string) || new Date().getFullYear();

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);
    const companyId = req.user.companyId;

    const whereClause: any = {
      user: {
        companyId,
      },
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (departmentId) {
      whereClause.user.departmentId = departmentId;
    }

    if (teamId) {
      whereClause.user.teamId = teamId;
    }

    const attendances = await prisma.attendance.findMany({
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
      },
      orderBy: [
        { user: { fullName: 'asc' } },
        { date: 'asc' },
      ],
    });

    const summary = await prisma.attendance.groupBy({
      by: ['userId', 'status'],
      where: whereClause,
      _count: true,
    });

    return res.status(200).json({
      success: true,
      data: {
        attendances,
        summary,
      },
    });
  } catch (error) {
    console.error('Get Monthly Attendance Report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getEmployeeAttendanceReport = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { userId, startDate, endDate } = req.query;
    const companyId = req.user.companyId;

    const whereClause: any = {
      user: {
        companyId,
      },
    };

    if (userId) {
      const targetUser = await prisma.user.findFirst({
        where: {
          id: userId as string,
          companyId,
        },
        select: { id: true },
      });

      if (!targetUser) {
        return res.status(403).json({
          success: false,
          message: 'User not found in your company',
        });
      }

      whereClause.userId = userId;
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            fullName: true,
            employeeCode: true,
            department: true,
            designation: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    const totals = attendances.reduce(
      (acc, att) => {
        if (att.totalHours) {
          acc.totalHours += att.totalHours;
        }
        if (att.netHours) {
          acc.netHours += att.netHours;
        }
        if (att.overtimeHours) {
          acc.overtimeHours += att.overtimeHours;
        }
        return acc;
      },
      { totalHours: 0, netHours: 0, overtimeHours: 0 }
    );

    return res.status(200).json({
      success: true,
      data: {
        attendances,
        totals,
      },
    });
  } catch (error) {
    console.error('Get Employee Attendance Report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getDepartmentAttendanceReport = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { month, year } = req.query;
  const companyId = req.user.companyId;

    const monthNum = parseInt(month as string) || new Date().getMonth() + 1;
    const yearNum = parseInt(year as string) || new Date().getFullYear();

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

    const departments = await prisma.department.findMany({
      include: {
        users: {
          where: {
            companyId,
          },
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    const departmentReports = [];

    for (const dept of departments) {
      const userIds = dept.users.map((u) => u.id);

      const attendances = await prisma.attendance.findMany({
        where: {
          userId: { in: userIds },
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const statusCounts = {
        PRESENT: 0,
        ABSENT: 0,
        HALF_DAY: 0,
        PAID_LEAVE: 0,
        UNPAID_LEAVE: 0,
        SICK_LEAVE: 0,
        CASUAL_LEAVE: 0,
        HOLIDAY: 0,
        WEEK_OFF: 0,
      };

      for (const att of attendances) {
        if (att.status in statusCounts) {
          statusCounts[att.status as keyof typeof statusCounts]++;
        }
      }

      departmentReports.push({
        department: dept.name,
        employeeCount: dept.users.length,
        statusCounts,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        departmentReports,
      },
    });
  } catch (error) {
    console.error('Get Department Attendance Report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getTeamAttendanceReport = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { month, year } = req.query;
  const companyId = req.user.companyId;

    const monthNum = parseInt(month as string) || new Date().getMonth() + 1;
    const yearNum = parseInt(year as string) || new Date().getFullYear();

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

    const teams = await prisma.team.findMany({
      include: {
        teamLeader: {
          select: {
            fullName: true,
          },
        },
        members: {
          where: {
            user: {
              companyId,
            },
          },
          include: {
            user: true,
          },
        },
      },
    });

    const teamReports = [];

    for (const team of teams) {
      const userIds = team.members.map((m) => m.userId);

      const attendances = await prisma.attendance.findMany({
        where: {
          userId: { in: userIds },
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const totalHours = attendances.reduce((sum, att) => sum + (att.totalHours || 0), 0);
      const netHours = attendances.reduce((sum, att) => sum + (att.netHours || 0), 0);
      const lateCount = attendances.filter((att) => att.isLate).length;

      teamReports.push({
        team: team.name,
        teamLeader: team.teamLeader?.fullName || 'Not Assigned',
        memberCount: team.members.length,
        totalHours,
        netHours,
        lateCount,
        attendanceCount: attendances.length,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        teamReports,
      },
    });
  } catch (error) {
    console.error('Get Team Attendance Report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getLeaveReport = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { fromDate, toDate, departmentId, teamId, status } = req.query;
    const companyId = req.user.companyId;

    const whereClause: any = {
      user: {
        companyId,
      },
    };

    if (fromDate && toDate) {
      whereClause.fromDate = {
        gte: new Date(fromDate as string),
      };
      whereClause.toDate = {
        lte: new Date(toDate as string),
      };
    }

    if (status) {
      whereClause.status = status;
    }

    if (departmentId) {
      whereClause.user.departmentId = departmentId;
    }

    if (teamId) {
      whereClause.user.teamId = teamId;
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
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
    });

    const summary = {
      pending: leaveRequests.filter((lr) => lr.status === 'PENDING').length,
      approved: leaveRequests.filter((lr) => lr.status === 'APPROVED').length,
      rejected: leaveRequests.filter((lr) => lr.status === 'REJECTED').length,
      totalDays: leaveRequests
        .filter((lr) => lr.status === 'APPROVED')
        .reduce((sum, lr) => sum + lr.totalDays, 0),
    };

    return res.status(200).json({
      success: true,
      data: {
        leaveRequests,
        summary,
      },
    });
  } catch (error) {
    console.error('Get Leave Report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getLateArrivalsReport = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { month, year, departmentId, teamId } = req.query;
  const companyId = req.user.companyId;

    const monthNum = parseInt(month as string) || new Date().getMonth() + 1;
    const yearNum = parseInt(year as string) || new Date().getFullYear();

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

    const whereClause: any = {
      user: {
        companyId,
      },
      isLate: true,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (departmentId) {
      whereClause.user.departmentId = departmentId;
    }

    if (teamId) {
      whereClause.user.teamId = teamId;
    }

    const lateArrivals = await prisma.attendance.findMany({
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
      },
      orderBy: { date: 'asc' },
    });

    const summary = lateArrivals.reduce((acc, att) => {
      const key = att.userId;
      if (!acc[key]) {
        acc[key] = {
          user: att.user,
          count: 0,
        };
      }
      acc[key].count++;
      return acc;
    }, {} as Record<string, any>);

    return res.status(200).json({
      success: true,
      data: {
        lateArrivals,
        summary: Object.values(summary),
      },
    });
  } catch (error) {
    console.error('Get Late Arrivals Report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
