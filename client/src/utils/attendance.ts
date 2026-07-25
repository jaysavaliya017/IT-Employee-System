export type AttendanceLike = {
  date?: string;
  punchInTime?: string | null;
  punchOutTime?: string | null;
  totalHours?: number | null;
  netHours?: number | null;
};

export const isLiveAttendance = (attendance?: AttendanceLike | null) => {
  return !!attendance?.punchInTime && !attendance?.punchOutTime;
};

export const getAttendanceDurationHours = (attendance?: AttendanceLike | null) => {
  if (!attendance?.punchInTime) {
    return 0;
  }

  if (typeof attendance.totalHours === 'number' && attendance.punchOutTime) {
    return attendance.totalHours;
  }

  const punchInTime = new Date(attendance.punchInTime).getTime();
  const punchOutTime = attendance.punchOutTime
    ? new Date(attendance.punchOutTime).getTime()
    : Date.now();

  return Math.max(0, (punchOutTime - punchInTime) / (1000 * 60 * 60));
};

export const formatAttendanceHours = (attendance?: AttendanceLike | null) => {
  if (!attendance?.punchInTime) {
    return '-';
  }

  const hours = getAttendanceDurationHours(attendance);
  return `${hours.toFixed(1)} hrs`;
};

export const formatAttendanceDurationClock = (attendance?: AttendanceLike | null) => {
  if (!attendance?.punchInTime) {
    return '00:00:00';
  }

  const punchInTime = new Date(attendance.punchInTime).getTime();
  const punchOutTime = attendance.punchOutTime
    ? new Date(attendance.punchOutTime).getTime()
    : Date.now();
  const totalSeconds = Math.max(0, Math.floor((punchOutTime - punchInTime) / 1000));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
