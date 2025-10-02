'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { 
  FiHome, 
  FiClock, 
  FiWifi,
  FiDownload,
  FiRefreshCw,
  FiSmartphone,
  FiCheck
} from 'react-icons/fi';

interface AppPreferences {
  defaultLandingPage: 'dashboard' | 'notifications';
  autoLogoutTime: number; // in minutes
  autoDownloadImages: boolean;
  wifiOnlyDownload: boolean;
  autoRefreshData: boolean;
  refreshInterval: number; // in minutes
}

export default function PreferencesPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<AppPreferences>({
    defaultLandingPage: 'dashboard',
    autoLogoutTime: 30,
    autoDownloadImages: true,
    wifiOnlyDownload: true,
    autoRefreshData: true,
    refreshInterval: 5,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = <K extends keyof AppPreferences>(
    key: K,
    value: AppPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      router.push('/account');
    }, 1500);
  };

  const autoLogoutOptions = [
    { value: 5, label: '5 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 0, label: 'Never' },
  ];

  const refreshIntervalOptions = [
    { value: 1, label: '1 minute' },
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 30, label: '30 minutes' },
  ];

  return (
    <MobileLayout className="bg-gray-50">
      <Header 
        title="App Preferences" 
        showMenu={false}
        showNotification={false}
        showBackButton={true}
      />

      <div className="px-4 py-4">
        {/* General Preferences */}
        <Card className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiSmartphone className="w-5 h-5 text-primary-500" />
            General Preferences
          </h3>
          
          {/* Default Landing Page */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Default Landing Page
            </label>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="landingPage"
                    value="dashboard"
                    checked={preferences.defaultLandingPage === 'dashboard'}
                    onChange={(e) => handleChange('defaultLandingPage', 'dashboard')}
                    className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Dashboard</p>
                    <p className="text-sm text-gray-500">See student status and recent logs</p>
                  </div>
                </div>
                {preferences.defaultLandingPage === 'dashboard' && (
                  <FiCheck className="w-5 h-5 text-primary-500" />
                )}
              </label>
              
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="landingPage"
                    value="notifications"
                    checked={preferences.defaultLandingPage === 'notifications'}
                    onChange={(e) => handleChange('defaultLandingPage', 'notifications')}
                    className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Notifications</p>
                    <p className="text-sm text-gray-500">Check latest alerts first</p>
                  </div>
                </div>
                {preferences.defaultLandingPage === 'notifications' && (
                  <FiCheck className="w-5 h-5 text-primary-500" />
                )}
              </label>
            </div>
          </div>
        </Card>

        {/* Security Preferences */}
        <Card className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiClock className="w-5 h-5 text-primary-500" />
            Security
          </h3>
          
          {/* Auto Logout */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto-logout after inactivity
            </label>
            <select
              value={preferences.autoLogoutTime}
              onChange={(e) => handleChange('autoLogoutTime', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {autoLogoutOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Automatically log out for security when inactive
            </p>
          </div>
        </Card>

        {/* Data Preferences */}
        <Card className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiDownload className="w-5 h-5 text-primary-500" />
            Data Usage
          </h3>
          
          <div className="space-y-4">
            <Switch
              checked={preferences.autoDownloadImages}
              onChange={(value) => handleChange('autoDownloadImages', value)}
              label="Auto-download images"
              description="Automatically download student photos and images"
            />
            
            {preferences.autoDownloadImages && (
              <div className="pl-6">
                <Switch
                  checked={preferences.wifiOnlyDownload}
                  onChange={(value) => handleChange('wifiOnlyDownload', value)}
                  label="WiFi only"
                  description="Only download images when connected to WiFi"
                />
              </div>
            )}
            
            <Switch
              checked={preferences.autoRefreshData}
              onChange={(value) => handleChange('autoRefreshData', value)}
              label="Auto-refresh data"
              description="Keep information up to date automatically"
            />
            
            {preferences.autoRefreshData && (
              <div className="pl-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refresh interval
                </label>
                <select
                  value={preferences.refreshInterval}
                  onChange={(e) => handleChange('refreshInterval', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {refreshIntervalOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </Card>

        {/* Cache Management */}
        <Card className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Cache Management</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Clear Cache</p>
                <p className="text-sm text-gray-500">Free up storage space</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => alert('Cache cleared successfully!')}
              >
                Clear
              </Button>
            </div>
            <div className="text-xs text-gray-500">
              Current cache size: ~12.5 MB
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            className="flex-1"
          >
            Save Preferences
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}