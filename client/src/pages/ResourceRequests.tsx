import React, { useState, useEffect } from 'react';
import { resourceRequestApi } from '../api/services';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { PageLoader } from '../components/Loader';
import { EmptyState } from '../components/EmptyState';
import { toast } from '../components/Toast';
import {
  Package,
  Send,
  BookOpen,
  PenTool,
  Mouse,
  Keyboard,
  Headphones,
  Laptop,
  HelpCircle,
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

const ResourceRequests: React.FC = () => {
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    requestType: '',
    description: '',
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await resourceRequestApi.getMyRequests();
      if (response.data.success) {
        setMyRequests(response.data.data.resourceRequests);
      }
    } catch (error) {
      console.error('Error loading resource requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.requestType) {
      toast.addToast('error', 'Please select a request type');
      return;
    }

    setSubmitting(true);
    try {
      const response = await resourceRequestApi.create({
        requestType: formData.requestType as any,
        description: formData.description,
      });
      if (response.data.success) {
        toast.addToast('success', 'Resource request submitted successfully');
        setFormData({ requestType: '', description: '' });
        setShowForm(false);
        loadRequests();
      }
    } catch (error: any) {
      toast.addToast('error', error.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const getRequestTypeInfo = (type: string) => {
    return REQUEST_TYPES.find((t) => t.value === type) || REQUEST_TYPES[6];
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Resource Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Request items like books, pens, mouse, keyboard, etc.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Send className="w-4 h-4" />
          {showForm ? 'Cancel' : 'New Request'}
        </button>
      </div>

      {/* New Request Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Resource Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Request Type</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {REQUEST_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, requestType: type.value })}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                          formData.requestType === type.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`p-2.5 rounded-lg ${type.color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Add any additional details about your request..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !formData.requestType}
                className="flex items-center justify-center gap-2 bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:bg-primary-300"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Request
                  </>
                )}
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* My Requests */}
      <Card>
        <CardHeader>
          <CardTitle>My Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {myRequests.length > 0 ? (
            <div className="space-y-3">
              {myRequests.map((request) => {
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
                        <p className="font-semibold text-gray-800">{typeInfo.label}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </div>
                      {request.description && (
                        <p className="text-sm text-gray-500 mt-1">{request.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Submitted {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    {request.status === 'APPROVED' && request.approvedAt && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Approved by</p>
                        <p className="text-sm font-medium text-gray-700">{request.approver?.fullName || 'Admin'}</p>
                      </div>
                    )}
                    {request.status === 'REJECTED' && request.rejectionReason && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Reason</p>
                        <p className="text-sm font-medium text-red-600">{request.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Package className="w-12 h-12 text-gray-300" />}
              title="No resource requests"
              description="You haven't submitted any resource requests yet"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResourceRequests;