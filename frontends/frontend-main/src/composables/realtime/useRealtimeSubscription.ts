import { ref, onMounted, onUnmounted, Ref } from 'vue';
import RealtimeServiceFactory from 'src/services/supabase/factories/RealtimeServiceFactory';
import subscriptionManager from 'src/services/supabase/base/RealtimeSubscriptionManager';
import { IRealtimeConfig, IRealtimeExtendedConfig } from 'src/services/supabase/interfaces/IRealtimeConfig';
import { IRealtimeCallbacks } from 'src/services/supabase/interfaces/IRealtimeSubscriber';

/**
 * Generic composable for Supabase realtime subscriptions
 * Can be used with any table by providing configuration
 */
export interface UseRealtimeSubscriptionOptions extends IRealtimeExtendedConfig {
  /**
   * Whether to subscribe immediately on mount
   */
  immediate?: boolean;

  /**
   * Custom service instance (optional)
   */
  service?: any;

  /**
   * Callbacks for realtime events
   */
  callbacks?: IRealtimeCallbacks;
}

export interface UseRealtimeSubscriptionReturn {
  /**
   * Whether the subscription is connected
   */
  isConnected: Ref<boolean>;

  /**
   * Loading state
   */
  isLoading: Ref<boolean>;

  /**
   * Error state
   */
  error: Ref<Error | null>;

  /**
   * Subscribe to realtime changes
   */
  subscribe: () => Promise<void>;

  /**
   * Unsubscribe from realtime changes
   */
  unsubscribe: () => Promise<void>;

  /**
   * Reconnect to realtime
   */
  reconnect: () => Promise<void>;

  /**
   * Get subscription statistics
   */
  getStats: () => any;
}

/**
 * Composable for managing Supabase realtime subscriptions
 * @param {String | IRealtimeConfig} tableOrConfig - Table name or full configuration
 * @param {UseRealtimeSubscriptionOptions} options - Additional options
 * @returns {UseRealtimeSubscriptionReturn} Composable return object
 */
export function useRealtimeSubscription(
  tableOrConfig: string | IRealtimeConfig,
  options: UseRealtimeSubscriptionOptions = {}
): UseRealtimeSubscriptionReturn {
  // State
  const isConnected = ref(false);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  // Service instance
  let service: any = null;
  let subscriptionKey: string = '';

  /**
   * Initialize the realtime service
   */
  const initializeService = () => {
    try {
      // Use provided service or create new one
      if (options.service) {
        service = options.service;
      } else if (typeof tableOrConfig === 'string') {
        // Create service from factory for known tables
        if (RealtimeServiceFactory.hasService(tableOrConfig)) {
          service = RealtimeServiceFactory.create(tableOrConfig, options);
        } else {
          // Create generic service for unknown tables
          service = RealtimeServiceFactory.createGeneric({
            table: tableOrConfig,
            schema: options.schema,
            filter: options.filter,
            events: options.events
          });
        }
      } else {
        // Create generic service with provided config
        service = RealtimeServiceFactory.createGeneric(tableOrConfig);
      }

      // Generate subscription key
      const config = typeof tableOrConfig === 'string' 
        ? { table: tableOrConfig, ...options }
        : tableOrConfig;
      
      subscriptionKey = generateSubscriptionKey(config);

      // Register with subscription manager to prevent duplicates
      service = subscriptionManager.register(subscriptionKey, service);

      // Set up callbacks
      if (options.callbacks || options) {
        service.setCallbacks({
          onConnect: () => {
            isConnected.value = true;
            isLoading.value = false;
            options.callbacks?.onConnect?.();
          },
          onDisconnect: () => {
            isConnected.value = false;
            options.callbacks?.onDisconnect?.();
          },
          onError: (err: Error) => {
            error.value = err;
            isLoading.value = false;
            options.callbacks?.onError?.(err);
          },
          onInsert: options.callbacks?.onInsert,
          onUpdate: options.callbacks?.onUpdate,
          onDelete: options.callbacks?.onDelete
        });
      }
    } catch (err) {
      error.value = err as Error;
      console.error('Failed to initialize realtime service:', err);
      throw err;
    }
  };

  /**
   * Subscribe to realtime changes
   */
  const subscribe = async () => {
    if (!service) {
      initializeService();
    }

    if (service.isSubscribed()) {
      console.log('Already subscribed to realtime');
      return;
    }

    try {
      isLoading.value = true;
      error.value = null;
      await service.subscribe();
      isConnected.value = true;
    } catch (err) {
      error.value = err as Error;
      console.error('Failed to subscribe to realtime:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Unsubscribe from realtime changes
   */
  const unsubscribe = async () => {
    if (!service) {
      return;
    }

    try {
      await subscriptionManager.unregister(subscriptionKey);
      isConnected.value = false;
      error.value = null;
    } catch (err) {
      error.value = err as Error;
      console.error('Failed to unsubscribe from realtime:', err);
    }
  };

  /**
   * Reconnect to realtime
   */
  const reconnect = async () => {
    await unsubscribe();
    await subscribe();
  };

  /**
   * Get subscription statistics
   */
  const getStats = () => {
    return {
      subscriptionKey,
      isConnected: isConnected.value,
      subscriberCount: subscriptionManager.getSubscriberCount(subscriptionKey),
      globalStats: subscriptionManager.getStats()
    };
  };

  // Lifecycle hooks
  onMounted(async () => {
    if (options.immediate !== false) {
      try {
        await subscribe();
      } catch (err) {
        console.error('Failed to auto-subscribe on mount:', err);
      }
    }
  });

  onUnmounted(async () => {
    await unsubscribe();
  });

  return {
    isConnected,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    reconnect,
    getStats
  };
}

/**
 * Generate a unique subscription key based on configuration
 * @private
 * @param {IRealtimeConfig} config - Realtime configuration
 * @returns {String} Subscription key
 */
function generateSubscriptionKey(config: IRealtimeConfig): string {
  const parts = [
    config.schema || 'public',
    config.table,
    config.filter || 'no-filter'
  ];
  
  return parts.join(':');
}