import api from './index';
import {
  User,
  Attendance,
  Shift,
  Role,
  MessageCategory,
  MessagePriority,
} from '../types';

export const authApi = {
  validateCompany: (companyName: string) =>
    api.post('/auth/validate-company', { companyName }),

  login: (companyName: string, email: string, password: string) =>
    api.post('/auth/login', { companyName, email, password }),

  register: (data: {
    email: string;
    password: string;
    fullName: string;
    employeeCode: string;
    departmentId?: string;
    designation?: string;
    role?: Role;
  }) => api.post('/auth/register', data),

  getMe: () => api.get('/auth/me'),

  logout: () => api.post('/auth/logout'),
};

export const attendanceApi = {
  punchIn: (data?: { punchInLocation?: string }) =>
    api.post('/attendance/punch-in', data || {}),

  punchOut: (data?: { punchOutLocation?: string }) =>
    api.post('/attendance/punch-out', data || {}),

  getToday: () => api.get('/attendance/today'),

  getMonthly: (month: number, year: number) =>
    api.get(`/attendance/monthly?month=${month}&year=${year}`),

  getUserAttendance: (userId: string, month?: number, year?: number) =>
    api.get(`/attendance/user/${userId}?month=${month || ''}&year=${year || ''}`),

  getAllAttendance: (params: {
    page?: number;
    limit?: number;
    departmentId?: string;
    teamId?: string;
    status?: string;
    date?: string;
    search?: string;
  }) => api.get('/attendance/admin/all', { params }),

  updateAttendance: (id: string, data: Partial<Attendance>) =>
    api.put(`/attendance/${id}`, data),
};

export const leaveApi = {
  getBalance: () => api.get('/leaves/balance'),

  apply: (data: {
    leaveTypeId: string;
    fromDate: string;
    toDate: string;
    reason?: string;
    attachmentUrl?: string;
  }) => api.post('/leaves/apply', data),

  getMyRequests: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/leaves/my-requests', { params }),

  getAdminRequests: (params?: {
    status?: string;
    departmentId?: string;
    teamId?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) => api.get('/leaves/admin/requests', { params }),

  approve: (id: string) => api.put(`/leaves/${id}/approve`),

  reject: (id: string, rejectionReason: string) =>
    api.put(`/leaves/${id}/reject`, { rejectionReason }),
};

export const employeeApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    departmentId?: string;
    teamId?: string;
    status?: string;
    search?: string;
    role?: string;
  }) => api.get('/employees', { params }),

  getById: (id: string) => api.get(`/employees/${id}`),

  create: (data: {
    email: string;
    password: string;
    fullName: string;
    employeeCode: string;
    phone?: string;
    departmentId?: string;
    designation?: string;
    managerId?: string;
    teamLeaderId?: string;
    teamId?: string;
    shiftId?: string;
    joiningDate?: string;
    role?: Role;
  }) => api.post('/employees', data),

  update: (id: string, data: Partial<User>) => api.put(`/employees/${id}`, data),

  transferCompany: (id: string, targetCompanyId: string) =>
    api.post(`/employees/${id}/transfer-company`, { targetCompanyId }),

  delete: (id: string) => api.delete(`/employees/${id}`),
};

export const teamApi = {
  getAll: (params?: { departmentId?: string; search?: string }) =>
    api.get('/teams', { params }),

  getById: (id: string) => api.get(`/teams/${id}`),

  create: (data: { name: string; teamLeaderId?: string; departmentId?: string }) =>
    api.post('/teams', data),

  update: (id: string, data: { name?: string; teamLeaderId?: string; departmentId?: string }) =>
    api.put(`/teams/${id}`, data),

  delete: (id: string) => api.delete(`/teams/${id}`),

  addMember: (id: string, userId: string) =>
    api.post(`/teams/${id}/members`, { userId }),

  removeMember: (id: string, userId: string) =>
    api.delete(`/teams/${id}/members/${userId}`),
};

export const shiftApi = {
  getAll: () => api.get('/shifts'),

  create: (data: {
    name: string;
    startTime: string;
    endTime: string;
    graceMinutes?: number;
    halfDayHours?: number;
    fullDayHours?: number;
    departmentId?: string;
  }) => api.post('/shifts', data),

  update: (id: string, data: Partial<Shift>) => api.put(`/shifts/${id}`, data),

  delete: (id: string) => api.delete(`/shifts/${id}`),
};

export const holidayApi = {
  getAll: (year?: number) => api.get(`/holidays?year=${year || new Date().getFullYear()}`),

  create: (data: { title: string; date: string; description?: string }) =>
    api.post('/holidays', data),

  update: (id: string, data: { title?: string; date?: string; description?: string }) =>
    api.put(`/holidays/${id}`, data),

  delete: (id: string) => api.delete(`/holidays/${id}`),
};

export const dashboardApi = {
  getEmployee: () => api.get('/dashboard/employee'),
  getAdmin: () => api.get('/dashboard/admin'),
  getTeamLeader: () => api.get('/dashboard/team-leader'),
};

