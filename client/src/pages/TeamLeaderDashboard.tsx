import React, { useState, useEffect } from 'react';
import { teamLeaderApi } from '../api/services';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { PageLoader } from '../components/Loader';
import { StatusBadge } from '../components/StatusBadge';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


const TeamLeaderDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await teamLeaderApi.getDashboard();
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
      label: 'Total Team Members',
      value: dashboardData?.totalMembers || 0,
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
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-600',
    },
  ];

  const chartData = [
    { name: 'Present', count: dashboardData?.presentToday || 0 },
    { name: 'Absent', count: dashboardData?.absentToday || 0 },
    { name: 'On Leave', count: dashboardData?.onLeaveToday || 0 },
  ];

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
        {/* Team Attendance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Team Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pending Leave Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData?.pendingLeaves?.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.pendingLeaves.map((leave: any) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{leave.user?.fullName}</p>
                      <p className="text-sm text-gray-500">
                        {leave.leaveType?.name} | {leave.totalDays} day(s)
                      </p>
                    </div>
                    <StatusBadge status={leave.status} />
                  </div>
                ))}
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

      {/* Team Members Quick View */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Employee</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Designation</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Department</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData?.teamMembers?.map((member: any) => (
                  <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800">{member.fullName}</p>
                      <p className="text-xs text-gray-500">{member.employeeCode}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{member.designation || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{member.department?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamLeaderDashboard;
