'use client';

import React, { useEffect, useState } from 'react';
import { FiWifiOff, FiRefreshCw, FiCheck, FiWifi } from 'react-icons/fi';
import { useAppUpdate } from '@/lib/hooks/useAppUpdate';

export const OfflineIndicator: React.FC = () => {
  const { checkForUpdates } = useAppUpdate();
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Use browser online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Show "reconnected" message briefly when connection is restored
    if (wasOffline && isOnline) {
      setShowReconnected(true);
      setIsExpanded(false);
      
      // Check for updates when coming back online
      checkForUpdates();
      
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    
    if (!isOnline) {
      setWasOffline(true);
    }
  }, [isOnline, wasOffline, checkForUpdates]);

  // Only show when offline or reconnecting
  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Compact indicator */}
      <div 
        className={`
          rounded-full shadow-lg cursor-pointer transition-all duration-300
          ${isOnline ? 'bg-green-500' : 'bg-red-500'}
          ${isExpanded ? 'rounded-2xl' : ''}
          animate-in fade-in slide-in-from-bottom-2
        `}
        onClick={() => !isOnline && setIsExpanded(!isExpanded)}
      >
        {!isExpanded ? (
          // Compact view
          <div className="p-3">
            {isOnline ? (
              <FiWifi className="w-5 h-5 text-white" />
            ) : (
              <FiWifiOff className="w-5 h-5 text-white" />
            )}
          </div>
        ) : (
          // Expanded view (only when offline)
          <div className="p-4 text-white min-w-[200px]">
            <div className="flex items-start gap-3">
              <FiWifiOff className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">No connection</p>
                <p className="text-xs opacity-90 mt-1">Check your internet connection</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Reconnected toast */}
      {showReconnected && (
        <div className="absolute bottom-0 right-0 mb-16 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <FiCheck className="w-4 h-4" />
            <span className="text-sm font-medium">Connected</span>
          </div>
        </div>
      )}
    </div>
  );
};