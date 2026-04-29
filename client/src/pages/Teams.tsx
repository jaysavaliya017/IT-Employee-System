import React, { useState, useEffect } from 'react';
import { teamApi, employeeApi } from '../api/services';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { PageLoader } from '../components/Loader';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { Plus, Users, Edit } from 'lucide-react';

const Teams: React.FC = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [formData, setFormData] = useState({ name: '', teamLeaderId: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [teamRes, empRes] = await Promise.all([
        teamApi.getAll(),
        employeeApi.getAll(),
      ]);
      if (teamRes.data.success) setTeams(teamRes.data.data.teams);
      if (empRes.data.success) setEmployees(empRes.data.data.employees);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingTeam) {
        await teamApi.update(editingTeam.id, formData);
      } else {
        await teamApi.create(formData);
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving team:', error);
    }
  };

  const handleEdit = (team: any) => {
    setEditingTeam(team);
    setFormData({ name: team.name, teamLeaderId: team.teamLeaderId || '' });
    setShowModal(true);
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle>Teams</CardTitle>
            <button
              onClick={() => {
                setEditingTeam(null);
                setFormData({ name: '', teamLeaderId: '' });
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              <Plus className="w-4 h-4" />
              Create Team
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <div key={team.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{team.name}</h3>
                        <p className="text-xs text-gray-500">{team.department?.name || 'No Department'}</p>
                      </div>
                    </div>
                    <button onClick={() => handleEdit(team)} className="p-2 hover:bg-gray-200 rounded">
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Team Leader</span>
                    <span className="text-sm font-medium">{team.teamLeader?.fullName || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">Members</span>
                    <span className="text-sm font-medium">{team.members?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No teams found" description="Create your first team to get started" />
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTeam ? 'Edit Team' : 'Create Team'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Team Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Team Leader</label>
            <select
              value={formData.teamLeaderId}
              onChange={(e) => setFormData({ ...formData, teamLeaderId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Team Leader</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button onClick={handleSubmit} className="px-4 py-2 bg-primary-600 text-white rounded-lg">
              {editingTeam ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Teams;
