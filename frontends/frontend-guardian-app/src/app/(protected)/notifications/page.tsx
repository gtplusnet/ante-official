'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { NotificationItem } from '@/components/features/NotificationItem';
import { useInAppNotifications } from '@/contexts/InAppNotificationContext';
import { FiArrowLeft, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PullToRefresh } from '@/components/ui/PullToRefresh';

export default function NotificationsPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  
  const {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    fetchNotifications,
    markAllAsRead,
    loadMore
  } = useInAppNotifications();

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Auto mark all notifications as read when page is viewed
  useEffect(() => {
    if (notifications.length > 0 && unreadCount > 0) {
      const timer = setTimeout(() => {
        markAllAsRead();
      }, 1000); // Wait 1 second before marking as read to ensure user sees them
      
      return () => clearTimeout(timer);
    }
  }, [notifications.length, unreadCount, markAllAsRead]);

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    setIsMarkingAllRead(true);
    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleRefresh = async () => {
    await fetchNotifications({}, true);
  };

  const handleLoadMore = async () => {
    if (!loading && hasMore) {
      await loadMore();
    }
  };

  return (
    <MobileLayout>
      {/* Custom Header */}
      <header className="bg-primary-500 text-white pt-safe-top animate-slide-down">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-lg hover:bg-primary-600 transition-colors"
              aria-label="Go back"
            >
              <FiArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
              aria-label="Refresh notifications"
            >
              <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAllRead}
                className="p-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                aria-label="Mark all as read"
              >
                <FiCheckCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Error State */}
      {error && (
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Notifications List with Pull to Refresh */}
      <PullToRefresh onRefresh={handleRefresh} className="flex-1">
        <div className={`p-4 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {loading && notifications.length === 0 ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FiCheckCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg font-medium mb-1">All caught up!</p>
            <p className="text-gray-400 text-sm">No notifications to show</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className="transition-all duration-500"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transitionDelay: `${index * 100}ms`
                  }}
                >
                  <NotificationItem notification={notification} />
                </div>
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMore && (
              <div className="mt-6 text-center">
                <Button
                  variant="secondary"
                  onClick={handleLoadMore}
                  loading={loading}
                  disabled={loading}
                >
                  Load More
                </Button>
              </div>
            )}
            
            {/* Loading More Indicator */}
            {loading && notifications.length > 0 && (
              <div className="flex justify-center mt-4">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </>
        )}
      </div>
    </PullToRefresh>
    </MobileLayout>
  );
}