import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Users2, LayoutGrid, Rows3 } from 'lucide-react';
import { eachDayOfInterval, endOfMonth, format, isSameMonth, startOfMonth } from 'date-fns';
import { attendanceApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import MonthCalendar from './MonthCalendar';
import AttendanceDetailsPanel from './AttendanceDetailsPanel';
import MonthlySummaryCards from './MonthlySummaryCards';
import ModifyAttendanceModal from './ModifyAttendanceModal';
import LeaveRequestModal from './LeaveRequestModal';
import { AttendanceStatus, Holiday } from '../../types';
import { AttendanceStatusBadge, AttendanceViewMode, MonthlyAttendanceRecord, PunchEntry } from './types';
import { getMonthlySummary } from './mockMonthlyAttendance';
import { formatDateLabel, formatMinutes, formatTimeLabel, getStatusLabel, matchesSearch } from './attendanceUtils';

const monthOptions = Array.from({ length: 12 }, (_, index) => ({ value: index, label: format(new Date(2026, index, 1), 'MMMM') }));
const yearOptions = [2025, 2026, 2027];

const WORK_SCHEDULE_NAME = 'General Work Schedule';

const toMinutesFromHours = (hours?: number | null) => {
  if (typeof hours !== 'number' || Number.isNaN(hours)) {
    return 0;
  }

  return Math.max(0, Math.round(hours * 60));
};

const statusLabelFromAttendance = (status?: AttendanceStatus) => {
  if (!status) {
    return 'Present';
  }

  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const mapAttendanceStatus = (status?: AttendanceStatus): MonthlyAttendanceRecord['attendanceStatus'] => {
  if (!status) {
    return 'PRESENT';
  }

  if (status === 'HALF_DAY') {
    return 'HALF_DAY';
  }

  if (status === 'ABSENT') {
    return 'ABSENT';
  }

  if (
    status === 'PAID_LEAVE' ||
    status === 'UNPAID_LEAVE' ||
    status === 'CASUAL_LEAVE' ||
    status === 'SICK_LEAVE'
  ) {
    return 'LEAVE';
  }

  if (status === 'HOLIDAY') {
    return 'HOLIDAY';
  }

  if (status === 'WEEK_OFF') {
    return 'WEEK_OFF';
  }

  return 'PRESENT';
};

const mapStatusBadges = (status?: AttendanceStatus): AttendanceStatusBadge[] => {
  if (status === 'HALF_DAY') {
    return [
      { id: 'half-1', label: '1st - Present', type: 'PRESENT' },
      { id: 'half-2', label: '2nd - Absent', type: 'ABSENT' },
    ];
  }

  const normalized = mapAttendanceStatus(status);
  return [
    {
      id: `status-${normalized}`,
      label: statusLabelFromAttendance(status),
      type: normalized,
    },
  ];
};

const buildShiftLabel = (shift?: { startTime?: string; endTime?: string } | null) => {
  if (!shift?.startTime || !shift?.endTime) {
    return '09:00 AM - 06:00 PM';
  }

  return `${shift.startTime} - ${shift.endTime}`;
};

const calculateEntryDurationMinutes = (inTime?: string | null, outTime?: string | null) => {
  if (!inTime || !outTime) {
    return null;
  }

  return Math.max(0, Math.round((new Date(outTime).getTime() - new Date(inTime).getTime()) / 60000));
};

const mapPunchEntries = (attendance: any): PunchEntry[] => {
  if (Array.isArray(attendance?.sessions) && attendance.sessions.length > 0) {
    return attendance.sessions.map((session: any, index: number) => ({
      id: session.id || `${attendance.id}-session-${index + 1}`,
      inTime: session.startTime,
      outTime: session.endTime,
      durationMinutes: calculateEntryDurationMinutes(session.startTime, session.endTime),
      source: session.punchInIp ? 'Network Punch' : 'Biometric',
      location: session.punchInLocation || session.punchOutLocation || '--',
      status: session.endTime ? 'Closed Punch' : 'Open Punch',
    }));
  }

  if (attendance?.punchInTime || attendance?.punchOutTime) {
    return [
      {
        id: `${attendance.id}-fallback`,
        inTime: attendance.punchInTime || null,
        outTime: attendance.punchOutTime || null,
        durationMinutes: calculateEntryDurationMinutes(attendance.punchInTime, attendance.punchOutTime),
        source: attendance.punchInIp ? 'Network Punch' : 'Biometric',
        location: attendance.punchInLocation || attendance.punchOutLocation || '--',
        status: attendance.punchOutTime ? 'Closed Punch' : 'Open Punch',
      },
    ];
  }

  return [];
};

const buildRecordFromAttendance = (
  date: Date,
  attendance: any,
  shift: { startTime?: string; endTime?: string } | null
) => {
  const punchEntries = mapPunchEntries(attendance);
  const firstIn = punchEntries.find((entry) => entry.inTime)?.inTime || attendance.punchInTime || null;
  const lastOut = [...punchEntries].reverse().find((entry) => entry.outTime)?.outTime || attendance.punchOutTime || null;

  return {
    id: attendance.id,
    date: date.toISOString(),
    attendanceStatus: mapAttendanceStatus(attendance.status),
    statusBadges: mapStatusBadges(attendance.status),
    firstInTime: firstIn,
    lastOutTime: lastOut,
    actualInTime: firstIn,
    actualOutTime: lastOut,
    shiftTime: buildShiftLabel(attendance.user?.shift || shift),
    workScheduleName: WORK_SCHEDULE_NAME,
    actualWorkingMinutes: toMinutesFromHours(attendance.totalHours),
    netWorkingMinutes: toMinutesFromHours(attendance.netHours || attendance.totalHours),
    lateByMinutes: attendance.isLate ? 10 : 0,
    earlyOutMinutes: 0,
    overtimeMinutes: toMinutesFromHours(attendance.overtimeHours),
    remarks: attendance.notes || undefined,
    punchEntries,
  } as MonthlyAttendanceRecord;
};

const buildDefaultRecord = (
  day: Date,
  today: Date,
  holidayMap: Map<string, Holiday>,
  shift: { startTime?: string; endTime?: string } | null
): MonthlyAttendanceRecord | null => {
  const dayKey = format(day, 'yyyy-MM-dd');
  const holiday = holidayMap.get(dayKey);
  const isSunday = day.getDay() === 0;
  const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (holiday) {
    return {
      id: `holiday-${dayKey}`,
      date: day.toISOString(),
      attendanceStatus: 'HOLIDAY',
      statusBadges: [{ id: `holiday-${dayKey}-badge`, label: holiday.title || 'Holiday', type: 'HOLIDAY' }],
      firstInTime: null,
      lastOutTime: null,
      actualInTime: null,
      actualOutTime: null,
      shiftTime: buildShiftLabel(shift),
      workScheduleName: WORK_SCHEDULE_NAME,
      actualWorkingMinutes: 0,
      netWorkingMinutes: 0,
      remarks: holiday.description || 'Company holiday',
      punchEntries: [],
    };
  }

  if (isSunday) {
    return {
      id: `weekoff-${dayKey}`,
      date: day.toISOString(),
      attendanceStatus: 'WEEK_OFF',
      statusBadges: [{ id: `weekoff-${dayKey}-badge`, label: 'Week Off', type: 'WEEK_OFF' }],
      firstInTime: null,
      lastOutTime: null,
      actualInTime: null,
      actualOutTime: null,
      shiftTime: buildShiftLabel(shift),
      workScheduleName: WORK_SCHEDULE_NAME,
      actualWorkingMinutes: 0,
      netWorkingMinutes: 0,
      remarks: 'Weekly off',
      punchEntries: [],
    };
  }

  if (isPast) {
    return {
      id: `absent-${dayKey}`,
      date: day.toISOString(),
      attendanceStatus: 'ABSENT',
      statusBadges: [{ id: `absent-${dayKey}-badge`, label: 'Absent', type: 'ABSENT' }],
      firstInTime: null,
      lastOutTime: null,
      actualInTime: null,
      actualOutTime: null,
      shiftTime: buildShiftLabel(shift),
      workScheduleName: WORK_SCHEDULE_NAME,
      actualWorkingMinutes: 0,
      netWorkingMinutes: 0,
      remarks: 'No punch records found',
      punchEntries: [],
    };
  }

  return null;
};

const buildMonthlyRecords = (
  currentMonth: Date,
  attendances: any[],
  holidays: Holiday[],
  shift: { startTime?: string; endTime?: string } | null,
  todayAttendance: any | null
) => {
  const today = new Date();
  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const attendanceMap = new Map(
    attendances.map((attendance) => [format(new Date(attendance.date), 'yyyy-MM-dd'), attendance])
  );

  if (todayAttendance) {
    attendanceMap.set(format(new Date(todayAttendance.date), 'yyyy-MM-dd'), todayAttendance);
  }

  const holidayMap = new Map(
    holidays.map((holiday) => [format(new Date(holiday.date), 'yyyy-MM-dd'), holiday])
  );

  return monthDays
    .map((day) => {
    const key = format(day, 'yyyy-MM-dd');
    const attendance = attendanceMap.get(key);

    if (attendance) {
      return buildRecordFromAttendance(day, attendance, shift);
    }

    return buildDefaultRecord(day, today, holidayMap, shift);
  })
    .filter((record): record is MonthlyAttendanceRecord => record !== null);
};

export const AttendanceCalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<AttendanceViewMode>('calendar');
  const [searchTerm, setSearchTerm] = useState('');
  const [records, setRecords] = useState<MonthlyAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const loadAttendanceData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();

      const [monthlyResponse, todayResponse] = await Promise.all([
        attendanceApi.getMonthly(month, year),
        attendanceApi.getToday().catch(() => null),
      ]);

      const attendances = monthlyResponse.data?.data?.attendances || [];
      const holidays = monthlyResponse.data?.data?.holidays || [];
      const shift = monthlyResponse.data?.data?.shift || user?.shift || null;
      const todayAttendance = todayResponse?.data?.data?.attendance || null;

      setRecords(buildMonthlyRecords(currentMonth, attendances, holidays, shift, todayAttendance));
    } catch (apiError: any) {
      setError(apiError?.response?.data?.message || 'Unable to load attendance data');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, user?.shift]);

  useEffect(() => {
    loadAttendanceData();

    const monthSelectedDate = isSameMonth(selectedDate, currentMonth) ? selectedDate : new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    setSelectedDate(monthSelectedDate);
  }, [currentMonth, loadAttendanceData]);

  const selectedRecord = useMemo(
    () => records.find((record) => format(new Date(record.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')),
    [records, selectedDate]
  );

  const filteredRecords = useMemo(
    () => records.filter((record) => matchesSearch(record, searchTerm)),
    [records, searchTerm]
  );

  const summary = useMemo(() => getMonthlySummary(records), [records]);
  const selectedEmployee = {
    name: user?.fullName || 'Employee',
    code: user?.employeeCode || 'EMP',
    department: user?.department?.name || 'Department',
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + (direction === 'next' ? 1 : -1), 1));
  };

  const handleRefresh = () => {
    loadAttendanceData();
  };

  const handleDownload = () => {
    const rows = [
      ['Date', 'Status', 'First In', 'Last Out', 'Actual Hours', 'Net Hours'].join(','),
      ...records.map((record) => [
        formatDateLabel(record.date),
        getStatusLabel(record),
        formatTimeLabel(record.firstInTime),
        formatTimeLabel(record.lastOutTime),
        formatMinutes(record.actualWorkingMinutes),
        formatMinutes(record.netWorkingMinutes),
      ].join(',')),
    ];

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedEmployee.code}-${format(currentMonth, 'MMMM-yyyy')}-attendance.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleRegularize = () => {
    setShowModifyModal(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-[30px] border border-gray-200 bg-white p-5 shadow-sm shadow-gray-100 sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Monthly Attendance Calendar</p>
              <h1 className="mt-2 text-2xl font-semibold text-gray-900">Professional monthly attendance tracker</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
                View daily attendance status, split punches, work hours, late marks, and quick actions from a single HRMS calendar workspace.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start rounded-2xl border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                <LayoutGrid className="h-4 w-4" /> Calendar
              </button>
              <button
                type="button"
                onClick={() => setViewMode('summary')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${viewMode === 'summary' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                <Rows3 className="h-4 w-4" /> Summary
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-12">
            <label className="lg:col-span-3">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Employee</span>
              <div className="relative">
                <Users2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={selectedEmployee.code}
                  disabled
                  className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                >
                  <option value={selectedEmployee.code}>{selectedEmployee.name} · {selectedEmployee.code}</option>
                </select>
              </div>
            </label>
            <label className="lg:col-span-2">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Month</span>
              <select
                value={currentMonth.getMonth()}
                onChange={(event) => setCurrentMonth(new Date(currentMonth.getFullYear(), Number(event.target.value), 1))}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </label>
            <label className="lg:col-span-2">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Year</span>
              <select
                value={currentMonth.getFullYear()}
                onChange={(event) => setCurrentMonth(new Date(Number(event.target.value), currentMonth.getMonth(), 1))}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
            <label className="lg:col-span-3">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Search</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search status, date, remarks"
                  className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </label>
            <div className="lg:col-span-2">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Navigate</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleMonthChange('prev')} className="inline-flex flex-1 items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 hover:bg-gray-50">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => handleMonthChange('next')} className="inline-flex flex-1 items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 hover:bg-gray-50">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <MonthlySummaryCards summary={summary} />

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.95fr)] xl:items-start">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-[28px] border border-gray-200 bg-white px-5 py-4 shadow-sm shadow-gray-100">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Active Month</p>
                <h2 className="mt-1 text-xl font-semibold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h2>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p className="font-medium text-gray-700">{selectedEmployee.name}</p>
                <p>{selectedEmployee.department}</p>
              </div>
            </div>

            {loading ? (
              <div className="rounded-[28px] border border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-500">
                Loading real attendance data...
              </div>
            ) : viewMode === 'calendar' ? (
              <MonthCalendar
                currentMonth={currentMonth}
                records={records}
                selectedDate={selectedDate}
                searchTerm={searchTerm}
                onSelectDate={setSelectedDate}
              />
            ) : (
              <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm shadow-gray-100">
                {filteredRecords.length === 0 ? (
                  <div className="px-6 py-12 text-center text-sm text-gray-500">
                    No days matched your current search.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50 text-left text-xs uppercase tracking-[0.18em] text-gray-500">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">First In</th>
                          <th className="px-4 py-3">Last Out</th>
                          <th className="px-4 py-3">Actual Hours</th>
                          <th className="px-4 py-3">Net Hours</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {filteredRecords.map((record) => (
                          <tr key={record.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedDate(new Date(record.date))}>
                            <td className="px-4 py-3 font-medium text-gray-900">{formatDateLabel(record.date)}</td>
                            <td className="px-4 py-3"><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{getStatusLabel(record)}</span></td>
                            <td className="px-4 py-3">{formatTimeLabel(record.firstInTime)}</td>
                            <td className="px-4 py-3">{formatTimeLabel(record.lastOutTime)}</td>
                            <td className="px-4 py-3">{formatMinutes(record.actualWorkingMinutes)}</td>
                            <td className="px-4 py-3">{formatMinutes(record.netWorkingMinutes)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          <AttendanceDetailsPanel
            record={selectedRecord}
            onModifyAttendance={() => setShowModifyModal(true)}
            onLeaveRequest={() => setShowLeaveModal(true)}
            onRegularizeAttendance={handleRegularize}
            onDownloadReport={handleDownload}
            onRefresh={handleRefresh}
          />
        </div>
      </div>

      <ModifyAttendanceModal
        isOpen={showModifyModal}
        record={selectedRecord}
        onClose={() => setShowModifyModal(false)}
      />
      <LeaveRequestModal
        isOpen={showLeaveModal}
        record={selectedRecord}
        onClose={() => setShowLeaveModal(false)}
      />
    </>
  );
};

export default AttendanceCalendarPage;