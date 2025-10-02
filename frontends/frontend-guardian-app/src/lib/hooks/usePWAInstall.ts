import { useState, useEffect, useCallback } from 'react';
import { detectBrowser } from '@/lib/utils/browser-detection';

interface PWAInstallState {
  canInstall: boolean;
  isInstalled: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unsupported';
  showPrompt: boolean;
  deferredPrompt: any;
}

const INSTALL_PROMPT_DISMISSED_KEY = 'pwa-install-prompt-dismissed';
const INSTALL_PROMPT_DELAY_KEY = 'pwa-install-prompt-delay';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const ENGAGEMENT_DELAY = 60 * 1000; // 60 seconds
const PAGE_VIEWS_REQUIRED = 5;

export function usePWAInstall() {
  const [state, setState] = useState<PWAInstallState>({
    canInstall: false,
    isInstalled: false,
    platform: 'unsupported',
    showPrompt: false,
    deferredPrompt: null,
  });

  const [pageViews, setPageViews] = useState(0);
  const [engagementTimer, setEngagementTimer] = useState<NodeJS.Timeout | null>(null);

  // Detect platform and installation status
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const browserInfo = detectBrowser();
    
    // Check if already running as PWA
    const isInstalled = browserInfo.isStandalone || 
                       window.matchMedia('(display-mode: standalone)').matches ||
                       window.matchMedia('(display-mode: fullscreen)').matches;

    // Determine platform
    let platform: PWAInstallState['platform'] = 'unsupported';
    if (browserInfo.isIOS) {
      platform = 'ios';
    } else if (browserInfo.isAndroid) {
      platform = 'android';
    } else if (!browserInfo.isMobile) {
      platform = 'desktop';
    }

    setState(prev => ({
      ...prev,
      isInstalled,
      platform,
      canInstall: !isInstalled && platform !== 'unsupported',
    }));

    // Track page views (only on client side)
    try {
      const currentViews = parseInt(sessionStorage.getItem('pwa-page-views') || '0') + 1;
      sessionStorage.setItem('pwa-page-views', currentViews.toString());
      setPageViews(currentViews);
    } catch (error) {
      console.warn('Session storage not available:', error);
      setPageViews(1);
    }
  }, []);

  // Handle beforeinstallprompt event (Chrome/Edge/Samsung)
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default prompt
      e.preventDefault();
      
      // Store the event for later use
      setState(prev => ({
        ...prev,
        deferredPrompt: e,
        canInstall: true,
      }));

      console.log('PWA install prompt captured');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app was installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      setState(prev => ({
        ...prev,
        isInstalled: true,
        showPrompt: false,
        canInstall: false,
      }));
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Determine when to show the prompt
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Don't show if already installed or can't install
    if (state.isInstalled || !state.canInstall) {
      return;
    }

    try {
      // Check if recently dismissed
      const dismissedTime = localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY);
      if (dismissedTime) {
        const timeSinceDismissed = Date.now() - parseInt(dismissedTime);
        if (timeSinceDismissed < DISMISS_DURATION) {
          return;
        }
      }

      // Check if we should delay the prompt
      const delayUntil = localStorage.getItem(INSTALL_PROMPT_DELAY_KEY);
      if (delayUntil && Date.now() < parseInt(delayUntil)) {
        return;
      }
    } catch (error) {
      console.warn('Local storage not available:', error);
    }

    // Require minimum page views
    if (pageViews < PAGE_VIEWS_REQUIRED) {
      return;
    }

    // Set engagement timer
    console.log('PWA Install: Setting engagement timer for', ENGAGEMENT_DELAY, 'ms');
    const timer = setTimeout(() => {
      console.log('PWA Install: Showing prompt after engagement delay');
      setState(prev => ({ ...prev, showPrompt: true }));
    }, ENGAGEMENT_DELAY);

    setEngagementTimer(timer);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [state.canInstall, state.isInstalled, pageViews]);

  // Install the PWA
  const install = useCallback(async () => {
    if (state.platform === 'ios') {
      // iOS doesn't support programmatic installation
      // The component will show instructions instead
      return false;
    }

    if (state.deferredPrompt) {
      try {
        // Show the install prompt
        state.deferredPrompt.prompt();
        
        // Wait for the user's response
        const { outcome } = await state.deferredPrompt.userChoice;
        
        console.log(`User response to install prompt: ${outcome}`);
        
        if (outcome === 'accepted') {
          setState(prev => ({
            ...prev,
            isInstalled: true,
            showPrompt: false,
          }));
          return true;
        }
      } catch (error) {
        console.error('Error showing install prompt:', error);
      }
    }
    
    return false;
  }, [state.deferredPrompt, state.platform]);

  // Dismiss the prompt
  const dismiss = useCallback(() => {
    setState(prev => ({ ...prev, showPrompt: false }));
    
    try {
      localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, Date.now().toString());
    } catch (error) {
      console.warn('Could not save dismissal to localStorage:', error);
    }
    
    if (engagementTimer) {
      clearTimeout(engagementTimer);
    }
  }, [engagementTimer]);

  // Delay the prompt (e.g., "Ask me later")
  const delayPrompt = useCallback((days: number = 3) => {
    setState(prev => ({ ...prev, showPrompt: false }));
    
    try {
      const delayUntil = Date.now() + (days * 24 * 60 * 60 * 1000);
      localStorage.setItem(INSTALL_PROMPT_DELAY_KEY, delayUntil.toString());
    } catch (error) {
      console.warn('Could not save delay to localStorage:', error);
    }
    
    if (engagementTimer) {
      clearTimeout(engagementTimer);
    }
  }, [engagementTimer]);

  return {
    canInstall: state.canInstall,
    isInstalled: state.isInstalled,
    platform: state.platform,
    showPrompt: state.showPrompt,
    install,
    dismiss,
    delayPrompt,
  };
}