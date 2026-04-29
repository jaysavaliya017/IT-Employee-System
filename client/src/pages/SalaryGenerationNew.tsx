import { useState, useEffect } from 'react';
import { salarySlipApi, departmentApi } from '../api/services';
import { SalarySlipEmployeeRow, Department, BulkSalaryResult } from '../types';
import {
  Play,
  Download,
  Search,
  CheckCircle,
  Clock,
  Loader,
  AlertCircle,
  FileText,
  Users,
} from 'lucide-react';
import Modal from '../components/Modal';

const SalaryGeneration = () => {
  const [employees, setEmployees] = useState<SalarySlipEmployeeRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showResultModal, setShowResultModal] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkSalaryResult | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [employeeInputs, setEmployeeInputs] = useState<Record<string, {
    salaryAmount: string;
    bonus: string;
    deduction: string;
  }>>({});

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [month, year]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentApi.getAll();
      if (response.data.success) {
        setDepartments(response.data.data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      setInitialLoading(true);
      const response = await salarySlipApi.getEmployeesForSalaryGeneration(month, year);
      if (response.data.success) {
        setEmployees(response.data.data || []);
        // Initialize inputs for each employee
        const inputs: Record<string, { salaryAmount: string; bonus: string; deduction: string }> = {};
        response.data.data.forEach((emp: SalarySlipEmployeeRow) => {
          inputs[emp.id] = {
            salaryAmount: emp.salaryAmount > 0 ? emp.salaryAmount.toString() : '',
            bonus: emp.bonus > 0 ? emp.bonus.toString() : '',
            deduction: emp.deduction > 0 ? emp.deduction.toString() : '',
          };
        });
        setEmployeeInputs(inputs);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const calculateNetSalary = (salaryAmount: number, bonus: number, deduction: number): number => {
    return salaryAmount + bonus - deduction;
  };

  const handleInputChange = (employeeId: string, field: 'salaryAmount' | 'bonus' | 'deduction', value: string) => {
    setEmployeeInputs(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value,
      },
    }));
  };

  const handleGenerateSingle = async (employeeId: string) => {
    const input = employeeInputs[employeeId];
    if (!input || !input.salaryAmount || parseFloat(input.salaryAmount) <= 0) {
      setToastMessage({ type: 'error', message: 'Please enter a valid salary amount' });
      return;
    }

    const salaryAmount = parseFloat(input.salaryAmount);
    const bonus = parseFloat(input.bonus) || 0;
    const deduction = parseFloat(input.deduction) || 0;

    if (bonus < 0 || deduction < 0) {
      setToastMessage({ type: 'error', message: 'Bonus and deduction cannot be negative' });
      return;
    }

    try {
      setLoading(true);
      const response = await salarySlipApi.generateSalarySlip({
        employeeId,
        month,
        year,
        salaryAmount,
        bonus,
        deduction,
      });

      if (response.data.success) {
        setToastMessage({ type: 'success', message: 'Salary slip generated successfully' });
        fetchEmployees();
      } else {
        setToastMessage({ type: 'error', message: response.data.message || 'Failed to generate salary slip' });
      }
    } catch (error: any) {
      setToastMessage({ type: 'error', message: error?.response?.data?.message || 'Failed to generate salary slip' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBulk = async () => {
    // Get all employees with valid salary amounts
    const validEmployees = employees
      .filter(emp => {
        const input = employeeInputs[emp.id];
        return input && input.salaryAmount && parseFloat(input.salaryAmount) > 0;
      })
      .map(emp => {
        const input = employeeInputs[emp.id];
        return {
          employeeId: emp.id,
          salaryAmount: parseFloat(input.salaryAmount),
          bonus: parseFloat(input.bonus) || 0,
          deduction: parseFloat(input.deduction) || 0,
        };
      });

    if (validEmployees.length === 0) {
      setToastMessage({ type: 'error', message: 'No valid employees to generate salary slips for' });
      return;
    }

    try {
      setLoading(true);
      const response = await salarySlipApi.generateBulkSalarySlips({
        month,
        year,
        employees: validEmployees,
      });

      if (response.data.success) {
        setBulkResult(response.data.data);
        setShowResultModal(true);
        fetchEmployees();
      } else {
        setToastMessage({ type: 'error', message: response.data.message || 'Failed to generate salary slips' });
      }
    } catch (error: any) {
      setToastMessage({ type: 'error', message: error?.response?.data?.message || 'Failed to generate salary slips' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (slipId: string, employeeName: string) => {
    try {
      const response = await salarySlipApi.downloadSalarySlip(slipId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salary-slip-${employeeName.replace(/\s+/g, '-')}-${getMonthName(month)}-${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setToastMessage({ type: 'error', message: 'Failed to download salary slip' });
    }
  };

  const getMonthName = (m: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[m - 1];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'GENERATED':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Generated</span>;
      case 'PAID':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Paid</span>;
      case 'NOT_GENERATED':
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1"><Clock className="w-3 h-3" /> Not Generated</span>;
    }
  };

  // Filter employees based on search and department
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = !searchTerm ||
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || emp.department?.id === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  // Get employees with valid salary input for bulk generation
  const validEmployeesCount = employees.filter(emp => {
    const input = employeeInputs[emp.id];
    return input && input.salaryAmount && parseFloat(input.salaryAmount) > 0;
  }).length;

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          toastMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toastMessage.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salary Generation</h1>
          <p className="text-gray-500 mt-1">Generate monthly salary slips for employees</p>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Month Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <option key={new Date().getFullYear() - 2 + i} value={new Date().getFullYear() - 2 + i}>
                  {new Date().getFullYear() - 2 + i}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Employee</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, employee code, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{filteredEmployees.length} employees</span>
          </div>
          {validEmployeesCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>{validEmployeesCount} ready for generation</span>
            </div>
          )}
        </div>
        <button
          onClick={handleGenerateBulk}
          disabled={loading || validEmployeesCount === 0}
          className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Generate All Salary Slips ({validEmployeesCount})
            </>
          )}
        </button>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Salary Amount</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Bonus</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Deduction</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Net Salary</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No employees found</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => {
                  const input = employeeInputs[employee.id] || { salaryAmount: '', bonus: '', deduction: '' };
                  const salaryAmount = parseFloat(input.salaryAmount) || 0;
                  const bonus = parseFloat(input.bonus) || 0;
                  const deduction = parseFloat(input.deduction) || 0;
                  const netSalary = calculateNetSalary(salaryAmount, bonus, deduction);
                  const isGenerated = employee.status === 'GENERATED' || employee.status === 'PAID';

                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{employee.fullName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600 font-mono">{employee.employeeCode}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">{employee.department?.name || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">{employee.designation || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">{employee.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={input.salaryAmount}
                          onChange={(e) => handleInputChange(employee.id, 'salaryAmount', e.target.value)}
                          placeholder="0.00"
                          disabled={isGenerated}
                          className="w-28 px-3 py-1.5 border border-gray-200 rounded-lg text-right focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={input.bonus}
                          onChange={(e) => handleInputChange(employee.id, 'bonus', e.target.value)}
                          placeholder="0.00"
                          disabled={isGenerated}
                          className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-right focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={input.deduction}
                          onChange={(e) => handleInputChange(employee.id, 'deduction', e.target.value)}
                          placeholder="0.00"
                          disabled={isGenerated}
                          className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-right focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${netSalary < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatCurrency(netSalary)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(employee.status)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {employee.slipId && (employee.status === 'GENERATED' || employee.status === 'PAID') && (
                            <button
                              onClick={() => handleDownload(employee.slipId!, employee.fullName)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Download Salary Slip"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleGenerateSingle(employee.id)}
                            disabled={loading || !input.salaryAmount || parseFloat(input.salaryAmount) <= 0 || isGenerated}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                          >
                            {loading ? <Loader className="w-4 h-4" /> : 'Generate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Generation Result Modal */}
      {showResultModal && bulkResult && (
        <Modal isOpen={showResultModal} onClose={() => setShowResultModal(false)} title="Bulk Generation Results">
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-sm text-green-600 font-medium">Success</div>
                <div className="text-2xl font-bold text-green-900 mt-1">{bulkResult.success}</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="text-sm text-yellow-600 font-medium">Skipped</div>
                <div className="text-2xl font-bold text-yellow-900 mt-1">{bulkResult.skipped}</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="text-sm text-red-600 font-medium">Failed</div>
                <div className="text-2xl font-bold text-red-900 mt-1">{bulkResult.failed}</div>
              </div>
            </div>

            {bulkResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-red-900 mb-2">Errors:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {bulkResult.errors.map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setShowResultModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SalaryGeneration;
