import React, { useState, useEffect } from 'react';
import { teamLeaderApi } from '../api/services';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { PageLoader } from '../components/Loader';
import { StatusBadge } from '../components/StatusBadge';
import AttendanceDuration from '../components/AttendanceDuration';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

const TeamAttendance: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendances, setAttendances] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  useEffect(() => {
    loadData();
  }, [month, year, selectedEmployee]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [attRes, memberRes] = await Promise.all([
        teamLeaderApi.getTeamAttendanceMonthly({ month, year, userId: selectedEmployee || undefined }),
        teamLeaderApi.getTeamMembers(),
      ]);
      if (attRes.data.success) setAttendances(attRes.data.data.attendances);
      if (memberRes.data.success) setTeamMembers(memberRes.data.data.teamMembers);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
              <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">All Team Members</option>
              {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.fullName}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {attendances.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Employee</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Punch In</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Punch Out</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Hours</th>
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
                      <td className="py-3 px-4 text-sm">{format(new Date(att.date), 'MMM d, yyyy')}</td>
                      <td className="py-3 px-4 text-sm">{att.punchInTime ? format(new Date(att.punchInTime), 'hh:mm a') : '-'}</td>
                      <td className="py-3 px-4 text-sm">{att.punchOutTime ? format(new Date(att.punchOutTime), 'hh:mm a') : '-'}</td>
                      <td className="py-3 px-4 text-sm"><AttendanceDuration attendance={att} /></td>
                      <td className="py-3 px-4"><StatusBadge status={att.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No attendance records found" />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamAttendance;
