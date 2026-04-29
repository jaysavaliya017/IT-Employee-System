-- ====================================================
-- Migration: 20260424074328_init
-- ====================================================
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'TEAM_LEADER', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY', 'PAID_LEAVE', 'UNPAID_LEAVE', 'SICK_LEAVE', 'CASUAL_LEAVE', 'HOLIDAY', 'WEEK_OFF');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "profileImage" TEXT,
    "departmentId" TEXT,
    "designation" TEXT,
    "managerId" TEXT,
    "teamLeaderId" TEXT,
    "teamId" TEXT,
    "shiftId" TEXT,
    "joiningDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teamLeaderId" TEXT,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "graceMinutes" INTEGER NOT NULL DEFAULT 0,
    "halfDayHours" DOUBLE PRECISION NOT NULL DEFAULT 4,
    "fullDayHours" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "punchInTime" TIMESTAMP(3),
    "punchOutTime" TIMESTAMP(3),
    "totalHours" DOUBLE PRECISION,
    "netHours" DOUBLE PRECISION,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "punchInLocation" TEXT,
    "punchOutLocation" TEXT,
    "punchInIp" TEXT,
    "punchOutIp" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "defaultBalance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_balances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "totalLeaves" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usedLeaves" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingLeaves" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "year" INTEGER NOT NULL DEFAULT 2024,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "totalDays" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "rejectedBy" TEXT,
    "rejectionReason" TEXT,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_approval_settings" (
    "id" TEXT NOT NULL,
    "canTeamLeaderApproveLeave" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_approval_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeCode_key" ON "users"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_departmentId_key" ON "teams"("name", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_teamId_userId_key" ON "team_members"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "shifts_name_key" ON "shifts"("name");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_userId_date_key" ON "attendances"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_name_key" ON "leave_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_userId_leaveTypeId_year_key" ON "leave_balances"("userId", "leaveTypeId", "year");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_rejectedBy_fkey" FOREIGN KEY ("rejectedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ====================================================
-- Migration: 20260427000000_add_resource_requests
-- ====================================================
-- CreateEnum
CREATE TYPE "ResourceRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ResourceRequestType" AS ENUM ('BOOKS', 'PENS', 'MOUSE', 'KEYBOARD', 'HEADSET', 'LAPTOP', 'OTHER');

-- CreateTable
CREATE TABLE "resource_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestType" "ResourceRequestType" NOT NULL,
    "description" TEXT,
    "status" "ResourceRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "resource_requests" ADD CONSTRAINT "resource_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_requests" ADD CONSTRAINT "resource_requests_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_requests" ADD CONSTRAINT "resource_requests_rejectedBy_fkey" FOREIGN KEY ("rejectedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ====================================================
-- Migration: 20260427103000_add_companies_multi_tenant
-- ====================================================
-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "companies_code_key" ON "companies"("code");

-- AddColumn
ALTER TABLE "users" ADD COLUMN "companyId" TEXT;

-- Seed default company and map existing users
INSERT INTO "companies" ("id", "name", "code", "isActive", "createdAt", "updatedAt")
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'ProAttend Technologies',
  'PROATTEND',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO NOTHING;

UPDATE "users"
SET "companyId" = '11111111-1111-1111-1111-111111111111'
WHERE "companyId" IS NULL;

-- Make company required after backfill
ALTER TABLE "users" ALTER COLUMN "companyId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ====================================================
-- Migration: 20260427103731_add_messaging_module
-- ====================================================
-- CreateEnum
CREATE TYPE "MessageConversationType" AS ENUM ('DIRECT', 'GROUP', 'ANNOUNCEMENT', 'COURSE');

-- CreateEnum
CREATE TYPE "MessagePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "MessageCategory" AS ENUM ('GENERAL', 'COURSE', 'LEAVE', 'ATTENDANCE', 'HR', 'ANNOUNCEMENT', 'REMINDER');

-- CreateTable
CREATE TABLE "message_conversations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "MessageConversationType" NOT NULL DEFAULT 'DIRECT',
    "title" TEXT,
    "description" TEXT,
    "courseCode" TEXT,
    "courseTitle" TEXT,
    "createdBy" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_conversation_participants" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "lastReadAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" "MessagePriority" NOT NULL DEFAULT 'NORMAL',
    "category" "MessageCategory" NOT NULL DEFAULT 'GENERAL',
    "isAnnouncement" BOOLEAN NOT NULL DEFAULT false,
    "isBulkReminder" BOOLEAN NOT NULL DEFAULT false,
    "courseCode" TEXT,
    "courseTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_attachments" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_read_receipts" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_read_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_conversations_companyId_updatedAt_idx" ON "message_conversations"("companyId", "updatedAt");

-- CreateIndex
CREATE INDEX "message_conversation_participants_userId_updatedAt_idx" ON "message_conversation_participants"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "message_conversation_participants_conversationId_userId_key" ON "message_conversation_participants"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "message_read_receipts_userId_readAt_idx" ON "message_read_receipts"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "message_read_receipts_messageId_userId_key" ON "message_read_receipts"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "message_conversations" ADD CONSTRAINT "message_conversations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_conversations" ADD CONSTRAINT "message_conversations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_conversation_participants" ADD CONSTRAINT "message_conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "message_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_conversation_participants" ADD CONSTRAINT "message_conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "message_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_read_receipts" ADD CONSTRAINT "message_read_receipts_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_read_receipts" ADD CONSTRAINT "message_read_receipts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ====================================================
-- Migration: 20260427105540_fix_schema_drift
-- ====================================================
-- AlterTable
ALTER TABLE "attendance_sessions" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- ====================================================
-- Migration: 20260427183000_add_attendance_sessions
-- ====================================================
CREATE TABLE "attendance_sessions" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "punchInLocation" TEXT,
    "punchOutLocation" TEXT,
    "punchInIp" TEXT,
    "punchOutIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "attendance_sessions_userId_startTime_idx" ON "attendance_sessions"("userId", "startTime");
CREATE INDEX "attendance_sessions_attendanceId_startTime_idx" ON "attendance_sessions"("attendanceId", "startTime");

ALTER TABLE "attendance_sessions"
ADD CONSTRAINT "attendance_sessions_attendanceId_fkey"
FOREIGN KEY ("attendanceId") REFERENCES "attendances"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attendance_sessions"
ADD CONSTRAINT "attendance_sessions_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- ====================================================
-- Migration: 20260428000000_add_hr_modules
-- ====================================================
-- Migration: Add HR modules - Salary, Gallery, Announcements, Documents, Notifications, Audit Logs, Policies, Holidays, Profile Completions

-- =============================================
-- SALARY MODULE TABLES
-- =============================================

-- Salary Structures (stores base salary and components for each employee)
CREATE TABLE "salary_structures" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "employeeId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "basicSalary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "hra" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "conveyanceAllowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "medicalAllowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "specialAllowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otherAllowances" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pfDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "professionalTax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otherDeductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("employeeId")
);

-- Salary Records (monthly salary entries)
CREATE TABLE "salary_records" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "employeeId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "salaryStructureId" UUID REFERENCES "salary_structures"("id"),
    "month" INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    "year" INTEGER NOT NULL,
    "basicSalary" DECIMAL(12,2) NOT NULL,
    "hra" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "conveyanceAllowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "medicalAllowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "specialAllowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otherAllowances" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalEarnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pfDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "professionalTax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "leaveDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otherDeductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grossSalary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netSalary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "workingDays" INTEGER DEFAULT 0,
    "paidDays" INTEGER DEFAULT 0,
    "unpaidDays" INTEGER DEFAULT 0,
    "leaveDays" INTEGER DEFAULT 0,
    "status" VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'CREDITED')),
    "paymentDate" TIMESTAMP,
    "paymentReference" VARCHAR(100),
    "isGenerated" BOOLEAN DEFAULT false,
    "generatedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("employeeId", "month", "year")
);

