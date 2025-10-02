'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

interface AuthGuardProps {
  children: React.ReactNode;
  requireStudent?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireStudent = true }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log('AuthGuard:', { loading, isAuthenticated, pathname, requireStudent, hasStudents: user?.students?.length });
    
    if (!loading) {
      if (!isAuthenticated) {
        console.log('AuthGuard: Not authenticated, redirecting to login');
        router.push('/login');
      } else if (requireStudent && user && (!user.students || user.students.length === 0)) {
        // User is authenticated but has no students
        // Only allow access to add-student page
        if (pathname !== '/add-student') {
          console.log('AuthGuard: No students, redirecting to add-student');
          router.push('/add-student');
        }
      }
    }
  }, [isAuthenticated, loading, user, router, pathname, requireStudent]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  // If user has no students and requireStudent is true, only show add-student page
  if (requireStudent && user && (!user.students || user.students.length === 0) && pathname !== '/add-student') {
    return null;
  }

  return <>{children}</>;
};