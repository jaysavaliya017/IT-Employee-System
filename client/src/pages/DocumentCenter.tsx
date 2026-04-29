import { useState, useEffect } from 'react';
import { documentApi } from '../api/services';
import { Document } from '../types';
import {
  FileText,
  Download,
  Search,
  Upload,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader,
  Folder,
  X,
} from 'lucide-react';

const DocumentCenter = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ documentType: '', search: '' });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    documentType: 'HR_DOCUMENT',
    visibilityType: 'COMPANY',
    file: null as File | null,
  });
  const [error, setError] = useState<{ docId?: string; message: string } | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [pagination.page, filters]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        documentType: filters.documentType || undefined,
        search: filters.search || undefined,
      });

      if (response.data.success) {
        setDocuments(response.data.data.documents);
        setPagination((prev) => ({ ...prev, ...response.data.data.pagination }));
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.title) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('documentType', uploadData.documentType);
      formData.append('visibilityType', uploadData.visibilityType);
      formData.append('file', uploadData.file);

      await documentApi.upload(formData);
      setShowUploadModal(false);
      setUploadData({ title: '', description: '', documentType: 'HR_DOCUMENT', visibilityType: 'COMPANY', file: null });
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      setError(null);
      const response = await documentApi.download(doc.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.fileName || doc.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const errorMsg = 
        error instanceof Error && error.message ? error.message :
        (error as any)?.response?.status === 404 ? 'File not found on server. It may have been deleted or moved.' :
        'Failed to download document. Please try again.';
      setError({ docId: doc.id, message: errorMsg });
      console.error('Error downloading document:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await documentApi.delete(id);
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const getDocumentTypeBadge = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      OFFER_LETTER: { label: 'Offer Letter', color: 'bg-green-100 text-green-700' },
      JOINING_LETTER: { label: 'Joining Letter', color: 'bg-blue-100 text-blue-700' },
      EXPERIENCE_LETTER: { label: 'Experience Letter', color: 'bg-purple-100 text-purple-700' },
      SALARY_SLIP: { label: 'Salary Slip', color: 'bg-yellow-100 text-yellow-700' },
      COMPANY_POLICY: { label: 'Policy', color: 'bg-indigo-100 text-indigo-700' },
      HR_DOCUMENT: { label: 'HR Document', color: 'bg-pink-100 text-pink-700' },
      OTHER: { label: 'Other', color: 'bg-gray-100 text-gray-700' },
    };
    const { label, color } = types[type] || types.OTHER;
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>{label}</span>;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Center</h1>
          <p className="text-gray-500 mt-1">Access company documents and policies</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload Document
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
                placeholder="Search documents..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <select
            value={filters.documentType}
            onChange={(e) => setFilters((prev) => ({ ...prev, documentType: e.target.value }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Types</option>
            <option value="OFFER_LETTER">Offer Letter</option>
            <option value="JOINING_LETTER">Joining Letter</option>
            <option value="EXPERIENCE_LETTER">Experience Letter</option>
            <option value="SALARY_SLIP">Salary Slip</option>
            <option value="COMPANY_POLICY">Company Policy</option>
            <option value="HR_DOCUMENT">HR Document</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
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

      {/* Documents Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader />
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Folder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-500">Documents you have access to will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <FileText className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                  <div className="mt-2">{getDocumentTypeBadge(doc.documentType)}</div>
                  {doc.description && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{doc.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleDownload(doc)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Upload Document</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Document title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Document description..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                <select
                  value={uploadData.documentType}
                  onChange={(e) => setUploadData((prev) => ({ ...prev, documentType: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="OFFER_LETTER">Offer Letter</option>
                  <option value="JOINING_LETTER">Joining Letter</option>
                  <option value="EXPERIENCE_LETTER">Experience Letter</option>
                  <option value="SALARY_SLIP">Salary Slip</option>
                  <option value="COMPANY_POLICY">Company Policy</option>
                  <option value="HR_DOCUMENT">HR Document</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                <select
                  value={uploadData.visibilityType}
                  onChange={(e) => setUploadData((prev) => ({ ...prev, visibilityType: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="ALL">All Employees</option>
                  <option value="COMPANY">Company Only</option>
                  <option value="DEPARTMENT">Department Only</option>
                  <option value="TEAM">Team Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setUploadData((prev) => ({ ...prev, file }));
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadData.file || !uploadData.title || uploading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                {uploading && <Loader className="w-4 h-4 animate-spin" />}
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentCenter;
