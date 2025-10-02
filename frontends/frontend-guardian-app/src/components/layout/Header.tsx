'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FiMenu, FiBell, FiRefreshCw } from 'react-icons/fi';
import { Badge } from '../ui/Badge';
import { BackButton } from '../ui/BackButton';
import { UpdateBadge } from '../ui/UpdatePrompt';
import { useNotificationBadge } from '@/contexts/InAppNotificationContext';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
  showMenu?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
  showNotification?: boolean;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onMenuClick,
  showMenu = true,
  showBackButton = false,
  onBackClick,
  showNotification = true,
  className = '',
}) => {
  const router = useRouter();
  const { count: displayCount, hasNotifications } = useNotificationBadge();

  return (
    <header className={`bg-primary-500 text-white pt-safe-top ${className}`}>
      <div className="relative flex items-center justify-center p-4">
          {/* Left side - Menu/Back button */}
          <div className="absolute left-4 flex items-center">
            {showBackButton ? (
              <BackButton onClick={onBackClick} />
            ) : (
              showMenu && (
                <button
                  onClick={onMenuClick}
                  className="p-2 -ml-2 rounded-lg hover:bg-primary-600 transition-all duration-200 hover:scale-110 active:scale-95"
                  aria-label="Open menu"
                >
                  <FiMenu className="w-6 h-6 transition-transform duration-200" />
                </button>
              )
            )}
          </div>

          {/* Center - Title */}
          <h1 className="text-lg font-semibold text-center">{title}</h1>
          
          {/* Right side - Notification and Update */}
          <div className="absolute right-4 flex items-center gap-2">
            <UpdateBadge />
            
            {showNotification && (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push('/notifications');
                }}
                className="relative p-2 -mr-2 rounded-lg hover:bg-primary-600 transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <FiBell className={`w-6 h-6 transition-transform duration-300 ${displayCount > 0 ? 'animate-pulse' : ''}`} />
                {displayCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
                    {displayCount > 9 ? '9+' : displayCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>
  );
};