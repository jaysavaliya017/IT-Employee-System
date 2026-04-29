import { useState, useEffect } from 'react';
import { announcementApi } from '../api/services';
import { Announcement } from '../types';
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Bell,
  Pin,
  Search,
} from 'lucide-react';
import {Loader} from '../components/Loader';
import Modal from '../components/Modal';

const AnnouncementList = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ priority: '', search: '' });
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'MEDIUM',
    expiryDate: '',
    visibilityType: 'ALL',
  });

  useEffect(() => {
    fetchAnnouncements();
  }, [pagination.page, filters]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        priority: filters.priority || undefined,
        search: filters.search || undefined,
      });

      if (response.data.success) {
        setAnnouncements(response.data.data.announcements);
        setPagination((prev) => ({ ...prev, ...response.data.data.pagination }));
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingAnnouncement) {
        await announcementApi.update(editingAnnouncement.id, formData);
      } else {
        await announcementApi.create(formData);
      }
      setShowForm(false);
      setEditingAnnouncement(null);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority,
      expiryDate: announcement.expiryDate ? announcement.expiryDate.split('T')[0] : '',
      visibilityType: announcement.visibilityType,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await announcementApi.delete(id);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', message: '', priority: 'MEDIUM', expiryDate: '', visibilityType: 'ALL' });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Urgent</span>;
      case 'HIGH':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">High</span>;
      case 'MEDIUM':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Medium</span>;
      case 'LOW':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">Low</span>;
      default:
        return null;
    }
  };

  const isExpired = (date?: string) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 mt-1">View and manage company announcements</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Announcement
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
                placeholder="Search announcements..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <select
            value={filters.priority}
            onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader />
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements found</h3>
            <p className="text-gray-500">Create your first announcement</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`bg-white rounded-xl shadow-sm p-6 border border-gray-100 ${isExpired(announcement.expiryDate) ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {announcement.priority === 'URGENT' && <Pin className="w-4 h-4 text-red-500" />}
                    <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                    {getPriorityBadge(announcement.priority)}
                    {isExpired(announcement.expiryDate) && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500">Expired</span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-2">{announcement.message}</p>
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </span>
                    {announcement.expiryDate && (
                      <span>Expires: {new Date(announcement.expiryDate).toLocaleDateString()}</span>
                    )}
                    {announcement.creator && (
                      <span>By: {announcement.creator.fullName}</span>
                    )}
                    <span className="px-2 py-1 bg-gray-100 rounded">{(announcement.visibilityType).replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(announcement)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

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

      {/* Create/Edit Modal */}
      {showForm && (
        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Announcement title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Announcement message..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                <select
                  value={formData.visibilityType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, visibilityType: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="ALL">All Employees</option>
                  <option value="COMPANY">Company Only</option>
                  <option value="DEPARTMENT">Department Only</option>
                  <option value="TEAM">Team Only</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
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
              disabled={!formData.title || !formData.message}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {editingAnnouncement ? 'Update' : 'Create'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AnnouncementList;
