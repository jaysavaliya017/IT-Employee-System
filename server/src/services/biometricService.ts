import prisma from '../config/database';
import { calculateWorkingHours, isLatePunchIn } from '../utils';
import { AttendanceStatus, BiometricPunchDirection } from '@prisma/client';

const MIN_GAP_SECONDS = 90;

export interface RawPunch {
  biometricUserId: string;
  punchTime: Date;
  direction?: BiometricPunchDirection;
  verifyMode?: number;
  rawPayload?: string;
}

const dayRange = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

export const ingestPunches = async (deviceId: string, records: RawPunch[]) => {
  if (records.length === 0) {
    return { received: 0, stored: 0 };
  }

  const device = await prisma.biometricDevice.findUnique({ where: { id: deviceId } });
  if (!device) throw new Error('Device not found');

  const result = await prisma.biometricPunch.createMany({
    data: records.map((record) => ({
      deviceId,
      companyId: device.companyId,
      biometricUserId: String(record.biometricUserId).trim(),
      punchTime: record.punchTime,
      direction: record.direction ?? 'AUTO',
      verifyMode: record.verifyMode,
      rawPayload: record.rawPayload,
    })),
    skipDuplicates: true,
  });

  await prisma.biometricDevice.update({
    where: { id: deviceId },
    data: { lastSeenAt: new Date() },
  });

  return { received: records.length, stored: result.count };
};

const recalculateAttendance = async (attendanceId: string) => {
  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: {
      user: { include: { shift: true } },
      sessions: { orderBy: { startTime: 'asc' } },
    },
  });

  if (!attendance) return null;

  const totalHours = attendance.sessions.reduce((sum, session) => {
    if (!session.endTime) return sum;
    return sum + calculateWorkingHours(session.startTime, session.endTime);
  }, 0);

  const shift = attendance.user.shift;
  let status: AttendanceStatus = 'PRESENT';
  let overtimeHours = 0;

  if (shift) {
    if (totalHours >= shift.fullDayHours) {
      status = 'PRESENT';
      overtimeHours = Math.max(0, totalHours - shift.fullDayHours);
    } else {
      status = 'HALF_DAY';
    }
  }

  const firstSession = attendance.sessions[0];
  const lastClosed = [...attendance.sessions].reverse().find((session) => session.endTime);

  return prisma.attendance.update({
    where: { id: attendanceId },
    data: {
      punchInTime: firstSession?.startTime ?? attendance.punchInTime,
      punchOutTime: lastClosed?.endTime ?? null,
      totalHours,
      netHours: totalHours,
      status,
      overtimeHours,
    },
  });
};

const applyPunch = async (
  userId: string,
  punchTime: Date,
  direction: BiometricPunchDirection,
  deviceLabel: string
) => {
  const { start, end } = dayRange(punchTime);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { shift: true },
  });

  if (!user) throw new Error('Employee not found');

  let attendance = await prisma.attendance.findFirst({
    where: { userId, date: { gte: start, lt: end } },
    include: { sessions: { orderBy: { startTime: 'asc' } } },
  });

  if (!attendance) {
    const isLate = user.shift
      ? isLatePunchIn(punchTime, user.shift.startTime, user.shift.graceMinutes)
      : false;

    attendance = await prisma.attendance.create({
      data: {
        userId,
        date: start,
        punchInTime: punchTime,
        isLate,
        status: 'PRESENT',
        punchInLocation: deviceLabel,
        notes: 'Recorded by fingerprint device',
      },
      include: { sessions: true },
    });
  }

  const openSession = [...attendance.sessions].reverse().find((session) => !session.endTime);
  let lastEvent: Date | null = null;
  for (const session of attendance.sessions) {
    const candidate: Date = session.endTime ?? session.startTime;
    if (!lastEvent || candidate > lastEvent) lastEvent = candidate;
  }

  if (lastEvent && (punchTime.getTime() - lastEvent.getTime()) / 1000 < MIN_GAP_SECONDS) {
    return { action: 'ignored_duplicate' as const, attendanceId: attendance.id };
  }

  const shouldClose =
    direction === 'OUT' || (direction === 'AUTO' && Boolean(openSession));

  if (shouldClose) {
    if (!openSession) {

      return { action: 'orphan_out' as const, attendanceId: attendance.id };
    }

    await prisma.attendanceSession.update({
      where: { id: openSession.id },
      data: { endTime: punchTime, punchOutLocation: deviceLabel },
    });

    await recalculateAttendance(attendance.id);
    return { action: 'punch_out' as const, attendanceId: attendance.id };
  }

  await prisma.attendanceSession.create({
    data: {
      attendanceId: attendance.id,
      userId,
      startTime: punchTime,
      punchInLocation: deviceLabel,
    },
  });

  await recalculateAttendance(attendance.id);
  return { action: 'punch_in' as const, attendanceId: attendance.id };
};

export const processPendingPunches = async (companyId?: string) => {
  const pending = await prisma.biometricPunch.findMany({
    where: { processed: false, ...(companyId ? { companyId } : {}) },
    orderBy: { punchTime: 'asc' },
    include: { device: true },
    take: 2000,
  });

  const summary = {
    total: pending.length,
    applied: 0,
    unmapped: 0,
    duplicates: 0,
    failed: 0,
  };

  for (const punch of pending) {
    try {
      let userId = punch.userId;

      if (!userId) {
        const user = await prisma.user.findFirst({
          where: {
            companyId: punch.companyId,
            biometricId: punch.biometricUserId,
            status: 'ACTIVE',
          },
          select: { id: true },
        });
        userId = user?.id ?? null;
      }

      if (!userId) {

        summary.unmapped += 1;
        await prisma.biometricPunch.update({
          where: { id: punch.id },
          data: { errorMessage: `No employee mapped to device ID ${punch.biometricUserId}` },
        });
        continue;
      }

      const result = await applyPunch(
        userId,
        punch.punchTime,
        punch.direction,
        punch.device.location || punch.device.name
      );

      if (result.action === 'ignored_duplicate') summary.duplicates += 1;
      else summary.applied += 1;

      await prisma.biometricPunch.update({
        where: { id: punch.id },
        data: {
          userId,
          processed: true,
          processedAt: new Date(),
          errorMessage: result.action === 'orphan_out' ? 'Punch-out with no matching punch-in' : null,
        },
      });
    } catch (error: any) {
      summary.failed += 1;
      await prisma.biometricPunch.update({
        where: { id: punch.id },
        data: { errorMessage: error?.message?.slice(0, 400) || 'Processing failed' },
      });
    }
  }

  return summary;
};

export const reprocessForUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true, biometricId: true },
  });

  if (!user?.biometricId) return { total: 0, applied: 0, unmapped: 0, duplicates: 0, failed: 0 };

  await prisma.biometricPunch.updateMany({
    where: { companyId: user.companyId, biometricUserId: user.biometricId, processed: false },
    data: { userId },
  });

  return processPendingPunches(user.companyId);
};
