import React, { useEffect, useState } from 'react';
import {
  AttendanceLike,
  formatAttendanceDurationClock,
  formatAttendanceHours,
  isLiveAttendance,
} from '../utils/attendance';

type AttendanceDurationProps = {
  attendance?: AttendanceLike | null;
  mode?: 'compact' | 'detailed';
};

const AttendanceDuration: React.FC<AttendanceDurationProps> = ({
  attendance,
  mode = 'compact',
}) => {
  const live = isLiveAttendance(attendance);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!live) {
      return;
    }

    const interval = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [live]);

  if (mode === 'detailed') {
    return (
      <div className="text-right">
        <div className="font-medium text-gray-800">{formatAttendanceDurationClock(attendance)}</div>
        <div className={`text-xs ${live ? 'text-green-600' : 'text-gray-500'}`}>
          {live ? 'Running live' : formatAttendanceHours(attendance)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-sm text-gray-800">{formatAttendanceHours(attendance)}</div>
      {live && <div className="text-xs text-green-600">Live</div>}
    </div>
  );
};

export default AttendanceDuration;
