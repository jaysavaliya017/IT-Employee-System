import React from 'react';


interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'PRESENT':
        return { bg: 'bg-teal-100', text: 'text-teal-800', label: 'Present' };
      case 'ABSENT':
        return { bg: 'bg-red-100', text: 'text-red-800', label: 'Absent' };
      case 'HALF_DAY':
        return { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Half Day' };
      case 'PAID_LEAVE':
        return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Paid Leave' };
      case 'UNPAID_LEAVE':
        return { bg: 'bg-pink-100', text: 'text-pink-800', label: 'Unpaid Leave' };
      case 'SICK_LEAVE':
        return { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Sick Leave' };
      case 'CASUAL_LEAVE':
        return { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Casual Leave' };
      case 'HOLIDAY':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Holiday' };
      case 'WEEK_OFF':
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Week Off' };
      case 'PENDING':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' };
      case 'APPROVED':
        return { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' };
      case 'REJECTED':
        return { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' };
      case 'ACTIVE':
        return { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' };
      case 'INACTIVE':
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bg} ${config.text} ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
    >
      {config.label}
    </span>
  );
};

export { StatusBadge };
