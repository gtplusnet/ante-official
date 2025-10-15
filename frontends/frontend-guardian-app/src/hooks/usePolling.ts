import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for polling data at regular intervals
 * Automatically stops when component unmounts or when page is hidden
 *
 * @param callback - Function to call on each poll
 * @param interval - Polling interval in milliseconds (default: 30000ms = 30s)
 * @param options - Additional options
 */
export function usePolling(
  callback: () => void | Promise<void>,
  interval: number = 30000,
  options?: {
    enabled?: boolean;
    runOnMount?: boolean;
    stopWhenHidden?: boolean;
  }
) {
  const {
    enabled = true,
    runOnMount = false,
    stopWhenHidden = true,
  } = options || {};

  const savedCallback = useRef(callback);
  const intervalId = useRef<NodeJS.Timeout | null>(null);
  const isPolling = useRef(false);

  // Update the saved callback whenever it changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Start polling
  const startPolling = useCallback(() => {
    if (isPolling.current || !enabled) return;

    isPolling.current = true;

    // Run immediately if runOnMount is true
    if (runOnMount) {
      savedCallback.current();
    }

    // Set up interval
    intervalId.current = setInterval(() => {
      savedCallback.current();
    }, interval);

    console.log(`[usePolling] Started polling (interval: ${interval}ms)`);
  }, [interval, enabled, runOnMount]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
    isPolling.current = false;
    console.log('[usePolling] Stopped polling');
  }, []);

  // Restart polling (useful for changing interval)
  const restartPolling = useCallback(() => {
    stopPolling();
    startPolling();
  }, [stopPolling, startPolling]);

  // Handle page visibility change
  useEffect(() => {
    if (!stopWhenHidden) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[usePolling] Page hidden - stopping polling');
        stopPolling();
      } else {
        console.log('[usePolling] Page visible - resuming polling');
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stopPolling, startPolling, stopWhenHidden]);

  // Main polling effect
  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]);

  return {
    isPolling: isPolling.current,
    startPolling,
    stopPolling,
    restartPolling,
  };
}
