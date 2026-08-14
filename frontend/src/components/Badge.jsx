import React from 'react';

const badgeStyles = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  active: 'bg-green-50 text-green-700 border-green-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  on_hold: 'bg-orange-50 text-orange-700 border-orange-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  super_admin: 'bg-purple-50 text-purple-700 border-purple-200',
  admin: 'bg-blue-50 text-blue-700 border-blue-200',
  user: 'bg-gray-100 text-gray-700 border-gray-200',
  income: 'bg-green-50 text-green-700 border-green-200',
  expense: 'bg-red-50 text-red-700 border-red-200',
};

export default function Badge({ status, children }) {
  const style = badgeStyles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${style}`}>
      {children || String(status).replace(/_/g, ' ')}
    </span>
  );
}
