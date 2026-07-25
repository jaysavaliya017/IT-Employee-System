import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AuthRequest, ApiResponse } from '../types';
import { calculateWorkingHours, isLatePunchIn } from '../utils';
import { AttendanceStatus } from '@prisma/client';

const punchInSchema = z.object({
  punchInLocation: z.string().optional(),
});

const punchOutSchema = z.object({
  punchOutLocation: z.string().optional(),
});

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

const calculateAttendanceMetrics = (
  totalHours: number,
  shift: { fullDayHours: number; halfDayHours: number } | null | undefined
) => {
  let netHours = totalHours;
  let status: AttendanceStatus = 'PRESENT';
  let overtimeHours = 0;

  if (!shift) {
    return { netHours, status, overtimeHours };
  }

  if (totalHours >= shift.fullDayHours) {
    status = 'PRESENT';
    if (totalHours > shift.fullDayHours) {
      overtimeHours = totalHours - shift.fullDayHours;
    }
  } else if (totalHours >= shift.halfDayHours) {
    status = 'HALF_DAY';
  } else {
    status = 'HALF_DAY';
  }

  return { netHours, status, overtimeHours };
};

const serializeTodayAttendance = (attendance: any) => {
  if (!attendance) {
    return null;
  }

  const sessions = [...(attendance.sessions || [])].sort(
    (left: { startTime: Date }, right: { startTime: Date }) =>
      new Date(left.startTime).getTime() - new Date(right.startTime).getTime()
  );
  const currentSession = sessions.find((session: { endTime?: Date | null }) => !session.endTime) || null;

  return {
    ...attendance,
    sessions,
    currentSession,
  };
};

