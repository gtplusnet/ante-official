/**
 * Authentication helper for gate app
 * Handles authentication with backend and Supabase
 */

export class AuthHelperService {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  /**
   * Authenticate with backend and get Supabase tokens
   * Uses a service account for the gate app
   */
  async authenticateGateApp(companyId: number): Promise<{
    supabaseToken: string;
    supabaseRefreshToken: string;
  } | null> {
    try {
      // Use a service account for the gate app
      // In production, this should be properly configured per company
      const credentials = this.getServiceAccountCredentials(companyId);
      
      if (!credentials) {
        console.error('[AuthHelper] No service account configured for company:', companyId);
        return null;
      }

      // Authenticate with backend
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        console.error('[AuthHelper] Authentication failed:', response.status);
        return null;
      }

      const result = await response.json();
      
      if (result.supabaseToken && result.supabaseRefreshToken) {
        console.log('[AuthHelper] Successfully authenticated and received Supabase tokens');
        return {
          supabaseToken: result.supabaseToken,
          supabaseRefreshToken: result.supabaseRefreshToken,
        };
      }

      console.error('[AuthHelper] No Supabase tokens in response');
      return null;
    } catch (error) {
      console.error('[AuthHelper] Authentication error:', error);
      return null;
    }
  }

  /**
   * Get service account credentials for a company
   * In production, this should be stored securely
   */
  private getServiceAccountCredentials(companyId: number): { username: string; password: string } | null {
    // For development/testing, use known test accounts
    const serviceAccounts: Record<number, { username: string; password: string }> = {
      16: {
        username: 'guillermotabligan',
        password: 'water123',
      },
      // Add more company service accounts as needed
    };

    return serviceAccounts[companyId] || null;
  }
}

// Singleton instance
let authHelperInstance: AuthHelperService | null = null;

export function getAuthHelperService(): AuthHelperService {
  if (!authHelperInstance) {
    authHelperInstance = new AuthHelperService();
  }
  return authHelperInstance;
}