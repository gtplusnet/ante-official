import { ref, onMounted, onUnmounted, watch, Ref, getCurrentInstance } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { CacheManager, CacheTTL } from '../utils/cache/CacheManager';

export interface UseCacheOptions {
  cacheKey?: any;
  invalidateEvents?: string[];
  ttl?: number;
  refreshInterval?: number;
  autoFetch?: boolean;
}

export interface UseCacheReturn<T> {
  data: Ref<T | null>;
  isCached: Ref<boolean>;
  isRefreshing: Ref<boolean>;
  error: Ref<Error | null>;
  lastUpdated: Ref<Date | null>;
  refresh: () => Promise<void>;
  load: () => Promise<void>;
  invalidate: () => void;
}

/**
 * Vue composable for cache operations with account switching support
 *
 * @param cacheManager - The cache manager instance to use
 * @param fetchFn - Function to fetch fresh data
 * @param options - Cache options
 */
export function useCache<T>(
  cacheManager: CacheManager<T>,
  fetchFn: () => Promise<T>,
  options: UseCacheOptions = {}
): UseCacheReturn<T> {
  // Get instance for event bus
  const instance = getCurrentInstance();
  const bus = instance?.appContext.config.globalProperties.$bus;
  const authStore = useAuthStore();

  // Reactive state
  const data = ref<T | null>(null);
  const isCached = ref(false);
  const isRefreshing = ref(false);
  const error = ref<Error | null>(null);
  const lastUpdated = ref<Date | null>(null);

  // Track cleanup functions
  const cleanupFunctions: (() => void)[] = [];
  let refreshIntervalId: NodeJS.Timeout | null = null;

  /**
   * Helper to get the current cache key value
   * Supports both static values and dynamic functions
   */
  const getCacheKey = () => {
    const key = options.cacheKey;
    if (typeof key === 'function') {
      return key();
    }
    return key || 'default';
  };

  /**
   * Load data with cache check
   */
  const loadData = async (forceRefresh = false): Promise<void> => {
    const accountId = authStore.accountInformation?.id;
    if (!accountId) {
      console.warn('[useCache] No account ID available, skipping cache operations');
      return;
    }

    // Reset error state
    error.value = null;

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      try {
        const cached = cacheManager.get(getCacheKey(), accountId);
        if (cached) {
          data.value = cached;
          isCached.value = true;
          lastUpdated.value = cacheManager.getLastUpdated(getCacheKey(), accountId);

          // Start background refresh
          isRefreshing.value = true;
          // Don't await - let it run in background
          fetchFreshData(accountId);
          return;
        }
      } catch (err) {
        console.error('[useCache] Error reading cache:', err);
      }
    }

    // No cache or forced refresh - fetch fresh data
    isRefreshing.value = true;
    await fetchFreshData(accountId);
  };

  /**
   * Fetch fresh data and update cache
   */
  const fetchFreshData = async (accountId: string): Promise<void> => {
    try {
      const freshData = await fetchFn();
      data.value = freshData;

      // Save to cache with TTL (default 24 hours)
      cacheManager.set(
        getCacheKey(),
        freshData,
        accountId,
        options.ttl || CacheTTL.DEFAULT
      );

      isCached.value = false;
      lastUpdated.value = new Date();
    } catch (err) {
      // Check if this is a canceled request
      if (axios.isCancel(err)) {
        // Don't log or set error state for canceled requests
        // This is an expected behavior when requests are intentionally canceled
        return;
      }

      error.value = err as Error;
      console.error('[useCache] Error fetching data:', err);

      // If we have cached data and fetch fails, keep showing cached data
      if (!data.value) {
        throw err;
      }
    } finally {
      isRefreshing.value = false;
    }
  };

  /**
   * Invalidate cache and refresh
   */
  const invalidate = (): void => {
    const accountId = authStore.accountInformation?.id;
    if (accountId) {
      // Clear specific cache entry
      cacheManager.clear(accountId);
    }
  };

  /**
   * Public refresh method - forces fresh fetch
   */
  const refresh = async (): Promise<void> => {
    await loadData(true);
  };

  /**
   * Public load method - checks cache first
   */
  const load = async (): Promise<void> => {
    await loadData(false);
  };

  // Watch for account changes
  const stopWatcher = watch(
    () => authStore.accountInformation?.id,
    (newId, oldId) => {
      if (newId && newId !== oldId) {
        console.log('[useCache] Account changed, invalidating cache and reloading');
        // Account changed - invalidate and refetch
        cacheManager.onAccountSwitch(newId, oldId);
        loadData(true);
      }
    },
    { immediate: false }
  );
  cleanupFunctions.push(() => stopWatcher());

  // Setup event listeners
  onMounted(() => {
    // Initial load if autoFetch is enabled (default true)
    if (options.autoFetch !== false) {
      loadData();
    }

    // Listen for account-switched event
    if (bus) {
      const handleAccountSwitch = () => {
        console.log('[useCache] Account switched event received');
        loadData(true);
      };
      bus.on('account-switched', handleAccountSwitch);
      cleanupFunctions.push(() => bus.off('account-switched', handleAccountSwitch));

      // Listen for logout event
      const handleLogout = () => {
        console.log('[useCache] Logout event received');
        data.value = null;
        isCached.value = false;
        isRefreshing.value = false;
        lastUpdated.value = null;
      };
      bus.on('logout', handleLogout);
      cleanupFunctions.push(() => bus.off('logout', handleLogout));

      // Custom invalidation events
      if (options.invalidateEvents) {
        options.invalidateEvents.forEach(event => {
          const handler = () => {
            console.log(`[useCache] Invalidation event received: ${event}`);
            loadData(true);
          };
          bus.on(event, handler);
          cleanupFunctions.push(() => bus.off(event, handler));
        });
      }
    }

    // Auto-refresh interval if specified
    if (options.refreshInterval) {
      refreshIntervalId = setInterval(() => {
        console.log('[useCache] Auto-refresh triggered');
        loadData(true);
      }, options.refreshInterval);
    }
  });

  // Cleanup on unmount
  onUnmounted(() => {
    // Clean up all event listeners
    cleanupFunctions.forEach(cleanup => cleanup());

    // Clear refresh interval
    if (refreshIntervalId) {
      clearInterval(refreshIntervalId);
    }
  });

  return {
    data,
    isCached,
    isRefreshing,
    error,
    lastUpdated,
    refresh,
    load,
    invalidate
  };
}

/**
 * Simplified cache hook for common use cases
 */
export function useCachedData<T>(
  cacheManager: CacheManager<T>,
  apiEndpoint: string,
  options: UseCacheOptions = {}
) {
  const instance = getCurrentInstance();
  const api = instance?.proxy?.$api;

  if (!api) {
    throw new Error('[useCachedData] API instance not available');
  }

  return useCache(
    cacheManager,
    async () => {
      const response = await api.get(apiEndpoint);
      return response.data;
    },
    options
  );
}