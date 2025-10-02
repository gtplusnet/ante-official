import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: boolean;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  padding = 'md',
  shadow = true,
  interactive = false,
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const shadowClass = shadow ? 'shadow-card' : '';
  const interactiveClass = interactive ? 'card-interactive cursor-pointer hover:shadow-card-hover' : '';

  return (
    <div
      className={`
        bg-white rounded-lg
        ${paddingStyles[padding]}
        ${shadowClass}
        ${interactiveClass}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};