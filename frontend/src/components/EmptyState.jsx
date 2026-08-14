import React from 'react';

export default function EmptyState({ title = 'No records found', description, icon: Icon }) {
  return (
    <div className="text-center py-12">
      {Icon && (
        <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <Icon className="w-6 h-6 text-gray-400" />
        </div>
      )}
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
  );
}