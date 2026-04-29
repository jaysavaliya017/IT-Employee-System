import React from 'react';
import { Clock3, CalendarCheck2, CalendarX2, Coffee, Plane, Landmark, AlarmClock } from 'lucide-react';
import { MonthlySummary } from './types';
import { formatMinutes } from './attendanceUtils';

interface MonthlySummaryCardsProps {
  summary: MonthlySummary;
}

const cards = [
  { key: 'totalPresentDays', label: 'Total Present Days', icon: CalendarCheck2, accent: 'text-emerald-600 bg-emerald-50' },
  { key: 'totalAbsentDays', label: 'Total Absent Days', icon: CalendarX2, accent: 'text-rose-600 bg-rose-50' },
  { key: 'totalWeekOffs', label: 'Total Week Offs', icon: Coffee, accent: 'text-slate-600 bg-slate-100' },
  { key: 'totalLeaves', label: 'Total Leaves', icon: Plane, accent: 'text-violet-600 bg-violet-50' },
  { key: 'totalHolidays', label: 'Total Holidays', icon: Landmark, accent: 'text-orange-600 bg-orange-50' },
  { key: 'totalWorkingMinutes', label: 'Total Working Hours', icon: Clock3, accent: 'text-sky-600 bg-sky-50' },
  { key: 'totalNetMinutes', label: 'Total Net Hours', icon: Clock3, accent: 'text-indigo-600 bg-indigo-50' },
  { key: 'totalLateMarks', label: 'Total Late Marks', icon: AlarmClock, accent: 'text-amber-600 bg-amber-50' },
] as const;

export const MonthlySummaryCards: React.FC<MonthlySummaryCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const value =
          card.key === 'totalWorkingMinutes' || card.key === 'totalNetMinutes'
            ? formatMinutes(summary[card.key])
            : summary[card.key];

        return (
          <div key={card.key} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-100/70">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">{card.label}</p>
                <p className="mt-3 text-2xl font-semibold text-gray-900">{value}</p>
              </div>
              <div className={`rounded-2xl p-3 ${card.accent}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MonthlySummaryCards;