import { Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '../config/database';
import { AuthRequest, ApiResponse } from '../types';
import { processPendingPunches, reprocessForUser } from '../services/biometricService';
import {
  getDeviceUsers,
  syncAllDevices,
  syncDevice,
  testConnection,
} from '../services/zktecoService';

const deviceSchema = z.object({
  name: z.string().min(2, 'Device name is required'),
  serialNumber: z.string().min(3, 'Serial number is required'),
  deviceType: z.enum(['ZKTECO', 'ESSL', 'REALTIME', 'MANTRA', 'OTHER']).default('ZKTECO'),
  ipAddress: z
    .string()
    .regex(/^(\d{1,3}\.){3}\d{1,3}$/, 'Enter a valid IPv4 address')
    .optional()
    .or(z.literal('')),
  port: z.coerce.number().int().min(1).max(65535).default(4370),
  commKey: z.coerce.number().int().min(0).default(0),
  location: z.string().optional(),
  timezone: z.string().default('Asia/Kolkata'),
  isActive: z.boolean().default(true),
});

const fail = (res: Response<ApiResponse>, error: any, fallback: string) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  console.error(`${fallback}:`, error);
  return res.status(500).json({ success: false, message: error?.message || fallback });
};

export const getDevices = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const devices = await prisma.biometricDevice.findMany({
      where: { companyId: req.user!.companyId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { punches: true } } },
    });

    const unmapped = await prisma.biometricPunch.groupBy({
      by: ['biometricUserId'],
      where: { companyId: req.user!.companyId, userId: null, processed: false },
      _count: { _all: true },
    });

    return res.json({
      success: true,
      message: 'Devices loaded',
      data: {
        devices,
        unmappedEnrollments: unmapped.map((row) => ({
          biometricUserId: row.biometricUserId,
          punchCount: row._count._all,
        })),
      },
    });
  } catch (error) {
    return fail(res, error, 'Could not load devices');
  }
};

export const createDevice = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const input = deviceSchema.parse(req.body);

    const existing = await prisma.biometricDevice.findUnique({
      where: { serialNumber: input.serialNumber },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A device with this serial number is already registered',
      });
    }

    const device = await prisma.biometricDevice.create({
      data: {
        ...input,
        ipAddress: input.ipAddress || null,
        companyId: req.user!.companyId,

        pushToken: crypto.randomBytes(20).toString('hex'),
      },
    });

    return res.status(201).json({ success: true, message: 'Device added', data: { device } });
  } catch (error) {
    return fail(res, error, 'Could not add device');
  }
};

export const updateDevice = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const input = deviceSchema.partial().parse(req.body);

    const device = await prisma.biometricDevice.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    });

    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });

    const updated = await prisma.biometricDevice.update({
      where: { id: device.id },
      data: { ...input, ipAddress: input.ipAddress === '' ? null : input.ipAddress },
    });

    return res.json({ success: true, message: 'Device updated', data: { device: updated } });
  } catch (error) {
    return fail(res, error, 'Could not update device');
  }
};

export const deleteDevice = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const device = await prisma.biometricDevice.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    });

    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });

    await prisma.biometricDevice.delete({ where: { id: device.id } });
    return res.json({ success: true, message: 'Device removed' });
  } catch (error) {
    return fail(res, error, 'Could not remove device');
  }
};

export const testDevice = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const device = await prisma.biometricDevice.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    });

    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });
    if (!device.ipAddress) {
      return res.status(400).json({
        success: false,
        message: 'This device is set up for push mode, so there is nothing to connect to.',
      });
    }

    const result = await testConnection({
      ipAddress: device.ipAddress,
      port: device.port,
      commKey: device.commKey,
    });

    await prisma.biometricDevice.update({
      where: { id: device.id },
      data: {
        status: result.success ? 'ONLINE' : 'OFFLINE',
        lastSeenAt: result.success ? new Date() : device.lastSeenAt,
      },
    });

    return res.json({
      success: result.success,
      message: result.success ? 'Device reachable' : result.message || 'Device did not respond',
      data: result.success ? { info: (result as any).info } : undefined,
    });
  } catch (error) {
    return fail(res, error, 'Connection test failed');
  }
};