export const punchIn = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    punchInSchema.parse(req.body);

    const userId = req.user.userId;
    const { start, end } = getTodayRange();

    const existingOpenSession = await prisma.attendanceSession.findFirst({
      where: {
        userId,
        startTime: {
          gte: start,
          lt: end,
        },
        endTime: null,
      },
      orderBy: { startTime: 'desc' },
    });

    if (existingOpenSession) {
      return res.status(400).json({
        success: false,
        message: 'You are already punched in. Please punch out first.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { shift: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isLate = user.shift
      ? isLatePunchIn(new Date(), user.shift.startTime, user.shift.graceMinutes)
      : false;

    const clientIp = req.ip || req.socket.remoteAddress;
    const punchInTime = new Date();

    let attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: {
          gte: start,
          lt: end,
        },
      },
      include: {
        sessions: true,
      },
    });

    if (!attendance) {
      attendance = await prisma.attendance.create({
        data: {
          userId,
          date: start,
          punchInTime,
          isLate,
          punchInIp: clientIp,
          punchInLocation: req.body.punchInLocation,
          status: 'PRESENT',
        },
        include: {
          sessions: true,
        },
      });
    }

    await prisma.attendanceSession.create({
      data: {
        attendanceId: attendance.id,
        userId,
        startTime: punchInTime,
        punchInIp: clientIp,
        punchInLocation: req.body.punchInLocation,
      },
    });

    const refreshedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        punchInTime: attendance.punchInTime || punchInTime,
        punchOutTime: null,
        isLate: attendance.sessions.length > 0 ? attendance.isLate : isLate,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
          },
        },
        sessions: {
          orderBy: { startTime: 'asc' },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: isLate ? 'Punched in successfully. You are late.' : 'Punched in successfully',
      data: {
        attendance: serializeTodayAttendance(refreshedAttendance),
        isLate,
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
    console.error('Punch In error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const punchOut = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    punchOutSchema.parse(req.body);

    const userId = req.user.userId;
    const { start, end } = getTodayRange();

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: {
          gte: start,
          lt: end,
        },
      },
      include: {
        user: {
          include: { shift: true },
        },
        sessions: {
          orderBy: { startTime: 'asc' },
        },
      },
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No punch-in found for today. Please punch in first.',
      });
    }

    const openSession = [...attendance.sessions]
      .reverse()
      .find((session) => !session.endTime);

    if (!openSession) {
      return res.status(400).json({
        success: false,
        message: 'No active punch-in found for today. Please punch in first.',
      });
    }

    const punchOutTime = new Date();
    const clientIp = req.ip || req.socket.remoteAddress;

    await prisma.attendanceSession.update({
      where: { id: openSession.id },
      data: {
        endTime: punchOutTime,
        punchOutIp: clientIp,
        punchOutLocation: req.body.punchOutLocation,
      },
    });

    const sessions = await prisma.attendanceSession.findMany({
      where: {
        attendanceId: attendance.id,
      },
      orderBy: { startTime: 'asc' },
    });

    const totalHours = sessions.reduce((total, session) => {
      if (!session.endTime) {
        return total;
      }

      return total + calculateWorkingHours(session.startTime, session.endTime);
    }, 0);

    const { netHours, status, overtimeHours } = calculateAttendanceMetrics(
      totalHours,
      attendance.user.shift
    );

    const firstSession = sessions[0];
    const lastClosedSession = [...sessions].reverse().find((session) => session.endTime) || null;

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        punchInTime: firstSession?.startTime || attendance.punchInTime,
        punchOutTime: lastClosedSession?.endTime || punchOutTime,
        totalHours,
        netHours,
        status,
        overtimeHours,
        punchOutIp: lastClosedSession?.punchOutIp || clientIp,
        punchOutLocation: lastClosedSession?.punchOutLocation || req.body.punchOutLocation,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
          },
        },
        sessions: {
          orderBy: { startTime: 'asc' },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Punched out successfully',
      data: {
        attendance: serializeTodayAttendance(updatedAttendance),
        totalHours,
        netHours,
        overtimeHours,
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
    console.error('Punch Out error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getTodayAttendance = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const userId = req.user.userId;
    const { start, end } = getTodayRange();

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: {
          gte: start,
          lt: end,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            shift: true,
          },
        },
        sessions: {
          orderBy: { startTime: 'asc' },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        attendance: serializeTodayAttendance(attendance),
      },
    });
  } catch (error) {
    console.error('Get Today Attendance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getMonthlyAttendance = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { month, year } = req.query;
    const userId = req.user.userId;

    const monthNum = parseInt(month as string) || new Date().getMonth() + 1;
    const yearNum = parseInt(year as string) || new Date().getFullYear();

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

    const attendances = await prisma.attendance.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
      include: {
        user: {
          select: {
            fullName: true,
            shift: true,
          },
        },
        sessions: {
          orderBy: { startTime: 'asc' },
        },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        shift: true,
      },
    });

    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        attendances,
        holidays,
        shift: user?.shift,
      },
    });
  } catch (error) {
    console.error('Get Monthly Attendance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getUserAttendance = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { userId } = req.params;
    const { month, year, startDate, endDate } = req.query;
    const companyId = req.user.companyId;

    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
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

    let whereClause: any = { userId };

    if (month && year) {
      const monthNum = parseInt(month as string);
      const yearNum = parseInt(year as string);
      whereClause.date = {
        gte: new Date(yearNum, monthNum - 1, 1),
        lte: new Date(yearNum, monthNum, 0, 23, 59, 59),
      };
    } else if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
      include: {
        user: {
          select: {
            fullName: true,
            employeeCode: true,
            department: true,
            shift: true,
          },
        },
        sessions: {
          orderBy: { startTime: 'asc' },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        attendances,
      },
    });
  } catch (error) {
    console.error('Get User Attendance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getAllAttendance = async (req: AuthRequest, res: Response<ApiResponse>) => {
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
      date,
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    const companyId = req.user.companyId;

    const whereClause: any = {
      user: {
        companyId,
      },
    };

    if (date) {
      const dateObj = new Date(date as string);
      const dayStart = new Date(dateObj);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dateObj);
      dayEnd.setHours(23, 59, 59, 999);

      whereClause.date = {
        gte: dayStart,
        lte: dayEnd,
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

    if (search) {
      whereClause.user.fullName = {
        contains: search as string,
        mode: 'insensitive',
      };
    }

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
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
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.attendance.count({ where: whereClause }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        attendances,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get All Attendance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateAttendance = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { id } = req.params;
    const companyId = req.user.companyId;
    const {
      punchInTime,
      punchOutTime,
      status,
      notes,
    } = req.body;

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        id,
        user: {
          companyId,
        },
      },
      select: { id: true },
    });

    if (!existingAttendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found in your company',
      });
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        punchInTime: punchInTime ? new Date(punchInTime) : undefined,
        punchOutTime: punchOutTime ? new Date(punchOutTime) : undefined,
        status,
        notes,
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

    return res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: {
        attendance,
      },
    });
  } catch (error) {
    console.error('Update Attendance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
