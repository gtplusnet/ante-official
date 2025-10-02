'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
// notificationsApi removed - using Supabase
import { getNotificationsSupabaseService, GuardianNotification, SchoolNotification } from '@/lib/services/notifications.service';
type NotificationListResponse = { notifications: Notification[]; hasMore: boolean; unreadCount: number };
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
  
  // Real-time updates
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
  const [currentPage, setCurrentPage] = useState(1);
  const [subscriptionCleanup, setSubscriptionCleanup] = useState<(() => void) | null>(null);
  
  const { user } = useAuth();
  const NOTIFICATIONS_PER_PAGE = 20;

  // Fetch notifications from Supabase
  const fetchNotifications = useCallback(async (
    filters: { type?: NotificationType; studentId?: string; read?: boolean } = {},
    reset = false
  ) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const notificationsService = getNotificationsSupabaseService();
      const limit = NOTIFICATIONS_PER_PAGE;
      
      // Use callback to get current page value
      let page = 1;
      if (!reset) {
        setCurrentPage(prev => {
          page = prev;
          return prev;
        });
      }
      
      // Get both guardian and school notifications
      const [guardianNotifications, schoolNotifications, unreadCount] = await Promise.all([
        notificationsService.getGuardianNotifications(user.id, limit),
        notificationsService.getSchoolNotifications(user.id, limit), 
        notificationsService.getUnreadCount(user.id)
      ]);
      
      // Convert to common Notification format and combine
      const combinedNotifications: Notification[] = [
        ...guardianNotifications.map((n): Notification => ({
          id: n.id,
          type: n.type as NotificationType,
          title: n.title,
          message: n.body,
          read: !!n.readAt,
          timestamp: new Date(n.createdAt),
          studentId: undefined,
          studentName: undefined
        })),
        ...schoolNotifications.map((n): Notification => ({
          id: n.id,
          type: 'attendance' as NotificationType,
          title: n.action ? `${n.action} notification` : 'School notification',
          message: `${n.studentName || 'Student'} - ${n.action || 'Update'}`,
          read: n.read,
          timestamp: new Date(n.timestamp),
          studentId: n.studentId || undefined,
          studentName: n.studentName || undefined
        }))
      ];
      
      // Sort by creation date (newest first)
      combinedNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      // Apply filtering if specified
      let filteredNotifications = combinedNotifications;
      if (filters.read !== undefined) {
        filteredNotifications = filteredNotifications.filter(n => n.read === filters.read);
      }
      if (filters.studentId) {
        filteredNotifications = filteredNotifications.filter(n => n.studentId === filters.studentId);
      }
      if (filters.type) {
        filteredNotifications = filteredNotifications.filter(n => n.type === filters.type);
      }

      if (reset) {
        setNotifications(filteredNotifications);
        setCurrentPage(1);
      } else {
        setNotifications(prev => [...prev, ...filteredNotifications]);
      }
      
      setUnreadCount(unreadCount);
      setHasMore(filteredNotifications.length === limit); // Simple check for more
      
      if (!reset) {
        setCurrentPage(prev => prev + 1);
      }
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load more notifications (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchNotifications({}, false);
  }, [hasMore, loading]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const notificationsService = getNotificationsSupabaseService();
      
      // Determine notification type by checking which table it belongs to
      const notification = notifications.find(n => n.id === id);
      if (!notification) return;
      
      let success = false;
      if (notification.studentId) {
        // School notification
        success = await notificationsService.markSchoolNotificationAsRead(id);
      } else {
        // Guardian notification
        success = await notificationsService.markGuardianNotificationAsRead(id);
      }
      
      if (success) {
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
      }
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
      setError(err.message || 'Failed to mark notification as read');
    }
  }, [notifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      if (!user) return;
      
      const notificationsService = getNotificationsSupabaseService();
      const success = await notificationsService.markAllAsRead(user.id);
      
      if (success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => ({ 
            ...notification, 
            read: true, 
            readAt: new Date() 
          }))
        );
        
        setUnreadCount(0);
      }
    } catch (err: any) {
      console.error('Failed to mark all notifications as read:', err);
      setError(err.message || 'Failed to mark all notifications as read');
    }
  }, [user]);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      // TODO: Replace with Supabase implementation
      await Promise.resolve();
      
      // Update local state
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      // Update unread count if the deleted notification was unread
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      console.error('Failed to delete notification:', err);
      setError(err.message || 'Failed to delete notification');
    }
  }, [notifications]);

  // Refresh unread count
  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const notificationsService = getNotificationsSupabaseService();
      const count = await notificationsService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (err: any) {
      console.error('Failed to refresh unread count:', err);
    }
  }, [user]);

  // Handle real-time notification events
  const handleNewNotification = useCallback((notification: Notification) => {
    console.log('Received new notification:', notification);
    
    // Add new notification to the beginning of the list
    setNotifications(prev => {
      // Check if notification already exists
      if (prev.some(n => n.id === notification.id)) {
        return prev;
      }
      return [notification, ...prev];
    });
    
    // Increment unread count if notification is unread
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // Handle notification read events
  const handleNotificationRead = useCallback((data: { notificationId: string; readAt: string }) => {
    console.log('Notification marked as read:', data);
    
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === data.notificationId 
          ? { ...notification, read: true, readAt: new Date(data.readAt) }
          : notification
      )
    );
    
    // Decrement unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Real-time notifications via Supabase
  const subscribe = useCallback((filters: { type?: NotificationType; studentId?: string } = {}) => {
    if (!user) return;
    
    // Clean up existing subscription
    setSubscriptionCleanup(prev => {
      if (prev) {
        prev();
      }
      return null;
    });
    
    const notificationsService = getNotificationsSupabaseService();
    
    const setupSubscription = async () => {
      const cleanup = await notificationsService.subscribeToNotifications(
        user.id,
        (payload) => {
          console.log('New realtime notification:', payload);
          // Refresh notifications when new ones arrive
          fetchNotifications({}, true);
        }
      );
      
      setSubscriptionCleanup(() => cleanup);
    };
    
    setupSubscription();
  }, [user, fetchNotifications]);

  // Unsubscribe from real-time notifications
  const unsubscribe = useCallback(() => {
    if (subscriptionCleanup) {
      subscriptionCleanup();
      setSubscriptionCleanup(null);
    }
  }, [subscriptionCleanup]);

  // Initialize notifications when user logs in
  useEffect(() => {
    if (user) {
      // Initialize notifications and set up realtime subscriptions
      fetchNotifications({}, true);
      
      // Set up subscription
      const notificationsService = getNotificationsSupabaseService();
      
      const setupNotificationSubscription = async () => {
        const cleanup = await notificationsService.subscribeToNotifications(
          user.id,
          (payload) => {
            console.log('New realtime notification:', payload);
            // Refresh notifications when new ones arrive
            fetchNotifications({}, true);
          }
        );
        
        setSubscriptionCleanup(() => cleanup);
      };
      
      setupNotificationSubscription();
      
      // Cleanup function
      return () => {
        if (subscriptionCleanup) {
          subscriptionCleanup();
        }
      };
    } else {
      // Clear state when user logs out
      setNotifications([]);
      setUnreadCount(0);
      setCurrentPage(1);
      setHasMore(false);
      
      // Clean up any existing subscription
      setSubscriptionCleanup(prev => {
        if (prev) {
          prev();
        }
        return null;
      });
    }
  }, [user, fetchNotifications]);

  // Refresh unread count periodically
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