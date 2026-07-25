import { format } from 'date-fns';
import { DayAttendanceStatus, MonthlyAttendanceRecord } from './types';

export const statusMeta: Record<DayAttendanceStatus, { badge: string; dot: string; panel: string }> = {
  PRESENT: {
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dot: 'bg-emerald-500',
    panel: 'from-emerald-50 to-white',
  },
  ABSENT: {
    badge: 'bg-rose-50 text-rose-700 border border-rose-200',
    dot: 'bg-rose-500',
    panel: 'from-rose-50 to-white',
  },
  WEEK_OFF: {
    badge: 'bg-slate-100 text-slate-700 border border-slate-200',
    dot: 'bg-slate-400',
    panel: 'from-slate-50 to-white',
  },
  LEAVE: {
    badge: 'bg-violet-50 text-violet-700 border border-violet-200',
    dot: 'bg-violet-500',
    panel: 'from-violet-50 to-white',
  },
  HOLIDAY: {
    badge: 'bg-orange-50 text-orange-700 border border-orange-200',
    dot: 'bg-orange-500',
    panel: 'from-orange-50 to-white',
  },
  HALF_DAY: {
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot: 'bg-amber-500',
    panel: 'from-amber-50 to-white',
  },
};

export const formatMinutes = (minutes?: number | null) => {
  if (!minutes || minutes <= 0) {
    return '00hrs 00mins';
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return `${String(hours).padStart(2, '0')}hrs ${String(remaining).padStart(2, '0')}mins`;
};

export const formatMinutesClock = (minutes?: number | null) => {
  if (!minutes || minutes <= 0) {
    return '--';
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  const seconds = Math.floor(((minutes % 1) * 60));

  return `${String(hours).padStart(2, '0')}:${String(remaining).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const formatDateLabel = (date: string | Date, pattern = 'dd-MMM-yyyy') =>
  format(new Date(date), pattern);

export const formatTimeLabel = (value?: string | null) =>
  value ? format(new Date(value), 'hh:mm a') : '--';

export const getStatusLabel = (record?: MonthlyAttendanceRecord | null) => {
  if (!record) {
    return 'No Data';
  }

  return record.attendanceStatus
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export const matchesSearch = (record: MonthlyAttendanceRecord, searchTerm: string) => {
  if (!searchTerm.trim()) {
    return true;
  }

  const normalized = searchTerm.trim().toLowerCase();
  const haystack = [
    formatDateLabel(record.date, 'dd MMM yyyy'),
    getStatusLabel(record),
    record.workScheduleName,
    record.statusBadges.map((badge) => badge.label).join(' '),
    record.remarks || '',
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalized);
};