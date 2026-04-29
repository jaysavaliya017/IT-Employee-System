import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { errorHandler } from './middleware/validate';

import authRoutes from './routes/auth';
import attendanceRoutes from './routes/attendance';
import leaveRoutes from './routes/leave';
import employeeRoutes from './routes/employee';
import teamRoutes from './routes/team';
import shiftRoutes from './routes/shift';
import holidayRoutes from './routes/holiday';
import dashboardRoutes from './routes/dashboard';
import teamLeaderRoutes from './routes/teamLeader';
import reportRoutes from './routes/report';
import resourceRequestRoutes from './routes/resourceRequest';
import departmentRoutes from './routes/department';
import companyRoutes from './routes/company';
import messagingRoutes from './routes/messaging';
import salaryRoutes from './routes/salary';
import salarySlipRoutes from './routes/salarySlip';
import galleryRoutes from './routes/gallery';
import announcementRoutes from './routes/announcement';
import documentRoutes from './routes/document';
import notificationRoutes from './routes/notification';
import policyRoutes from './routes/policy';
import auditLogRoutes from './routes/auditLog';
import holidayEnhancedRoutes from './routes/holidayEnhanced';

const app = express();

app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/team-leader', teamLeaderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/resource-requests', resourceRequestRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/salary-slip', salarySlipRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/holidays-enhanced', holidayEnhancedRoutes);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

export default app;
