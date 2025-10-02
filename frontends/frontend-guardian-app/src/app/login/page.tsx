'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { FiAlertCircle } from 'react-icons/fi';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateForm = (): boolean => {
    if (!email || !password) {
      setValidationError('Please fill in all fields');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
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
      await login({ email, password });
      // Navigation is handled by the auth context
    } catch (err: any) {
      // Error is handled by the auth context
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout className="bg-white">
      <LoadingOverlay 
        isLoading={isSubmitting || loading} 
        message="Signing you in..."
      />
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        {/* Logo Section */}
        <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <img
            src="/logo.png"
            alt="Mater Dei Academy"
            className="w-32 h-32 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-primary-500">MATER DEI ACADEMY</h1>
          <p className="text-sm text-gray-600">Of Sta.Maria Bulacan, Inc.</p>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
          <h2 className="text-xl font-semibold text-center mb-6">Account Login</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Messages */}
            {(validationError || error) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">
                  {validationError || error?.message || 'An error occurred'}
                </p>
              </div>
            )}
            
            <div className="transition-all duration-200 hover:scale-[1.02]">
              <Input
                type="email"
                placeholder="Email Address"
                icon="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
                className="transition-all duration-200"
              />
            </div>
            
            <div className="transition-all duration-200 hover:scale-[1.02]">
              <Input
                type="password"
                placeholder="Password"
                icon="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
                className="transition-all duration-200"
              />
            </div>
            
            <div className="pt-2">
              <Button 
                type="submit" 
                fullWidth 
                size="lg"
                loading={isSubmitting || loading}
                disabled={isSubmitting || loading}
                className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                Sign In
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary-500 font-medium hover:underline">
                Register Now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}