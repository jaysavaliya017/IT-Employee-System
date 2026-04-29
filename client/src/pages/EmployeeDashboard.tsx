import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { leaveApi, holidayApi } from '../api/services';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { PageLoader } from '../components/Loader';
import { AttendanceTimerCard } from '../components/Timer';
import {

  CalendarDays,
  Megaphone,
  Info,
  AlertTriangle,
  PartyPopper,
  Clock,
  UserCheck,
  TrendingUp,
  Umbrella,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';

// India Public Holidays 2026
const HOLIDAYS_2026 = [
  { id: 1, name: 'Republic Day', date: '2026-01-26', type: 'National Holiday' },
  { id: 2, name: 'Maha Shivaratri', date: '2026-03-08', type: 'Festival' },
  { id: 3, name: 'Holi', date: '2026-03-28', type: 'Festival' },
  { id: 4, name: 'Good Friday', date: '2026-04-03', type: 'National Holiday' },
  { id: 5, name: 'Eid ul-Fitr', date: '2026-04-14', type: 'Festival' },
  { id: 6, name: 'Ambedkar Jayanti', date: '2026-04-14', type: 'National Holiday' },
  { id: 7, name: 'Ram Navami', date: '2026-04-15', type: 'Festival' },
  { id: 8, name: 'Mahavir Jayanti', date: '2026-04-21', type: 'Festival' },
  { id: 9, name: 'Labour Day', date: '2026-05-01', type: 'National Holiday' },
  { id: 10, name: 'Buddha Purnima', date: '2026-05-15', type: 'Festival' },
  { id: 11, name: 'Eid ul-Adha', date: '2026-08-10', type: 'Festival' },
  { id: 12, name: 'Independence Day', date: '2026-08-15', type: 'National Holiday' },
  { id: 13, name: 'Janmashtami', date: '2026-08-16', type: 'Festival' },
  { id: 14, name: 'Ganesh Chaturthi', date: '2026-08-28', type: 'Festival' },
  { id: 15, name: 'Mahatma Gandhi Jayanti', date: '2026-10-02', type: 'National Holiday' },
  { id: 16, name: 'Dussehra', date: '2026-10-21', type: 'Festival' },
  { id: 17, name: 'Diwali', date: '2026-10-24', type: 'Festival' },
  { id: 18, name: 'Guru Nanak Jayanti', date: '2026-11-14', type: 'Festival' },
  { id: 19, name: 'Christmas', date: '2026-12-25', type: 'National Holiday' },
];

const ANNOUNCEMENTS = [
  {
    id: 1,
    type: 'info',
    title: 'New Leave Policy Effective May 1st',
    message: 'Starting May 1st, all leave requests must be submitted at least 3 days in advance. Emergency leaves are exempt from this rule.',
    date: '2026-04-20',
  },
  {
    id: 2,
    type: 'success',
    title: 'Company Picnic – April 30th',
    message: 'Join us for the annual company picnic at City Park on April 30th from 11 AM to 4 PM. Bring your family!',
    date: '2026-04-18',
  },
  {
    id: 3,
    type: 'warning',
    title: 'System Maintenance – April 26th',
    message: 'The HR portal will be down for scheduled maintenance on April 26th from 12 AM to 4 AM. Plan accordingly.',
    date: '2026-04-15',
  },
];

const announcementStyles: Record<string, { bg: string; border: string; icon: React.ReactNode; badge: string }> = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    icon: <Info className="w-4 h-4 text-blue-600" />,
    badge: 'bg-blue-100 text-blue-700',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-400',
    icon: <PartyPopper className="w-4 h-4 text-green-600" />,
    badge: 'bg-green-100 text-green-700',
  },
  warning: {
    bg: 'bg-orange-50',
    border: 'border-orange-400',
    icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
    badge: 'bg-orange-100 text-orange-700',
  },
};

