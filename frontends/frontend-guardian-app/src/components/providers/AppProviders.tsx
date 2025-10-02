'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { InAppNotificationProvider } from '@/contexts/InAppNotificationContext';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { UpdatePrompt } from '@/components/ui/UpdatePrompt';
import { SafeInstallPrompt } from '@/components/ui/SafeInstallPrompt';
import { SupabaseProvider } from './SupabaseProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <SupabaseProvider>
      <AuthProvider>
        <NotificationProvider>
          <InAppNotificationProvider>
            <ServiceWorkerRegistration />
            <UpdatePrompt />
            <SafeInstallPrompt />
            <OfflineIndicator />
            {children}
          </InAppNotificationProvider>
        </NotificationProvider>
      </AuthProvider>
    </SupabaseProvider>
  );
};