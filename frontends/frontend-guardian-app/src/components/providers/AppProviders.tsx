'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { InAppNotificationProvider } from '@/contexts/InAppNotificationContext';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { UpdatePrompt } from '@/components/ui/UpdatePrompt';
import { SafeInstallPrompt } from '@/components/ui/SafeInstallPrompt';
import { Toaster } from 'react-hot-toast';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <InAppNotificationProvider>
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <ServiceWorkerRegistration />
          <UpdatePrompt />
          <SafeInstallPrompt />
          <OfflineIndicator />
          {children}
        </InAppNotificationProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};