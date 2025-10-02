'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { 
  FiBell, 
  FiAlertCircle, 
  FiDollarSign, 
  FiInfo,
  FiVolume2,
  FiMoon,
  FiLock
} from 'react-icons/fi';

interface NotificationSettings {
  attendance: boolean;
  emergency: boolean;
  payment: boolean;
  general: boolean;
  sound: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export default function NotificationSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings>({
    attendance: true, // Locked ON
    emergency: true,  // Locked ON
    payment: true,
    general: true,
    sound: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggle = (key: keyof NotificationSettings, value: boolean) => {
    // Prevent toggling off mandatory notifications
    if ((key === 'attendance' || key === 'emergency') && !value) {
      return;
    }
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleTimeChange = (key: 'quietHoursStart' | 'quietHoursEnd', value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      router.push('/account');
    }, 1500);
  };

  return (
    <MobileLayout className="bg-gray-50">
      <Header 
        title="Notification Settings" 
        showMenu={false}
        showNotification={false}
        showBackButton={true}
      />

      <div className="px-4 py-4">
        {/* Important Notice */}
        <Card className="mb-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Important Notice</h4>
              <p className="text-sm text-red-800">
                Attendance and Emergency notifications cannot be disabled for student safety. 
                These are mandatory for all guardians.
              </p>
            </div>
          </div>
        </Card>

        {/* Notification Types */}
        <Card className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Notification Types</h3>
          <div className="space-y-4">
            {/* Attendance Notifications - LOCKED */}
            <div className="flex items-start justify-between">
              <div className="flex-1 flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiBell className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">Attendance Alerts</h4>
                    <FiLock className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Real-time notifications when your student enters or leaves school
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.attendance}
                onChange={() => {}}
                disabled={true}
                size="md"
              />
            </div>

            {/* Emergency Notifications - LOCKED */}
            <div className="flex items-start justify-between">
              <div className="flex-1 flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiAlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">Emergency Alerts</h4>
                    <FiLock className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Critical alerts about emergencies or urgent school matters
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.emergency}
                onChange={() => {}}
                disabled={true}
                size="md"
              />
            </div>

            {/* Payment Reminders */}
            <div className="flex items-start justify-between">
              <div className="flex-1 flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiDollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Payment Reminders</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Notifications about tuition fees and payment deadlines
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.payment}
                onChange={(value) => handleToggle('payment', value)}
                size="md"
              />
            </div>

            {/* General Announcements */}
            <div className="flex items-start justify-between">
              <div className="flex-1 flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiInfo className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">General Announcements</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    School news, events, and general information
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.general}
                onChange={(value) => handleToggle('general', value)}
                size="md"
              />
            </div>
          </div>
        </Card>

        {/* Sound Settings */}
        <Card className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Sound Settings</h3>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiVolume2 className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Notification Sound</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Play sound for incoming notifications
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.sound}
                onChange={(value) => handleToggle('sound', value)}
                size="md"
              />
            </div>
          </div>
        </Card>

        {/* Quiet Hours */}
        <Card className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quiet Hours</h3>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiMoon className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Enable Quiet Hours</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Mute non-emergency notifications during specified hours
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.quietHoursEnabled}
                onChange={(value) => handleToggle('quietHoursEnabled', value)}
                size="md"
              />
            </div>

            {settings.quietHoursEnabled && (
              <div className="pl-13 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={(e) => handleTimeChange('quietHoursStart', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={(e) => handleTimeChange('quietHoursEnd', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Emergency notifications will still be delivered during quiet hours
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
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
            Save Settings
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}