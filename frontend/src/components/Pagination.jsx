import React from 'react';
import { Button } from './ui';

export default function Pagination({ page, limit, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;

  const pages = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-sm text-gray-500">
        Showing {total === 0 ? 0 : (page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
      </p>
      <div className="flex items-center space-x-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="px-3 py-1.5">
          Previous
        </Button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="text-sm text-gray-400 px-1">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                p === page
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          )
        )}
        <Button variant="secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="px-3 py-1.5">
          Next
        </Button>
      </div>
    </div>
  );
}
