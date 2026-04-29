import React from 'react';
import { eachDayOfInterval, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, endOfMonth } from 'date-fns';
import CalendarDayCell from './CalendarDayCell';
import { MonthlyAttendanceRecord } from './types';

interface MonthCalendarProps {
  currentMonth: Date;
  records: MonthlyAttendanceRecord[];
  selectedDate: Date;
  searchTerm: string;
  onSelectDate: (day: Date) => void;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const MonthCalendar: React.FC<MonthCalendarProps> = ({
  currentMonth,
  records,
  selectedDate,
  searchTerm,
  onSelectDate,
}) => {
  const gridDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 }),
  });

  const recordMap = new Map(records.map((record) => [format(new Date(record.date), 'yyyy-MM-dd'), record]));

  return (
    <div className="rounded-[28px] border border-gray-200 bg-white p-4 shadow-sm shadow-gray-100/80 sm:p-5">
      <div className="mb-4 grid grid-cols-7 gap-2">
        {dayNames.map((day) => (
          <div key={day} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.slice(0, 3)}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {gridDays.map((day) => {
          const record = recordMap.get(format(day, 'yyyy-MM-dd'));

          return (
            <CalendarDayCell
              key={day.toISOString()}
              day={day}
              currentMonth={currentMonth}
              record={record}
              isSelected={isSameDay(day, selectedDate)}
              searchTerm={searchTerm}
              onSelect={onSelectDate}
            />
          );
        })}
      </div>
    </div>
  );
};

export default MonthCalendar;