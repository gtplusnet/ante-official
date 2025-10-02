import { ref, computed, Ref } from 'vue';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { NotificationResponse } from '@shared/response';
import { useAuthStore } from 'src/stores/auth';
import supabaseDatabaseService from 'src/services/supabase/supabaseDatabase.service';

/**
 * Notification realtime composable
 * Handles realtime updates for notifications with full data fetching
 */
export interface UseNotificationRealtimeReturn {
  // State
  notifications: Ref<NotificationResponse[]>;
  isConnected: Ref<boolean>;
  isLoading: Ref<boolean>;
  error: Ref<Error | null>;
  unreadCount: Ref<number>;

  // Methods
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  fetchAllNotifications: (params?: any) => Promise<void>;
  fetchNotification: (id: string | number) => Promise<NotificationResponse | null>;
  updateLocalNotification: (id: string | number, updates: Partial<NotificationResponse>) => void;
  removeLocalNotification: (id: string | number) => void;
  markAsRead: (notificationId: string | number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export function useNotificationRealtime(
  existingNotifications?: Ref<NotificationResponse[]>
): UseNotificationRealtimeReturn {
  const authStore = useAuthStore();

  // State
  const notifications = existingNotifications || ref<NotificationResponse[]>([]);
  const isLoadingFetch = ref(false);

  // Computed
  const unreadCount = computed(() => 
    notifications.value.filter(n => !n.hasRead).length
  );

  /**
   * Fetch full notification data by ID using Supabase
   * @param {String|Number} id - Notification ID
   * @returns {Promise<NotificationResponse|null>} Full notification data
   */
  const fetchNotification = async (id: string | number): Promise<NotificationResponse | null> => {
    try {
      const notification = await supabaseDatabaseService.fetchNotificationById(id);
      return notification as NotificationResponse;
    } catch (error) {
      console.error('Error fetching notification:', error);
      return null;
    }
  };

  /**
   * Update a notification in local state
   * @param {String|Number} id - Notification ID
   * @param {Object} updates - Fields to update
   */
  const updateLocalNotification = (id: string | number, updates: Partial<NotificationResponse>) => {
    const index = notifications.value.findIndex(n => n.id === id.toString());
    if (index !== -1) {
      notifications.value[index] = {
        ...notifications.value[index],
        ...updates
      };
    }
  };

  /**
   * Remove a notification from local state
   * @param {String|Number} id - Notification ID
   */
  const removeLocalNotification = (id: string | number) => {
    const index = notifications.value.findIndex(n => n.id === id.toString());
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  };

  /**
   * Fetch all notifications from Supabase
   * @param {Object} params - Optional parameters
   */
  const fetchAllNotifications = async (params?: any): Promise<void> => {
    try {
      isLoadingFetch.value = true;
      const userId = authStore.accountInformation?.id;
      
      if (!userId) {
        console.error('No user ID available');
        return;
      }

      const fetchedNotifications = await supabaseDatabaseService.fetchNotifications(userId, params);
      notifications.value = fetchedNotifications as NotificationResponse[];
      console.log(`Fetched ${fetchedNotifications.length} notifications from Supabase`);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      isLoadingFetch.value = false;
    }
  };

  /**
   * Mark a notification as read
   * @param {String|Number} notificationId - Notification ID
   */
  const markAsRead = async (notificationId: string | number): Promise<void> => {
    try {
      const success = await supabaseDatabaseService.markAsRead(notificationId);
      
      if (success) {
        updateLocalNotification(notificationId, { hasRead: true });
        console.log(`Marked notification ${notificationId} as read`);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async (): Promise<void> => {
    try {
      const userId = authStore.accountInformation?.id;
      
      if (!userId) {
        console.error('No user ID available');
        return;
      }

      const success = await supabaseDatabaseService.markAllAsRead(userId);
      
      if (success) {
        // Update all local notifications
        notifications.value = notifications.value.map(n => ({
          ...n,
          hasRead: true
        }));
        console.log('Marked all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  /**
   * Handle INSERT event - fetch and add new notification
   * @private
   */
  const handleInsert = async (payload: any) => {
    try {
      isLoadingFetch.value = true;
      
      // Extract notification ID from payload
      const notificationId = payload.id || payload.notificationId;
      
      if (!notificationId) {
        console.error('No notification ID in INSERT payload');
        return;
      }

      // Check if notification already exists (prevent duplicates)
      const exists = notifications.value.some(n => n.id === notificationId.toString());
      if (exists) {
        console.log('Notification already exists, skipping INSERT');
        return;
      }

      // Fetch full notification data
      const fullNotification = await fetchNotification(notificationId);
      
      if (fullNotification) {
        // Add to beginning of array (newest first)
        notifications.value.unshift(fullNotification);
        console.log('Added new notification via realtime:', notificationId);
      }
    } catch (error) {
      console.error('Error handling notification INSERT:', error);
    } finally {
      isLoadingFetch.value = false;
    }
  };

  /**
   * Handle UPDATE event - update existing notification
   * @private
   */
  const handleUpdate = async (payload: any) => {
    try {
      // Extract updated fields
      const updates = payload.new || payload;
      const notificationId = updates.id || updates.notificationId;
      
      if (!notificationId) {
        console.error('No notification ID in UPDATE payload');
        return;
      }

      // Update specific fields that commonly change
      const localUpdates: Partial<NotificationResponse> = {};
      
      if ('hasRead' in updates) {
        localUpdates.hasRead = updates.hasRead;
      }
      
      if ('isDeleted' in updates) {
        // If marked as deleted, remove from list
        if (updates.isDeleted) {
          removeLocalNotification(notificationId);
          return;
        }
      }

      // Apply updates to local state
      updateLocalNotification(notificationId, localUpdates);
      console.log('Updated notification via realtime:', notificationId);

      // Optionally fetch full data if significant changes detected
      if (Object.keys(localUpdates).length === 0) {
        // Unknown changes, fetch full data
        const fullNotification = await fetchNotification(notificationId);
        if (fullNotification) {
          updateLocalNotification(notificationId, fullNotification);
        }
      }
    } catch (error) {
      console.error('Error handling notification UPDATE:', error);
    }
  };

  /**
   * Handle DELETE event - remove notification
   * @private
   */
  const handleDelete = (payload: any) => {
    try {
      const notificationId = payload.id || payload.notificationId;
      
      if (!notificationId) {
        console.error('No notification ID in DELETE payload');
        return;
      }

      removeLocalNotification(notificationId);
      console.log('Removed notification via realtime:', notificationId);
    } catch (error) {
      console.error('Error handling notification DELETE:', error);
    }
  };

  // Initialize realtime subscription
  const realtimeSubscription = useRealtimeSubscription('AccountNotifications', {
    immediate: false, // Don't auto-subscribe, wait for explicit call
    filter: `receiverId=eq.${authStore.accountInformation?.id}`,
    callbacks: {
      onInsert: handleInsert,
      onUpdate: handleUpdate,
      onDelete: handleDelete,
      onConnect: () => {
        console.log('Notification realtime connected');
      },
      onDisconnect: () => {
        console.log('Notification realtime disconnected');
      },
      onError: (error) => {
        console.error('Notification realtime error:', error);
      }
    }
  });

  return {
    // State
    notifications,
    isConnected: realtimeSubscription.isConnected,
    isLoading: computed(() => realtimeSubscription.isLoading.value || isLoadingFetch.value),
    error: realtimeSubscription.error,
    unreadCount,

    // Methods
    subscribe: realtimeSubscription.subscribe,
    unsubscribe: realtimeSubscription.unsubscribe,
    fetchAllNotifications,
    fetchNotification,
    updateLocalNotification,
    removeLocalNotification,
    markAsRead,
    markAllAsRead
  };
}