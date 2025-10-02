'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth.api';
import { getStoredTokens, getStoredUserInfo, getStoredCompanyInfo, clearStoredTokens, storeUserInfo } from '@/lib/utils/storage';
import { getSupabaseService } from '@/lib/services/supabase.service';
import { getStudentsSupabaseService } from '@/lib/services/students.service';
import { 
  GuardianAuthInfo, 
  LoginRequest, 
  RegisterRequest,
  ApiError 
} from '@/types/api.types';

interface AuthContextType {
  user: GuardianAuthInfo | null;
  company: { id: number; name: string } | null;
  loading: boolean;
  error: ApiError | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<GuardianAuthInfo | null>(null);
  const [company, setCompany] = useState<{ id: number; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const router = useRouter();

  // Check for stored auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const tokens = await getStoredTokens();
      const userInfo = await getStoredUserInfo();
      const companyInfo = await getStoredCompanyInfo();

      if (tokens && userInfo) {
        setUser(userInfo);
        setCompany(companyInfo);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: LoginRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authApi.login(data);
      setUser(response.guardian);
      setCompany(response.company);
      
      // Navigate based on whether user has students
      if (!response.guardian.students || response.guardian.students.length === 0) {
        router.push('/add-student');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authApi.register(data);
      setUser(response.guardian);
      setCompany(response.company);
      
      // Navigate based on whether user has students
      if (!response.guardian.students || response.guardian.students.length === 0) {
        router.push('/add-student');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authApi.logout();
      setUser(null);
      setCompany(null);
      await clearStoredTokens();
      
      // Navigate to login
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAuth = async () => {
    try {
      const tokens = await getStoredTokens();
      const storedUser = await getStoredUserInfo();
      
      if (!tokens || !storedUser) {
        throw new Error('No tokens or user found');
      }
      
      // Set Supabase session with tokens from backend
      const supabaseService = getSupabaseService();
      const sessionResult = await supabaseService.setSession(
        tokens.accessToken, 
        tokens.refreshToken
      );
      
      if (sessionResult.error) {
        console.error('Failed to set Supabase session:', sessionResult.error);
        throw new Error('Invalid session');
      }
      
      // Fetch fresh profile data from Supabase
      const { data: profileData, error: profileError } = await supabaseService.getGuardianProfile(storedUser.id);
      
      if (profileError || !profileData) {
        console.error('Failed to fetch profile:', profileError);
        // Fallback to stored user info if profile fetch fails
        setUser(storedUser);
        return;
      }
      
      // Get students data via Supabase
      const studentsService = getStudentsSupabaseService();
      const students = await studentsService.getGuardianStudents(storedUser.id);
      
      // Update user with fresh Supabase data
      const refreshedUser: GuardianAuthInfo = {
        ...storedUser,
        firstName: (profileData as any).firstName,
        lastName: (profileData as any).lastName,
        middleName: (profileData as any).middleName,
        email: (profileData as any).email,
        contactNumber: (profileData as any).contactNumber,
        alternateNumber: (profileData as any).alternateNumber,
        address: (profileData as any).address,
        occupation: (profileData as any).occupation,
        students: students.map(s => ({
          id: s.id,
          studentNumber: s.studentNumber,
          firstName: s.firstName,
          lastName: s.lastName,
          middleName: s.middleName,
          grade: s.gradeLevel || undefined,
          section: s.section || undefined,
          relationship: s.relationship || 'Parent',
          isPrimary: s.isPrimary || true
        }))
      };
      
      setUser(refreshedUser);
      // Update stored user info with fresh data
      await storeUserInfo(refreshedUser);
      
    } catch (error) {
      console.error('Refresh auth error:', error);
      // Only logout if tokens are actually invalid
      const tokens = await getStoredTokens();
      if (!tokens) {
        await logout();
      }
    }
  };

  const value: AuthContextType = {
    user,
    company,
    loading,
    error,
    login,
    register,
    logout,
    refreshAuth,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};