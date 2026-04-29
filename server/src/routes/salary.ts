import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authMiddleware } from '../middleware/auth';
import { isAdmin } from '../middleware/role';
import {
  createOrUpdateSalaryStructure,
  getSalaryStructure,
  generateMonthlySalary,
  getSalaryRecords,
  getSalaryRecordById,
  getSalarySlip,
  downloadSalarySlip,
  creditSalary,
  addSalaryComponent,
  getMySalaryHistory,
} from '../controllers/salaryController';

const router = Router();

// Configure multer for salary slip uploads
const storage = multer.diskStorage({
  destination: (_req: Express.Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, path.join(process.cwd(), 'uploads', 'salary-slips'));
  },
  filename: (_req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only PDF files are allowed'));
  },
});

// All routes require authentication
router.use(authMiddleware);

// Employee routes
router.get('/my-salary', getMySalaryHistory);

// Salary structure routes
router.post('/structure', isAdmin, createOrUpdateSalaryStructure);
router.get('/structure/:employeeId', getSalaryStructure);

// Admin routes
router.post('/generate-monthly', isAdmin, generateMonthlySalary);
router.get('/records', isAdmin, getSalaryRecords);
router.get('/records/:employeeId', isAdmin, getSalaryRecords);
router.get('/slip/:id', getSalarySlip);
router.get('/slip/:id/download', downloadSalarySlip);
router.put('/credit/:id', isAdmin, creditSalary);
router.post('/component', isAdmin, addSalaryComponent);

export default router;
