'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FiUser, 
  FiLock, 
  FiBell, 
  FiSettings,
  FiShield,
  FiHelpCircle,
  FiUsers,
  FiChevronRight,
  FiCamera,
  FiMail,
  FiPhone,
  FiLogOut,
  FiSmartphone,
  FiRefreshCw
} from 'react-icons/fi';
import { useAppUpdate } from '@/lib/hooks/useAppUpdate';
import { APP_VERSION } from '@/lib/config/version';

interface SettingsSection {
  id: string;
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  label: string;
  icon: React.ElementType;
  value?: string;
  action: () => void;
  showArrow?: boolean;
  danger?: boolean;
}

export default function AccountPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { checkForUpdates, applyUpdate, updateAvailable, isChecking } = useAppUpdate();

  // Use real user data from auth context
  const userData = {
    name: user ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    phone: user?.contactNumber || 'Not set',
    photoUrl: user?.profilePhoto?.url || '',
    connectedStudents: user?.students?.length || 0,
  };

  const settingsSections: SettingsSection[] = [
    {
      id: 'profile',
      title: 'Profile',
      items: [
        {
          id: 'photo',
          label: 'Profile Photo',
          icon: FiCamera,
          value: 'Tap to change',
          action: () => router.push('/account/edit-profile'),
          showArrow: true,
        },
        {
          id: 'name',
          label: 'Name',
          icon: FiUser,
          value: userData.name,
          action: () => router.push('/account/edit-profile'),
          showArrow: true,
        },
        {
          id: 'email',
          label: 'Email',
          icon: FiMail,
          value: userData.email,
          action: () => router.push('/account/edit-profile'),
          showArrow: true,
        },
        {
          id: 'phone',
          label: 'Phone',
          icon: FiPhone,
          value: userData.phone,
          action: () => router.push('/account/edit-profile'),
          showArrow: true,
        },
      ],
    },
    {
      id: 'security',
      title: 'Security',
      items: [
        {
          id: 'password',
          label: 'Change Password',
          icon: FiLock,
          action: () => router.push('/account/change-password'),
          showArrow: true,
        },
        // {
        //   id: 'sessions',
        //   label: 'Active Sessions',
        //   icon: FiSmartphone,
        //   value: '2 devices',
        //   action: () => router.push('/account/sessions'),
        //   showArrow: true,
        // },
      ],
    },
    {
      id: 'preferences',
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          label: 'Notification Settings',
          icon: FiBell,
          action: () => router.push('/account/notifications'),
          showArrow: true,
        },
        // {
        //   id: 'app-settings',
        //   label: 'App Preferences',
        //   icon: FiSettings,
        //   action: () => router.push('/account/preferences'),
        //   showArrow: true,
        // },
        {
          id: 'app-update',
          label: updateAvailable ? 'Update Available' : 'Check for Updates',
          icon: FiRefreshCw,
          value: `v${APP_VERSION}`,
          action: updateAvailable ? applyUpdate : checkForUpdates,
          showArrow: false,
        },
      ],
    },
    {
      id: 'students',
      title: 'Connected Students',
      items: [
        {
          id: 'manage-students',
          label: 'Manage Students',
          icon: FiUsers,
          value: `${userData.connectedStudents} students`,
          action: () => router.push('/account/students'),
          showArrow: true,
        },
      ],
    },
    // {
    //   id: 'privacy',
    //   title: 'Privacy & Data',
    //   items: [
    //     {
    //       id: 'privacy-settings',
    //       label: 'Privacy Settings',
    //       icon: FiShield,
    //       action: () => router.push('/account/privacy'),
    //       showArrow: true,
    //     },
    //   ],
    // },
    // {
    //   id: 'support',
    //   title: 'Help & Support',
    //   items: [
    //     {
    //       id: 'help',
    //       label: 'Help Center',
    //       icon: FiHelpCircle,
    //       action: () => router.push('/account/help'),
    //       showArrow: true,
    //     },
    //   ],
    // },
    {
      id: 'logout',
      title: '',
      items: [
        {
          id: 'logout',
          label: 'Log Out',
          icon: FiLogOut,
          action: () => {
            // In real app, this would clear auth tokens and redirect
            router.push('/login');
          },
          danger: true,
        },
      ],
    },
  ];

  return (
    <AuthenticatedLayout
      title="Account Settings"
      className="bg-gray-50"
    >
      <div className="px-4 py-4">
        {/* Profile Header */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
              {userData.photoUrl ? (
                <img 
                  src={userData.photoUrl} 
                  alt={userData.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-semibold text-gray-600">
                  {userData.name.split(' ').map(n => n[0]).join('')}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{userData.name}</h2>
              <p className="text-sm text-gray-500">{userData.email}</p>
              <p className="text-xs text-gray-400 mt-1">Guardian Account</p>
            </div>
          </div>
        </Card>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingsSections.map((section) => (
            <div key={section.id}>
              {section.title && (
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">
                  {section.title}
                </h3>
              )}
              <Card className="divide-y divide-gray-100">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className={`
                        w-full flex items-center justify-between p-4 
                        hover:bg-gray-50 transition-colors duration-200
                        ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-900'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-10 h-10 rounded-lg flex items-center justify-center
                          ${item.danger ? 'bg-red-100' : 'bg-primary-100'}
                        `}>
                          <Icon className={`w-5 h-5 ${item.danger ? 'text-red-600' : 'text-primary-600'}`} />
                        </div>
                        <div className="text-left">
                          <p className="font-medium flex items-center gap-2">
                            {item.label}
                            {item.id === 'app-update' && updateAvailable && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            )}
                          </p>
                          {item.value && (
                            <p className="text-sm text-gray-500">{item.value}</p>
                          )}
                        </div>
                      </div>
                      {item.showArrow && (
                        <FiChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  );
                })}
              </Card>
            </div>
          ))}
        </div>

        {/* App Version */}
        <div className="text-center mt-8 mb-4">
          <p className="text-xs text-gray-400">
            Geer Guardian App v1.0.0
          </p>
          <p className="text-xs text-gray-400 mt-1">
            © 2025 Mater Dei Academy
          </p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}