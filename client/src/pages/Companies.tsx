import React, { useEffect, useState } from 'react';
import { companyApi } from '../api/services';
import { Company } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { PageLoader } from '../components/Loader';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { toast } from '../components/Toast';
import { Plus, Edit, Building2, Power } from 'lucide-react';

type CompanyForm = {
  name: string;
  code: string;
  isActive: boolean;
};

const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CompanyForm>({
    name: '',
    code: '',
    isActive: true,
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const response = await companyApi.getAll();
      if (response.data.success) {
        setCompanies(response.data.data.companies || []);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingCompany(null);
    setFormData({ name: '', code: '', isActive: true });
    setShowModal(true);
  };

  const openEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      code: company.code,
      isActive: company.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingCompany) {
        await companyApi.update(editingCompany.id, formData);
        toast.success('Company updated successfully');
      } else {
        await companyApi.create(formData);
        toast.success('Company created successfully');
      }

      setShowModal(false);
      await loadCompanies();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save company');
    }
  };

  const handleToggleStatus = async (company: Company) => {
    try {
      await companyApi.updateStatus(company.id, !company.isActive);
      toast.success(company.isActive ? 'Company deactivated' : 'Company activated');
      await loadCompanies();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update company status');
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle>Companies</CardTitle>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              <Plus className="w-4 h-4" />
              Add Company
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {companies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((company) => (
                <div key={company.id} className="p-4 border border-gray-200 rounded-lg bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{company.name}</p>
                        <p className="text-xs text-gray-500">Code: {company.code}</p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        company.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {company.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="mt-4 text-sm text-gray-600">
                    Users: <span className="font-medium text-gray-800">{company._count?.users || 0}</span>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => openEdit(company)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(company)}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-white ${
                        company.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                      {company.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No companies found" description="Create your first company" />
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCompany ? 'Edit Company' : 'Add Company'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Company Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Enter company name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Company Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Example: PROATTEND"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="company-active"
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <label htmlFor="company-active" className="text-sm text-gray-700">
              Company is active
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button onClick={handleSubmit} className="px-4 py-2 bg-primary-600 text-white rounded-lg">
              {editingCompany ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Companies;
