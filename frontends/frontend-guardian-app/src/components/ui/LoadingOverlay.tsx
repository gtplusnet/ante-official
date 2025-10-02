import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
}) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-200">
        <LoadingSpinner size="lg" color="#8B1F1F" />
        <p className="text-gray-700 font-medium animate-pulse">{message}</p>
      </div>
    </div>
  );
};