'use client';

import React, { useState, useEffect } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';

export const SafeInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the default prompt
      e.preventDefault();
      
      // Store the event for later use
      setDeferredPrompt(e);
      
      // Show our custom prompt after a delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 10000); // 10 seconds delay
    };

    // Check if already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    
    if (!isInstalled) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 pointer-events-auto">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg border p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FiDownload className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Install Guardian App
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Add to your home screen for quick access and offline use.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                Not now
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};