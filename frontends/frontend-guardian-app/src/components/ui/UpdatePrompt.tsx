'use client';

import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiX } from 'react-icons/fi';
import { useAppUpdate } from '@/lib/hooks/useAppUpdate';

export const UpdatePrompt: React.FC = () => {
  const { updateAvailable, newVersion, applyUpdate, isChecking } = useAppUpdate();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (updateAvailable && !isDismissed) {
      setIsVisible(true);
    }
  }, [updateAvailable, isDismissed]);

  const handleUpdate = () => {
    applyUpdate();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    // Reset dismiss after 30 minutes
    setTimeout(() => setIsDismissed(false), 30 * 60 * 1000);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-safe-top left-0 right-0 z-50 animate-in slide-in-from-top duration-300">
      <div className="mx-4 mt-4">
        <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <FiRefreshCw className="w-5 h-5" />
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">
                Update Available
              </h3>
              <p className="text-sm opacity-90">
                A new version of the app is available. Update now for the latest features and improvements.
              </p>
              {newVersion && (
                <p className="text-xs opacity-75 mt-1">
                  Version: {newVersion}
                </p>
              )}
              
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleUpdate}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  Update Now
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-white/80 hover:text-white text-sm font-medium transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
              aria-label="Dismiss"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact version for mobile
export const UpdateBadge: React.FC = () => {
  const { updateAvailable, applyUpdate } = useAppUpdate();
  const [showTooltip, setShowTooltip] = useState(false);

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={applyUpdate}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Update available"
      >
        <FiRefreshCw className="w-5 h-5" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
      </button>
      
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
          Update available - Click to refresh
        </div>
      )}
    </div>
  );
};