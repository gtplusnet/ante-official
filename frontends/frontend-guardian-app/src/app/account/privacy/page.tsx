'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { 
  FiShield, 
  FiDownload, 
  FiTrash2, 
  FiEye,
  FiFileText,
  FiAlertCircle,
  FiExternalLink
} from 'react-icons/fi';

interface PrivacySettings {
  shareDataWithSchool: boolean;
  allowAnalytics: boolean;
  showProfileToTeachers: boolean;
}

export default function PrivacySettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<PrivacySettings>({
    shareDataWithSchool: true,
    allowAnalytics: true,
    showProfileToTeachers: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleToggle = (key: keyof PrivacySettings, value: boolean) => {
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

  const handleDownloadData = () => {
    // In real app, this would trigger data export
    alert('Your data download will be prepared and sent to your email within 24 hours.');
  };

  const handleDeleteAccount = () => {
    // In real app, this would initiate account deletion process
    alert('Account deletion request submitted. You will receive a confirmation email.');
    setShowDeleteConfirm(false);
    router.push('/login');
  };

  return (
    <MobileLayout className="bg-gray-50">
      <Header 
        title="Privacy Settings" 
        showMenu={false}
        showNotification={false}
        showBackButton={true}
      />

      <div className="px-4 py-4">
        {/* Privacy Controls */}
        <Card className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiShield className="w-5 h-5 text-primary-500" />
            Privacy Controls
          </h3>
          <div className="space-y-4">
            <Switch
              checked={settings.shareDataWithSchool}
              onChange={(value) => handleToggle('shareDataWithSchool', value)}
              label="Share Data with School"
              description="Allow the school to access your contact information for communication"
            />
            
            <Switch
              checked={settings.allowAnalytics}
              onChange={(value) => handleToggle('allowAnalytics', value)}
              label="Usage Analytics"
              description="Help improve the app by sharing anonymous usage data"
            />
            
            <Switch
              checked={settings.showProfileToTeachers}
              onChange={(value) => handleToggle('showProfileToTeachers', value)}
              label="Profile Visibility"
              description="Allow teachers to view your profile information"
            />
          </div>
        </Card>

        {/* Data Management */}
        <Card className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Data Management</h3>
          <div className="space-y-3">
            {/* Download Data */}
            <button
              onClick={handleDownloadData}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiDownload className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Download My Data</p>
                  <p className="text-sm text-gray-500">Get a copy of all your data</p>
                </div>
              </div>
              <FiExternalLink className="w-5 h-5 text-gray-400" />
            </button>

            {/* Delete Account */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FiTrash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-red-900">Delete Account</p>
                  <p className="text-sm text-red-700">Permanently delete your account</p>
                </div>
              </div>
              <FiExternalLink className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </Card>

        {/* Legal Documents */}
        <Card className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Legal Documents</h3>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/privacy-policy')}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-3">
                <FiFileText className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Privacy Policy</span>
              </div>
              <FiExternalLink className="w-4 h-4 text-gray-400" />
            </button>
            
            <button
              onClick={() => router.push('/terms-of-service')}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-3">
                <FiFileText className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Terms of Service</span>
              </div>
              <FiExternalLink className="w-4 h-4 text-gray-400" />
            </button>
            
            <button
              onClick={() => router.push('/data-policy')}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-3">
                <FiEye className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Data Usage Policy</span>
              </div>
              <FiExternalLink className="w-4 h-4 text-gray-400" />
            </button>
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
            Save Settings
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiAlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Account?</h3>
              <p className="text-sm text-gray-600 mb-6">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDeleteAccount}
                  className="flex-1 !bg-red-600 hover:!bg-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </MobileLayout>
  );
}