-- Salary Bonus/Deduction Entries
CREATE TABLE "salary_components" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "salaryRecordId" UUID NOT NULL REFERENCES "salary_records"("id") ON DELETE CASCADE,
    "employeeId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "type" VARCHAR(20) NOT NULL CHECK (type IN ('BONUS', 'DEDUCTION', 'REIMBURSEMENT')),
    "componentName" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "isTaxable" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- GALLERY MODULE TABLES
-- =============================================

CREATE TABLE "gallery_images" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "imageUrl" VARCHAR(500) NOT NULL,
    "thumbnailUrl" VARCHAR(500),
    "category" VARCHAR(50),
    "fileName" VARCHAR(255),
    "fileSize" INTEGER,
    "mimeType" VARCHAR(50),
    "visibilityType" VARCHAR(20) DEFAULT 'ALL' CHECK (visibilityType IN ('ALL', 'COMPANY', 'DEPARTMENT', 'TEAM', 'EMPLOYEE')),
    "companyId" UUID REFERENCES "companies"("id") ON DELETE CASCADE,
    "departmentId" UUID REFERENCES "departments"("id") ON DELETE SET NULL,
    "teamId" UUID REFERENCES "teams"("id") ON DELETE SET NULL,
    "employeeId" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "uploadedBy" UUID NOT NULL REFERENCES "users"("id"),
    "isFeatured" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ANNOUNCEMENT MODULE TABLES
-- =============================================

CREATE TABLE "announcements" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "priority" VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    "expiryDate" TIMESTAMP,
    "attachmentUrl" VARCHAR(500),
    "attachmentName" VARCHAR(255),
    "visibilityType" VARCHAR(20) DEFAULT 'ALL' CHECK (visibilityType IN ('ALL', 'COMPANY', 'DEPARTMENT', 'TEAM', 'EMPLOYEE')),
    "companyId" UUID REFERENCES "companies"("id") ON DELETE CASCADE,
    "departmentId" UUID REFERENCES "departments"("id") ON DELETE SET NULL,
    "teamId" UUID REFERENCES "teams"("id") ON DELETE SET NULL,
    "targetEmployeeId" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "createdBy" UUID NOT NULL REFERENCES "users"("id"),
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- DOCUMENT CENTER MODULE TABLES
-- =============================================

