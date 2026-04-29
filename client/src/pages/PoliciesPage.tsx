import { useState, useEffect } from 'react';
import { policyApi } from '../api/services';
import { Policy } from '../types';
import {
  FileText,
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Loader,
  BookOpen,
  Download,
} from 'lucide-react';
import Modal from '../components/Modal';

const PoliciesPage = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ policyType: '', search: '' });
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [error, setError] = useState<{ policyId?: string; message: string } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    policyType: 'HR_POLICY',
    version: '1.0',
    file: null as File | null,
  });

  useEffect(() => {
    fetchPolicies();
  }, [pagination.page, filters]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await policyApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        policyType: filters.policyType || undefined,
        search: filters.search || undefined,
      });

      if (response.data.success) {
        setPolicies(response.data.data.policies);
        setPagination((prev) => ({ ...prev, ...response.data.data.pagination }));
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingPolicy) {
        // For updates, if there's a file, use FormData
        if (formData.file) {
          const updateFormData = new FormData();
          updateFormData.append('title', formData.title);
          updateFormData.append('content', formData.content);
          updateFormData.append('policyType', formData.policyType);
          updateFormData.append('version', formData.version);
          updateFormData.append('file', formData.file);
          await policyApi.update(editingPolicy.id, updateFormData);
        } else {
          await policyApi.update(editingPolicy.id, {
            title: formData.title,
            content: formData.content,
            policyType: formData.policyType,
            version: formData.version,
          });
        }
      } else {
        // For creates, always use FormData
        await policyApi.create(formData);
      }
      setShowForm(false);
      setEditingPolicy(null);
      resetForm();
      fetchPolicies();
    } catch (error) {
      console.error('Error saving policy:', error);
    }
  };

  const handleEdit = (policy: Policy) => {
    setEditingPolicy(policy);
    setFormData({
      title: policy.title,
      content: policy.content,
      policyType: policy.policyType,
      version: policy.version,
      file: null,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;
    try {
      await policyApi.delete(id);
      fetchPolicies();
    } catch (error) {
      console.error('Error deleting policy:', error);
    }
  };

  const handlePreview = (policy: Policy) => {
    setSelectedPolicy(policy);
    setShowPreview(true);
  };

  const handleDownload = async (policy: Policy) => {
    try {
      setError(null);
      const response = await policyApi.download(policy.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `${policy.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${policy.version}.pdf`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const errorMsg = 
        error instanceof Error && error.message ? error.message :
        (error as any)?.response?.status === 404 ? 'No document attached to this policy or file not found on server.' :
        'Failed to download policy. Please try again.';
      setError({ policyId: policy.id, message: errorMsg });
      console.error('Error downloading policy:', error);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', policyType: 'HR_POLICY', version: '1.0', file: null });
  };

  const getPolicyTypeBadge = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      LEAVE_POLICY: { label: 'Leave Policy', color: 'bg-blue-100 text-blue-700' },
      SALARY_POLICY: { label: 'Salary Policy', color: 'bg-green-100 text-green-700' },
      ATTENDANCE_POLICY: { label: 'Attendance Policy', color: 'bg-purple-100 text-purple-700' },
      WORK_FROM_HOME_POLICY: { label: 'WFH Policy', color: 'bg-orange-100 text-orange-700' },
      HR_POLICY: { label: 'HR Policy', color: 'bg-pink-100 text-pink-700' },
      CODE_OF_CONDUCT: { label: 'Code of Conduct', color: 'bg-indigo-100 text-indigo-700' },
      OTHER: { label: 'Other', color: 'bg-gray-100 text-gray-700' },
    };
    const { label, color } = types[type] || types.OTHER;
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>{label}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Policies</h1>
          <p className="text-gray-500 mt-1">View and manage company policies and documents</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Policy
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search policies..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <select
            value={filters.policyType}
            onChange={(e) => setFilters((prev) => ({ ...prev, policyType: e.target.value }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Types</option>
            <option value="LEAVE_POLICY">Leave Policy</option>
            <option value="SALARY_POLICY">Salary Policy</option>
            <option value="ATTENDANCE_POLICY">Attendance Policy</option>
            <option value="WORK_FROM_HOME_POLICY">WFH Policy</option>
            <option value="HR_POLICY">HR Policy</option>
            <option value="CODE_OF_CONDUCT">Code of Conduct</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Policies List */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <h3 className="font-medium text-red-900 mb-1">Download Error</h3>
              <p className="text-sm text-red-700">{error.message}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 self-start"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Policies List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader />
        </div>
      ) : policies.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No policies found</h3>
          <p className="text-gray-500">Add your first company policy</p>
        </div>
      ) : (
        <div className="space-y-4">
          {policies.map((policy) => (
            <div key={policy.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <FileText className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{policy.title}</h3>
                      {getPolicyTypeBadge(policy.policyType)}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {policy.content.substring(0, 200)}...
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span>Version {policy.version}</span>
                      {policy.effectiveDate && (
                        <span>Effective: {new Date(policy.effectiveDate).toLocaleDateString()}</span>
                      )}
                      <span>Updated: {new Date(policy.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handlePreview(policy)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(policy)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(policy)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(policy.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-sm font-medium">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedPolicy && (
        <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title={selectedPolicy.title}>
          <div className="prose max-w-none">
            <div className="mb-4 flex items-center gap-3">
              {getPolicyTypeBadge(selectedPolicy.policyType)}
              <span className="text-sm text-gray-500">Version {selectedPolicy.version}</span>
            </div>
            <div className="whitespace-pre-wrap text-gray-700">{selectedPolicy.content}</div>
          </div>
        </Modal>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingPolicy ? 'Edit Policy' : 'New Policy'}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Policy title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Policy Type</label>
              <select
                value={formData.policyType}
                onChange={(e) => setFormData((prev) => ({ ...prev, policyType: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="LEAVE_POLICY">Leave Policy</option>
                <option value="SALARY_POLICY">Salary Policy</option>
                <option value="ATTENDANCE_POLICY">Attendance Policy</option>
                <option value="WORK_FROM_HOME_POLICY">WFH Policy</option>
                <option value="HR_POLICY">HR Policy</option>
                <option value="CODE_OF_CONDUCT">Code of Conduct</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData((prev) => ({ ...prev, version: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="1.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Policy content..."
                rows={10}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Policy Document (Optional)</label>
              <input
                type="file"
                onChange={(e) => setFormData((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                accept=".pdf,.doc,.docx,.xlsx,.xls"
              />
              {formData.file && (
                <p className="text-sm text-gray-500 mt-1">Selected: {formData.file.name}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.title || !formData.content}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {editingPolicy ? 'Update' : 'Create'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PoliciesPage;
