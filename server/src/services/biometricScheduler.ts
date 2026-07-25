import cron from 'node-cron';
import { syncAllDevices } from './zktecoService';
import { processPendingPunches } from './biometricService';

let running = false;

const runSync = async () => {

  if (running) {
    console.log('[biometric] previous sync still running, skipping this tick');
    return;
  }

  running = true;
  try {
    const results = await syncAllDevices();
    const failures = results.filter((item) => !item.ok);

    if (failures.length > 0) {
      console.warn(
        '[biometric] devices did not respond:',
        failures.map((item) => `${item.name} (${item.detail})`).join(', ')
      );
    }

    await processPendingPunches();
  } catch (error) {
    console.error('[biometric] scheduled sync failed:', error);
  } finally {
    running = false;
  }
};

export const startBiometricScheduler = () => {
  if (process.env.BIOMETRIC_SYNC_ENABLED === 'false') {
    console.log('[biometric] scheduler disabled by env');
    return;
  }

  const expression = process.env.BIOMETRIC_SYNC_CRON || '*/10 * * * *';

  cron.schedule(expression, runSync, {
    timezone: process.env.BIOMETRIC_TIMEZONE || 'Asia/Kolkata',
  });

  console.log(`[biometric] scheduler started (${expression})`);
};

export default startBiometricScheduler;
