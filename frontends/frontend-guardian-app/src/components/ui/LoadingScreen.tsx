import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" color="#8B1F1F" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
};