export const syncOneDevice = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const device = await prisma.biometricDevice.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    });

    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });

    const result = await syncDevice(device.id);

    return res.json({
      success: true,
      message: `Stored ${result.stored} new punch(es)`,
      data: result,
    });
  } catch (error) {
    return fail(res, error, 'Sync failed');
  }
};

export const syncAll = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const results = await syncAllDevices(req.user!.companyId);
    return res.json({ success: true, message: 'Sync finished', data: { results } });
  } catch (error) {
    return fail(res, error, 'Sync failed');
  }
};

export const processPunches = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const summary = await processPendingPunches(req.user!.companyId);
    return res.json({
      success: true,
      message: `Applied ${summary.applied} of ${summary.total} punch(es)`,
      data: summary,
    });
  } catch (error) {
    return fail(res, error, 'Could not process punches');
  }
};

export const listDeviceEnrollments = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const device = await prisma.biometricDevice.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    });

    if (!device?.ipAddress) {
      return res.status(400).json({ success: false, message: 'Device is not reachable for enrollment listing' });
    }

    const enrollments = await getDeviceUsers({
      ipAddress: device.ipAddress,
      port: device.port,
      commKey: device.commKey,
    });

    const mapped = await prisma.user.findMany({
      where: { companyId: req.user!.companyId, biometricId: { not: null } },
      select: { id: true, fullName: true, employeeCode: true, biometricId: true },
    });

    return res.json({
      success: true,
      message: 'Enrollments loaded',
      data: {
        enrollments: enrollments.map((item: any) => ({
          ...item,
          mappedTo: mapped.find((user) => user.biometricId === item.biometricUserId) || null,
        })),
      },
    });
  } catch (error) {
    return fail(res, error, 'Could not read enrollments from device');
  }
};

const mapSchema = z.object({
  biometricId: z.string().trim().min(1, 'Device ID is required').nullable(),
});

export const mapEmployee = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const { biometricId } = mapSchema.parse(req.body);

    const employee = await prisma.user.findFirst({
      where: { id: req.params.userId, companyId: req.user!.companyId },
    });

    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    if (biometricId) {
      const clash = await prisma.user.findFirst({
        where: {
          companyId: req.user!.companyId,
          biometricId,
          id: { not: employee.id },
        },
        select: { fullName: true, employeeCode: true },
      });

      if (clash) {
        return res.status(409).json({
          success: false,
          message: `Device ID ${biometricId} is already assigned to ${clash.fullName} (${clash.employeeCode})`,
        });
      }
    }

    await prisma.user.update({
      where: { id: employee.id },
      data: { biometricId },
    });

    const summary = biometricId ? await reprocessForUser(employee.id) : null;

    return res.json({
      success: true,
      message: biometricId
        ? `Mapped to device ID ${biometricId}${summary?.applied ? `, backfilled ${summary.applied} punch(es)` : ''}`
        : 'Device mapping removed',
      data: { summary },
    });
  } catch (error) {
    return fail(res, error, 'Could not map employee');
  }
};

export const getPunchLogs = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 50);

    const where: any = { companyId: req.user!.companyId };

    if (req.query.deviceId) where.deviceId = String(req.query.deviceId);
    if (req.query.unmappedOnly === 'true') where.userId = null;
    if (req.query.from || req.query.to) {
      where.punchTime = {};
      if (req.query.from) where.punchTime.gte = new Date(String(req.query.from));
      if (req.query.to) where.punchTime.lte = new Date(String(req.query.to));
    }

    const [punches, total] = await Promise.all([
      prisma.biometricPunch.findMany({
        where,
        orderBy: { punchTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          device: { select: { name: true, location: true } },
          user: { select: { id: true, fullName: true, employeeCode: true } },
        },
      }),
      prisma.biometricPunch.count({ where }),
    ]);

    return res.json({
      success: true,
      message: 'Punch logs loaded',
      data: { punches, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return fail(res, error, 'Could not load punch logs');
  }
};
