'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    if (!loading) {
      // Redirect based on auth status
      if (isAuthenticated) {
        // Check if user has students
        if (!user?.students || user.students.length === 0) {
          router.push('/add-student');
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/login');
      }
    }
  }, [router, isAuthenticated, loading, user]);

  // Show loading screen while checking auth
  return <LoadingScreen />;
}