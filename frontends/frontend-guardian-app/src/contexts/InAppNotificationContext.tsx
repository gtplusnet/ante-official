'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { guardianPublicApi, NotificationDto } from '@/lib/api/guardian-public-api';
import { Notification, NotificationType } from '@/types';
import { useAuth } from './AuthContext';

interface InAppNotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;

  // Actions
  fetchNotifications: (filters?: { type?: NotificationType; studentId?: string; read?: boolean }, reset?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  loadMore: () => Promise<void>;

  // Real-time updates (polling-based for PWA)
  subscribe: (filters?: { type?: NotificationType; studentId?: string }) => void;
  unsubscribe: () => void;
}

const InAppNotificationContext = createContext<InAppNotificationContextValue | undefined>(undefined);

interface InAppNotificationProviderProps {
  children: ReactNode;
}

export const InAppNotificationProvider: React.FC<InAppNotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const { user } = useAuth();
  const NOTIFICATIONS_PER_PAGE = 20;

  // Convert Public API NotificationDto to our Notification format
  const convertNotification = (dto: NotificationDto): Notification => ({
    id: dto.id,
    type: dto.type as NotificationType,
    title: dto.title,
    message: dto.message,
    read: dto.isRead,
    timestamp: new Date(dto.timestamp),
    studentId: dto.studentId,
    studentName: dto.studentName,
  });

  // Fetch notifications from Public API
  const fetchNotifications = useCallback(async (
    filters: { type?: NotificationType; studentId?: string; read?: boolean } = {},
    reset = false
  ) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const offset = reset ? 0 : currentOffset;

      console.log('[InAppNotifications] Fetching notifications from Public API', { offset, reset, filters });

      // Fetch notifications from guardianPublicApi
      const apiNotifications = await guardianPublicApi.getNotifications({
        limit: NOTIFICATIONS_PER_PAGE,
        offset,
        type: filters.type as any,
        unreadOnly: filters.read === false ? true : false,
        studentId: filters.studentId,
      });

      // Convert to our Notification format
      const convertedNotifications = apiNotifications.map(convertNotification);

      if (reset) {
        setNotifications(convertedNotifications);
        setCurrentOffset(0);
      } else {
        setNotifications(prev => [...prev, ...convertedNotifications]);
      }

      // Calculate unread count from the notifications
      const unread = convertedNotifications.filter(n => !n.read).length;
      setUnreadCount(reset ? unread : prev => prev + unread);

      setHasMore(apiNotifications.length === NOTIFICATIONS_PER_PAGE);

      if (!reset) {
        setCurrentOffset(prev => prev + NOTIFICATIONS_PER_PAGE);
      }

      console.log(`[InAppNotifications] Loaded ${convertedNotifications.length} notifications`);
    } catch (err: any) {
      console.error('[InAppNotifications] Failed to fetch notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [user, currentOffset]);

  // Load more notifications (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchNotifications({}, false);
  }, [hasMore, loading, fetchNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      console.log('[InAppNotifications] Marking notification as read:', id);

      // Call Public API to mark as read
      await guardianPublicApi.markNotificationsRead([id]);

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, read: true, readAt: new Date() }
            : notification
        )
      );

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('[InAppNotifications] Failed to mark notification as read:', err);
      setError(err.message || 'Failed to mark notification as read');
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      if (!user || notifications.length === 0) return;

      console.log('[InAppNotifications] Marking all notifications as read');

      // Get all unread notification IDs
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);

      if (unreadIds.length === 0) return;

      // Call Public API to mark all as read
      await guardianPublicApi.markNotificationsRead(unreadIds);

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          read: true,
          readAt: new Date()
        }))
      );

      setUnreadCount(0);
    } catch (err: any) {
      console.error('[InAppNotifications] Failed to mark all notifications as read:', err);
      setError(err.message || 'Failed to mark all notifications as read');
    }
  }, [user, notifications]);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      console.log('[InAppNotifications] Delete notification not implemented yet:', id);

      // TODO: Implement delete endpoint in backend
      // For now, just remove from local state
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));

      // Update unread count if the deleted notification was unread
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      console.error('[InAppNotifications] Failed to delete notification:', err);
      setError(err.message || 'Failed to delete notification');
    }
  }, [notifications]);

  // Refresh unread count
  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      console.log('[InAppNotifications] Refreshing unread count');

      // Fetch unread notifications to get count
      const unreadNotifications = await guardianPublicApi.getNotifications({
        limit: 100, // Get a reasonable number to count
        offset: 0,
        unreadOnly: true,
      });

      setUnreadCount(unreadNotifications.length);
    } catch (err: any) {
      console.error('[InAppNotifications] Failed to refresh unread count:', err);
    }
  }, [user]);

  // Real-time notifications via polling (PWA-friendly)
  const subscribe = useCallback((filters: { type?: NotificationType; studentId?: string } = {}) => {
    if (!user) return;

    console.log('[InAppNotifications] Starting notification polling (every 30 seconds)');

    // Clean up existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Set up polling interval (every 30 seconds)
    const interval = setInterval(() => {
      console.log('[InAppNotifications] Polling for new notifications');
      fetchNotifications(filters, true);
    }, 30000); // 30 seconds

    setPollingInterval(interval);
  }, [user, pollingInterval, fetchNotifications]);

  // Unsubscribe from polling
  const unsubscribe = useCallback(() => {
    console.log('[InAppNotifications] Stopping notification polling');

    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  // Initialize notifications when user logs in
  useEffect(() => {
    if (user) {
      console.log('[InAppNotifications] Initializing notifications for user:', user.id);

      // Initialize notifications
      fetchNotifications({}, true);

      // Start polling for new notifications
      subscribe();

      // Cleanup function
      return () => {
        unsubscribe();
      };
    } else {
      // Clear state when user logs out
      console.log('[InAppNotifications] Clearing notifications (user logged out)');
      setNotifications([]);
      setUnreadCount(0);
      setCurrentOffset(0);
      setHasMore(false);
      unsubscribe();
    }
  }, [user?.id]); // Only depend on user.id to avoid re-running on every user object change

  // Refresh unread count periodically (in addition to polling)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(refreshUnreadCount, 60000); // Every minute
    return () => clearInterval(interval);
  }, [user, refreshUnreadCount]);

  const value: InAppNotificationContextValue = {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshUnreadCount,
    loadMore,
    subscribe,
    unsubscribe
  };

  return (
    <InAppNotificationContext.Provider value={value}>
      {children}
    </InAppNotificationContext.Provider>
  );
};

export const useInAppNotifications = () => {
  const context = useContext(InAppNotificationContext);
  if (context === undefined) {
    throw new Error('useInAppNotifications must be used within an InAppNotificationProvider');
  }
  return context;
};

// Hook for notification badge count (for header/navigation)
export const useNotificationBadge = () => {
  const { unreadCount, refreshUnreadCount } = useInAppNotifications();

  return {
    count: unreadCount,
    refresh: refreshUnreadCount,
    hasNotifications: unreadCount > 0
  };
};
