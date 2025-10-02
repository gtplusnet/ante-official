'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { 
  FiCamera, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin,
  FiEdit2,
  FiTrash2
} from 'react-icons/fi';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  zipCode: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [formData, setFormData] = useState<ProfileData>({
    firstName: 'Maria',
    lastName: 'Dela Cruz',
    email: 'maria.delacruz@email.com',
    phone: '+639123456789',
    street: '123 Mabini Street',
    barangay: 'Barangay San Jose',
    city: 'Santa Maria',
    province: 'Bulacan',
    zipCode: '3022',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Photo size must be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      // In real app, upload to server
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
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

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+639\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format (e.g., +639123456789)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      // In real app, show success message
      router.push('/account');
    }, 1500);
  };

  const getInitials = () => {
    return `${formData.firstName[0]}${formData.lastName[0]}`;
  };

  return (
    <MobileLayout className="bg-gray-50">
      <Header 
        title="Edit Profile" 
        showMenu={false}
        showBackButton={true}
        showNotification={false}
      />

      <div className="px-4 py-4">
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
                </div>
                <label 
                  htmlFor="photo-upload"
                  className="absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-full shadow-lg cursor-pointer hover:bg-primary-600 transition-colors"
                >
                  <FiCamera className="w-5 h-5" />
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {profilePhoto && (
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
                Max size: 5MB. JPG, PNG allowed.
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
                    First Name
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
                    Last Name
                  </label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder="Last name"
                    error={errors.lastName}
                  />
                </div>
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
                  Email Address
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
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+639123456789"
                  error={errors.phone}
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
                  Street Address
                </label>
                <Input
                  value={formData.street}
                  onChange={(e) => handleChange('street', e.target.value)}
                  placeholder="House/Unit No., Street"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barangay
                </label>
                <Input
                  value={formData.barangay}
                  onChange={(e) => handleChange('barangay', e.target.value)}
                  placeholder="Barangay name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City/Municipality
                  </label>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Province
                  </label>
                  <Input
                    value={formData.province}
                    onChange={(e) => handleChange('province', e.target.value)}
                    placeholder="Province"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <Input
                  value={formData.zipCode}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                  placeholder="ZIP code"
                  maxLength={4}
                />
              </div>
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
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </MobileLayout>
  );
}