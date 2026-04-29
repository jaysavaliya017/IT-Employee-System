import React, { useEffect, useState } from 'react';
import { Modal } from '../Modal';
import { formatDateLabel, formatTimeLabel, getStatusLabel } from './attendanceUtils';
import { MonthlyAttendanceRecord } from './types';

interface ModifyAttendanceModalProps {
  isOpen: boolean;
  record?: MonthlyAttendanceRecord | null;
  onClose: () => void;
}

export const ModifyAttendanceModal: React.FC<ModifyAttendanceModalProps> = ({
  isOpen,
  record,
  onClose,
}) => {
  const [status, setStatus] = useState('PRESENT');
  const [inTime, setInTime] = useState('09:00');
  const [outTime, setOutTime] = useState('18:00');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!record) {
      return;
    }

    setStatus(record.attendanceStatus);
    setInTime(record.actualInTime ? new Date(record.actualInTime).toTimeString().slice(0, 5) : '09:00');
    setOutTime(record.actualOutTime ? new Date(record.actualOutTime).toTimeString().slice(0, 5) : '18:00');
    setReason(record.remarks || '');
  }, [record]);

  const handleSubmit = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modify Attendance"
      footer={
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            Cancel
          </button>
          <button onClick={handleSubmit} className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
            Submit
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Selected Date</p>
          <p className="mt-2 text-base font-semibold text-gray-900">{record ? formatDateLabel(record.date) : '--'}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-gray-700">
            <span>Attendance Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100">
              {['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'HOLIDAY', 'WEEK_OFF'].map((item) => (
                <option key={item} value={item}>{item.replace('_', ' ')}</option>
              ))}
            </select>
          </label>
          <div className="space-y-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-600">
            <span className="font-medium text-gray-700">Current Summary</span>
            <p>{record ? getStatusLabel(record) : '--'}</p>
            <p>{record ? `${formatTimeLabel(record.firstInTime)} - ${formatTimeLabel(record.lastOutTime)}` : '--'}</p>
          </div>
          <label className="space-y-2 text-sm font-medium text-gray-700">
            <span>In Time</span>
            <input type="time" value={inTime} onChange={(event) => setInTime(event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
          </label>
          <label className="space-y-2 text-sm font-medium text-gray-700">
            <span>Out Time</span>
            <input type="time" value={outTime} onChange={(event) => setOutTime(event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
          </label>
        </div>
        <label className="space-y-2 text-sm font-medium text-gray-700">
          <span>Reason</span>
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" placeholder="Enter reason for modification" />
        </label>
      </div>
    </Modal>
  );
};

export default ModifyAttendanceModal;