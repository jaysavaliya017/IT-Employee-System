export const generateToken = (length = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const calculateWorkingHours = (punchIn: Date, punchOut: Date): number => {
  const diff = punchOut.getTime() - punchIn.getTime();
  return diff / (1000 * 60 * 60);
};

export const isLatePunchIn = (punchInTime: Date, shiftStartTime: string, graceMinutes: number): boolean => {
  const [hours, minutes] = shiftStartTime.split(':').map(Number);
  const shiftStart = new Date(punchInTime);
  shiftStart.setHours(hours, minutes, 0, 0);

  const lateThreshold = new Date(shiftStart.getTime() + graceMinutes * 60 * 1000);
  return punchInTime > lateThreshold;
};

export const calculateLeaveDays = (fromDate: Date, toDate: Date): number => {
  const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export const getMonthDates = (year: number, month: number): Date[] => {
  const dates: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return dates;
};

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return formatDate(date1) === formatDate(date2);
};

export const paginate = <T>(items: T[], page: number = 1, limit: number = 10): { items: T[], total: number, page: number, limit: number, totalPages: number } => {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const itemsPaginated = items.slice(start, start + limit);

  return {
    items: itemsPaginated,
    total,
    page,
    limit,
    totalPages,
  };
};
