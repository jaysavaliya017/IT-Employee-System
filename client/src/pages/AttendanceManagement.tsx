import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../api/services';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { PageLoader } from '../components/Loader';
import { StatusBadge } from '../components/StatusBadge';
import AttendanceDuration from '../components/AttendanceDuration';
import { EmptyState } from '../components/EmptyState';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

const AttendanceManagement: React.FC = () => {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<string>('');


  useEffect(() => {
    loadAttendance();
  }, [date, status]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const params: any = { date };
      if (status) params.status = status;
      const response = await attendanceApi.getAllAttendance(params);
      if (response.data.success) setAttendances(response.data.data.attendances);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Attendance Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">All Status</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="LATE">Late</option>
            </select>
          </div>

          {attendances.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Employee</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Department</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Punch In</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Punch Out</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Total Hours</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((att) => (
                    <tr key={att.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-800">{att.user?.fullName}</p>
                        <p className="text-xs text-gray-500">{att.user?.employeeCode}</p>
                      </td>
                      <td className="py-3 px-4 text-sm">{att.user?.department?.name || '-'}</td>
                      <td className="py-3 px-4 text-sm">{att.punchInTime ? format(new Date(att.punchInTime), 'hh:mm a') : '-'}</td>
                      <td className="py-3 px-4 text-sm">{att.punchOutTime ? format(new Date(att.punchOutTime), 'hh:mm a') : '-'}</td>
                      <td className="py-3 px-4 text-sm"><AttendanceDuration attendance={att} /></td>
                      <td className="py-3 px-4">
                        <StatusBadge status={att.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No attendance records found" description="Try selecting a different date or filter" />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceManagement;
