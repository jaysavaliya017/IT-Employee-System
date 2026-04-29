import { useState, useEffect } from 'react';
import { salarySlipApi } from '../api/services';
import { SalarySlip } from '../types';
import {
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
} from 'lucide-react';
import { Loader } from '../components/Loader';

const EmployeeSalarySlips = () => {
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    month: '',
    year: new Date().getFullYear(),
  });
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchMySlips();
  }, [pagination.page, filters]);

  const fetchMySlips = async () => {
    try {
      setLoading(true);
      const response = await salarySlipApi.getMySalarySlips({
        page: pagination.page,
        limit: pagination.limit,
        month: filters.month ? parseInt(filters.month) : undefined,
        year: filters.year,
      });

      if (response.data.success) {
        setSlips(response.data.data.slips || []);
        setPagination((prev) => ({ ...prev, ...response.data.data.pagination }));
      }
    } catch (error) {
      console.error('Error fetching salary slips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (slipId: string) => {
    try {
      setDownloadLoading(slipId);
      const response = await salarySlipApi.downloadSalarySlip(slipId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salary-slip-${slipId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading salary slip:', error);
    } finally {
      setDownloadLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'GENERATED':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 flex items-center gap-1"><Clock className="w-3 h-3" /> Generated</span>;
      case 'PAID':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Paid</span>;
      case 'NOT_GENERATED':
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Not Generated</span>;
    }
  };

  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'number' ? amount : parseFloat(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(num || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Salary Slips</h1>
          <p className="text-gray-500 mt-1">View and download your salary slips</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={filters.month}
              onChange={(e) => handleFilterChange('month', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <option key={new Date().getFullYear() - 2 + i} value={new Date().getFullYear() - 2 + i}>
                  {new Date().getFullYear() - 2 + i}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Salary Slips Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader />
        </div>
      ) : slips.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Salary Slips Found</h3>
          <p className="text-gray-500">
            {filters.month || filters.year
              ? 'Try adjusting your filters to see more results.'
              : 'Your salary slips will appear here once they are generated by the HR team.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slips.map((slip) => (
              <div key={slip.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getMonthName(slip.month)} {slip.year}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Generated: {formatDate(slip.generatedAt || slip.createdAt)}
                    </p>
                  </div>
                  {getStatusBadge(slip.status)}
                </div>

                {/* Salary Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Salary Amount</span>
                    <span className="font-medium text-gray-900">{formatCurrency(slip.salaryAmount)}</span>
                  </div>
                  {Number(slip.bonus) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Bonus</span>
                      <span className="font-medium text-green-600">+{formatCurrency(slip.bonus)}</span>
                    </div>
                  )}
                  {Number(slip.deduction) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Deduction</span>
                      <span className="font-medium text-red-600">-{formatCurrency(slip.deduction)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Net Salary</span>
                    <span className="text-xl font-bold text-primary-600">{formatCurrency(slip.netSalary)}</span>
                  </div>
                </div>

                {/* Payment Info */}
                {slip.status === 'PAID' && slip.paidAt && (
                  <div className="bg-green-50 rounded-lg p-3 mb-4">
                    <div className="text-sm text-green-700">
                      <span className="font-medium">Paid on:</span> {formatDate(slip.paidAt)}
                    </div>
                  </div>
                )}

                {/* Download Button */}
                {(slip.status === 'GENERATED' || slip.status === 'PAID') && (
                  <button
                    onClick={() => handleDownload(slip.id)}
                    disabled={downloadLoading === slip.id}
                    className="w-full px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    {downloadLoading === slip.id ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download Salary Slip
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 text-sm font-medium">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeeSalarySlips;
