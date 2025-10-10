import { ref, Ref } from 'vue';

// TODO: Migrate to Socket.io - this is a temporary stub to allow build to pass

export interface UseRealtimeSubscriptionOptions {
  immediate?: boolean;
  service?: any;
  callbacks?: {
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (err: Error) => void;
    onInsert?: (data: any) => void;
    onUpdate?: (data: any) => void;
    onDelete?: (data: any) => void;
  };
  schema?: string;
  filter?: string;
  events?: string[];
}

export interface UseRealtimeSubscriptionReturn {
  isConnected: Ref<boolean>;
  isLoading: Ref<boolean>;
  error: Ref<Error | null>;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  reconnect: () => Promise<void>;
  getStats: () => any;
}

export function useRealtimeSubscription(
  tableOrConfig: string | any,
  options: UseRealtimeSubscriptionOptions = {}
): UseRealtimeSubscriptionReturn {
  const isConnected = ref(false);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  const subscribe = async () => {
    console.warn('Realtime subscription not implemented - migrating to Socket.io');
  };

  const unsubscribe = async () => {
    // Stub
  };

  const reconnect = async () => {
    // Stub
  };

  const getStats = () => {
    return {
      subscriptionKey: 'stub',
      isConnected: false,
      subscriberCount: 0,
      globalStats: {}
    };
  };

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
