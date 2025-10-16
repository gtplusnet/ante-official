'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth.api';
import { guardianPublicApi } from '@/lib/api/guardian-public-api';
import { getStoredTokens, getStoredUserInfo, getStoredCompanyInfo, clearStoredTokens, storeUserInfo } from '@/lib/utils/storage';
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

      // Fetch fresh profile data from Public API
      const profileData = await guardianPublicApi.getProfile();

      // Update user with fresh API data - now includes full student data
      const refreshedUser: GuardianAuthInfo = {
        id: profileData.id,
        email: profileData.email,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        middleName: profileData.middleName,
        contactNumber: profileData.phoneNumber || '',
        alternateNumber: '',
        address: profileData.address,
        occupation: profileData.occupation,
        lastLogin: profileData.lastLogin ? new Date(profileData.lastLogin) : undefined,
        students: profileData.students.map(s => ({
          id: s.id,
          studentNumber: s.studentNumber,
          firstName: s.firstName,
          lastName: s.lastName,
          middleName: s.middleName,
          dateOfBirth: s.dateOfBirth,
          gender: s.gender,
          section: s.section,
          lrn: s.lrn,
          profilePhoto: s.profilePhoto,
          dateRegistered: s.dateRegistered,
          isActive: s.isActive,
          guardian: s.guardian,
          temporaryGuardianName: s.temporaryGuardianName,
          temporaryGuardianAddress: s.temporaryGuardianAddress,
          temporaryGuardianContactNumber: s.temporaryGuardianContactNumber,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          relationship: s.relationship || 'Parent',
          isPrimary: s.isPrimary !== undefined ? s.isPrimary : true,
        }))
      };

      setUser(refreshedUser);
      // Update stored user info with fresh data
      await storeUserInfo(refreshedUser);

      console.log('[AuthContext] Refreshed user data from Public API');
    } catch (error) {
      console.error('[AuthContext] Refresh auth error:', error);
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