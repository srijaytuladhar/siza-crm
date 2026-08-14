import React from 'react';

export const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500';

export const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

export function Label({ children, className = '' }) {
  return <label className={`${labelClass} ${className}`}>{children}</label>;
}

export function Input({ className = '', ...props }) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${inputClass} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function TextArea({ className = '', ...props }) {
  return <textarea className={`${inputClass} ${className}`} rows="3" {...props} />;
}

export function Button({ variant = 'primary', className = '', type = 'button', ...props }) {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-primary-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  };
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function ErrorAlert({ message }) {
  if (!message) return null;
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
      {message}
    </div>
  );
}

export function SuccessAlert({ message }) {
  if (!message) return null;
  return (
    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm" role="status">
      {message}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, accent = 'text-primary-600', sub }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
            <Icon className={`w-6 h-6 ${accent}`} />
          </div>
        )}
      </div>
    </div>
  );
}

export function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>{children}</div>;
}
