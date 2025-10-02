import React from 'react';
import { FiLock, FiMail } from 'react-icons/fi';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: 'email' | 'password' | 'none';
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon = 'none',
  fullWidth = true,
  className = '',
  ...props
}) => {
  const iconMap = {
    email: <FiMail className="w-5 h-5 text-gray-400" />,
    password: <FiLock className="w-5 h-5 text-gray-400" />,
    none: null,
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <div className={`${widthClass} ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon !== 'none' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {iconMap[icon]}
          </div>
        )}
        <input
          className={`
            block w-full rounded-lg border border-gray-300 
            ${icon !== 'none' ? 'pl-10' : 'px-3'} 
            py-3 text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-500
            ${error ? 'border-red-500' : ''}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};