'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { FiAlertCircle } from 'react-icons/fi';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';

export default function RegisterPage() {
  const { register, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    email: '',
    contactNumber: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateForm = (): boolean => {
    // Check required fields
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.contactNumber || !formData.password || !formData.confirmPassword ||
        !formData.dateOfBirth) {
      setValidationError('Please fill in all required fields');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }

    // Phone number validation (Philippine format)
    const phoneRegex = /^9\d{9}$/;
    if (!phoneRegex.test(formData.contactNumber)) {
      setValidationError('Please enter a valid 10-digit mobile number (9XXXXXXXXX)');
      return false;
    }

    // Password validation - only check if password is provided
    if (!formData.password) {
      setValidationError('Password is required');
      return false;
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }

    // Age validation (must be at least 18)
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 18) {
      setValidationError('You must be at least 18 years old to register');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName || undefined,
        email: formData.email,
        password: formData.password,
        contactNumber: formData.contactNumber,
        dateOfBirth: formData.dateOfBirth,
      });
      // Navigation is handled by the auth context
    } catch (err: any) {
      // Error is handled by the auth context
      console.error('Registration error:', err);
      // Also set local validation error for better UX
      if (err?.code === 'EMAIL_EXISTS') {
        setValidationError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }
  };

  return (
    <MobileLayout className="bg-gray-50">
      <LoadingOverlay 
        isLoading={isSubmitting || loading} 
        message="Creating your account..."
      />
      <div className="flex flex-col min-h-screen">
        {/* Registration Form */}
        <div className="flex-1 p-6 pt-safe-top">
          <div className="max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Account Registration</h1>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Messages */}
              {(validationError || error) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">
                    {validationError || (typeof error?.message === 'string' ? error.message : 'An error occurred during registration')}
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="lastName"
                  placeholder="e.g. Dela Cruz"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="firstName"
                  placeholder="e.g. Juan"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Middle Name
                </label>
                <Input
                  type="text"
                  name="middleName"
                  placeholder="e.g. Santos"
                  value={formData.middleName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  name="email"
                  placeholder="e.g. juan.delacruz@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="w-20">
                    <Input
                      type="text"
                      value="+63"
                      disabled
                      className="text-center"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="tel"
                      name="contactNumber"
                      placeholder="9XXXXXXXXX"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      pattern="[0-9]{10}"
                      maxLength={10}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Re-enter Password <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-type your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                fullWidth 
                size="lg" 
                className="mt-6"
                loading={isSubmitting || loading}
                disabled={isSubmitting || loading}
              >
                Submit
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-primary-500 font-medium hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}