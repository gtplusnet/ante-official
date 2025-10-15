import { ref, computed, Ref } from 'vue';
import { NotificationResponse } from '@shared/response';

// TODO: Migrate to Socket.io and backend API - this is a temporary stub to allow build to pass

export interface UseNotificationRealtimeReturn {
  notifications: Ref<NotificationResponse[]>;
  isConnected: Ref<boolean>;
  isLoading: Ref<boolean>;
  error: Ref<Error | null>;
  unreadCount: Ref<number>;
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
  const notifications = existingNotifications || ref<NotificationResponse[]>([]);
  const isConnected = ref(false);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  const unreadCount = computed(() =>
    notifications.value.filter(n => !n.hasRead).length
  );

  const subscribe = async () => {
    console.warn('Notification realtime not implemented - migrating to Socket.io');
  };

  const unsubscribe = async () => {
    // Stub
  };

  const fetchAllNotifications = async (params?: any) => {
    console.warn('Fetch notifications not implemented - use backend API');
  };

  const fetchNotification = async (id: string | number) => {
    console.warn('Fetch notification not implemented - use backend API');
    return null;
  };

  const updateLocalNotification = (id: string | number, updates: Partial<NotificationResponse>) => {
    const index = notifications.value.findIndex(n => n.id === id.toString());
    if (index !== -1) {
      notifications.value[index] = {
        ...notifications.value[index],
        ...updates
      };
    }
  };

  const removeLocalNotification = (id: string | number) => {
    const index = notifications.value.findIndex(n => n.id === id.toString());
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  };

  const markAsRead = async (notificationId: string | number) => {
    console.warn('Mark as read not implemented - use backend API');
  };

  const markAllAsRead = async () => {
    console.warn('Mark all as read not implemented - use backend API');
  };

  return {
    notifications,
    isConnected,
    isLoading,
    error,
    unreadCount,
    subscribe,
    unsubscribe,
    fetchAllNotifications,
    fetchNotification,
    updateLocalNotification,
    removeLocalNotification,
    markAsRead,
    markAllAsRead
  };
}
