import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { getFirebaseMessaging, FIREBASE_VAPID_KEY } from '@/lib/firebase/config';
import { getToken, onMessage } from 'firebase/messaging';
import { apiClient } from '@/lib/api/api-client';
import { Capacitor } from '@capacitor/core';
import { detectBrowser } from '@/lib/utils/browser-detection';
import { getStoredTokens } from '@/lib/utils/storage';

export interface NotificationHandlers {
  onNotificationReceived?: (notification: PushNotificationSchema) => void;
  onNotificationActionPerformed?: (notification: ActionPerformed) => void;
  onTokenReceived?: (token: string) => void;
  onPermissionDenied?: () => void;
  onRegistrationError?: (error: string) => void;
  onRegistrationSuccess?: () => void;
}

export interface RegistrationStatus {
  tokenObtained: boolean;
  tokenRegistered: boolean;
  error?: string;
}

class PushNotificationService {
  private initialized = false;
  private fcmToken: string | null = null;
  private handlers: NotificationHandlers = {};
  private registrationError: string | null = null;
  private registrationStatus: 'idle' | 'registering' | 'registered' | 'failed' = 'idle';

  /**
   * Initialize push notifications
   */
  async initialize(handlers?: NotificationHandlers): Promise<boolean> {
    console.log('🚀 [Push] Starting push notification initialization...');
    
    if (this.initialized) {
      console.log('✅ [Push] Push notifications already initialized');
      return true;
    }

    if (handlers) {
      this.handlers = handlers;
      console.log('📝 [Push] Handlers registered:', Object.keys(handlers));
    }

    try {
      const isNative = Capacitor.isNativePlatform();
      console.log('📱 [Push] Platform detected:', isNative ? 'Native (iOS/Android)' : 'Web');
      
      if (isNative) {
        // Native platform (iOS/Android)
        return await this.initializeNative();
      } else {
        // Web platform
        return await this.initializeWeb();
      }
    } catch (error) {
      console.error('❌ [Push] Failed to initialize push notifications:', error);
      return false;
    }
  }

