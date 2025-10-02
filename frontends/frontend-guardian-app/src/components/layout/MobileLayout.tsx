'use client';

import React from 'react';

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen-safe bg-gray-50 ${className}`}>
      <div className="mx-auto max-w-lg h-full">
        {children}
      </div>
    </div>
  );
};