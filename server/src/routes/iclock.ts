import express, { Router } from 'express';
import prisma from '../config/database';
import { ingestPunches, processPendingPunches, RawPunch } from '../services/biometricService';

const router = Router();

router.use(express.text({ type: () => true, limit: '5mb' }));

const findDevice = async (serial?: unknown) => {
  const serialNumber = String(serial ?? '').trim();
  if (!serialNumber) return null;

  return prisma.biometricDevice.findFirst({
    where: { serialNumber, isActive: true },
  });
};

const touchDevice = (id: string, message: string) =>
  prisma.biometricDevice.update({
    where: { id },
    data: { status: 'ONLINE', lastSeenAt: new Date(), lastSyncMessage: message.slice(0, 300) },
  });

const parseAttendanceRows = (body: string): RawPunch[] => {
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line): RawPunch | null => {
      const parts = line.split(/\t+/);
      if (parts.length < 2) return null;

      const [pin, timestamp, status, verify] = parts;

      const punchTime = new Date(String(timestamp).replace(' ', 'T'));
      if (Number.isNaN(punchTime.getTime())) return null;

      const statusCode = Number(status);

      return {
        biometricUserId: String(pin).trim(),
        punchTime,

        direction: statusCode === 0 ? 'IN' : statusCode === 1 ? 'OUT' : 'AUTO',
        verifyMode: Number.isFinite(Number(verify)) ? Number(verify) : undefined,
        rawPayload: line.slice(0, 500),
      };
    })
    .filter((record): record is RawPunch => record !== null);
};

router.get('/iclock/cdata', async (req, res) => {
  const device = await findDevice(req.query.SN);

  if (!device) {

    return res.type('text/plain').send('OK');
  }

  await touchDevice(device.id, 'Handshake received');

  const config = [
    `GET OPTION FROM: ${device.serialNumber}`,
    'Stamp=9999',
    'OpStamp=9999',
    'ErrorDelay=30',
    'Delay=10',
    'TransTimes=00:00;14:00',
    'TransInterval=1',

    'TransFlag=1111000000',
    'TimeZone=5.5',
    'Realtime=1',
    'Encrypt=0',
  ].join('\n');

  return res.type('text/plain').send(config);
});

router.post('/iclock/cdata', async (req, res) => {
  const device = await findDevice(req.query.SN);
  if (!device) return res.type('text/plain').send('OK');

  const table = String(req.query.table || '').toUpperCase();
  const body = typeof req.body === 'string' ? req.body : '';

  if (table !== 'ATTLOG') {

    await touchDevice(device.id, `Received ${table || 'unknown'} payload`);
    return res.type('text/plain').send('OK');
  }

  try {
    const records = parseAttendanceRows(body);
    const result = await ingestPunches(device.id, records);

    await touchDevice(device.id, `Push: ${result.received} received, ${result.stored} new`);

    processPendingPunches(device.companyId).catch((error) =>
      console.error('Biometric push processing failed:', error)
    );

    return res.type('text/plain').send(`OK: ${result.received}`);
  } catch (error) {
    console.error('iclock cdata error:', error);

    return res.status(500).type('text/plain').send('ERROR');
  }
});

router.get('/iclock/getrequest', async (req, res) => {
  const device = await findDevice(req.query.SN);
  if (!device) return res.type('text/plain').send('OK');

  await touchDevice(device.id, 'Polling for commands');

  return res.type('text/plain').send('OK');
});

router.post('/iclock/devicecmd', (_req, res) => res.type('text/plain').send('OK'));
router.get('/iclock/ping', (_req, res) => res.type('text/plain').send('OK'));

export default router;
