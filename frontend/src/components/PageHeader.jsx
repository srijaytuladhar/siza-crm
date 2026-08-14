import React from 'react';
import { Button } from './ui';

export default function PageHeader({ title, subtitle, actionLabel, onAction, actionIcon: ActionIcon }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
