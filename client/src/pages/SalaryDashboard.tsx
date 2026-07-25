import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { salaryApi } from '../api/services';
import { SalaryRecord, SalaryStructure } from '../types';
import {
  DollarSign,
  Download,
  TrendingUp,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Loader } from '../components/Loader';

const SalaryDashboard = () => {
  const { user } = useAuth();
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [salaryStructure, setSalaryStructure] = useState<SalaryStructure | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalaryData();
  }, []);

  const fetchSalaryData = async () => {
    try {
      setLoading(true);
      const [salaryRes, structRes] = await Promise.all([
        salaryApi.getMySalary({ limit: 12 }),
        user?.id ? salaryApi.getStructure(user.id) : Promise.resolve({ data: { success: false } }),
      ]);

      if (salaryRes.data.success) {
        setSalaryRecords(salaryRes.data.data.records);
      }
      if (structRes.data.success) {
        setSalaryStructure(structRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching salary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadSlip = async (recordId: string) => {
    try {
      const response = await salaryApi.downloadSlip(recordId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Salary_Slip_${recordId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading salary slip:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CREDITED':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Credited</span>;
      case 'PROCESSED':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 flex items-center gap-1"><Clock className="w-3 h-3" /> Processed</span>;
      case 'PENDING':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Pending</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const latestRecord = salaryRecords[0];
  const totalEarnings = latestRecord
    ? latestRecord.basicSalary + latestRecord.hra + latestRecord.conveyanceAllowance +
      latestRecord.medicalAllowance + latestRecord.specialAllowance + latestRecord.otherAllowances
    : 0;

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Salary Dashboard</h1>
          <p className="text-slate-500 mt-1">View your salary slips and payment history</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Net Salary</p>
              <p className="text-xl font-bold text-slate-900">
                {latestRecord ? formatCurrency(latestRecord.netSalary) : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Earnings</p>
              <p className="text-xl font-bold text-slate-900">
                {latestRecord ? formatCurrency(totalEarnings) : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Deductions</p>
              <p className="text-xl font-bold text-slate-900">
                {latestRecord ? formatCurrency(latestRecord.totalDeductions) : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Slips Available</p>
              <p className="text-xl font-bold text-slate-900">{salaryRecords.length}</p>
            </div>
          </div>
        </div>
      </div>

      {salaryStructure && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Salary Structure</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-500">Basic Salary</p>
              <p className="font-medium">{formatCurrency(Number(salaryStructure.basicSalary))}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">HRA</p>
              <p className="font-medium">{formatCurrency(Number(salaryStructure.hra))}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">PF Deduction</p>
              <p className="font-medium">{formatCurrency(Number(salaryStructure.pfDeduction))}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Tax Deduction</p>
              <p className="font-medium">{formatCurrency(Number(salaryStructure.taxDeduction))}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Salary History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Working Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Gross</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Deductions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Net Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {salaryRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No salary records found</p>
                  </td>
                </tr>
              ) : (
                salaryRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{getMonthName(record.month)} {record.year}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {record.workingDays} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-medium">
                      {formatCurrency(record.totalEarnings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-600">
                      -{formatCurrency(record.totalDeductions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-bold">
                      {formatCurrency(record.netSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => downloadSlip(record.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Slip
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalaryDashboard;
