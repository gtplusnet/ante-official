/**
 * Fallback authentication service for Guardian App
 * Uses service account when guardian doesn't have Supabase tokens
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' 
  ? 'https://backend-ante.geertest.com'
  : 'http://localhost:3000');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Service account credentials
const SERVICE_ACCOUNT = {
  username: 'guillermotabligan',
  password: 'water123',
};

class FallbackAuthService {
  private supabaseClient: SupabaseClient | null = null;
  private serviceTokens: { accessToken: string; refreshToken: string } | null = null;
  private lastAuthTime: number = 0;
  private readonly TOKEN_LIFETIME = 50 * 60 * 1000; // 50 minutes

  /**
   * Get or create a Supabase client with service account authentication
   */
  async getAuthenticatedClient(): Promise<SupabaseClient> {
    const now = Date.now();
    
    // If we have a client and tokens are still fresh, return existing client
    if (this.supabaseClient && this.serviceTokens && (now - this.lastAuthTime) < this.TOKEN_LIFETIME) {
      return this.supabaseClient;
    }

    console.log('[FallbackAuth] Authenticating with service account...');
    
    try {
      // Authenticate with backend using service account
      const loginResponse = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(SERVICE_ACCOUNT),
      });

      if (!loginResponse.ok) {
        throw new Error(`Service account login failed: ${loginResponse.status}`);
      }

      const loginResult = await loginResponse.json();
      
      if (!loginResult.supabaseToken || !loginResult.supabaseRefreshToken) {
        throw new Error('No Supabase tokens received from service account');
      }

      // Store tokens
      this.serviceTokens = {
        accessToken: loginResult.supabaseToken,
        refreshToken: loginResult.supabaseRefreshToken,
      };
      this.lastAuthTime = now;

      // Create new Supabase client with service account tokens
      this.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storage: {
            getItem: (key: string) => {
              if (typeof window !== 'undefined') {
                return window.localStorage.getItem(`fallback_${key}`)
              }
              return null
            },
            setItem: (key: string, value: string) => {
              if (typeof window !== 'undefined') {
                window.localStorage.setItem(`fallback_${key}`, value)
              }
            },
            removeItem: (key: string) => {
              if (typeof window !== 'undefined') {
                window.localStorage.removeItem(`fallback_${key}`)
              }
            },
          },
        },
        global: {
          headers: {
            'X-Source': 'frontend-guardian-app',
          },
        },
      });

      // Set the session
      const { error: sessionError } = await this.supabaseClient.auth.setSession({
        access_token: this.serviceTokens.accessToken,
        refresh_token: this.serviceTokens.refreshToken,
      });

      if (sessionError) {
        throw new Error(`Failed to set Supabase session: ${sessionError.message}`);
      }

      console.log('[FallbackAuth] Service account authentication successful - realtime enabled');
      console.log('[FallbackAuth] Client ready for realtime subscriptions');
      return this.supabaseClient;
      
    } catch (error) {
      console.error('[FallbackAuth] Service account authentication failed:', error);
      throw error;
    }
  }

  /**
   * Clear cached client and tokens
   */
  clearCache(): void {
    this.supabaseClient = null;
    this.serviceTokens = null;
    this.lastAuthTime = 0;
  }
}

// Export singleton instance
export const fallbackAuthService = new FallbackAuthService();