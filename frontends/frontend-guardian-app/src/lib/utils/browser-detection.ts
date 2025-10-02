/**
 * Browser and platform detection utilities
 */

export interface BrowserInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  isIOSChrome: boolean;
  isIOSSafari: boolean;
  isStandalone: boolean;
  isMobile: boolean;
  isPWA: boolean;
  browserName: string;
  platformName: string;
  supportsNotifications: boolean;
  notificationSupportReason?: string;
}

/**
 * Detect browser and platform information
 */
export function detectBrowser(): BrowserInfo {
  if (typeof window === 'undefined') {
    return getDefaultBrowserInfo();
  }

  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';
  
  // Platform detection
  const isIOS = /iphone|ipad|ipod/.test(ua) || (platform.startsWith('mac') && navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(ua);
  const isMobile = isIOS || isAndroid || /mobile/.test(ua);
  
  // Browser detection
  const isSafari = /safari/.test(ua) && !/chrome/.test(ua) && !/crios/.test(ua);
  const isChrome = /chrome/.test(ua) && !/edg/.test(ua);
  const isFirefox = /firefox/.test(ua);
  const isEdge = /edg/.test(ua);
  
  // iOS specific browser detection
  const isIOSChrome = isIOS && (/crios/.test(ua) || (isChrome && !isSafari));
  const isIOSSafari = isIOS && isSafari;
  
  // PWA detection
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true ||
                      document.referrer.includes('android-app://');
  
  const isPWA = isStandalone;
  
  // Determine browser name
  let browserName = 'Unknown';
  if (isIOSChrome) browserName = 'Chrome on iOS';
  else if (isIOSSafari) browserName = 'Safari on iOS';
  else if (isChrome) browserName = 'Chrome';
  else if (isSafari) browserName = 'Safari';
  else if (isFirefox) browserName = 'Firefox';
  else if (isEdge) browserName = 'Edge';
  
  // Platform name
  let platformName = 'Unknown';
  if (isIOS) platformName = 'iOS';
  else if (isAndroid) platformName = 'Android';
  else if (platform.includes('win')) platformName = 'Windows';
  else if (platform.includes('mac')) platformName = 'macOS';
  else if (platform.includes('linux')) platformName = 'Linux';
  
  // Notification support detection
  const { supported, reason } = checkNotificationSupport(browserName, platformName, isStandalone);
  
  return {
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isFirefox,
    isEdge,
    isIOSChrome,
    isIOSSafari,
    isStandalone,
    isMobile,
    isPWA,
    browserName,
    platformName,
    supportsNotifications: supported,
    notificationSupportReason: reason
  };
}

/**
 * Check if notifications are supported for current browser/platform
 */
function checkNotificationSupport(browserName: string, platformName: string, isStandalone: boolean): { supported: boolean; reason?: string } {
  // Check basic API support
  if (!('Notification' in window)) {
    return { supported: false, reason: 'Notification API not available' };
  }
  
  if (!('serviceWorker' in navigator)) {
    return { supported: false, reason: 'Service Workers not supported' };
  }
  
  // iOS Chrome never supports notifications
  if (browserName === 'Chrome on iOS') {
    return { 
      supported: false, 
      reason: 'Chrome on iOS does not support push notifications. Please use Safari and add this app to your home screen.' 
    };
  }
  
  // Safari on iOS only supports notifications in standalone mode (PWA)
  if (browserName === 'Safari on iOS' && !isStandalone) {
    return { 
      supported: false, 
      reason: 'Safari on iOS only supports notifications when the app is added to your home screen.' 
    };
  }
  
  // All other browsers should support notifications
  return { supported: true };
}

/**
 * Get default browser info for SSR
 */
function getDefaultBrowserInfo(): BrowserInfo {
  return {
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    isFirefox: false,
    isEdge: false,
    isIOSChrome: false,
    isIOSSafari: false,
    isStandalone: false,
    isMobile: false,
    isPWA: false,
    browserName: 'Unknown',
    platformName: 'Unknown',
    supportsNotifications: false,
    notificationSupportReason: 'Running on server'
  };
}

/**
 * Check if the current browser is iOS Safari
 */
export function isIOSSafari(): boolean {
  const info = detectBrowser();
  return info.isIOSSafari;
}

/**
 * Check if the current browser is iOS Chrome
 */
export function isIOSChrome(): boolean {
  const info = detectBrowser();
  return info.isIOSChrome;
}

/**
 * Check if running as PWA
 */
export function isPWA(): boolean {
  const info = detectBrowser();
  return info.isPWA;
}

/**
 * Get instructions for enabling notifications based on browser
 */
export function getNotificationInstructions(): { title: string; steps: string[] } | null {
  const info = detectBrowser();
  
  if (info.isIOSChrome) {
    return {
      title: 'Use Safari for Notifications',
      steps: [
        'Chrome on iOS does not support push notifications',
        'Open this website in Safari browser',
        'Tap the Share button (box with arrow)',
        'Select "Add to Home Screen"',
        'Open the app from your home screen',
        'Enable notifications when prompted'
      ]
    };
  }
  
  if (info.isIOSSafari && !info.isStandalone) {
    return {
      title: 'Add to Home Screen First',
      steps: [
        'Tap the Share button (box with arrow) at the bottom',
        'Scroll down and select "Add to Home Screen"',
        'Give the app a name and tap "Add"',
        'Open the app from your home screen',
        'Enable notifications when prompted'
      ]
    };
  }
  
  return null;
}