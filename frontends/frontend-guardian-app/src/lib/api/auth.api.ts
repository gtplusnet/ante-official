import { apiClient, ApiResponse } from './api-client';
import { storeTokens, storeUserInfo, storeCompanyInfo, clearStoredTokens } from '@/lib/utils/storage';
import { getSupabaseService } from '@/lib/services/supabase.service';

export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
  deviceInfo?: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  email: string;
  password: string;
  contactNumber: string;
  alternateNumber?: string;
  address?: string;
  occupation?: string;
  deviceId?: string;
}

export interface GuardianAuthResponse {
  guardian: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    contactNumber: string;
    students: Array<{
      id: string;
      studentNumber: string;
      firstName: string;
      lastName: string;
      middleName?: string;
      grade?: string;
      section?: string;
      relationship: string;
      isPrimary: boolean;
    }>;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    supabaseToken?: string;
    supabaseRefreshToken?: string;
  };
  company: {
    id: number;
    name: string;
  };
}

class AuthApi {
  async login(data: LoginRequest): Promise<GuardianAuthResponse> {
    try {
      // Add device info if running on mobile
      const deviceInfo = {
        platform: 'web', // This will be updated when running on Capacitor
        appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      };

      const response = await apiClient.post<GuardianAuthResponse>('/api/guardian/auth/login', {
        ...data,
        deviceInfo: JSON.stringify(deviceInfo),
      });

      if (response.success && response.data) {
        // Store tokens, user info, and company info
        await storeTokens(response.data.tokens);
        await storeUserInfo(response.data.guardian);
        await storeCompanyInfo(response.data.company);
        
        // Initialize Supabase session if tokens are provided
        console.log('[AuthApi] Checking for Supabase tokens:', {
          hasSupabaseToken: !!response.data.tokens.supabaseToken,
          hasSupabaseRefreshToken: !!response.data.tokens.supabaseRefreshToken,
          tokenKeys: Object.keys(response.data.tokens)
        });
        
        if (response.data.tokens.supabaseToken && response.data.tokens.supabaseRefreshToken) {
          const supabaseService = getSupabaseService();
          const sessionResult = await supabaseService.setSession(
            response.data.tokens.supabaseToken,
            response.data.tokens.supabaseRefreshToken
          );
          console.log('[AuthApi] Supabase session result:', sessionResult);
          console.log('[AuthApi] Supabase session initialized after login');
        } else {
          console.warn('[AuthApi] No Supabase tokens received from backend');
        }
        
        return response.data;
      }

      throw new Error('Login failed');
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password. Please check your credentials and try again.',
          details: error.response?.data,
        };
      }
      
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message;
        throw {
          code: 'VALIDATION_ERROR',
          message: Array.isArray(errorMessage) ? errorMessage[0] : errorMessage || 'Invalid request',
          details: error.response?.data,
        };
      }
      
      throw {
        code: error.code || 'LOGIN_ERROR',
        message: error.message || 'Unable to login. Please try again later.',
        details: error.details,
      };
    }
  }

  async register(data: RegisterRequest): Promise<GuardianAuthResponse> {
    try {
      const companyId = process.env.NEXT_PUBLIC_COMPANY_ID ? parseInt(process.env.NEXT_PUBLIC_COMPANY_ID) : 1;
      
      const response = await apiClient.post<GuardianAuthResponse>('/api/guardian/auth/register', {
        ...data,
        companyId,
      });

      if (response.success && response.data) {
        // Store tokens, user info, and company info
        await storeTokens(response.data.tokens);
        await storeUserInfo(response.data.guardian);
        await storeCompanyInfo(response.data.company);
        
        // Initialize Supabase session if tokens are provided
        if (response.data.tokens.supabaseToken && response.data.tokens.supabaseRefreshToken) {
          const supabaseService = getSupabaseService();
          await supabaseService.setSession(
            response.data.tokens.supabaseToken,
            response.data.tokens.supabaseRefreshToken
          );
          console.log('[AuthApi] Supabase session initialized after registration');
        }
        
        return response.data;
      }

      throw new Error('Registration failed');
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 409) {
        throw {
          code: 'EMAIL_EXISTS',
          message: 'This email address is already registered. Please use a different email or sign in to your existing account.',
          details: error.response?.data,
        };
      }
      
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message;
        throw {
          code: 'VALIDATION_ERROR',
          message: Array.isArray(errorMessage) ? errorMessage[0] : errorMessage || 'Invalid request',
          details: error.response?.data,
        };
      }
      
      throw {
        code: error.code || 'REGISTRATION_ERROR',
        message: error.message || 'Registration failed. Please try again later.',
        details: error.details,
      };
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint (optional, depends on backend implementation)
      await apiClient.post('/api/guardian/auth/logout', {});
    } catch (error) {
      // Even if the API call fails, clear local storage
      console.error('Logout API error:', error);
    } finally {
      // Clear stored tokens and user info
      await clearStoredTokens();
      
      // Clear Supabase session
      const supabaseService = getSupabaseService();
      await supabaseService.clearSession();
    }
  }
}

export const authApi = new AuthApi();