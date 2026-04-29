import React, { useState, useEffect } from 'react';
import { leaveApi } from '../api/services';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { PageLoader } from '../components/Loader';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const LeaveBalance: React.FC = () => {
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaveBalances();
  }, []);

  const loadLeaveBalances = async () => {
    try {
      const response = await leaveApi.getBalance();
      if (response.data.success) {
        setLeaveBalances(response.data.data.leaveBalances);
      }
    } catch (error) {
      console.error('Error loading leave balances:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const chartData = leaveBalances.map((lb) => ({
    name: lb.leaveType.name,
    used: lb.usedLeaves,
    remaining: lb.remainingLeaves,
    total: lb.totalLeaves,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {leaveBalances.map((lb, index) => (
          <Card key={lb.id}>
            <CardContent>
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: COLORS[index % COLORS.length] + '20' }}
                >
                  <span className="text-2xl font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                    {lb.remainingLeaves}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{lb.leaveType.name}</h3>
                  <p className="text-sm text-gray-500">
                    {lb.usedLeaves} used of {lb.totalLeaves} days
                  </p>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(lb.remainingLeaves / lb.totalLeaves) * 100}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Balance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="remaining"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveBalance;
