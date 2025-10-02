import React, { ReactNode } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { usePullToRefresh } from '../../lib/hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  enabled?: boolean;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  enabled = true,
  className = ''
}: PullToRefreshProps) {
  const { isPulling, pullDistance, isRefreshing, canRelease } = usePullToRefresh({
    onRefresh,
    enabled
  });

  const getIndicatorStyles = () => {
    if (!isPulling && !isRefreshing) {
      return {
        opacity: 0,
        transform: 'translateY(-100%)'
      };
    }

    const opacity = Math.min(pullDistance / 80, 1);
    const rotation = pullDistance * 3;
    const scale = canRelease ? 1.1 : 0.9;

    return {
      opacity,
      transform: `translateY(${Math.min(pullDistance - 40, 40)}px) scale(${scale})`,
      rotation
    };
  };

  const indicatorStyles = getIndicatorStyles();

  return (
    <div className={`pull-to-refresh-container relative ${className}`}>
      {/* Pull indicator */}
      <div 
        className="pull-indicator absolute top-0 left-0 right-0 flex justify-center z-50 pointer-events-none"
        style={{
          opacity: indicatorStyles.opacity,
          transform: indicatorStyles.transform,
          transition: isPulling ? 'none' : 'all 0.3s ease-out'
        }}
      >
        <div className={`
          pull-indicator-content 
          bg-white rounded-full shadow-lg p-3
          ${isRefreshing ? 'animate-spin' : ''}
        `}>
          <FiRefreshCw 
            className={`
              w-6 h-6 
              ${canRelease ? 'text-primary' : 'text-gray-400'}
              transition-colors duration-200
            `}
            style={{
              transform: `rotate(${indicatorStyles.rotation}deg)`,
              transition: isPulling ? 'none' : 'transform 0.3s ease-out'
            }}
          />
        </div>
      </div>

      {/* Main content */}
      <div 
        className="pull-content"
        style={{
          transform: isPulling ? `translateY(${pullDistance}px)` : 'translateY(0)',
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>

      {/* Loading overlay */}
      {isRefreshing && (
        <div className="refresh-overlay absolute inset-0 flex items-start justify-center pt-20 pointer-events-none">
          <div className="bg-white rounded-full shadow-lg p-3 animate-bounce">
            <FiRefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
}