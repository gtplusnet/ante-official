'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';

interface BackButtonProps {
  onClick?: () => void;
  className?: string;
  iconClassName?: string;
  ariaLabel?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  className = '',
  iconClassName = '',
  ariaLabel = 'Go back',
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`p-2 -ml-2 rounded-lg hover:bg-primary-600 transition-all duration-200 hover:scale-110 active:scale-95 ${className}`}
      aria-label={ariaLabel}
    >
      <FiArrowLeft className={`w-6 h-6 transition-transform duration-200 ${iconClassName}`} />
    </button>
  );
};