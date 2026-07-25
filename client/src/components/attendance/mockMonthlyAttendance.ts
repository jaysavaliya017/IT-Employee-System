import {
  addDays,
  endOfMonth,
  format,
  isSameMonth,
  set,
  startOfMonth,
} from 'date-fns';
import {
  DayAttendanceStatus,
  EmployeeOption,
  MonthlyAttendanceRecord,
  MonthlySummary,
  PunchEntry,
} from './types';

const DEFAULT_SHIFT = '08:00 AM - 10:00 PM';
const DEFAULT_SCHEDULE = 'General Work Schedule';

export const employeeOptions: EmployeeOption[] = [
  { id: 'emp-001', name: 'Aarav Shah', code: 'EMP001', department: 'Engineering' },
  { id: 'emp-002', name: 'Mira Patel', code: 'EMP002', department: 'Design' },
  { id: 'emp-003', name: 'Rohan Mehta', code: 'EMP003', department: 'QA' },
  { id: 'emp-004', name: 'Diya Joshi', code: 'EMP004', department: 'Support' },
];

const setTime = (date: Date, hours: number, minutes: number, seconds = 0) =>
  set(date, { hours, minutes, seconds, milliseconds: 0 }).toISOString();

const createPunch = (
  id: string,
  date: Date,
  inHour: number,
  inMinute: number,
  outHour?: number,
  outMinute?: number,
  source = 'Biometric',
  location = 'Head Office',
  status?: string
): PunchEntry => {
  const inTime = setTime(date, inHour, inMinute, id.length);
  const outTime =
    typeof outHour === 'number' && typeof outMinute === 'number'
      ? setTime(date, outHour, outMinute, id.length + 6)
      : null;
  const durationMinutes = outTime
    ? Math.max(0, Math.round((new Date(outTime).getTime() - new Date(inTime).getTime()) / 60000))
    : null;

  return {
    id,
    inTime,
    outTime,
    durationMinutes,
    source,
    location,
    status,
  };
};

const createRecord = (
  date: Date,
  status: DayAttendanceStatus,
  punchEntries: PunchEntry[],
  config?: Partial<MonthlyAttendanceRecord>
): MonthlyAttendanceRecord => {
  const closedPunches = punchEntries.filter((entry) => entry.inTime && entry.outTime);
  const actualWorkingMinutes = closedPunches.reduce(
    (total, entry) => total + (entry.durationMinutes || 0),
    0
  );
  const netWorkingMinutes = Math.max(0, actualWorkingMinutes - (config?.lateByMinutes || 0) / 2);

  return {
    id: `record-${format(date, 'yyyy-MM-dd')}`,
    date: date.toISOString(),
    attendanceStatus: status,
    statusBadges: config?.statusBadges || [
      {
        id: `${format(date, 'yyyy-MM-dd')}-${status.toLowerCase()}`,
        label: status.replace('_', ' '),
        type: status,
      },
    ],
    firstInTime: punchEntries.find((entry) => entry.inTime)?.inTime || null,
    lastOutTime: [...punchEntries].reverse().find((entry) => entry.outTime)?.outTime || null,
    actualInTime: punchEntries.find((entry) => entry.inTime)?.inTime || null,
    actualOutTime: [...punchEntries].reverse().find((entry) => entry.outTime)?.outTime || null,
    shiftTime: DEFAULT_SHIFT,
    workScheduleName: DEFAULT_SCHEDULE,
    actualWorkingMinutes,
    netWorkingMinutes: config?.netWorkingMinutes ?? netWorkingMinutes,
    lateByMinutes: config?.lateByMinutes,
    earlyOutMinutes: config?.earlyOutMinutes,
    overtimeMinutes: config?.overtimeMinutes,
    remarks: config?.remarks,
    punchEntries,
  };
};

