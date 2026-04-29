import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../api/services';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { PageLoader } from '../components/Loader';
import { StatusBadge } from '../components/StatusBadge';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';


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
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  const stats = [
    {
      label: 'Total Employees',
      value: dashboardData?.totalEmployees || 0,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Present Today',
      value: dashboardData?.presentToday || 0,
      icon: UserCheck,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Absent Today',
      value: dashboardData?.absentToday || 0,
      icon: UserX,
      color: 'bg-red-100 text-red-600',
    },
    {
      label: 'On Leave Today',
      value: dashboardData?.onLeaveToday || 0,
      icon: Clock,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Late Arrivals',
      value: dashboardData?.lateArrivals || 0,
      icon: AlertCircle,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      label: 'Pending Leave Requests',
      value: dashboardData?.pendingLeaveRequests || 0,
      icon: FileText,
      color: 'bg-yellow-100 text-yellow-600',
    },
  ];

  const pieChartData = [
    { name: 'Present', value: dashboardData?.presentToday || 0 },
    { name: 'Absent', value: dashboardData?.absentToday || 0 },
    { name: 'On Leave', value: dashboardData?.onLeaveToday || 0 },
  ];

  const COLORS = ['#10b981', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Overview Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Department-wise Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.departments?.map((dept: any) => (
                <div key={dept.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                    {dept.employeeCount}
                  </span>
                </div>
              ))}
              {(!dashboardData?.departments || dashboardData.departments.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <p>No department data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Leave Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData?.pendingLeaves?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Employee</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Department</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Leave Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Duration</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.pendingLeaves.map((leave: any) => (
                    <tr key={leave.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-800">{leave.user?.fullName}</p>
                        <p className="text-xs text-gray-500">{leave.user?.employeeCode}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {leave.user?.department?.name || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{leave.leaveType?.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{leave.totalDays} day(s)</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={leave.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No pending leave requests</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
