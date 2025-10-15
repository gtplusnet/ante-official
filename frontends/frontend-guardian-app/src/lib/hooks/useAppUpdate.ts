import { useState, useEffect, useCallback } from 'react';
import { APP_VERSION, VERSION_CHECK_INTERVAL, hasVersionChanged } from '../config/version';

interface AppUpdateState {
  updateAvailable: boolean;
  isChecking: boolean;
  currentVersion: string;
  newVersion: string | null;
  lastChecked: Date | null;
}

export function useAppUpdate() {
  const [state, setState] = useState<AppUpdateState>({
    updateAvailable: false,
    isChecking: false,
    currentVersion: APP_VERSION,
    newVersion: null,
    lastChecked: null,
  });

  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check for updates by fetching version from server
  const checkForUpdates = useCallback(async () => {
    setState(prev => ({ ...prev, isChecking: true }));

    try {
      // Fetch version info from server with cache bypass
      const response = await fetch('/api/version', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const serverVersion = data.version;

        if (hasVersionChanged(serverVersion)) {
          setState(prev => ({
            ...prev,
            updateAvailable: true,
            newVersion: serverVersion,
            isChecking: false,
            lastChecked: new Date(),
          }));
        } else {
          setState(prev => ({
            ...prev,
            updateAvailable: false,
            isChecking: false,
            lastChecked: new Date(),
          }));
        }
      }
    } catch (error) {
      // Silently handle update check failures (network errors, API unavailable, etc.)
      // This is expected in offline mode or when API is not available
      setState(prev => ({ ...prev, isChecking: false }));
    }
  }, []);

  // Apply update by refreshing the page
  const applyUpdate = useCallback(async () => {
    if (serviceWorkerRegistration?.waiting) {
      // Tell waiting service worker to skip waiting
      serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // Give service worker time to activate
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, [serviceWorkerRegistration]);

  // Listen for service worker updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Get existing registration
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          setServiceWorkerRegistration(registration);

          // Check if there's already a waiting worker
          if (registration.waiting) {
            setState(prev => ({
              ...prev,
              updateAvailable: true,
              newVersion: 'New version available',
            }));
          }

          // Listen for new service workers
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker is ready
                  setState(prev => ({
                    ...prev,
                    updateAvailable: true,
                    newVersion: 'New version available',
                  }));
                }
              });
            }
          });
        }
      });

      // Listen for controllerchange (when new SW takes over)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // New service worker has taken control, reload the page
        window.location.reload();
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'SERVICE_WORKER_UPDATED') {
          setState(prev => ({
            ...prev,
            updateAvailable: true,
            newVersion: event.data.version || 'New version available',
          }));
        }
      });
    }
  }, []);

  // Set up periodic version checks
  useEffect(() => {
    // Check on mount
    checkForUpdates();

    // Check periodically
    const interval = setInterval(checkForUpdates, VERSION_CHECK_INTERVAL);

    // Check when app becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdates]);

  return {
    ...state,
    checkForUpdates,
    applyUpdate,
  };
}