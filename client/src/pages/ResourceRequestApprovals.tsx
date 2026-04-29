import React, { useState, useEffect } from 'react';
import { resourceRequestApi } from '../api/services';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { PageLoader } from '../components/Loader';
import { EmptyState } from '../components/EmptyState';
import { toast } from '../components/Toast';
import {
  Package,
  CheckCircle,
  XCircle,
  BookOpen,
  PenTool,
  Mouse,
  Keyboard,
  Headphones,
  Laptop,
  HelpCircle,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';

const REQUEST_TYPES = [
  { value: 'BOOKS', label: 'Books', icon: BookOpen, color: 'bg-blue-100 text-blue-600' },
  { value: 'PENS', label: 'Pens', icon: PenTool, color: 'bg-green-100 text-green-600' },
  { value: 'MOUSE', label: 'Mouse', icon: Mouse, color: 'bg-purple-100 text-purple-600' },
  { value: 'KEYBOARD', label: 'Keyboard', icon: Keyboard, color: 'bg-orange-100 text-orange-600' },
  { value: 'HEADSET', label: 'Headset', icon: Headphones, color: 'bg-pink-100 text-pink-600' },
  { value: 'LAPTOP', label: 'Laptop', icon: Laptop, color: 'bg-red-100 text-red-600' },
  { value: 'OTHER', label: 'Other', icon: HelpCircle, color: 'bg-gray-100 text-gray-600' },
];

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending' },
  APPROVED: { bg: 'bg-green-50', text: 'text-green-700', label: 'Approved' },
  REJECTED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected' },
};

const ResourceRequestApprovals: React.FC = () => {

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ show: boolean; requestId: string | null; reason: string }>({
    show: false,
    requestId: null,
    reason: '',
  });

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    try {
      const response = await resourceRequestApi.getAllRequests({ status: filter });
      if (response.data.success) {
        setRequests(response.data.data.resourceRequests);
      }
    } catch (error) {
      console.error('Error loading resource requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await resourceRequestApi.approve(id);
      if (response.data.success) {
        toast.addToast('success', 'Request approved successfully');
        loadRequests();
      }
    } catch (error: any) {
      toast.addToast('error', error.response?.data?.message || 'Failed to approve request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.requestId || !rejectModal.reason.trim()) {
      toast.addToast('error', 'Please provide a rejection reason');
      return;
    }

    setActionLoading(rejectModal.requestId);
    try {
      const response = await resourceRequestApi.reject(rejectModal.requestId, rejectModal.reason);
      if (response.data.success) {
        toast.addToast('success', 'Request rejected successfully');
        setRejectModal({ show: false, requestId: null, reason: '' });
        loadRequests();
      }
    } catch (error: any) {
      toast.addToast('error', error.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  const getRequestTypeInfo = (type: string) => {
    return REQUEST_TYPES.find((t) => t.value === type) || REQUEST_TYPES[6];
  };

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const processedRequests = requests.filter((r) => r.status !== 'PENDING');

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Resource Request Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage resource requests from your team</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="ALL">All Requests</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Pending Requests */}
      {filter === 'ALL' || filter === 'PENDING' ? (
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals ({pendingRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRequests.length > 0 ? (
              <div className="space-y-4">
                {pendingRequests.map((request) => {
                  const typeInfo = getRequestTypeInfo(request.requestType);
                  const Icon = typeInfo.icon;
                  return (
                    <div
                      key={request.id}
                      className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100"
                    >
                      <div className={`p-3 rounded-lg ${typeInfo.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800">{typeInfo.label}</p>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            Pending
                          </span>
                        </div>
                        {request.description && (
                          <p className="text-sm text-gray-500 mt-1">{request.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <p className="text-xs text-gray-500">
                            Requested by: <span className="font-medium">{request.user?.fullName}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Dept: <span className="font-medium">{request.user?.department?.name || 'N/A'}</span>
                          </p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={actionLoading === request.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-60"
                        >
                          {actionLoading === request.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setRejectModal({ show: true, requestId: request.id, reason: '' })}
                          disabled={actionLoading === request.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-60"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<Package className="w-12 h-12 text-gray-300" />}
                title="No pending requests"
                description="All resource requests have been processed"
              />
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Processed Requests */}
      {(filter === 'ALL' || filter !== 'PENDING') && processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processed Requests ({processedRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processedRequests.map((request) => {
                const typeInfo = getRequestTypeInfo(request.requestType);
                const Icon = typeInfo.icon;
                const status = statusStyles[request.status] || statusStyles.PENDING;
                return (
                  <div
                    key={request.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className={`p-3 rounded-lg ${typeInfo.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-700">{typeInfo.label}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </div>
                      {request.description && (
                        <p className="text-sm text-gray-500 mt-1">{request.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-xs text-gray-500">
                          {request.user?.fullName} · {request.user?.department?.name || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(request.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    {request.status === 'APPROVED' && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Approved by</p>
                        <p className="text-sm font-medium text-green-600">{request.approver?.fullName || 'Admin'}</p>
                        <p className="text-xs text-gray-400">{format(new Date(request.approvedAt), 'MMM d, yyyy')}</p>
                      </div>
                    )}
                    {request.status === 'REJECTED' && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Rejected by</p>
                        <p className="text-sm font-medium text-red-600">{request.rejecter?.fullName || 'Admin'}</p>
                        {request.rejectionReason && (
                          <p className="text-xs text-gray-500 mt-1">Reason: {request.rejectionReason}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reject Modal */}
      {rejectModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Reject Resource Request</h3>
            <p className="text-sm text-gray-500 mb-4">Please provide a reason for rejecting this request.</p>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="Rejection reason..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none mb-4"
            />
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setRejectModal({ show: false, requestId: null, reason: '' })}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceRequestApprovals;