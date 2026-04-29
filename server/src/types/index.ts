import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  companyId: string;
  companyCode: string;
  departmentId?: string;
  teamId?: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface LoginInput {
  companyName: string;
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  employeeCode: string;
  departmentId?: string;
  designation?: string;
  role?: string;
}

export interface AttendanceInput {
  userId: string;
  date?: Date;
  punchInTime?: Date;
  punchOutTime?: Date;
  status?: string;
  punchInLocation?: string;
  punchOutLocation?: string;
  notes?: string;
}

export interface LeaveInput {
  leaveTypeId: string;
  fromDate: Date;
  toDate: Date;
  reason?: string;
  attachmentUrl?: string;
}

export interface EmployeeInput {
  fullName?: string;
  email?: string;
  phone?: string;
  departmentId?: string;
  designation?: string;
  managerId?: string;
  teamLeaderId?: string;
  teamId?: string;
  shiftId?: string;
  joiningDate?: Date;
  status?: string;
}

export interface TeamInput {
  name: string;
  teamLeaderId?: string;
  departmentId?: string;
}

export interface ShiftInput {
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes?: number;
  halfDayHours?: number;
  fullDayHours?: number;
  departmentId?: string;
}

export interface HolidayInput {
  title: string;
  date: Date;
  description?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterQuery extends PaginationQuery {
  search?: string;
  departmentId?: string;
  teamId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  userId?: string;
}
