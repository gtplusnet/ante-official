'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useNotifications } from '@/contexts/NotificationContext';
import { pushNotificationService } from '@/lib/services/push-notification.service';
import { detectBrowser, getNotificationInstructions } from '@/lib/utils/browser-detection';
import { FiBell, FiX, FiAlertTriangle, FiCheck, FiInfo, FiChevronDown, FiChevronUp, FiSmartphone } from 'react-icons/fi';

const DISMISSAL_KEY = 'push-notification-widget-dismissed';

export const PushNotificationWidget: React.FC = () => {
  const { isSupported, permissionGranted, requestPermission } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [browserInfo, setBrowserInfo] = useState(detectBrowser());
  const [instructions, setInstructions] = useState(getNotificationInstructions());

  // Check if widget was previously dismissed and gather debug info
  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSAL_KEY);
    setIsDismissed(dismissed === 'true');
    
    // Update browser info on mount
    const currentBrowserInfo = detectBrowser();
    setBrowserInfo(currentBrowserInfo);
    setInstructions(getNotificationInstructions());

    // Gather debug information
    const gatherDebugInfo = async () => {
      const info: any = {
        timestamp: new Date().toISOString(),
        browser: {
          userAgent: navigator.userAgent,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
          platform: navigator.platform,
          ...currentBrowserInfo
        },
        notifications: {
          supported: 'Notification' in window,
          permission: window.Notification?.permission || 'not-supported',
          serviceWorkerSupported: 'serviceWorker' in navigator
        },
        firebase: {
          vapidKey: !!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          vapidKeyPreview: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.substring(0, 20) + '...'
        },
        pushService: {
          supported: await pushNotificationService.isSupported(),
          token: pushNotificationService.getToken()
        }
      };

      // Check service worker registration
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          info.serviceWorker = {
            registrations: registrations.length,
            states: registrations.map(reg => ({
              scope: reg.scope,
              state: reg.active?.state || 'none',
              installing: !!reg.installing,
              waiting: !!reg.waiting
            }))
          };
        } catch (error: any) {
          info.serviceWorker = { error: error.message };
        }
      }

      setDebugInfo(info);
    };

    gatherDebugInfo();
  }, []); // Empty dependency array - only run once on mount

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        setShowSuccess(true);
        // Auto-hide after showing success
        setTimeout(() => {
          setIsDismissed(true);
          localStorage.setItem(DISMISSAL_KEY, 'true');
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(DISMISSAL_KEY, 'true');
  };

  // Don't show if notifications are already enabled or widget was dismissed
  if (permissionGranted || isDismissed) {
    return null;
  }
  
  // For iOS Chrome, show special instructions instead
  if (browserInfo.isIOSChrome || (browserInfo.isIOSSafari && !browserInfo.isStandalone)) {
    return <IOSInstructionsCard 
      browserInfo={browserInfo} 
      instructions={instructions}
      onDismiss={handleDismiss}
      showDebug={showDebug}
      setShowDebug={setShowDebug}
      debugInfo={debugInfo}
    />;
  }
  
  // Don't show for unsupported browsers
  if (!isSupported) {
    return null;
  }

  if (showSuccess) {
    return (
      <Card className="mb-6 bg-green-50 border border-green-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <FiCheck className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-900">
              Notifications Enabled!
            </h3>
            <p className="text-sm text-green-700">
              You'll now receive real-time attendance updates.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-6 bg-amber-50 border border-amber-200">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
          <FiBell className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-amber-900">
                Enable Push Notifications
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                Get instant alerts when your children check in or out of school. 
                Stay connected and informed in real-time.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 text-amber-600 hover:text-amber-700 -mt-1 -mr-1"
              aria-label="Dismiss notification"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <FiCheck className="w-4 h-4" />
              <span>Instant attendance notifications</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <FiCheck className="w-4 h-4" />
              <span>Important school announcements</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <FiCheck className="w-4 h-4" />
              <span>Payment reminders and updates</span>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleEnableNotifications}
              loading={isLoading}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Enable Notifications
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-amber-700 hover:bg-amber-100"
            >
              Maybe Later
            </Button>
          </div>

          {/* Browser-specific instructions */}
          <div className="mt-3 p-3 bg-amber-100 rounded-lg">
            <div className="flex items-start gap-2">
              <FiAlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-700">
                <p className="font-medium">If the button doesn't work:</p>
                <p>Check your browser settings and look for notification permissions. You may need to manually enable notifications for this site.</p>
              </div>
            </div>
          </div>

          {/* Debug Information */}
          <div className="mt-3 border-t border-amber-200 pt-3">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="flex items-center gap-2 text-xs text-amber-600 hover:text-amber-700"
            >
              <FiInfo className="w-3 h-3" />
              <span>Debug Information</span>
              {showDebug ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
            </button>
            
            {showDebug && (
              <div className="mt-2 p-2 bg-white border border-amber-200 rounded text-xs">
                <pre className="text-amber-800 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
                <div className="mt-2 pt-2 border-t border-amber-200">
                  <p className="text-amber-600 font-medium mb-1">Check browser console for detailed logs</p>
                  <p className="text-amber-600">Look for messages starting with 🔔 [Push] to trace the initialization flow.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Component for iOS-specific instructions
interface IOSInstructionsCardProps {
  browserInfo: any;
  instructions: any;
  onDismiss: () => void;
  showDebug: boolean;
  setShowDebug: (show: boolean) => void;
  debugInfo: any;
}

const IOSInstructionsCard: React.FC<IOSInstructionsCardProps> = ({
  browserInfo,
  instructions,
  onDismiss,
  showDebug,
  setShowDebug,
  debugInfo
}) => {
  if (!instructions) return null;

  return (
    <Card className="mb-6 bg-blue-50 border border-blue-200">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
          <FiSmartphone className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                {instructions.title}
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                {browserInfo.isIOSChrome 
                  ? 'Chrome on iOS does not support push notifications.' 
                  : 'Safari requires the app to be added to your home screen for notifications.'}
              </p>
            </div>
            <button
              onClick={onDismiss}
              className="p-1 text-blue-600 hover:text-blue-700 -mt-1 -mr-1"
              aria-label="Dismiss notification"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          
          {/* Step by step instructions */}
          <div className="mt-4 bg-white rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">Follow these steps:</h4>
            <ol className="space-y-2">
              {instructions.steps.map((step: string, index: number) => (
                <li key={index} className="flex gap-3 text-sm text-blue-800">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Visual hint for share button */}
          {browserInfo.isIOSSafari && !browserInfo.isStandalone && (
            <div className="mt-3 p-3 bg-blue-100 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9 9 0 10-13.432 0m13.432 0A9 9 0 0112 21m0-9v6m0-6h.01" />
                </svg>
                <p className="text-xs text-blue-700">
                  Look for the share icon at the bottom of your Safari browser
                </p>
              </div>
            </div>
          )}

          {/* Debug Information */}
          <div className="mt-3 border-t border-blue-200 pt-3">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700"
            >
              <FiInfo className="w-3 h-3" />
              <span>Technical Information</span>
              {showDebug ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
            </button>
            
            {showDebug && (
              <div className="mt-2 p-2 bg-white border border-blue-200 rounded text-xs">
                <pre className="text-blue-800 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="mt-4">
            <Button
              onClick={onDismiss}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              I'll do this later
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};