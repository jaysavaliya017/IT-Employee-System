import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { isAdmin } from '../middleware/role';
import {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  testDevice,
  syncOneDevice,
  syncAll,
  processPunches,
  listDeviceEnrollments,
  mapEmployee,
  getPunchLogs,
} from '../controllers/biometricController';

const router = Router();

router.use(authMiddleware, isAdmin);

router.get('/devices', getDevices);
router.post('/devices', createDevice);
router.put('/devices/:id', updateDevice);
router.delete('/devices/:id', deleteDevice);

router.post('/devices/:id/test', testDevice);
router.post('/devices/:id/sync', syncOneDevice);
router.get('/devices/:id/enrollments', listDeviceEnrollments);

router.post('/sync-all', syncAll);
router.post('/process', processPunches);

router.get('/punches', getPunchLogs);
router.put('/employees/:userId/mapping', mapEmployee);

export default router;
