'use client';

import { useEffect } from 'react';

export const ServiceWorkerRegistration = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Only register service worker in production or if explicitly enabled
      const shouldRegister = process.env.NODE_ENV === 'production' || 
                           process.env.NEXT_PUBLIC_ENABLE_SW === 'true';
      
      if (!shouldRegister) {
        console.log('Service Worker registration skipped in development');
        return;
      }

      // Register Firebase messaging service worker
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
          
          // Check for updates every hour
          const updateInterval = setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
          
          // Check for updates when the page regains focus
          const handleVisibilityChange = () => {
            if (!document.hidden) {
              registration.update();
            }
          };
          
          document.addEventListener('visibilitychange', handleVisibilityChange);
          
          // Cleanup on unmount
          return () => {
            clearInterval(updateInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
          };
        })
        .catch(error => {
          // Only log errors that are not related to dev tools or extensions
          if (error.message && !error.message.includes('illegal path')) {
            console.error('Service Worker registration failed:', error);
          }
        });
    }
  }, []);

  return null;
};