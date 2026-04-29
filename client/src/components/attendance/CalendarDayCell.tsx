import React from 'react';
import { format, isToday } from 'date-fns';
import { formatTimeLabel, matchesSearch, statusMeta } from './attendanceUtils';
import { MonthlyAttendanceRecord } from './types';

interface CalendarDayCellProps {
  day: Date;
  currentMonth: Date;
  record?: MonthlyAttendanceRecord;
  isSelected: boolean;
  searchTerm: string;
  onSelect: (day: Date) => void;
}

export const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
  day,
  currentMonth,
  record,
  isSelected,
  searchTerm,
  onSelect,
}) => {
  const inCurrentMonth = day.getMonth() === currentMonth.getMonth();
  const searchMatch = record ? matchesSearch(record, searchTerm) : !searchTerm.trim();

  return (
    <button
      type="button"
      onClick={() => onSelect(day)}
      className={`relative min-h-[84px] rounded-2xl border p-2 text-left transition-all sm:min-h-[118px] sm:p-3 ${
        inCurrentMonth ? 'bg-white' : 'bg-gray-50/80'
      } ${
        isSelected
          ? 'border-sky-400 shadow-lg shadow-sky-100 ring-2 ring-sky-100'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      } ${searchMatch ? 'opacity-100' : 'opacity-35'}`}
    >
      <div className="flex items-start justify-between gap-1 sm:gap-2">
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold sm:h-8 sm:w-8 sm:text-sm ${
            isToday(day) ? 'bg-sky-600 text-white' : 'text-gray-800'
          }`}
        >
          {format(day, 'd')}
        </span>
        {record && <span className={`h-2.5 w-2.5 rounded-full ${statusMeta[record.attendanceStatus].dot}`} />}
      </div>

      {record ? (
        <div className="mt-2 space-y-1.5 sm:mt-3 sm:space-y-2">
          <div className="hidden flex-wrap gap-1.5 sm:flex">
            {record.statusBadges.slice(0, 2).map((badge) => (
              <span
                key={badge.id}
                className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${statusMeta[badge.type].badge}`}
              >
                {badge.label}
              </span>
            ))}
            {record.statusBadges.length > 2 && (
              <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600">
                +{record.statusBadges.length - 2}
              </span>
            )}
          </div>
          <div className="sm:hidden">
            <span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-semibold ${statusMeta[record.statusBadges[0]?.type || record.attendanceStatus].badge}`}>
              {record.statusBadges[0]?.label || 'Status'}
            </span>
          </div>
          <div className="rounded-xl bg-gray-50 px-2 py-1.5 text-[10px] text-gray-600 sm:px-2.5 sm:py-2 sm:text-xs">
            <p className="font-medium text-gray-700">{formatTimeLabel(record.firstInTime)} - {formatTimeLabel(record.lastOutTime)}</p>
            <p className="mt-0.5 hidden truncate text-[11px] text-gray-500 sm:block">
              {record.punchEntries.length > 0 ? `${record.punchEntries.length} punch entries` : 'No punches'}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-2 py-3 text-center text-[10px] text-gray-400 sm:mt-8 sm:px-3 sm:py-4 sm:text-xs">
          No attendance data
        </div>
      )}

      {isSelected && record && (
        <div className="pointer-events-none absolute left-2 right-2 top-full z-10 mt-2 hidden rounded-xl border border-sky-100 bg-white p-3 text-xs shadow-xl shadow-sky-100/70 sm:block">
          <p className="font-semibold text-gray-800">{record.statusBadges.map((badge) => badge.label).join(', ')}</p>
          <p className="mt-1 text-gray-500">{formatTimeLabel(record.firstInTime)} - {formatTimeLabel(record.lastOutTime)}</p>
        </div>
      )}
    </button>
  );
};

export default CalendarDayCell;