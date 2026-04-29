import React, { useState, useEffect } from 'react';
import { leaveApi } from '../api/services';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { PageLoader } from '../components/Loader';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';

const LeaveHistory: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    loadLeaveRequests();
  }, [filter]);

  const loadLeaveRequests = async () => {
    setLoading(true);
    try {
      const params = filter !== 'ALL' ? { status: filter } : {};
      const response = await leaveApi.getMyRequests(params);
      if (response.data.success) {
        setLeaveRequests(response.data.data.leaveRequests);
      }
    } catch (error) {
      console.error('Error loading leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle>Leave History</CardTitle>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {leaveRequests.length > 0 ? (
            <div className="space-y-4">
              {leaveRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{request.leaveType?.name}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(request.fromDate), 'MMM d')} -{' '}
                        {format(new Date(request.toDate), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-500">{request.totalDays} day(s)</p>
                    </div>
                  </div>
                  <StatusBadge status={request.status} size="md" />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Clock className="w-12 h-12 text-gray-300" />}
              title="No leave requests found"
              description="You haven't applied for any leave yet"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveHistory;
