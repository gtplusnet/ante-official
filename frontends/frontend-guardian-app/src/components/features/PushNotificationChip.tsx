'use client';

import React, { useState } from 'react';
import { FiBell, FiAlertCircle } from 'react-icons/fi';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { detectBrowser, getNotificationInstructions } from '@/lib/utils/browser-detection';

export const PushNotificationChip: React.FC = () => {
  const { isSupported, permissionGranted, requestPermission, registrationStatus, registrationError, retryRegistration } = useNotifications();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const browserInfo = detectBrowser();

  // Don't show if not authenticated or notifications already granted
  if (!isAuthenticated || permissionGranted) {
    return null;
  }

  // Don't show for unsupported browsers (except iOS which needs instructions)
  if (!isSupported && !browserInfo.isIOSChrome && !browserInfo.isIOSSafari) {
    return null;
  }

  // Handle click - either request permission or show instructions
  const handleClick = async () => {
    // For iOS Chrome or iOS Safari not in standalone, show instructions
    if (browserInfo.isIOSChrome || (browserInfo.isIOSSafari && !browserInfo.isStandalone)) {
      setShowInstructions(true);
      return;
    }

    // For supported browsers, request permission
    if (isSupported) {
      setIsLoading(true);
      try {
        const granted = await requestPermission();
        if (granted) {
          // Show success message for 3 seconds then hide chip
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
          }, 3000);
        }
      } catch (error) {
        console.error('Failed to request notification permission:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle retry
  const handleRetry = async () => {
    setIsLoading(true);
    try {
      await retryRegistration();
      // If successful, show success message
      if (registrationStatus === 'registered') {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to retry registration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const instructions = getNotificationInstructions();

  return (
    <>
      {/* Success State */}
      {showSuccess && (
        <div className="sticky top-0 z-40 bg-green-100 border-b border-green-200">
          <div className="px-4 py-3 flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-green-900">
              Push notifications enabled successfully!
            </span>
          </div>
        </div>
      )}

      {/* Error State with Retry */}
      {!showSuccess && registrationStatus === 'failed' && registrationError && (
        <div className="sticky top-0 z-40 bg-red-100 border-b border-red-200">
          <div className="px-4 py-3">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FiAlertCircle className="w-5 h-5 text-red-700" />
              <span className="text-sm font-medium text-red-900">
                Failed to register: {registrationError}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handleRetry}
                disabled={isLoading}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors disabled:opacity-70"
              >
                {isLoading ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registering State */}
      {!showSuccess && registrationStatus === 'registering' && (
        <div className="sticky top-0 z-40 bg-blue-100 border-b border-blue-200">
          <div className="px-4 py-3 flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
            <span className="text-sm font-medium text-blue-900">
              Registering with server...
            </span>
          </div>
        </div>
      )}

      {/* Default State - Permission Request */}
      {!showSuccess && registrationStatus !== 'failed' && registrationStatus !== 'registering' && (
        <div 
          className="sticky top-0 z-40 bg-amber-100 border-b border-amber-200"
          style={{ marginTop: '0' }}
        >
          <button
            onClick={handleClick}
            disabled={isLoading}
            className="w-full px-4 py-3 flex items-center justify-center gap-2 hover:bg-amber-200 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            aria-label="Enable push notifications"
          >
            <FiBell className={`w-5 h-5 text-amber-700 ${isLoading ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-medium text-amber-900">
              {isLoading 
                ? 'Requesting permission...' 
                : browserInfo.isIOSChrome || (browserInfo.isIOSSafari && !browserInfo.isStandalone)
                ? 'Tap to enable push notifications'
                : 'Tap to enable push notifications'}
            </span>
            {!isLoading && (
              <FiAlertCircle className="w-4 h-4 text-amber-600" />
            )}
          </button>
        </div>
      )}

      {/* iOS Instructions Modal */}
      {showInstructions && instructions && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setShowInstructions(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <FiBell className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900">
                    {instructions.title}
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {browserInfo.isIOSChrome 
                      ? 'Chrome on iOS does not support push notifications. Please use Safari.' 
                      : 'Safari requires the app to be added to your home screen for notifications.'}
                  </p>
                </div>
              </div>

              {/* Step by step instructions */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-900 mb-3">Follow these steps:</h4>
                <ol className="space-y-3">
                  {instructions.steps.map((step: string, index: number) => (
                    <li key={index} className="flex gap-3 text-sm text-blue-800">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Visual hint for share button */}
              {browserInfo.isIOSSafari && !browserInfo.isStandalone && (
                <div className="bg-blue-100 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9 9 0 10-13.432 0m13.432 0A9 9 0 0112 21m0-9v6m0-6h.01" />
                    </svg>
                    <p className="text-xs text-blue-700">
                      Look for the share icon at the bottom of your Safari browser
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowInstructions(false)}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

