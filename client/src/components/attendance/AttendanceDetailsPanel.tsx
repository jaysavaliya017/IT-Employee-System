import React from 'react';
import { AlertTriangle, CalendarClock, Clock3, Download, FilePenLine, RefreshCcw, ScrollText } from 'lucide-react';
import { formatDateLabel, formatMinutes, formatTimeLabel, getStatusLabel, statusMeta } from './attendanceUtils';
import { MonthlyAttendanceRecord } from './types';
import PunchDetailsTable from './PunchDetailsTable';

interface AttendanceDetailsPanelProps {
  record?: MonthlyAttendanceRecord;
  onModifyAttendance: () => void;
  onLeaveRequest: () => void;
  onRegularizeAttendance: () => void;
  onDownloadReport: () => void;
  onRefresh: () => void;
}

export const AttendanceDetailsPanel: React.FC<AttendanceDetailsPanelProps> = ({
  record,
  onModifyAttendance,
  onLeaveRequest,
  onRegularizeAttendance,
  onDownloadReport,
  onRefresh,
}) => {
  if (!record) {
    return (
      <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm shadow-gray-100 lg:sticky lg:top-6">
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-10 text-center text-sm text-gray-500">
          Select any date to see attendance summary and punch in-out details. If a day has no record yet, you will see the no data state here.
        </div>
      </div>
    );
  }

  const statusBadgeTone = statusMeta[record.attendanceStatus].badge;

  return (
    <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm shadow-gray-100 lg:sticky lg:top-6">
      <div className={`rounded-[24px] bg-gradient-to-br ${statusMeta[record.attendanceStatus].panel} border border-gray-100 p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Selected Date</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">{formatDateLabel(record.date)}</h2>
          </div>
          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusBadgeTone}`}>
            {getStatusLabel(record)}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/70 bg-white/90 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Shift Time</p>
            <p className="mt-2 font-semibold text-gray-900">{record.shiftTime}</p>
            <p className="mt-1 text-sm text-gray-500">{record.workScheduleName}</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/90 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Actual In / Out</p>
            <p className="mt-2 font-semibold text-gray-900">{formatTimeLabel(record.actualInTime)} to {formatTimeLabel(record.actualOutTime)}</p>
            <p className="mt-1 text-sm text-gray-500">{record.punchEntries.length} punch movements</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800"><Clock3 className="h-4 w-4 text-sky-600" /> Actual Working Hours</div>
          <p className="mt-3 text-lg font-semibold text-gray-900">{formatMinutes(record.actualWorkingMinutes)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800"><CalendarClock className="h-4 w-4 text-indigo-600" /> Net Working Hours</div>
          <p className="mt-3 text-lg font-semibold text-gray-900">{formatMinutes(record.netWorkingMinutes)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Late By / Early Out / Overtime</p>
          <div className="mt-3 space-y-2 text-sm text-gray-600">
            <p>Late By: <span className="font-semibold text-gray-900">{record.lateByMinutes ? formatMinutes(record.lateByMinutes) : '--'}</span></p>
            <p>Early Out: <span className="font-semibold text-gray-900">{record.earlyOutMinutes ? formatMinutes(record.earlyOutMinutes) : '--'}</span></p>
            <p>Overtime: <span className="font-semibold text-gray-900">{record.overtimeMinutes ? formatMinutes(record.overtimeMinutes) : '--'}</span></p>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Remarks</p>
          <p className="mt-3 text-sm leading-6 text-gray-600">{record.remarks || 'No remarks captured for this date.'}</p>
        </div>
      </div>

      {!record.actualOutTime && record.punchEntries.some((entry) => entry.inTime && !entry.outTime) && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          Missing punch out found for this date. Regularize the open punch before payroll lock.
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={onModifyAttendance} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-700">
          <FilePenLine className="h-4 w-4" /> Modify Attendance
        </button>
        <button onClick={onLeaveRequest} className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-medium text-violet-700 hover:bg-violet-100">
          <ScrollText className="h-4 w-4" /> Leave Request
        </button>
        <button onClick={onRegularizeAttendance} className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-100">
          <CalendarClock className="h-4 w-4" /> Regularize Attendance
        </button>
        <button onClick={onDownloadReport} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Download className="h-4 w-4" /> Download Monthly Report
        </button>
        <button onClick={onRefresh} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <RefreshCcw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Punch In-Out Details</h3>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
            {record.punchEntries.length} entries
          </span>
        </div>
        <PunchDetailsTable punchEntries={record.punchEntries} />
      </div>
    </div>
  );
};

export default AttendanceDetailsPanel;