import { useState, useEffect, useRef, useCallback } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
}

interface PullToRefreshState {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
  canRelease: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  enabled = true
}: UsePullToRefreshOptions): PullToRefreshState {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
    canRelease: false
  });

  const touchStartY = useRef(0);
  const pullStarted = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || state.isRefreshing) return;

    const touch = e.touches[0];
    touchStartY.current = touch.clientY;

    // Check if we're at the top of the scrollable area
    const scrollElement = document.documentElement;
    const isAtTop = scrollElement.scrollTop <= 0;

    if (isAtTop) {
      pullStarted.current = true;
    }
  }, [enabled, state.isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !pullStarted.current || state.isRefreshing) return;

    const touch = e.touches[0];
    const currentY = touch.clientY;
    const distance = currentY - touchStartY.current;

    if (distance > 0) {
      // Prevent default scroll behavior when pulling
      e.preventDefault();

      // Apply resistance to make the pull feel more natural
      const resistedDistance = distance / resistance;
      const canRelease = resistedDistance >= threshold;

      setState(prev => ({
        ...prev,
        isPulling: true,
        pullDistance: resistedDistance,
        canRelease
      }));
    }
  }, [enabled, state.isRefreshing, resistance, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || !pullStarted.current || state.isRefreshing) return;

    pullStarted.current = false;

    if (state.canRelease) {
      // Trigger refresh
      setState(prev => ({ ...prev, isRefreshing: true, isPulling: false }));

      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull to refresh error:', error);
      } finally {
        setState({
          isPulling: false,
          pullDistance: 0,
          isRefreshing: false,
          canRelease: false
        });
      }
    } else {
      // Reset without refreshing
      setState({
        isPulling: false,
        pullDistance: 0,
        isRefreshing: false,
        canRelease: false
      });
    }
  }, [enabled, state.isRefreshing, state.canRelease, onRefresh]);

  useEffect(() => {
    if (!enabled) return;

    // Add passive: false to allow preventDefault in touchmove
    const options = { passive: false };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return state;
}