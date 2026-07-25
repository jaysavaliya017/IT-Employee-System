import prisma from '../config/database';
import { ingestPunches, processPendingPunches, RawPunch } from './biometricService';

const ZKLib = require('node-zklib');

interface DeviceConnection {
  ipAddress: string;
  port: number;
  commKey?: number;
}

const CONNECT_TIMEOUT = 10_000;
const INPORT_TIMEOUT = 4_000;

const connect = async (device: DeviceConnection) => {
  const zk = new ZKLib(device.ipAddress, device.port || 4370, CONNECT_TIMEOUT, INPORT_TIMEOUT);
  await zk.createSocket();
  return zk;
};

export const testConnection = async (device: DeviceConnection) => {
  let zk: any;
  try {
    zk = await connect(device);
    const info = await zk.getInfo();
    return {
      success: true,
      info: {
        userCounts: info?.userCounts ?? null,
        logCounts: info?.logCounts ?? null,
        logCapacity: info?.logCapacity ?? null,
      },
    };
  } catch (error: any) {
    return { success: false, message: error?.message || 'Could not reach the device' };
  } finally {
    try {
      await zk?.disconnect();
    } catch {

    }
  }
};

export const getDeviceUsers = async (device: DeviceConnection) => {
  let zk: any;
  try {
    zk = await connect(device);
    const users = await zk.getUsers();
    return (users?.data ?? []).map((user: any) => ({
      biometricUserId: String(user.userId ?? user.uid),
      name: user.name || '',
      role: user.role,
      cardNo: user.cardno,
    }));
  } finally {
    try {
      await zk?.disconnect();
    } catch {

    }
  }
};

const toRawPunch = (log: any): RawPunch | null => {
  const timestamp = new Date(log.recordTime ?? log.timestamp);
  if (Number.isNaN(timestamp.getTime())) return null;

  const id = log.deviceUserId ?? log.userId ?? log.uid;
  if (id === undefined || id === null) return null;

  return {
    biometricUserId: String(id).trim(),
    punchTime: timestamp,

    direction: 'AUTO',
    verifyMode: typeof log.verifyMode === 'number' ? log.verifyMode : undefined,
    rawPayload: JSON.stringify(log).slice(0, 900),
  };
};

export const syncDevice = async (deviceId: string, options: { since?: Date; process?: boolean } = {}) => {
  const device = await prisma.biometricDevice.findUnique({ where: { id: deviceId } });

  if (!device) throw new Error('Device not found');
  if (!device.ipAddress) throw new Error('This device has no IP address. It is configured for push mode.');
  if (!device.isActive) throw new Error('Device is disabled');

  let zk: any;

  try {
    zk = await connect({ ipAddress: device.ipAddress, port: device.port, commKey: device.commKey });

    const logs = await zk.getAttendances();
    const since = options.since ?? device.lastSyncAt;

    const records = (logs?.data ?? [])
      .map(toRawPunch)
      .filter((record: RawPunch | null): record is RawPunch => {
        if (!record) return false;
        if (since && record.punchTime <= since) return false;
        return true;
      });

    const ingest = await ingestPunches(device.id, records);

    await prisma.biometricDevice.update({
      where: { id: device.id },
      data: {
        status: 'ONLINE',
        lastSeenAt: new Date(),
        lastSyncAt: new Date(),
        lastSyncMessage: `Pulled ${ingest.received}, stored ${ingest.stored}`,
      },
    });

    const processed = options.process === false ? null : await processPendingPunches(device.companyId);

    return { ...ingest, processed };
  } catch (error: any) {
    await prisma.biometricDevice.update({
      where: { id: device.id },
      data: {
        status: 'OFFLINE',
        lastSyncMessage: error?.message?.slice(0, 300) || 'Sync failed',
      },
    });
    throw error;
  } finally {
    try {
      await zk?.disconnect();
    } catch {

    }
  }
};

export const syncAllDevices = async (companyId?: string) => {
  const devices = await prisma.biometricDevice.findMany({
    where: {
      isActive: true,
      ipAddress: { not: null },
      ...(companyId ? { companyId } : {}),
    },
  });

  const results: Array<{ deviceId: string; name: string; ok: boolean; detail: string }> = [];

  for (const device of devices) {
    try {
      const result = await syncDevice(device.id);
      results.push({
        deviceId: device.id,
        name: device.name,
        ok: true,
        detail: `stored ${result.stored}, applied ${result.processed?.applied ?? 0}`,
      });
    } catch (error: any) {
      results.push({
        deviceId: device.id,
        name: device.name,
        ok: false,
        detail: error?.message || 'Sync failed',
      });
    }
  }

  return results;
};

const encodeDeviceTime = (date: Date): number => {
  const year = date.getFullYear() - 2000;
  const month = date.getMonth();
  const day = date.getDate() - 1;

  return (
    ((year * 12 + month) * 31 + day) * 24 * 60 * 60 +
    date.getHours() * 60 * 60 +
    date.getMinutes() * 60 +
    date.getSeconds()
  );
};

const CMD_SET_TIME = 202;

export const setDeviceTime = async (device: DeviceConnection, when: Date = new Date()) => {
  let zk: any;
  try {
    zk = await connect(device);

    const payload = Buffer.alloc(4);
    payload.writeUInt32LE(encodeDeviceTime(when), 0);

    await zk.executeCmd(CMD_SET_TIME, payload);
    return true;
  } finally {
    try {
      await zk?.disconnect();
    } catch {

    }
  }
};

export const clearDeviceLogs = async (device: DeviceConnection) => {
  let zk: any;
  try {
    zk = await connect(device);
    await zk.clearAttendanceLog();
    return true;
  } finally {
    try {
      await zk?.disconnect();
    } catch {

    }
  }
};
