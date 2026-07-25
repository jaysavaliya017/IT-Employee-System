import React, { useState, useEffect } from 'react';
import { employeeApi, departmentApi, shiftApi, companyApi } from '../api/services';
import { Card, CardContent } from '../components/Card';
import { PageLoader } from '../components/Loader';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { EmptyState, PageHeader } from '../components/PageKit';
import { Plus, Search, Edit, Trash2, Users, ArrowRightLeft } from 'lucide-react';
import { Company, Role } from '../types';
import { toast } from '../components/Toast';
import { notifyApiError } from '../utils/apiError';

const DESIGNATIONS = [
  'Full Stack Developer',
  'UI/UX',
  'Frontend Developer',
  'Backend Developer',
  'QA',
];

type EmployeeFormData = {
  email: string;
  password: string;
  fullName: string;
  employeeCode: string;
  phone: string;
  departmentId: string;
  designation: string;
  shiftId: string;
  role: Role;
  joiningDate: string;
};

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [targetCompanyId, setTargetCompanyId] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [formData, setFormData] = useState<EmployeeFormData>({
    email: '',
    password: '',
    fullName: '',
    employeeCode: '',
    phone: '',
    departmentId: '',
    designation: '',
    shiftId: '',
    role: 'EMPLOYEE',
    joiningDate: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, shiftRes, companyRes] = await Promise.all([
        employeeApi.getAll(),
        departmentApi.getAll(),
        shiftApi.getAll(),
        companyApi.getAll(),
      ]);
      if (empRes.data.success) setEmployees(empRes.data.data.employees);
      if (deptRes.data.success) setDepartments(deptRes.data.data.departments || []);
      if (shiftRes.data.success) setShifts(shiftRes.data.data.shifts);
      if (companyRes.data.success) {
        setCompanies((companyRes.data.data.companies || []).filter((company: Company) => company.isActive));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingEmployee) {
        await employeeApi.update(editingEmployee.id, formData);
      } else {
        await employeeApi.create(formData);
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      notifyApiError(error, 'Could not save the employee');
    }
  };

  const handleEdit = (employee: any) => {
    setEditingEmployee(employee);
    setFormData({
      email: employee.email,
      password: '',
      fullName: employee.fullName,
      employeeCode: employee.employeeCode,
      phone: employee.phone || '',
      departmentId: employee.departmentId || '',
      designation: employee.designation || '',
      shiftId: employee.shiftId || '',
      role: employee.role,
      joiningDate: employee.joiningDate?.split('T')[0] || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await employeeApi.delete(id);
      loadData();
    } catch (error) {
      notifyApiError(error, 'Could not delete the employee');
    }
  };

  const openTransferModal = (employee: any) => {
    setSelectedEmployee(employee);
    setTargetCompanyId('');
    setShowTransferModal(true);
  };

  const handleTransfer = async () => {
    if (!selectedEmployee || !targetCompanyId) {
      toast.error('Please select target company');
      return;
    }

    setIsTransferring(true);
    try {
      await employeeApi.transferCompany(selectedEmployee.id, targetCompanyId);
      toast.success('Employee transferred successfully');
      setShowTransferModal(false);
      setSelectedEmployee(null);
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to transfer employee');
    } finally {
      setIsTransferring(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        subtitle={`${employees.length} ${employees.length === 1 ? 'person' : 'people'} in your organization`}
        icon={Users}
        actions={
          <button
            onClick={() => {
              setEditingEmployee(null);
              setFormData({
                email: '',
                password: '',
                fullName: '',
                employeeCode: '',
                phone: '',
                departmentId: '',
                designation: '',
                shiftId: '',
                role: 'EMPLOYEE',
                joiningDate: '',
              });
              setShowModal(true);
            }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        }
      />

      <Card>
        <CardContent>
          <div className="mb-5">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 transition-all"
              />
            </div>
          </div>

          {employees.length > 0 ? (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2.5 px-6 text-xs font-semibold uppercase tracking-wide text-slate-400">Employee</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Department</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Designation</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Role</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                    <th className="text-right py-2.5 px-6 text-xs font-semibold uppercase tracking-wide text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white text-sm font-semibold">
                            {(emp.fullName || 'U').charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 text-sm truncate">{emp.fullName}</p>
                            <p className="text-xs text-slate-400 truncate">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{emp.department?.name || '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{emp.designation || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="badge bg-slate-100 text-slate-600">{emp.role}</span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={emp.status} />
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEdit(emp)}
                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openTransferModal(emp)}
                            className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                            title="Transfer to another company"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(emp.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Users} title="No employees found" description="Add your first employee to get started, or adjust your search." />
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Employee Code</label>
              <input
                type="text"
                value={formData.employeeCode}
                onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required={!editingEmployee}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Designation</label>
              <select
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select Designation</option>
                {DESIGNATIONS.map((designation) => (
                  <option key={designation} value={designation}>{designation}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Shift</label>
              <select
                value={formData.shiftId}
                onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select Shift</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="TEAM_LEADER">Team Leader</option>
                <option value="MANAGER">Manager</option>
                <option value="HR">HR</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Joining Date</label>
              <input
                type="date"
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button onClick={handleSubmit} className="px-4 py-2 bg-primary-600 text-white rounded-lg">
              {editingEmployee ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Transfer Employee To Company"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Transfer <span className="font-medium text-slate-800">{selectedEmployee?.fullName}</span> to another company.
            This will reset department, team, shift, manager, and team leader assignments.
          </p>

          <div>
            <label className="block text-sm font-medium mb-1">Target Company</label>
            <select
              value={targetCompanyId}
              onChange={(e) => setTargetCompanyId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} ({company.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowTransferModal(false)}
              className="px-4 py-2 bg-slate-100 rounded-lg"
              disabled={isTransferring}
            >
              Cancel
            </button>
            <button
              onClick={handleTransfer}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-indigo-300"
              disabled={isTransferring || !targetCompanyId}
            >
              {isTransferring ? 'Transferring...' : 'Transfer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Employees;
