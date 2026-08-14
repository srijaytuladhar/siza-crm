import React from 'react';

export default function Spinner({ className = '' }) {
  return (
    <div className="flex justify-center py-12">
      <div className={`animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent ${className}`} />
    </div>
  );
}
