import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../api/services';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { PageHeader, StatCard, EmptyState } from '../components/PageKit';
import { PageLoader } from '../components/Loader';
import { StatusBadge } from '../components/StatusBadge';
import { notifyApiError } from '../utils/apiError';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertCircle,
  FileText,
  LayoutDashboard,
} from 'lucide-react';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await dashboardApi.getAdmin();
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      notifyApiError(error, 'Could not load the dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  const stats = [
    { label: 'Total Employees', value: dashboardData?.totalEmployees || 0, icon: Users, tone: 'primary' as const },
    { label: 'Present Today', value: dashboardData?.presentToday || 0, icon: UserCheck, tone: 'emerald' as const },
    { label: 'Absent Today', value: dashboardData?.absentToday || 0, icon: UserX, tone: 'red' as const },
    { label: 'On Leave Today', value: dashboardData?.onLeaveToday || 0, icon: Clock, tone: 'violet' as const },
    { label: 'Late Arrivals', value: dashboardData?.lateArrivals || 0, icon: AlertCircle, tone: 'amber' as const },
    { label: 'Pending Requests', value: dashboardData?.pendingLeaveRequests || 0, icon: FileText, tone: 'sky' as const },
  ];

  const pieChartData = [
    { name: 'Present', value: dashboardData?.presentToday || 0 },
    { name: 'Absent', value: dashboardData?.absentToday || 0 },
    { name: 'On Leave', value: dashboardData?.onLeaveToday || 0 },
  ];
  const COLORS = ['#10b981', '#ef4444', '#8b5cf6'];
  const totalToday = pieChartData.reduce((sum, d) => sum + d.value, 0);

  const maxDept = Math.max(1, ...(dashboardData?.departments?.map((d: any) => d.employeeCount) || [1]));

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle={today} icon={LayoutDashboard} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} tone={stat.tone} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
            <span className="text-xs font-medium text-slate-400">{totalToday} tracked</span>
          </CardHeader>
          <CardContent>
            {totalToday > 0 ? (
              <div className="flex items-center gap-6">
                <div className="relative h-52 w-52 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={92}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieChartData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-slate-900">{totalToday}</span>
                    <span className="text-xs text-slate-400">employees</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  {pieChartData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} />
                        <span className="text-sm text-slate-600">{d.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 tabular-nums">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState icon={UserCheck} title="No attendance yet" description="Attendance for today will appear here as employees punch in." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employees by Department</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData?.departments?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.departments.map((dept: any) => (
                  <div key={dept.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700">{dept.name}</span>
                      <span className="text-sm font-semibold text-slate-900 tabular-nums">{dept.employeeCount}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary-500 transition-all duration-500"
                        style={{ width: `${(dept.employeeCount / maxDept) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} title="No department data" description="Add departments and assign employees to see the breakdown." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Leave Requests</CardTitle>
          {dashboardData?.pendingLeaves?.length > 0 && (
            <span className="badge bg-amber-50 text-amber-700 ring-1 ring-amber-600/10">
              {dashboardData.pendingLeaves.length} pending
            </span>
          )}
        </CardHeader>
        <CardContent>
          {dashboardData?.pendingLeaves?.length > 0 ? (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2.5 px-6 text-xs font-semibold uppercase tracking-wide text-slate-400">Employee</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Department</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Leave Type</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Duration</th>
                    <th className="text-left py-2.5 px-6 text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboardData.pendingLeaves.map((leave: any) => (
                    <tr key={leave.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
                            {(leave.user?.fullName || 'U').charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{leave.user?.fullName}</p>
                            <p className="text-xs text-slate-400">{leave.user?.employeeCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{leave.user?.department?.name || '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{leave.leaveType?.name}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{leave.totalDays} day(s)</td>
                      <td className="py-3 px-6"><StatusBadge status={leave.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Clock} title="All caught up" description="There are no pending leave requests right now." />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
