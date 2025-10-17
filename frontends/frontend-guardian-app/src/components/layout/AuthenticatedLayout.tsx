'use client';

import React, { useState, ReactNode } from 'react';
import { MobileLayout } from './MobileLayout';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { LoadingScreen } from '../ui/LoadingScreen';
import { PushNotificationChip } from '../features/PushNotificationChip';
import { useAuth } from '@/contexts/AuthContext';

interface AuthenticatedLayoutProps {
  children: ReactNode;
  title: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  showNotification?: boolean;
  className?: string;
}

export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({
  children,
  title,
  showBackButton = false,
  onBackClick,
  showNotification = true,
  className = ''
}) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { user, company, loading: authLoading } = useAuth();

  // Convert user to Guardian format for Navigation
  const guardianForNav = user ? {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    photoUrl: user.profilePhoto?.url
  } : { id: '', name: '', email: '' };

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <MobileLayout className={className}>
      <Header
        title={title}
        onMenuClick={() => setIsNavOpen(true)}
        showMenu={!showBackButton}
        showBackButton={showBackButton}
        onBackClick={onBackClick}
        showNotification={showNotification}
      />
      <PushNotificationChip />
      <Navigation
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        guardian={guardianForNav}
        company={company}
      />
      {children}
    </MobileLayout>
  );
};