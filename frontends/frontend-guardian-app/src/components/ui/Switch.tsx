import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  className = '',
}) => {
  const sizes = {
    sm: {
      switch: 'w-8 h-4',
      thumb: 'w-3 h-3',
      translate: 'translate-x-4',
    },
    md: {
      switch: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5',
    },
    lg: {
      switch: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7',
    },
  };

  const sizeConfig = sizes[size];

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  const switchElement = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
        ${sizeConfig.switch}
        ${checked ? 'bg-primary-500' : 'bg-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
      `}
    >
      <span
        className={`
          inline-block rounded-full bg-white shadow-sm transform transition-transform duration-200
          ${sizeConfig.thumb}
          ${checked ? sizeConfig.translate : 'translate-x-0.5'}
        `}
      />
    </button>
  );

  if (label || description) {
    return (
      <div className={`flex items-start gap-3 ${className}`}>
        <div className="flex-1">
          {label && (
            <label 
              className={`block font-medium text-gray-900 ${description ? 'mb-1' : ''} ${disabled ? 'opacity-50' : ''}`}
            >
              {label}
            </label>
          )}
          {description && (
            <p className={`text-sm text-gray-500 ${disabled ? 'opacity-50' : ''}`}>
              {description}
            </p>
          )}
        </div>
        {switchElement}
      </div>
    );
  }

  return switchElement;
};