import React, { useEffect, useState } from 'react';
import { Modal } from '../Modal';
import { formatDateLabel } from './attendanceUtils';
import { MonthlyAttendanceRecord } from './types';

interface LeaveRequestModalProps {
  isOpen: boolean;
  record?: MonthlyAttendanceRecord | null;
  onClose: () => void;
}

export const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({ isOpen, record, onClose }) => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!record) {
      return;
    }

    const selected = new Date(record.date).toISOString().slice(0, 10);
    setFromDate(selected);
    setToDate(selected);
    setReason(record.remarks || '');
  }, [record]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Leave Request"
      footer={
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            Cancel
          </button>
          <button onClick={onClose} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">
            Submit
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm text-violet-800">
          Selected date: <span className="font-semibold">{record ? formatDateLabel(record.date) : '--'}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-gray-700">
            <span>From Date</span>
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
          </label>
          <label className="space-y-2 text-sm font-medium text-gray-700">
            <span>To Date</span>
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
          </label>
          <label className="space-y-2 text-sm font-medium text-gray-700 sm:col-span-2">
            <span>Leave Type</span>
            <select value={leaveType} onChange={(event) => setLeaveType(event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
              {['Casual Leave', 'Sick Leave', 'Paid Leave', 'Optional Holiday'].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="space-y-2 text-sm font-medium text-gray-700">
          <span>Reason</span>
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" placeholder="Enter leave reason" />
        </label>
      </div>
    </Modal>
  );
};

export default LeaveRequestModal;