  /**
   * Initialize for native platforms (iOS/Android)
   */
  private async initializeNative(): Promise<boolean> {
    try {
      // Request permission
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission denied');
        this.handlers.onPermissionDenied?.();
        return false;
      }

      // Register with Apple/Google
      await PushNotifications.register();

      // Add listeners
      await this.addNativeListeners();

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize native push notifications:', error);
      return false;
    }
  }

  /**
   * Initialize for web platform
   */
  private async initializeWeb(): Promise<boolean> {
    try {
      console.log('🔔 [Push] Starting web push notification initialization...');
      
      // Check browser compatibility first
      const browserInfo = detectBrowser();
      console.log('🌐 [Push] Browser detected:', browserInfo.browserName, 'on', browserInfo.platformName);
      
      if (!browserInfo.supportsNotifications) {
        console.log('❌ [Push] Browser does not support notifications:', browserInfo.notificationSupportReason);
        return false;
      }
      
      const messaging = await getFirebaseMessaging();
      if (!messaging) {
        console.log('❌ [Push] Firebase messaging not supported in this browser');
        return false;
      }
      console.log('✅ [Push] Firebase messaging supported');

      // Check current permission
      const currentPermission = Notification.permission;
      console.log('🔐 [Push] Current notification permission:', currentPermission);

      // Request permission if needed
      let permission = currentPermission;
      if (permission === 'default') {
        console.log('🔄 [Push] Requesting notification permission...');
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        console.log('❌ [Push] Web push notification permission denied. Current state:', permission);
        this.handlers.onPermissionDenied?.();
        return false;
      }
      console.log('✅ [Push] Notification permission granted');

      // Check VAPID key - use hardcoded fallback if env var not available (PM2 doesn't load .env.local)
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || FIREBASE_VAPID_KEY;
      console.log('🔑 [Push] VAPID key configured:', vapidKey ? 'Yes' : 'No');
      console.log('🔑 [Push] VAPID key source:', process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ? 'Environment' : 'Hardcoded');
      console.log('🔑 [Push] VAPID key preview:', vapidKey ? vapidKey.substring(0, 20) + '...' : 'Not found');

      if (!vapidKey) {
        console.error('❌ [Push] VAPID key not found in environment variables or config');
        return false;
      }

      // Get FCM token
      console.log('🔄 [Push] Requesting FCM token...');
      const token = await getToken(messaging, {
        vapidKey: vapidKey
      });

      if (token) {
        console.log('✅ [Push] FCM token received:', token.substring(0, 50) + '...');
        this.fcmToken = token;
        await this.registerToken(token);
        this.handlers.onTokenReceived?.(token);
      } else {
        console.error('❌ [Push] Failed to retrieve FCM token');
        return false;
      }

      // Handle foreground messages
      onMessage(messaging, async (payload) => {
        console.log('📨 [Push] Foreground message received:', payload);
        
        const notification: PushNotificationSchema = {
          title: payload.notification?.title || '',
          body: payload.notification?.body || '',
          id: payload.messageId || '',
          data: payload.data || {}
        };

        // Show notification even in foreground
        try {
          await this.showLocalNotification(
            notification.title || 'New Notification',
            notification.body || 'You have a new message',
            notification.data
          );
        } catch (error) {
          console.error('❌ [Push] Failed to show foreground notification:', error);
        }

        this.handlers.onNotificationReceived?.(notification);
      });

      this.initialized = true;
      console.log('✅ [Push] Web push notifications initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ [Push] Failed to initialize web push notifications:', error);
      return false;
    }
  }

  /**
   * Add listeners for native platforms
   */
  private async addNativeListeners(): Promise<void> {
    // Handle registration
    await PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token:', token.value);
      this.fcmToken = token.value;
      await this.registerToken(token.value);
      this.handlers.onTokenReceived?.(token.value);
    });

    // Handle registration error
    await PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration:', error);
    });

    // Handle foreground notifications
    await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
      this.handlers.onNotificationReceived?.(notification);
    });

    // Handle notification tap
    await PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push notification action performed:', notification);
      this.handlers.onNotificationActionPerformed?.(notification);
    });
  }

  /**
   * Register FCM token with backend (with retry logic)
   */
  private async registerToken(token: string): Promise<void> {
    this.registrationStatus = 'registering';
    this.registrationError = null;
    
    try {
      console.log('🔄 [Push] Registering device token with backend...');
      console.log('📱 [Push] Token to register:', token.substring(0, 50) + '...');
      
      // Check if authenticated first
      const tokens = await getStoredTokens();
      if (!tokens?.accessToken) {
        const errorMsg = 'Not authenticated - please login again';
        console.error('🔐 [Push] Auth check failed:', errorMsg);
        this.registrationError = errorMsg;
        this.registrationStatus = 'failed';
        this.handlers.onRegistrationError?.(errorMsg);
        throw new Error(errorMsg);
      }
      console.log('🔐 [Push] Auth check passed');
      
      // Detect platform
      const platform = Capacitor.isNativePlatform() 
        ? Capacitor.getPlatform() // 'ios' or 'android'
        : 'web';
      
      // Get or generate device ID
      let deviceId = localStorage.getItem('deviceId');
      if (!deviceId) {
        deviceId = `web-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('deviceId', deviceId);
      }
      
      const payload = { 
        token,
        platform,
        deviceId
      };
      
      console.log('📊 [Push] Registration payload:', { ...payload, token: token.substring(0, 50) + '...' });
      
      // Retry logic (3 attempts with 1 second delay)
      let retries = 3;
      let lastError: any = null;
      
      while (retries > 0) {
        try {
          console.log(`🚀 [Push] Registration attempt ${4 - retries}/3...`);
          const response = await apiClient.post('/api/guardian/device-token', payload);
          console.log('✅ [Push] Device token registered successfully:', response);
          this.registrationStatus = 'registered';
          this.handlers.onRegistrationSuccess?.();
          return; // Success!
        } catch (error: any) {
          lastError = error;
          
          // Check for authentication errors (don't retry)
          if (error.response?.status === 401 || error.code === 'UNAUTHENTICATED') {
            const errorMsg = 'Session expired - please login again';
            console.error('🔐 [Push] Authentication error:', errorMsg);
            this.registrationError = errorMsg;
            this.registrationStatus = 'failed';
            this.handlers.onRegistrationError?.(errorMsg);
            throw new Error(errorMsg);
          }
          
          retries--;
          if (retries > 0) {
            console.log(`⚠️ [Push] Registration failed, retrying in 1s... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // All retries failed
      const errorMsg = lastError?.message || 'Failed to register device token after 3 attempts';
      console.error('❌ [Push] All registration attempts failed:', errorMsg);
      console.error('❌ [Push] Error details:', {
        status: lastError?.response?.status,
        statusText: lastError?.response?.statusText,
        data: lastError?.response?.data,
        message: lastError?.message
      });
      this.registrationError = errorMsg;
      this.registrationStatus = 'failed';
      this.handlers.onRegistrationError?.(errorMsg);
      throw lastError;
      
    } catch (error: any) {
      // Error already logged and handled above
      throw error;
    }
  }

  /**
   * Remove FCM token from backend
   */
  async removeToken(): Promise<void> {
    if (!this.fcmToken) return;

    try {
      await apiClient.delete(`/api/guardian/device-token/${encodeURIComponent(this.fcmToken)}`);
      console.log('Device token removed from backend');
    } catch (error) {
      console.error('Failed to remove device token:', error);
    }
  }

  /**
   * Get current FCM token
   */
  getToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Check if push notifications are supported
   */
  async isSupported(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      return true;
    }

    // Use browser detection for better compatibility checks
    const browserInfo = detectBrowser();
    if (!browserInfo.supportsNotifications) {
      console.log('🚫 [Push] Not supported:', browserInfo.notificationSupportReason);
      return false;
    }

    // Check web support
    if (!('Notification' in window)) {
      return false;
    }

    const messaging = await getFirebaseMessaging();
    return messaging !== null;
  }

  /**
   * Request permission (useful for re-requesting after initial denial)
   */
  async requestPermission(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      const permStatus = await PushNotifications.requestPermissions();
      return permStatus.receive === 'granted';
    } else {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
  }

  /**
   * Create a local notification (for testing or custom notifications)
   */
  async showLocalNotification(title: string, body: string, data?: any): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      // Use service worker for web notifications
      if (Notification.permission === 'granted') {
        try {
          // Get service worker registration
          const registration = await navigator.serviceWorker.ready;
          
          // Show notification through service worker
          await registration.showNotification(title, {
            body,
            icon: '/logo-192.png',
            badge: '/logo-192.png',
            data,
            tag: 'local-notification',
            requireInteraction: false
          });
          
          console.log('✅ [Push] Local notification shown through service worker');
        } catch (fallbackError) {
          // Fallback for desktop browsers that support direct Notification API
          try {
            new Notification(title, {
              body,
              icon: '/logo-192.png',
              badge: '/logo-192.png',
              data
            });
            console.log('✅ [Push] Local notification shown through Notification API');
          } catch (desktopError) {
            console.error('❌ [Push] Failed to show notification:', desktopError);
            throw fallbackError; // Throw the original service worker error
          }
        }
      } else {
        console.warn('⚠️ [Push] Notification permission not granted');
      }
    }
    // For native platforms, you would use Local Notifications plugin
  }

  /**
   * Get current registration status
   */
  async getRegistrationStatus(): Promise<RegistrationStatus> {
    return {
      tokenObtained: !!this.fcmToken,
      tokenRegistered: this.registrationStatus === 'registered',
      error: this.registrationError || undefined,
    };
  }

  /**
   * Retry token registration manually
   */
  async retryRegistration(): Promise<boolean> {
    if (!this.fcmToken) {
      console.error('❌ [Push] No FCM token available to register');
      return false;
    }

    try {
      console.log('🔄 [Push] Manually retrying token registration...');
      await this.registerToken(this.fcmToken);
      return true;
    } catch (error) {
      console.error('❌ [Push] Manual retry failed:', error);
      return false;
    }
  }

  /**
   * Get current registration error
   */
  getRegistrationError(): string | null {
    return this.registrationError;
  }

  /**
   * Get current registration status string
   */
  getRegistrationStatusString(): 'idle' | 'registering' | 'registered' | 'failed' {
    return this.registrationStatus;
  }
}

export const pushNotificationService = new PushNotificationService();