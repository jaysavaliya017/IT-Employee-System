import { useState, useEffect } from 'react';
import { salaryApi, employeeApi } from '../api/services';
import { SalaryRecord, User, SalaryStructure } from '../types';
import {
  Play,
  CheckCircle,
  Loader,
  AlertCircle,
  Eye,
} from 'lucide-react';
import Modal from '../components/Modal';

const SalaryGeneration = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [detailedRecords, setDetailedRecords] = useState<SalaryRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<SalaryRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeeApi.getAll({ limit: 100 });
      if (response.data.success) {
        setEmployees(response.data.data.employees.filter((e: User) => e.status === 'ACTIVE'));
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const generateSalary = async () => {
    try {
      setLoading(true);
      const response = await salaryApi.generateMonthly({
        month,
        year,
        employeeId: selectedEmployee || undefined,
      });

      if (response.data.success) {
        setResults(response.data.data);
        setShowResults(true);
        
        // Fetch detailed records for the generated salaries
        fetchDetailedRecords();
      }
    } catch (error) {
      console.error('Error generating salary:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedRecords = async () => {
    try {
      const response = await salaryApi.getRecords({
        month,
        year,
        employeeId: selectedEmployee || undefined,
        limit: 100,
      });

      if (response.data.success) {
        setDetailedRecords(response.data.data.records || []);
      }
    } catch (error) {
      console.error('Error fetching detailed records:', error);
    }
  };

  const getMonthName = (m: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[m - 1];
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num || 0);
  };

  const viewDetails = (record: SalaryRecord) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salary Generation</h1>
          <p className="text-gray-500 mt-1">Generate monthly salary for employees</p>
        </div>
      </div>

      {/* Generation Form */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary-100 rounded-lg">
            <Play className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Generate Monthly Salary</h2>
            <p className="text-sm text-gray-500">Create salary records for the selected period</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <option key={2024 + i} value={2024 + i}>{2024 + i}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee (Optional)</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeCode})</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={generateSalary}
          disabled={loading}
          className="w-full md:w-auto px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Generate Salary
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {showResults && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Generation Complete</h2>
              <p className="text-sm text-gray-500">
                {results.filter((r) => r.status === 'SUCCESS').length} salaries generated for {getMonthName(month)} {year}
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          {detailedRecords.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-blue-600 font-medium">Total Earnings</div>
                <div className="text-2xl font-bold text-blue-900 mt-1">
                  {formatCurrency(detailedRecords.reduce((sum, r) => sum + (r.totalEarnings || 0), 0))}
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="text-sm text-red-600 font-medium">Total Deductions</div>
                <div className="text-2xl font-bold text-red-900 mt-1">
                  {formatCurrency(detailedRecords.reduce((sum, r) => sum + (r.totalDeductions || 0), 0))}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-sm text-green-600 font-medium">Net Payable</div>
                <div className="text-2xl font-bold text-green-900 mt-1">
                  {formatCurrency(detailedRecords.reduce((sum, r) => sum + (r.netSalary || 0), 0))}
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="text-sm text-purple-600 font-medium">Employees</div>
                <div className="text-2xl font-bold text-purple-900 mt-1">
                  {detailedRecords.length}
                </div>
              </div>
            </div>
          )}

          {/* Detailed Salary Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Employee</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Employee Code</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Basic</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Earnings</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Deductions</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Net Salary</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {detailedRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {record.employee?.fullName || 'N/A'}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600">
                      {record.employee?.employeeCode || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                      {formatCurrency(record.basicSalary)}
                    </td>
                    <td className="px-4 py-3 text-right text-green-700 font-semibold">
                      {formatCurrency(record.totalEarnings)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-700 font-semibold">
                      {formatCurrency(record.totalDeductions)}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-900 font-bold text-base">
                      {formatCurrency(record.netSalary)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {record.status === 'PENDING' && (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Pending</span>
                      )}
                      {record.status === 'PROCESSED' && (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Processed</span>
                      )}
                      {record.status === 'CREDITED' && (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Credited</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => viewDetails(record)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Generation Status Table */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generation Status</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((result, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 font-mono text-sm">{result.employeeId}</td>
                      <td className="px-6 py-4">
                        {result.status === 'SUCCESS' ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Success</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">{result.status}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{result.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Important Information</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Salary will be calculated based on the employee's salary structure</li>
              <li>Attendance and approved leaves for the month will be considered</li>
              <li>Existing salary records for the same period will be updated</li>
              <li>Employees will be notified when their salary slips are generated</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Salary Detail Modal */}
      {showDetailModal && selectedRecord && (
        <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Salary Details Review">
          <div className="space-y-6">
            {/* Employee Information */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Employee Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Name</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRecord.employee?.fullName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Employee Code</p>
                  <p className="text-sm font-mono font-semibold text-gray-900 mt-1">{selectedRecord.employee?.employeeCode || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Designation</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRecord.employee?.designation || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Department</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRecord.employee?.department?.name || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Attendance Information */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Attendance Summary</h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500 font-medium">Working Days</p>
                  <p className="text-lg font-bold text-blue-900 mt-1">{selectedRecord.workingDays || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 font-medium">Paid Days</p>
                  <p className="text-lg font-bold text-green-900 mt-1">{selectedRecord.paidDays || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 font-medium">Leave Days</p>
                  <p className="text-lg font-bold text-orange-900 mt-1">{selectedRecord.leaveDays || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 font-medium">Unpaid Days</p>
                  <p className="text-lg font-bold text-red-900 mt-1">{selectedRecord.unpaidDays || 0}</p>
                </div>
              </div>
            </div>

            {/* Salary Breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Salary Breakdown</h3>
              
              {/* Earnings */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-green-900">Earnings</h4>
                  <span className="text-lg font-bold text-green-900">{formatCurrency(selectedRecord.totalEarnings)}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Basic Salary</span>
                    <span className="font-medium text-gray-900">{formatCurrency(selectedRecord.basicSalary)}</span>
                  </div>
                  {selectedRecord.hra > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">HRA</span>
                      <span className="font-medium text-gray-900">{formatCurrency(selectedRecord.hra)}</span>
                    </div>
                  )}
                  {selectedRecord.conveyanceAllowance > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Conveyance Allowance</span>
                      <span className="font-medium text-gray-900">{formatCurrency(selectedRecord.conveyanceAllowance)}</span>
                    </div>
                  )}
                  {selectedRecord.medicalAllowance > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Medical Allowance</span>
                      <span className="font-medium text-gray-900">{formatCurrency(selectedRecord.medicalAllowance)}</span>
                    </div>
                  )}
                  {selectedRecord.specialAllowance > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Special Allowance</span>
                      <span className="font-medium text-gray-900">{formatCurrency(selectedRecord.specialAllowance)}</span>
                    </div>
                  )}
                  {selectedRecord.otherAllowances > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Other Allowances</span>
                      <span className="font-medium text-gray-900">{formatCurrency(selectedRecord.otherAllowances)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-red-900">Deductions</h4>
                  <span className="text-lg font-bold text-red-900">{formatCurrency(selectedRecord.totalDeductions)}</span>
                </div>
                <div className="space-y-2">
                  {selectedRecord.pfDeduction > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">PF Deduction</span>
                      <span className="font-medium text-gray-900">{formatCurrency(selectedRecord.pfDeduction)}</span>
                    </div>
                  )}
                  {selectedRecord.taxDeduction > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Tax Deduction</span>
                      <span className="font-medium text-gray-900">{formatCurrency(selectedRecord.taxDeduction)}</span>
                    </div>
                  )}
                  {selectedRecord.professionalTax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Professional Tax</span>
                      <span className="font-medium text-gray-900">{formatCurrency(selectedRecord.professionalTax)}</span>
                    </div>
                  )}
                  {selectedRecord.leaveDeduction > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Leave Deduction</span>
                      <span className="font-medium text-gray-900">{formatCurrency(selectedRecord.leaveDeduction)}</span>
                    </div>
                  )}
                  {selectedRecord.otherDeductions > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Other Deductions</span>
                      <span className="font-medium text-gray-900">{formatCurrency(selectedRecord.otherDeductions)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Components */}
              {selectedRecord.salaryComponents && selectedRecord.salaryComponents.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="text-sm font-semibold text-purple-900 mb-3">Additional Components</h4>
                  <div className="space-y-2">
                    {selectedRecord.salaryComponents.map((comp, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {comp.componentName}
                          <span className="text-xs text-gray-500 ml-1">({comp.type})</span>
                        </span>
                        <span className="font-medium text-gray-900">{formatCurrency(comp.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Net Salary Summary */}
            <div className="bg-blue-900 rounded-lg p-4 text-white">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Gross Salary</span>
                  <span className="font-semibold">{formatCurrency(selectedRecord.grossSalary)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-blue-700 pt-2 mt-2">
                  <span>Net Salary</span>
                  <span>{formatCurrency(selectedRecord.netSalary)}</span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
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