export const teamLeaderApi = {
  getDashboard: () => api.get('/team-leader/dashboard'),
  getTeamMembers: () => api.get('/team-leader/team-members'),
  getTeamAttendanceToday: () => api.get('/team-leader/team-attendance/today'),
  getTeamAttendanceMonthly: (params: {
    month?: number;
    year?: number;
    userId?: string;
    status?: string;
  }) => api.get('/team-leader/team-attendance/monthly', { params }),
  getTeamLeaves: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/team-leader/team-leaves', { params }),
  approveLeave: (id: string) => api.put(`/team-leader/leaves/${id}/approve`),
  rejectLeave: (id: string, rejectionReason: string) =>
    api.put(`/team-leader/leaves/${id}/reject`, { rejectionReason }),
};

export const reportApi = {
  getMonthlyAttendance: (params: {
    month: number;
    year: number;
    departmentId?: string;
    teamId?: string;
  }) => api.get('/reports/monthly-attendance', { params }),

  getEmployeeAttendance: (params: {
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/reports/employee-attendance', { params }),

  getDepartmentAttendance: (params: { month: number; year: number }) =>
    api.get('/reports/department-attendance', { params }),

  getTeamAttendance: (params: { month: number; year: number }) =>
    api.get('/reports/team-attendance', { params }),

  getLeave: (params: {
    fromDate?: string;
    toDate?: string;
    departmentId?: string;
    teamId?: string;
    status?: string;
  }) => api.get('/reports/leave', { params }),

  getLateArrivals: (params: {
    month: number;
    year: number;
    departmentId?: string;
    teamId?: string;
  }) => api.get('/reports/late-arrivals', { params }),
};

export const messagingApi = {
  searchUsers: (search?: string) => api.get('/messaging/users', { params: { search } }),

  getConversations: () => api.get('/messaging/conversations'),

  createDirectConversation: (targetUserId: string) =>
    api.post('/messaging/conversations/direct', { targetUserId }),

  getMessages: (conversationId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/messaging/conversations/${conversationId}/messages`, { params }),

  sendMessage: (
    conversationId: string,
    data: {
      content: string;
      priority?: MessagePriority;
      category?: MessageCategory;
      courseCode?: string;
      courseTitle?: string;
      attachments?: Array<{ fileName: string; fileUrl: string; fileType: string; fileSize: number }>;
    }
  ) => api.post(`/messaging/conversations/${conversationId}/messages`, data),

  markRead: (conversationId: string) => api.post(`/messaging/conversations/${conversationId}/read`),

  getUnreadCount: () => api.get('/messaging/unread-count'),

  uploadFiles: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return api.post('/messaging/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  sendBulkAnnouncement: (data: {
    title: string;
    content: string;
    targetUserIds: string[];
    category?: MessageCategory;
    priority?: MessagePriority;
    courseCode?: string;
    courseTitle?: string;
    isAnnouncement?: boolean;
    isBulkReminder?: boolean;
  }) => api.post('/messaging/bulk', data),
};

export const departmentApi = {
  getAll: () => api.get('/departments').catch(() => ({ data: { success: true, data: { departments: [] } } })),
};

export const resourceRequestApi = {
  create: (data: {
    requestType: 'BOOKS' | 'PENS' | 'MOUSE' | 'KEYBOARD' | 'HEADSET' | 'LAPTOP' | 'OTHER';
    description?: string;
  }) => api.post('/resource-requests', data),

  getMyRequests: (params?: { status?: string }) =>
    api.get('/resource-requests/my-requests', { params }),

  getAllRequests: (params?: {
    status?: string;
    departmentId?: string;
    page?: number;
    limit?: number;
  }) => api.get('/resource-requests/all', { params }),

  approve: (id: string) => api.put(`/resource-requests/${id}/approve`),

  reject: (id: string, rejectionReason: string) =>
    api.put(`/resource-requests/${id}/reject`, { rejectionReason }),
};

export const companyApi = {
  getAll: () => api.get('/companies'),

  create: (data: { name: string; code: string; isActive?: boolean }) =>
    api.post('/companies', data),

  update: (id: string, data: { name?: string; code?: string; isActive?: boolean }) =>
    api.put(`/companies/${id}`, data),

  updateStatus: (id: string, isActive: boolean) =>
    api.patch(`/companies/${id}/status`, { isActive }),
};

// Salary APIs
export const salaryApi = {
  getMySalary: (params?: { page?: number; limit?: number }) =>
    api.get('/salary/my-salary', { params }),

  getStructure: (employeeId: string) =>
    api.get(`/salary/structure/${employeeId}`),

  createStructure: (data: any) =>
    api.post('/salary/structure', data),

  updateStructure: (id: string, data: any) =>
    api.put(`/salary/structure/${id}`, data),

  generateMonthly: (data: { month: number; year: number; employeeId?: string }) =>
    api.post('/salary/generate-monthly', data),

  getRecords: (params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    departmentId?: string;
    month?: number;
    year?: number;
    status?: string;
    search?: string;
  }) => api.get('/salary/records', { params }),

  getRecordById: (id: string) =>
    api.get(`/salary/records/${id}`),

  getSlip: (id: string) =>
    api.get(`/salary/slip/${id}`),

  downloadSlip: (id: string) =>
    api.get(`/salary/slip/${id}/download`, { responseType: 'blob' }),

  creditSalary: (id: string, data: { paymentDate?: string; paymentReference?: string }) =>
    api.put(`/salary/credit/${id}`, data),

  addComponent: (data: {
    salaryRecordId: string;
    type: 'BONUS' | 'DEDUCTION' | 'REIMBURSEMENT';
    componentName: string;
    amount: number;
    description?: string;
    isTaxable?: boolean;
  }) => api.post('/salary/component', data),
};

// Salary Slip APIs (New Module)
export const salarySlipApi = {
  getEmployeesForSalaryGeneration: (month: number, year: number) =>
    api.get('/salary-slip/employees', { params: { month, year } }),

  generateSalarySlip: (data: {
    employeeId: string;
    month: number;
    year: number;
    salaryAmount: number;
    bonus?: number;
    deduction?: number;
  }) => api.post('/salary-slip/generate', data),

  generateBulkSalarySlips: (data: {
    month: number;
    year: number;
    employees: Array<{
      employeeId: string;
      salaryAmount: number;
      bonus?: number;
      deduction?: number;
    }>;
  }) => api.post('/salary-slip/generate-bulk', data),

  getMySalarySlips: (params?: {
    page?: number;
    limit?: number;
    month?: number;
    year?: number;
  }) => api.get('/salary-slip/my-slips', { params }),

  getAllSalarySlips: (params?: {
    page?: number;
    limit?: number;
    month?: number;
    year?: number;
    employeeId?: string;
    departmentId?: string;
    search?: string;
    status?: string;
  }) => api.get('/salary-slip/slips', { params }),

  downloadSalarySlip: (id: string) =>
    api.get('/salary-slip/slips/' + id + '/download', { responseType: 'blob' }),

  markSalaryAsPaid: (id: string) =>
    api.put('/salary-slip/slips/' + id + '/mark-paid', {}),
};

// Gallery APIs
export const galleryApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    featured?: boolean;
  }) => api.get('/gallery', { params }),

  getById: (id: string) =>
    api.get(`/gallery/${id}`),

  upload: (formData: FormData) =>
    api.post('/gallery/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, data: any) =>
    api.put(`/gallery/${id}`, data),

  delete: (id: string) =>
    api.delete(`/gallery/${id}`),
};

// Announcement APIs
export const announcementApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    priority?: string;
    visibilityType?: string;
    search?: string;
  }) => api.get('/announcements', { params }),

  getById: (id: string) =>
    api.get(`/announcements/${id}`),

  create: (data: any) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return api.post('/announcements', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  update: (id: string, data: any) =>
    api.put(`/announcements/${id}`, data),

  delete: (id: string) =>
    api.delete(`/announcements/${id}`),
};

// Document APIs
export const documentApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    documentType?: string;
    visibilityType?: string;
    search?: string;
  }) => api.get('/documents', { params }),

  getById: (id: string) =>
    api.get(`/documents/${id}`),

  upload: (formData: FormData) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  download: (id: string) =>
    api.get(`/documents/${id}/download`, { responseType: 'blob' }),

  delete: (id: string) =>
    api.delete(`/documents/${id}`),
};

// Notification APIs
export const notificationApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: string;
  }) => api.get('/notifications', { params }),

  getUnreadCount: () =>
    api.get('/notifications/unread-count'),

  markAsRead: (id: string) =>
    api.put(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.put('/notifications/read-all'),

  delete: (id: string) =>
    api.delete(`/notifications/${id}`),

  getSettings: () =>
    api.get('/notifications/settings'),

  updateSettings: (data: any) =>
    api.put('/notifications/settings', data),
};

// Policy APIs
export const policyApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    policyType?: string;
    search?: string;
  }) => api.get('/policies', { params }),

  getById: (id: string) =>
    api.get(`/policies/${id}`),

  download: (id: string) =>
    api.get(`/policies/${id}/download`, { responseType: 'blob' }),

  create: (data: any) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return api.post('/policies', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  update: (id: string, data: any) =>
    api.put(`/policies/${id}`, data),

  delete: (id: string) =>
    api.delete(`/policies/${id}`),
};

// Audit Log APIs
export const auditLogApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    userId?: string;
    fromDate?: string;
    toDate?: string;
  }) => api.get('/audit-logs', { params }),

  getStats: () =>
    api.get('/audit-logs/stats'),
};

// Holiday APIs (enhanced)
export const holidayEnhancedApi = {
  getAll: (params?: { year?: number; month?: number }) =>
    api.get('/holidays-enhanced', { params }),

  create: (data: { title: string; date: string; description?: string; holidayType?: string }) =>
    api.post('/holidays-enhanced', data),

  update: (id: string, data: any) =>
    api.put(`/holidays-enhanced/${id}`, data),

  delete: (id: string) =>
    api.delete(`/holidays-enhanced/${id}`),
};
