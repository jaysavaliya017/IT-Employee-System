import React, { useState, useEffect } from 'react';
import { leaveApi } from '../api/services';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { PageLoader } from '../components/Loader';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { Check, X, Clock } from 'lucide-react';
import { format } from 'date-fns';

const LeaveRequests: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('PENDING');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadLeaveRequests();
  }, [filter]);

  const loadLeaveRequests = async () => {
    setLoading(true);
    try {
      const params = filter !== 'ALL' ? { status: filter } : {};
      const response = await leaveApi.getAdminRequests(params);
      if (response.data.success) setLeaveRequests(response.data.data.leaveRequests);
    } catch (error) {
      console.error('Error loading leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await leaveApi.approve(id);
      loadLeaveRequests();
    } catch (error) {
      console.error('Error approving leave:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    try {
      await leaveApi.reject(selectedRequest.id, rejectionReason);
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      loadLeaveRequests();
    } catch (error) {
      console.error('Error rejecting leave:', error);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle>Leave Requests</CardTitle>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
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
                <div key={request.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{request.user?.fullName}</p>
                      <p className="text-sm text-gray-500">{request.user?.employeeCode} | {request.user?.department?.name}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm"><span className="text-gray-500">Leave Type:</span> {request.leaveType?.name}</p>
                        <p className="text-sm"><span className="text-gray-500">Duration:</span> {format(new Date(request.fromDate), 'MMM d')} - {format(new Date(request.toDate), 'MMM d, yyyy')} ({request.totalDays} days)</p>
                        {request.reason && <p className="text-sm"><span className="text-gray-500">Reason:</span> {request.reason}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={request.status} size="md" />
                      {request.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(request.id)} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200">
                            <Check className="w-5 h-5" />
                          </button>
                          <button onClick={() => { setSelectedRequest(request); setShowRejectModal(true); }} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Clock className="w-12 h-12 text-gray-300" />} title="No leave requests found" />
          )}
        </CardContent>
      </Card>

      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Leave Request" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Reason for Rejection</label>
            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
            <button onClick={handleReject} className="px-4 py-2 bg-red-600 text-white rounded-lg">Reject</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LeaveRequests;
