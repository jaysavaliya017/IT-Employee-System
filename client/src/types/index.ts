export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'HR' | 'MANAGER' | 'TEAM_LEADER' | 'EMPLOYEE';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'PAID_LEAVE' | 'UNPAID_LEAVE' | 'SICK_LEAVE' | 'CASUAL_LEAVE' | 'HOLIDAY' | 'WEEK_OFF';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  company?: Company;
  phone?: string;
  role: Role;
  status: UserStatus;
  profileImage?: string;
  designation?: string;
  joiningDate?: string;
  createdAt: string;
  department?: Department;
  shift?: Shift;
  manager?: UserBasic;
  teamLeader?: UserBasic;
  team?: Team;
}

export interface UserBasic {
  id: string;
  fullName: string;
  email: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
  };
}

export interface Team {
  id: string;
  name: string;
  teamLeaderId?: string;
  departmentId?: string;
  teamLeader?: UserBasic;
  department?: Department;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  user: User;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  halfDayHours: number;
  fullDayHours: number;
  departmentId?: string;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  punchInTime?: string;
  punchOutTime?: string;
  totalHours?: number;
  netHours?: number;
  status: AttendanceStatus;
  isLate: boolean;
  overtimeHours: number;
  punchInLocation?: string;
  punchOutLocation?: string;
  punchInIp?: string;
  punchOutIp?: string;
  notes?: string;
  currentSession?: AttendanceSession | null;
  sessions?: AttendanceSession[];
  user?: User;
}

