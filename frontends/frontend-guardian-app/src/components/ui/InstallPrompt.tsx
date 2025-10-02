'use client';

import React, { useState, useEffect } from 'react';
import { FiDownload, FiX, FiShare, FiPlus, FiSmartphone, FiMonitor } from 'react-icons/fi';
import { usePWAInstall } from '@/lib/hooks/usePWAInstall';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const InstallPrompt: React.FC = () => {
  const { canInstall, isInstalled, platform, showPrompt, install, dismiss, delayPrompt } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Debug logging
  React.useEffect(() => {
    console.log('PWA Install Prompt:', { 
      canInstall, 
      isInstalled, 
      platform, 
      showPrompt, 
      isVisible, 
      isClosing 
    });
  }, [canInstall, isInstalled, platform, showPrompt, isVisible, isClosing]);

  useEffect(() => {
    if (showPrompt && !isClosing) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showPrompt, isClosing]);

  const handleInstall = async () => {
    if (platform === 'ios') {
      // For iOS, we can't trigger install, just show instructions
      // The UI already shows instructions for iOS
      return;
    }
    
    const installed = await install();
    if (installed) {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      dismiss();
      setIsClosing(false);
    }, 300);
  };

  const handleDelay = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      delayPrompt(3); // Delay for 3 days
      setIsClosing(false);
    }, 300);
  };

  if (!showPrompt || isInstalled || !canInstall) {
    return null;
  }

  const getPlatformConfig = () => {
    switch (platform) {
      case 'ios':
        return {
          icon: <FiShare className="w-6 h-6" />,
          title: 'Add Guardian to Home Screen',
          description: 'Install this app on your iPhone for quick access and a better experience.',
          primaryButton: 'Show me how',
          instructions: [
            'Tap the Share button below',
            'Scroll down and tap "Add to Home Screen"',
            'Tap "Add" to install',
          ],
        };
      case 'android':
        return {
          icon: <FiDownload className="w-6 h-6" />,
          title: 'Install Guardian App',
          description: 'Add Guardian to your home screen for offline access and notifications.',
          primaryButton: 'Install',
          benefits: ['Works offline', 'Quick access', 'Push notifications'],
        };
      case 'desktop':
        return {
          icon: <FiMonitor className="w-6 h-6" />,
          title: 'Install Guardian App',
          description: 'Install Guardian on your computer for a better experience.',
          primaryButton: 'Install',
          benefits: ['Desktop shortcuts', 'Faster loading', 'Works offline'],
        };
      default:
        return {
          icon: <FiSmartphone className="w-6 h-6" />,
          title: 'Mobile App',
          description: 'For the best experience, open this site on a mobile device.',
          primaryButton: 'OK',
        };
    }
  };

  const config = getPlatformConfig();

  return (
    <div 
      className={`fixed bottom-safe left-0 right-0 z-50 p-4 pb-safe-bottom transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <Card className="max-w-md mx-auto bg-white shadow-xl border-0">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                {config.icon}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {config.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {config.description}
                  </p>
                  
                  {/* iOS Instructions */}
                  {platform === 'ios' && 'instructions' in config && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Quick steps:</p>
                      <ol className="space-y-1">
                        {config.instructions!.map((step, index) => (
                          <li key={index} className="flex gap-2 text-xs text-gray-600">
                            <span className="flex-shrink-0 w-4 h-4 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  
                  {/* Benefits for Android/Desktop */}
                  {(platform === 'android' || platform === 'desktop') && 'benefits' in config && (
                    <div className="flex gap-3 mb-3">
                      {config.benefits!.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <FiPlus className="w-3 h-3 text-rose-500" />
                          <span className="text-xs text-gray-600">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleClose}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 -mt-1 -mr-1"
                  aria-label="Close"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="flex-1 bg-rose-600 hover:bg-rose-700"
                >
                  {config.primaryButton}
                </Button>
                <Button
                  onClick={handleDelay}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600"
                >
                  Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Minimal badge version for compact spaces
export const InstallBadge: React.FC = () => {
  const { canInstall, isInstalled, install } = usePWAInstall();
  const [showTooltip, setShowTooltip] = useState(false);

  if (!canInstall || isInstalled) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={install}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Install app"
      >
        <FiDownload className="w-5 h-5" />
      </button>
      
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
          Install app for offline access
        </div>
      )}
    </div>
  );
};