CREATE TABLE "documents" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "documentType" VARCHAR(50) NOT NULL CHECK (documentType IN ('OFFER_LETTER', 'JOINING_LETTER', 'EXPERIENCE_LETTER', 'SALARY_SLIP', 'COMPANY_POLICY', 'HR_DOCUMENT', 'OTHER')),
    "fileUrl" VARCHAR(500) NOT NULL,
    "fileName" VARCHAR(255),
    "fileSize" INTEGER,
    "mimeType" VARCHAR(50),
    "visibilityType" VARCHAR(20) DEFAULT 'COMPANY' CHECK (visibilityType IN ('ALL', 'COMPANY', 'DEPARTMENT', 'TEAM', 'EMPLOYEE')),
    "companyId" UUID REFERENCES "companies"("id") ON DELETE CASCADE,
    "departmentId" UUID REFERENCES "departments"("id") ON DELETE SET NULL,
    "teamId" UUID REFERENCES "teams"("id") ON DELETE SET NULL,
    "targetEmployeeId" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "uploadedBy" UUID NOT NULL REFERENCES "users"("id"),
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- NOTIFICATION SYSTEM TABLES
-- =============================================

CREATE TABLE "notifications" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL CHECK (type IN ('SALARY_CREDITED', 'SALARY_SLIP', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'ANNOUNCEMENT', 'GALLERY_IMAGE', 'DOCUMENT_UPLOADED', 'BIRTHDAY', 'WORK_ANNIVERSARY', 'GENERAL')),
    "referenceId" VARCHAR(100),
    "referenceType" VARCHAR(50),
    "isRead" BOOLEAN DEFAULT false,
    "readAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "notification_settings" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "emailNotifications" BOOLEAN DEFAULT true,
    "pushNotifications" BOOLEAN DEFAULT true,
    "salaryNotifs" BOOLEAN DEFAULT true,
    "leaveNotifs" BOOLEAN DEFAULT true,
    "announcementNotifs" BOOLEAN DEFAULT true,
    "birthdayNotifs" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- AUDIT LOGS TABLE
-- =============================================

CREATE TABLE "audit_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "action" VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" VARCHAR(100),
    "oldValue" JSONB,
    "newValue" JSONB,
    "description" TEXT,
    "ipAddress" VARCHAR(50),
    "userAgent" TEXT,
    "companyId" UUID REFERENCES "companies"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- COMPANY POLICIES TABLE
-- =============================================

CREATE TABLE "policies" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "policyType" VARCHAR(50) NOT NULL CHECK (policyType IN ('LEAVE_POLICY', 'SALARY_POLICY', 'ATTENDANCE_POLICY', 'WORK_FROM_HOME_POLICY', 'HR_POLICY', 'CODE_OF_CONDUCT', 'OTHER')),
    "fileUrl" VARCHAR(500),
    "version" VARCHAR(20) DEFAULT '1.0',
    "effectiveDate" TIMESTAMP,
    "isActive" BOOLEAN DEFAULT true,
    "companyId" UUID REFERENCES "companies"("id") ON DELETE CASCADE,
    "createdBy" UUID NOT NULL REFERENCES "users"("id"),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PROFILE COMPLETION TABLE
-- =============================================

CREATE TABLE "profile_completions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "personalDetails" BOOLEAN DEFAULT false,
    "contactDetails" BOOLEAN DEFAULT false,
    "emergencyContact" BOOLEAN DEFAULT false,
    "bankDetails" BOOLEAN DEFAULT false,
    "documents" BOOLEAN DEFAULT false,
    "profilePhoto" BOOLEAN DEFAULT false,
    "completionPercentage" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- HOLIDAYS ENHANCEMENT
-- =============================================

ALTER TABLE "holidays" ADD COLUMN IF NOT EXISTS "companyId" UUID REFERENCES "companies"("id") ON DELETE CASCADE;
ALTER TABLE "holidays" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
ALTER TABLE "holidays" ADD COLUMN IF NOT EXISTS "holidayType" VARCHAR(20) DEFAULT 'GENERAL' CHECK (holidayType IN ('GENERAL', 'RESTRICTED', 'OPTIONAL', 'NATIONAL', 'FESTIVAL'));

-- =============================================
-- BIRTHDAY & WORK ANNIVERSARY (stored as computed/virtual in code)
-- (No separate table needed - derived from users.joiningDate and dob)

-- =============================================
-- LEAVE CALENDAR (computed from leave_requests)
-- (No separate table needed - derived from approved leave_requests)

