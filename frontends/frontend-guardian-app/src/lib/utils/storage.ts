interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const TOKEN_KEY = 'guardian_auth_tokens';
const USER_KEY = 'guardian_user_info';
const COMPANY_KEY = 'guardian_company_info';

// In a real app, consider using more secure storage like react-native-keychain for mobile
// or encrypted storage for sensitive data

export const storeTokens = async (tokens: AuthTokens): Promise<void> => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    }
  } catch (error) {
    console.error('Error storing tokens:', error);
  }
};

export const getStoredTokens = async (): Promise<AuthTokens | null> => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(TOKEN_KEY);
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving tokens:', error);
    return null;
  }
};

export const clearStoredTokens = async (): Promise<void> => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(COMPANY_KEY);
    }
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

export const storeUserInfo = async (userInfo: any): Promise<void> => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
    }
  } catch (error) {
    console.error('Error storing user info:', error);
  }
};

export const getStoredUserInfo = async (): Promise<any | null> => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving user info:', error);
    return null;
  }
};

export const storeCompanyInfo = async (companyInfo: any): Promise<void> => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(COMPANY_KEY, JSON.stringify(companyInfo));
    }
  } catch (error) {
    console.error('Error storing company info:', error);
  }
};

export const getStoredCompanyInfo = async (): Promise<any | null> => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(COMPANY_KEY);
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving company info:', error);
    return null;
  }
};

// Session storage utilities for temporary data
export const setSessionData = (key: string, value: any): void => {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error('Error setting session data:', error);
  }
};

export const getSessionData = <T>(key: string): T | null => {
  try {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  } catch (error) {
    console.error('Error getting session data:', error);
    return null;
  }
};

export const removeSessionData = (key: string): void => {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Error removing session data:', error);
  }
};