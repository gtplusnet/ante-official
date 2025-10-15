import { guardianPublicApi, GuardianLoginRequest } from './guardian-public-api';
import { storeTokens, storeUserInfo, storeCompanyInfo, clearStoredTokens } from '@/lib/utils/storage';

export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
  deviceInfo?: string;
  deviceToken?: string; // FCM/APNS token for push notifications (optional)
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
      // Use Guardian Public API for login
      const loginRequest: GuardianLoginRequest = {
        email: data.email,
        password: data.password,
        deviceId: data.deviceId,
        deviceToken: data.deviceToken, // Pass through device token if provided (for push notifications)
        platform: 'web', // This will be updated when running on Capacitor
      };

      const response = await guardianPublicApi.login(loginRequest);

      // Transform response to match expected format
      const authResponse: GuardianAuthResponse = {
        guardian: {
          id: response.guardian.id,
          email: response.guardian.email,
          firstName: response.guardian.firstName,
          lastName: response.guardian.lastName,
          middleName: '',
          contactNumber: response.guardian.phoneNumber || '',
          students: response.students.map(s => ({
            id: s.id,
            studentNumber: s.studentCode,
            firstName: s.firstName,
            lastName: s.lastName,
            middleName: s.middleName,
            grade: s.gradeLevel,
            section: s.section,
            relationship: s.relationship || 'Guardian',
            isPrimary: s.isPrimary || false,
          })),
        },
        tokens: {
          accessToken: response.token,
          refreshToken: response.token, // Public API uses single token
          expiresIn: 900, // 15 minutes default
        },
        company: {
          id: parseInt(process.env.NEXT_PUBLIC_COMPANY_ID || '1'),
          name: 'School',
        },
      };

      // Store tokens, user info, and company info
      await storeTokens(authResponse.tokens);
      await storeUserInfo(authResponse.guardian);
      await storeCompanyInfo(authResponse.company);

      console.log('[AuthApi] Login successful via Public API');
      return authResponse;
    } catch (error: any) {
      console.error('[AuthApi] Login error:', error);
      throw {
        code: error.code || 'LOGIN_ERROR',
        message: error.message || 'Unable to login. Please try again later.',
        details: error.details,
      };
    }
  }

  async register(data: RegisterRequest): Promise<GuardianAuthResponse> {
    // TODO: Registration endpoint not yet implemented in Public API
    // Registration should be done through school admin portal
    throw {
      code: 'NOT_IMPLEMENTED',
      message: 'Guardian registration is handled by the school administration. Please contact your school to create an account.',
      details: 'Public API does not expose guardian registration endpoint',
    };
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint via Public API
      await guardianPublicApi.logout();
    } catch (error) {
      // Even if the API call fails, clear local storage
      console.error('[AuthApi] Logout API error:', error);
    } finally {
      // Clear stored tokens and user info
      await clearStoredTokens();
      console.log('[AuthApi] Logout successful - tokens cleared');
    }
  }
}

export const authApi = new AuthApi();