const LEAVE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [_todayAttendance, setTodayAttendance] = useState<any>(null);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const leaveRes = await leaveApi.getBalance();
      if (leaveRes.data.success) {
        setLeaveBalances(leaveRes.data.data.leaveBalances);
      }
      
      // Try to fetch from API, fallback to HOLIDAYS_2026
      try {
        const holidaysRes = await holidayApi.getAll();
        if (holidaysRes.data.success) {
          const apiHolidays = (holidaysRes.data.data.holidays as any[])
            .filter((h) => new Date(h.date).getFullYear() === 2026)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          // Use API holidays if available, otherwise use our list
          setUpcomingHolidays(apiHolidays.length > 0 ? apiHolidays : HOLIDAYS_2026);
        } else {
          setUpcomingHolidays(HOLIDAYS_2026);
        }
      } catch {
        // If API call fails, use our default list
        setUpcomingHolidays(HOLIDAYS_2026);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pieChartData = leaveBalances.map((lb) => ({
    name: lb.leaveType.name,
    value: lb.remainingLeaves,
    total: lb.totalLeaves,
  }));

  if (loading) {
    return <PageLoader />;
  }

  const today = new Date();
  const shift = user?.shift;
  const shiftTime = shift ? `${shift.startTime} - ${shift.endTime}` : '09:00 - 18:00';
  const totalLeaveRemaining = leaveBalances.reduce((sum, lb) => sum + lb.remainingLeaves, 0);
  const totalLeaveTotal = leaveBalances.reduce((sum, lb) => sum + lb.totalLeaves, 0);
  const totalLeaveUsed = totalLeaveTotal - totalLeaveRemaining;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.fullName?.split(' ')[0]}!</h1>
            <p className="text-primary-100 mt-1">
              {format(today, 'EEEE, MMMM d, yyyy')} · Shift: {shiftTime}
            </p>
          </div>
          <div className="flex gap-4 text-center">
            <div className="bg-white/15 rounded-lg px-4 py-2 min-w-[90px]">
              <p className="text-xs text-primary-100">Department</p>
              <p className="font-semibold text-sm mt-0.5 truncate max-w-[100px]">
                {(user as any)?.department?.name ?? 'N/A'}
              </p>
            </div>
            <div className="bg-white/15 rounded-lg px-4 py-2 min-w-[90px]">
              <p className="text-xs text-primary-100">Role</p>
              <p className="font-semibold text-sm mt-0.5">{user?.role ?? 'N/A'}</p>
            </div>
            <div className="bg-white/15 rounded-lg px-4 py-2 min-w-[90px]">
              <p className="text-xs text-primary-100">Leaves Left</p>
              <p className="font-semibold text-sm mt-0.5">{totalLeaveRemaining} / {totalLeaveTotal}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Shift Start</p>
            <p className="font-semibold text-gray-800">{shift?.startTime ?? '09:00'}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Shift End</p>
            <p className="font-semibold text-gray-800">{shift?.endTime ?? '18:00'}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Umbrella className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Leaves Used</p>
            <p className="font-semibold text-gray-800">{totalLeaveUsed} days</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div>
              <p className="text-xs text-gray-500">Holidays 2026</p>
              <p className="font-semibold text-gray-800">{upcomingHolidays.length} total</p>
          </div>
        </div>
      </div>

      {/* Attendance Timer + Leave Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceTimerCard
          shiftStartTime={shift?.startTime}
          shiftEndTime={shift?.endTime}
          onAttendanceChange={setTodayAttendance}
        />

        {/* Leave Balance Card */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {leaveBalances.length > 0 ? (
              <div className="space-y-4">
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={65}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieChartData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={LEAVE_COLORS[index % LEAVE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any, name: any) => [`${value} days`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {leaveBalances.map((lb, index) => {
                    const used = lb.totalLeaves - lb.remainingLeaves;
                    const pct = lb.totalLeaves > 0 ? Math.round((used / lb.totalLeaves) * 100) : 0;
                    return (
                      <div key={lb.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: LEAVE_COLORS[index % LEAVE_COLORS.length] }}
                            />
                            <span className="text-sm text-gray-700">{lb.leaveType.name}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {lb.remainingLeaves} left / {lb.totalLeaves} total
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: LEAVE_COLORS[index % LEAVE_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No leave balance available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Holidays 2026 + Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All 2026 Holidays */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Holidays 2026</CardTitle>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                {upcomingHolidays.length} total
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingHolidays.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {upcomingHolidays.map((holiday) => {
                  const holidayDate = new Date(holiday.date);
                  const daysLeft = Math.ceil((holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const isPast = daysLeft < 0;
                  const isToday = daysLeft === 0;
                  const isNational = (holiday.type ?? '').includes('National');
                  return (
                    <div
                      key={holiday.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isToday
                          ? 'bg-green-50 border-green-200'
                          : isPast
                          ? 'bg-gray-50 border-gray-100 opacity-60'
                          : 'bg-yellow-50 border-yellow-100'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center font-bold leading-tight shrink-0 ${
                        isToday ? 'bg-green-100 text-green-700' : isPast ? 'bg-gray-100 text-gray-400' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        <span className="text-xs uppercase">{format(holidayDate, 'MMM')}</span>
                        <span className="text-lg">{format(holidayDate, 'd')}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-medium truncate ${isPast ? 'text-gray-500' : 'text-gray-800'}`}>
                            {holiday.name ?? holiday.title}
                          </p>
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap ${
                            isNational 
                              ? 'bg-red-100 text-red-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {isNational ? '🇮🇳 National' : '🎉 Festival'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{format(holidayDate, 'EEEE, MMMM d, yyyy')}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap shrink-0 ${
                        isToday
                          ? 'bg-green-100 text-green-700'
                          : isPast
                          ? 'bg-gray-100 text-gray-400'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {isToday ? 'Today' : isPast ? 'Past' : `In ${daysLeft}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No holidays found for 2026</p>
                <p className="text-sm text-gray-400">Check back later</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Announcements</CardTitle>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {ANNOUNCEMENTS.length} new
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ANNOUNCEMENTS.map((ann) => {
                const style = announcementStyles[ann.type];
                return (
                  <div
                    key={ann.id}
                    className={`p-3 rounded-lg border-l-4 ${style.bg} ${style.border}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {style.icon}
                        <p className="font-medium text-gray-800 text-sm">{ann.title}</p>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap ${style.badge}`}>
                        {ann.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{ann.message}</p>
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <Megaphone className="w-3 h-3" />
                      {format(new Date(ann.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