const getEmployeeMonthOverrides = (employeeId: string, currentMonth: Date) => {
  const monthStart = startOfMonth(currentMonth);

  return {
    2: createRecord(monthStart, 'PRESENT', [createPunch('p-2-1', addDays(monthStart, 1), 9, 28, 13, 33)], {
      lateByMinutes: 8,
      remarks: 'Late due to traffic diversion.',
    }),
    5: createRecord(addDays(monthStart, 4), 'HALF_DAY', [
      createPunch('p-5-1', addDays(monthStart, 4), 8, 57, 12, 58, 'Mobile', 'Client Site'),
    ], {
      statusBadges: [
        { id: '5-1', label: '1st - Present', type: 'PRESENT' },
        { id: '5-2', label: '2nd - Absent', type: 'ABSENT' },
      ],
      earlyOutMinutes: 54,
      remarks: 'Half day approved by reporting manager.',
    }),
    8: createRecord(addDays(monthStart, 7), 'PRESENT', [
      createPunch('p-8-1', addDays(monthStart, 7), 9, 28, 9, 29, 'Biometric', 'Main Gate', 'Manual Check'),
      createPunch('p-8-2', addDays(monthStart, 7), 9, 32, 13, 33, 'Biometric', 'Floor 4', 'Verified'),
      createPunch('p-8-3', addDays(monthStart, 7), 14, 2, undefined, undefined, 'Mobile', 'Floor 4', 'Open Punch'),
    ], {
      lateByMinutes: 6,
      remarks: 'Open punch is awaiting punch-out sync.',
    }),
    11: createRecord(addDays(monthStart, 10), 'LEAVE', [], {
      statusBadges: [{ id: '11-1', label: 'Casual Leave', type: 'LEAVE' }],
      remarks: 'Casual leave applied for family event.',
    }),
    14: createRecord(addDays(monthStart, 13), 'HOLIDAY', [], {
      statusBadges: [{ id: '14-1', label: 'Public Holiday', type: 'HOLIDAY' }],
      remarks: 'Festival holiday declared by company.',
    }),
    17: createRecord(addDays(monthStart, 16), 'ABSENT', [], {
      remarks: 'No attendance punches available for this day.',
    }),
    21: createRecord(addDays(monthStart, 20), 'PRESENT', [
      createPunch('p-21-1', addDays(monthStart, 20), 7, 58, 12, 30, 'Biometric', 'Main Gate'),
      createPunch('p-21-2', addDays(monthStart, 20), 13, 14, 18, 47, 'Web', 'Remote VPN'),
    ], {
      overtimeMinutes: 41,
      remarks: 'Worked late for production deployment.',
    }),
    24:
      employeeId === 'emp-002'
        ? createRecord(addDays(monthStart, 23), 'PRESENT', [
            createPunch('p-24-1', addDays(monthStart, 23), 10, 4, 14, 11, 'Mobile', 'Design Studio'),
          ], { lateByMinutes: 34 })
        : createRecord(addDays(monthStart, 23), 'WEEK_OFF', [], {
            statusBadges: [{ id: '24-1', label: 'Weekend Off', type: 'WEEK_OFF' }],
          }),
  };
};

export const generateMockMonthlyAttendance = (
  currentMonth: Date,
  employeeId: string
): MonthlyAttendanceRecord[] => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const overrides: Record<number, MonthlyAttendanceRecord> = getEmployeeMonthOverrides(employeeId, currentMonth);
  const records: MonthlyAttendanceRecord[] = [];

  for (let date = monthStart; isSameMonth(date, monthStart); date = addDays(date, 1)) {
    const dayNumber = Number(format(date, 'd'));

    if (overrides[dayNumber]) {
      records.push(overrides[dayNumber]);
      continue;
    }

    const weekDay = date.getDay();

    if (weekDay === 0) {
      records.push(
        createRecord(date, 'WEEK_OFF', [], {
          statusBadges: [{ id: `${dayNumber}-weekoff`, label: 'Week Off', type: 'WEEK_OFF' }],
          remarks: 'Default Sunday weekly off.',
        })
      );
      continue;
    }

    if (weekDay === 6 && dayNumber % 2 === 0) {
      records.push(
        createRecord(date, 'WEEK_OFF', [], {
          statusBadges: [{ id: `${dayNumber}-weekoff`, label: 'Alt Saturday Off', type: 'WEEK_OFF' }],
        })
      );
      continue;
    }

    if (dayNumber % 9 === 0) {
      continue;
    }

    records.push(
      createRecord(
        date,
        'PRESENT',
        [
          createPunch(`p-${dayNumber}-1`, date, 8, 54, 13, 1),
          createPunch(`p-${dayNumber}-2`, date, 13, 42, 18, 16, 'Web', 'Office LAN'),
        ],
        {
          lateByMinutes: dayNumber % 5 === 0 ? 4 : 0,
          overtimeMinutes: dayNumber % 7 === 0 ? 22 : 0,
        }
      )
    );

    if (format(date, 'yyyy-MM-dd') === format(monthEnd, 'yyyy-MM-dd')) {
      break;
    }
  }

  return records;
};

export const getMonthlySummary = (records: MonthlyAttendanceRecord[]): MonthlySummary => {
  return records.reduce(
    (summary, record) => {
      if (record.attendanceStatus === 'PRESENT') {
        summary.totalPresentDays += 1;
      }
      if (record.attendanceStatus === 'ABSENT') {
        summary.totalAbsentDays += 1;
      }
      if (record.attendanceStatus === 'WEEK_OFF') {
        summary.totalWeekOffs += 1;
      }
      if (record.attendanceStatus === 'LEAVE') {
        summary.totalLeaves += 1;
      }
      if (record.attendanceStatus === 'HOLIDAY') {
        summary.totalHolidays += 1;
      }
      if (record.lateByMinutes && record.lateByMinutes > 0) {
        summary.totalLateMarks += 1;
      }

      summary.totalWorkingMinutes += record.actualWorkingMinutes;
      summary.totalNetMinutes += record.netWorkingMinutes;

      return summary;
    },
    {
      totalPresentDays: 0,
      totalAbsentDays: 0,
      totalWeekOffs: 0,
      totalLeaves: 0,
      totalHolidays: 0,
      totalWorkingMinutes: 0,
      totalNetMinutes: 0,
      totalLateMarks: 0,
    }
  );
};