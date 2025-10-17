'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { guardianPublicApi } from '@/lib/api/guardian-public-api';
import {
  FiCamera,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiTrash2,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';

interface ProfileData {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  phoneNumber: string;
  address: string;
  occupation: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { user, refreshAuth } = useAuth();
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phoneNumber: '',
    address: '',
    occupation: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        middleName: user.middleName || '',
        email: user.email || '',
        phoneNumber: user.contactNumber || '',
        address: user.address || '',
        occupation: user.occupation || '',
      });
      // Load profile photo if available
      if ((user as any).profilePhoto?.url) {
        setProfilePhoto((user as any).profilePhoto.url);
      }
      setIsLoading(false);
    } else {
      // If no user after mount, stop loading (middleware should redirect)
      setIsLoading(false);
    }
  }, [user]);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear messages
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Photo size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload an image file');
      return;
    }

    // Clear any previous messages
    setErrorMessage('');
    setSuccessMessage('');

    // Show local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhoto(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setIsUploadingPhoto(true);
    try {
      console.log('[EditProfile] Uploading profile photo...');
      
      const updatedProfile = await guardianPublicApi.uploadProfilePhoto(file);
      
      console.log('[EditProfile] Profile photo uploaded successfully');
      
      // Update profile photo with server URL
      if (updatedProfile.profilePhoto?.url) {
        setProfilePhoto(updatedProfile.profilePhoto.url);
      }
      
      // Refresh auth context to update user data
      await refreshAuth();
      
      setSuccessMessage('Profile photo updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error: any) {
      console.error('[EditProfile] Photo upload failed:', error);
      setErrorMessage(error.message || 'Failed to upload photo. Please try again.');
      // Revert to previous photo on error
      if ((user as any).profilePhoto?.url) {
        setProfilePhoto((user as any).profilePhoto.url);
      } else {
        setProfilePhoto('');
      }
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const removePhoto = () => {
    setProfilePhoto('');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.phoneNumber && !/^[\d\s+()-]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      console.log('[EditProfile] Updating profile via Public API');

      // Update profile using guardianPublicApi
      await guardianPublicApi.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName || undefined,
        email: formData.email,
        phoneNumber: formData.phoneNumber || undefined,
        address: formData.address || undefined,
        occupation: formData.occupation || undefined,
      });

      console.log('[EditProfile] Profile updated successfully');

      // Refresh auth context to get updated user data
      await refreshAuth();

      setSuccessMessage('Profile updated successfully!');

      // Navigate back after short delay
      setTimeout(() => {
        router.push('/account');
      }, 1500);
    } catch (error: any) {
      console.error('[EditProfile] Update failed:', error);
      setErrorMessage(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = () => {
    if (!formData.firstName || !formData.lastName) return '??';
    return `${formData.firstName[0]}${formData.lastName[0]}`;
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <MobileLayout className="bg-gray-50">
      <Header
        title="Edit Profile"
        showMenu={false}
        showBackButton={true}
        showNotification={false}
      />

      <div className="px-4 py-4">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <FiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-700">Update Failed</p>
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <Card>
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-semibold text-gray-600">
                      {getInitials()}
                    </span>
                  )}
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                <label
                  htmlFor="photo-upload"
                  className={`absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-full shadow-lg cursor-pointer hover:bg-primary-600 transition-colors ${
                    isUploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <FiCamera className="w-5 h-5" />
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={isUploadingPhoto}
                  />
                </label>
              </div>
              {isUploadingPhoto && (
                <p className="text-sm text-primary-600 mt-3 animate-pulse">
                  Uploading photo...
                </p>
              )}
              {profilePhoto && !isUploadingPhoto && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="mt-3 flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Remove Photo
                </button>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {isUploadingPhoto 
                  ? 'Please wait while we upload your photo...'
                  : 'Click the camera icon to upload a new photo (max 5MB)'
                }
              </p>
            </div>
          </Card>

          {/* Personal Information */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiUser className="w-5 h-5 text-primary-500" />
              Personal Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    placeholder="First name"
                    error={errors.firstName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder="Last name"
                    error={errors.lastName}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Middle Name
                </label>
                <Input
                  value={formData.middleName}
                  onChange={(e) => handleChange('middleName', e.target.value)}
                  placeholder="Middle name (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Occupation
                </label>
                <Input
                  value={formData.occupation}
                  onChange={(e) => handleChange('occupation', e.target.value)}
                  placeholder="Your occupation (optional)"
                />
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiPhone className="w-5 h-5 text-primary-500" />
              Contact Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="email@example.com"
                  error={errors.email}
                  icon="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  placeholder="+639123456789 (optional)"
                  error={errors.phoneNumber}
                />
              </div>
            </div>
          </Card>

          {/* Address Information */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiMapPin className="w-5 h-5 text-primary-500" />
              Address Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complete Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="House/Unit No., Street, Barangay, City, Province (optional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your complete address in one field
                </p>
              </div>
            </div>
          </Card>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Profile Update Tips</p>
              <ul className="space-y-1 text-blue-800">
                <li>• Keep your contact information up to date</li>
                <li>• Email is required for account security</li>
                <li>• Phone number helps school reach you quickly</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pb-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </MobileLayout>
  );
}
