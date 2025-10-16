'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { pushNotificationService } from '@/lib/services/push-notification.service';
import { PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
  isSupported: boolean;
  permissionGranted: boolean;
  fcmToken: string | null;
  lastNotification: PushNotificationSchema | null;
  initialize: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  showInAppNotification: (title: string, body: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<PushNotificationSchema | null>(null);
  const [inAppNotification, setInAppNotification] = useState<{ title: string; body: string } | null>(null);
  
  const router = useRouter();
  const { user } = useAuth();

  // Handle notification received (foreground)
  const handleNotificationReceived = useCallback((notification: PushNotificationSchema) => {
    console.log('Notification received:', notification);
    setLastNotification(notification);
    
    // Show in-app notification
    showInAppNotification(
      notification.title || 'New Notification',
      notification.body || ''
    );
    
    // Handle specific notification types
    if (notification.data?.type === 'attendance') {
      // Could trigger a refresh of attendance data here
      console.log('Attendance notification:', notification.data);
    }
  }, []);

  // Handle notification tap
  const handleNotificationAction = useCallback((action: ActionPerformed) => {
    console.log('Notification action:', action);
    
    const data = action.notification.data;
    
    // Navigate based on notification type
    if (data?.type === 'attendance') {
      router.push('/dashboard');
    } else if (data?.type === 'payment') {
      router.push('/tuition');
    } else if (data?.type === 'announcement') {
      router.push('/notifications');
    }
  }, [router]);

  // Handle token received
  const handleTokenReceived = useCallback((token: string) => {
    console.log('FCM token received');
    setFcmToken(token);
  }, []);

  // Handle permission denied
  const handlePermissionDenied = useCallback(() => {
    console.log('Push notification permission denied');
    setPermissionGranted(false);
  }, []);

  // Initialize push notifications
  const initialize = useCallback(async () => {
    // Check if push notifications are enabled
    const pushEnabled = process.env.NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true';
    if (!pushEnabled) {
      console.log('Push notifications are disabled via feature flag');
      return;
    }

    if (!user) {
      console.log('User not authenticated, skipping push notification initialization');
      return;
    }

    const supported = await pushNotificationService.isSupported();
    setIsSupported(supported);

    if (!supported) {
      console.log('Push notifications not supported on this device/browser');
      return;
    }

    const initialized = await pushNotificationService.initialize({
      onNotificationReceived: handleNotificationReceived,
      onNotificationActionPerformed: handleNotificationAction,
      onTokenReceived: handleTokenReceived,
      onPermissionDenied: handlePermissionDenied
    });

    setPermissionGranted(initialized);
  }, [user, handleNotificationReceived, handleNotificationAction, handleTokenReceived, handlePermissionDenied]);

  // Request permission manually
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await pushNotificationService.requestPermission();
    setPermissionGranted(granted);
    
    if (granted) {
      await initialize();
    }
    
    return granted;
  }, [initialize]);

  // Show in-app notification
  const showInAppNotification = useCallback((title: string, body: string) => {
    setInAppNotification({ title, body });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setInAppNotification(null);
    }, 5000);
  }, []);

  // Initialize on mount and when user changes
  useEffect(() => {
    if (user) {
      initialize();
    }
  }, [user, initialize]);

  // Cleanup on logout
  useEffect(() => {
    if (!user && fcmToken) {
      pushNotificationService.removeToken();
      setFcmToken(null);
      setPermissionGranted(false);
    }
  }, [user, fcmToken]);

  const value: NotificationContextValue = {
    isSupported,
    permissionGranted,
    fcmToken,
    lastNotification,
    initialize,
    requestPermission,
    showInAppNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* In-app notification display */}
      {inAppNotification && (
        <div className="fixed top-4 right-4 left-4 md:left-auto md:w-96 z-50 animate-in slide-in-from-top-2">
          <div 
            className="bg-white rounded-lg shadow-lg p-4 border border-gray-200 cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => {
              try {
                router.push('/notifications');
                setInAppNotification(null);
              } catch (error) {
                console.error('Navigation error:', error);
                setInAppNotification(null);
              }
            }}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {inAppNotification.title}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {inAppNotification.body}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInAppNotification(null);
                }}
                className="ml-4 flex-shrink-0 rounded-md text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};