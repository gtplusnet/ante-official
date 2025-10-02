import { ref, computed, onMounted, onUnmounted, Ref, watchEffect } from 'vue';
import { api } from 'src/boot/axios';
import bus from 'src/bus';
import { NotificationService } from '../services/notification.service';
import { NotificationResponse } from '@shared/response';
import { useGlobalMethods } from './useGlobalMethods';
import { useCache } from './useCache';
import { notificationCache, CacheTTL } from '../utils/cache/implementations';

interface NotificationParams {
  isRead?: boolean;
}

type FilterType = 'all' | 'read' | 'unread';

interface UseNotificationsReturn {
  // State
  notifications: Ref<NotificationResponse[]>;
  allNotifications: Ref<NotificationResponse[]>;
  currentFilter: Ref<FilterType>;
  isLoading: Ref<boolean>;
  
  // Methods
  getNotifications: (params?: NotificationParams) => Promise<void>;
  setFilter: (filter: FilterType) => void;
  notificationClickHandler: (data: NotificationResponse) => Promise<void>;
  markAsRead: (data: NotificationResponse) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  watchSocketEvent: () => void;
}

export function useNotifications(emit?: ((event: string, ...args: unknown[]) => void) | ((event: 'update-notification-count', ...args: unknown[]) => void), onNotificationRead?: () => void): UseNotificationsReturn {
  // Get global methods
  const { handleAxiosError, socketStore } = useGlobalMethods();

  // State
  const allNotifications = ref<NotificationResponse[]>([]);
  const currentFilter = ref<FilterType>('all');
  const isLoading = ref(false);

  // Cache setup for notifications
  const fetchNotifications = async () => {
    const response = await api.get('/notification/by-account');
    return { notifications: response.data };
  };

  const {
    data: cachedData,
    load: loadCachedNotifications,
    refresh: refreshCachedNotifications,
    isRefreshing,
    isCached
  } = useCache(
    notificationCache,
    fetchNotifications,
    {
      cacheKey: 'allNotifications',
      ttl: CacheTTL.DEFAULT, // 24 hours as requested
      invalidateEvents: [
        'notification-received',
        'notification-read',
        'notification-cleared'
      ],
      autoFetch: false // We'll control loading manually
    }
  );

  // Watch for cached data changes and update allNotifications
  watchEffect(() => {
    if (cachedData.value?.notifications) {
      allNotifications.value = cachedData.value.notifications;
    }
  });

  // Update isLoading to use cache's isRefreshing
  watchEffect(() => {
    isLoading.value = isRefreshing.value && !isCached.value;
  });

  // Computed filtered notifications
  const notifications = computed(() => {
    if (currentFilter.value === 'all') {
      return allNotifications.value;
    } else if (currentFilter.value === 'unread') {
      return allNotifications.value.filter(n => !n.hasRead);
    } else if (currentFilter.value === 'read') {
      return allNotifications.value.filter(n => n.hasRead);
    }
    return allNotifications.value;
  });

  // Get all notifications using cache
  const getNotifications = async (params?: NotificationParams): Promise<void> => {
    // Set filter based on params if provided
    if (params?.isRead === false) {
      currentFilter.value = 'unread';
    } else if (params?.isRead === true) {
      currentFilter.value = 'read';
    } else {
      currentFilter.value = 'all';
    }

    // Load from cache (checks cache first, then fetches if needed)
    await loadCachedNotifications();
  };

  // Set filter without API call
  const setFilter = (filter: FilterType): void => {
    currentFilter.value = filter;
  };
  
  // Handle notification click
  const notificationClickHandler = async (data: NotificationResponse): Promise<void> => {
    try {
      // Mark as read first
      await markAsRead(data);
      
      // Handle the click via service
      await NotificationService.handleNotificationClick(data);
    } catch (error) {
      handleAxiosError(error);
    }
  };
  
  // Mark single notification as read
  const markAsRead = async (data: NotificationResponse): Promise<void> => {
    if (!data.hasRead) {
      try {
        await NotificationService.markAsRead(data.notificationData.id);

        // Update local state in allNotifications
        allNotifications.value = allNotifications.value.map((notification) => {
          if (notification.id === data.id) {
            notification.hasRead = true;
          }
          return notification;
        });

        // Refresh cache to get updated data
        refreshCachedNotifications();

        // Emit event for parent components
        (emit as ((event: string, ...args: unknown[]) => void))?.('update-notification-count');

        // Call the refresh callback if provided
        onNotificationRead?.();
      } catch (error) {
        handleAxiosError(error);
      }
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async (): Promise<void> => {
    try {
      await NotificationService.markAllAsRead();

      // Update local state in allNotifications
      allNotifications.value = allNotifications.value.map((notification) => {
        notification.hasRead = true;
        return notification;
      });

      // Refresh cache to get updated data
      refreshCachedNotifications();

      // Emit event for parent components
      emit?.('update-notification-count');

      // Call the refresh callback if provided
      onNotificationRead?.();
    } catch (error) {
      handleAxiosError(error);
    }
  };
  
  // Watch socket events
  const watchSocketEvent = (): void => {
    if (socketStore?.socket) {
      socketStore.socket.on('notification', () => {
        // Refresh cache when new notification arrives
        refreshCachedNotifications();
      });
    } else {
      setTimeout(() => {
        watchSocketEvent();
      }, 1000);
    }
  };
  
  // Handle refresh event from approval completion
  const handleRefreshEvent = () => {
    // Maintain current filter when refreshing
    const currentFilterValue = currentFilter.value;
    getNotifications().then(() => {
      currentFilter.value = currentFilterValue;
    });
    emit?.('update-notification-count');
  };
  
  // Lifecycle
  onMounted(() => {
    bus.on('refreshNotifications', handleRefreshEvent);
  });
  
  onUnmounted(() => {
    bus.off('refreshNotifications', handleRefreshEvent);
  });
  
  return {
    notifications,
    allNotifications,
    currentFilter,
    isLoading,
    getNotifications,
    setFilter,
    notificationClickHandler,
    markAsRead,
    markAllAsRead,
    watchSocketEvent,
  };
}