export interface AttendanceSession {
  id: string;
  attendanceId: string;
  userId: string;
  startTime: string;
  endTime?: string | null;
  punchInLocation?: string;
  punchOutLocation?: string;
  punchInIp?: string;
  punchOutIp?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveType {
  id: string;
  name: string;
  isPaid: boolean;
  defaultBalance: number;
}

export interface LeaveBalance {
  id: string;
  userId: string;
  leaveTypeId: string;
  totalLeaves: number;
  usedLeaves: number;
  remainingLeaves: number;
  year: number;
  leaveType: LeaveType;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason?: string;
  status: LeaveStatus;
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  attachmentUrl?: string;
  createdAt: string;
  user?: User;
  leaveType?: LeaveType;
  approver?: UserBasic;
  rejecter?: UserBasic;
}

export interface Holiday {
  id: string;
  title: string;
  date: string;
  description?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  createdBy?: string;
  createdAt: string;
  creator?: UserBasic;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardStats {
  totalEmployees?: number;
  presentToday?: number;
  absentToday?: number;
  onLeaveToday?: number;
  lateArrivals?: number;
  pendingLeaveRequests?: number;
}

export type MessageConversationType = 'DIRECT' | 'GROUP' | 'ANNOUNCEMENT' | 'COURSE';
export type MessagePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type MessageCategory = 'GENERAL' | 'COURSE' | 'LEAVE' | 'ATTENDANCE' | 'HR' | 'ANNOUNCEMENT' | 'REMINDER';

export interface MessagingUser {
  id: string;
  fullName: string;
  employeeCode: string;
  email: string;
  role: Role;
  department?: { name: string };
  team?: { name: string };
}

export interface MessageAttachment {
  id?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface MessageReadReceipt {
  userId: string;
  readAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  priority: MessagePriority;
  category: MessageCategory;
  isAnnouncement: boolean;
  isBulkReminder: boolean;
  courseCode?: string;
  courseTitle?: string;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    employeeCode: string;
    role: Role;
  };
  attachments: MessageAttachment[];
  readReceipts: MessageReadReceipt[];
}

export interface MessageConversation {
  id: string;
  companyId: string;
  type: MessageConversationType;
  title?: string;
  description?: string;
  courseCode?: string;
  courseTitle?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
  participants: Array<{
    user: MessagingUser;
  }>;
  lastMessage?: Message | null;
}

// Salary Types
export interface SalaryStructure {
  id: string;
  employeeId: string;
  basicSalary: number;
  hra: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  specialAllowance: number;
  otherAllowances: number;
  pfDeduction: number;
  taxDeduction: number;
  professionalTax: number;
  otherDeductions: number;
  isActive: boolean;
  employee?: User;
}

export interface SalaryRecord {
  id: string;
  employeeId: string;
  salaryStructureId?: string;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  specialAllowance: number;
  otherAllowances: number;
  totalEarnings: number;
  pfDeduction: number;
  taxDeduction: number;
  professionalTax: number;
  leaveDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  grossSalary: number;
  netSalary: number;
  workingDays: number;
  paidDays: number;
  unpaidDays: number;
  leaveDays: number;
  status: 'PENDING' | 'PROCESSED' | 'CREDITED';
  paymentDate?: string;
  paymentReference?: string;
  isGenerated: boolean;
  generatedAt?: string;
  createdAt: string;
  employee?: User;
  salaryStructure?: SalaryStructure;
  salaryComponents?: SalaryComponent[];
}

export interface SalaryComponent {
  id: string;
  salaryRecordId: string;
  employeeId: string;
  type: 'BONUS' | 'DEDUCTION' | 'REIMBURSEMENT';
  componentName: string;
  amount: number;
  description?: string;
  isTaxable: boolean;
}

// Salary Slip Types
export type SalarySlipStatus = 'NOT_GENERATED' | 'GENERATED' | 'PAID';

export interface SalarySlip {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  salaryAmount: number;
  bonus: number;
  deduction: number;
  netSalary: number;
  status: SalarySlipStatus;
  pdfUrl?: string;
  generatedBy?: string;
  generatedAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  employee?: User;
  generatedByUser?: UserBasic;
}

export interface SalarySlipEmployeeRow {
  id: string;
  fullName: string;
  employeeCode: string;
  email: string;
  designation?: string;
  department?: Department;
  salaryAmount: number;
  bonus: number;
  deduction: number;
  netSalary: number;
  status: SalarySlipStatus;
  slipId?: string | null;
}

export interface SalaryGenerationRequest {
  employeeId: string;
  month: number;
  year: number;
  salaryAmount: number;
  bonus?: number;
  deduction?: number;
}

export interface SalaryBulkGenerationRequest {
  month: number;
  year: number;
  employees: Array<{
    employeeId: string;
    salaryAmount: number;
    bonus?: number;
    deduction?: number;
  }>;
}

export interface BulkSalaryResult {
  success: number;
  skipped: number;
  failed: number;
  errors: string[];
  generatedSlips: SalarySlip[];
}

// Gallery Types
export interface GalleryImage {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  visibilityType: 'ALL' | 'COMPANY' | 'DEPARTMENT' | 'TEAM' | 'EMPLOYEE';
  companyId?: string;
  departmentId?: string;
  teamId?: string;
  employeeId?: string;
  uploadedBy: string;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  uploadedByUser?: UserBasic;
  company?: Company;
  department?: Department;
  team?: Team;
}

// Announcement Types
export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  expiryDate?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  visibilityType: 'ALL' | 'COMPANY' | 'DEPARTMENT' | 'TEAM' | 'EMPLOYEE';
  companyId?: string;
  departmentId?: string;
  teamId?: string;
  targetEmployeeId?: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  creator?: UserBasic;
  company?: Company;
  department?: Department;
  team?: Team;
}

// Document Types
export interface Document {
  id: string;
  title: string;
  description?: string;
  documentType: 'OFFER_LETTER' | 'JOINING_LETTER' | 'EXPERIENCE_LETTER' | 'SALARY_SLIP' | 'COMPANY_POLICY' | 'HR_DOCUMENT' | 'OTHER';
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  visibilityType: 'ALL' | 'COMPANY' | 'DEPARTMENT' | 'TEAM' | 'EMPLOYEE';
  companyId?: string;
  departmentId?: string;
  teamId?: string;
  targetEmployeeId?: string;
  uploadedBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  uploadedByUser?: UserBasic;
  company?: Company;
  department?: Department;
  team?: Team;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'SALARY_CREDITED' | 'SALARY_SLIP' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'ANNOUNCEMENT' | 'GALLERY_IMAGE' | 'DOCUMENT_UPLOADED' | 'BIRTHDAY' | 'WORK_ANNIVERSARY' | 'GENERAL';
  referenceId?: string;
  referenceType?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  salaryNotifs: boolean;
  leaveNotifs: boolean;
  announcementNotifs: boolean;
  birthdayNotifs: boolean;
}

// Policy Types
export interface Policy {
  id: string;
  title: string;
  content: string;
  policyType: 'LEAVE_POLICY' | 'SALARY_POLICY' | 'ATTENDANCE_POLICY' | 'WORK_FROM_HOME_POLICY' | 'HR_POLICY' | 'CODE_OF_CONDUCT' | 'OTHER';
  fileUrl?: string;
  version: string;
  effectiveDate?: string;
  isActive: boolean;
  companyId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: UserBasic;
  company?: Company;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  companyId?: string;
  createdAt: string;
  user?: UserBasic;
}

// Holiday Types (enhanced)
export interface HolidayEnhanced {
  id: string;
  title: string;
  date: string;
  description?: string;
  holidayType: 'GENERAL' | 'RESTRICTED' | 'OPTIONAL' | 'NATIONAL' | 'FESTIVAL';
  companyId?: string;
  isActive: boolean;
}

// Profile Completion
export interface ProfileCompletion {
  id: string;
  userId: string;
  personalDetails: boolean;
  contactDetails: boolean;
  emergencyContact: boolean;
  bankDetails: boolean;
  documents: boolean;
  profilePhoto: boolean;
  completionPercentage: number;
}
