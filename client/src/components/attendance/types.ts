export type AttendanceViewMode = 'calendar' | 'summary';

export type DayAttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'WEEK_OFF'
  | 'HOLIDAY'
  | 'HALF_DAY'
  | 'LEAVE';

export interface AttendanceStatusBadge {
  id: string;
  label: string;
  type: DayAttendanceStatus;
}

export interface PunchEntry {
  id: string;
  inTime?: string | null;
  outTime?: string | null;
  durationMinutes?: number | null;
  source?: string;
  location?: string;
  status?: string;
}

export interface MonthlyAttendanceRecord {
  id: string;
  date: string;
  attendanceStatus: DayAttendanceStatus;
  statusBadges: AttendanceStatusBadge[];
  firstInTime?: string | null;
  lastOutTime?: string | null;
  actualInTime?: string | null;
  actualOutTime?: string | null;
  shiftTime: string;
  workScheduleName: string;
  actualWorkingMinutes: number;
  netWorkingMinutes: number;
  lateByMinutes?: number;
  earlyOutMinutes?: number;
  overtimeMinutes?: number;
  remarks?: string;
  punchEntries: PunchEntry[];
}

export interface MonthlySummary {
  totalPresentDays: number;
  totalAbsentDays: number;
  totalWeekOffs: number;
  totalLeaves: number;
  totalHolidays: number;
  totalWorkingMinutes: number;
  totalNetMinutes: number;
  totalLateMarks: number;
}

export interface EmployeeOption {
  id: string;
  name: string;
  code: string;
  department: string;
}