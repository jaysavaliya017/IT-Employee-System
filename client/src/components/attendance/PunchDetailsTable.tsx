import React from 'react';
import { MapPin, Wifi } from 'lucide-react';
import { formatMinutesClock, formatTimeLabel, statusMeta } from './attendanceUtils';
import { PunchEntry } from './types';

interface PunchDetailsTableProps {
  punchEntries: PunchEntry[];
}

export const PunchDetailsTable: React.FC<PunchDetailsTableProps> = ({ punchEntries }) => {
  if (punchEntries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        No punch entries available for this date.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-[0.18em] text-gray-500">
            <tr>
              <th className="px-4 py-3">Sr No.</th>
              <th className="px-4 py-3">In Time</th>
              <th className="px-4 py-3">Out Time</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Punch Type</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white text-gray-700">
            {punchEntries.map((entry, index) => {
              const status = entry.status || (entry.outTime ? 'Closed Punch' : 'Missing Punch Out');
              const tone = entry.outTime ? statusMeta.PRESENT.badge : statusMeta.ABSENT.badge;

              return (
                <tr key={entry.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 font-medium text-gray-900">{index + 1}</td>
                  <td className="px-4 py-3">{formatTimeLabel(entry.inTime)}</td>
                  <td className="px-4 py-3">{formatTimeLabel(entry.outTime)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{entry.outTime ? formatMinutesClock(entry.durationMinutes) : '--'}</td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                      <Wifi className="h-3.5 w-3.5" />
                      {entry.source || '--'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {entry.location || '--'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PunchDetailsTable;