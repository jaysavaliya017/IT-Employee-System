import React, { useState, useEffect } from 'react';
import { shiftApi } from '../api/services';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { PageLoader } from '../components/Loader';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { Plus, Clock, Edit, Trash2 } from 'lucide-react';

const Shifts: React.FC = () => {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    graceMinutes: 0,
    halfDayHours: 4,
    fullDayHours: 8,
  });

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      const response = await shiftApi.getAll();
      if (response.data.success) setShifts(response.data.data.shifts);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingShift) {
        await shiftApi.update(editingShift.id, formData);
      } else {
        await shiftApi.create(formData);
      }
      setShowModal(false);
      loadShifts();
    } catch (error) {
      console.error('Error saving shift:', error);
    }
  };

  const handleEdit = (shift: any) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      graceMinutes: shift.graceMinutes,
      halfDayHours: shift.halfDayHours,
      fullDayHours: shift.fullDayHours,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await shiftApi.delete(id);
      loadShifts();
    } catch (error) {
      console.error('Error deleting shift:', error);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle>Shifts</CardTitle>
            <button
              onClick={() => {
                setEditingShift(null);
                setFormData({ name: '', startTime: '', endTime: '', graceMinutes: 0, halfDayHours: 4, fullDayHours: 8 });
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              <Plus className="w-4 h-4" />
              Add Shift
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {shifts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shifts.map((shift) => (
                <div key={shift.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-800">{shift.name}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(shift)} className="p-2 hover:bg-gray-200 rounded">
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                      <button onClick={() => handleDelete(shift.id)} className="p-2 hover:bg-red-50 rounded text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Timing</span>
                      <span className="font-medium">{shift.startTime} - {shift.endTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Grace Period</span>
                      <span>{shift.graceMinutes} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Full Day</span>
                      <span>{shift.fullDayHours} hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Half Day</span>
                      <span>{shift.halfDayHours} hrs</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No shifts found" />
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingShift ? 'Edit Shift' : 'Create Shift'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Shift Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Grace (min)</label>
              <input type="number" value={formData.graceMinutes} onChange={(e) => setFormData({ ...formData, graceMinutes: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Half Day</label>
              <input type="number" value={formData.halfDayHours} onChange={(e) => setFormData({ ...formData, halfDayHours: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Full Day</label>
              <input type="number" value={formData.fullDayHours} onChange={(e) => setFormData({ ...formData, fullDayHours: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
            <button onClick={handleSubmit} className="px-4 py-2 bg-primary-600 text-white rounded-lg">{editingShift ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Shifts;
