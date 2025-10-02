import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ofnmfmwywkhosrmycltb.supabase.co';
// Anon key is only used for client initialization - actual auth uses JWT from backend
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mbm1mbXd5d2tob3NybXljbHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNTQ1OTcsImV4cCI6MjA3MjYzMDU5N30.xG_whEdorHh3pPPrf8p8xm7FzJrTuqhCpd-igos08XY';

class SupabaseService {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.customAccessToken = null;
    this.customRefreshToken = null;
    this.customUser = null; // Store user info from JWT
    this.isCustomSession = false;
    this.customAuthClient = null; // Cache for custom auth client
    this.cachedTokenForClient = null; // Track which token the cached client uses
  }

  /**
   * Initialize the Supabase client
   */
  initialize() {
    if (!this.isInitialized && supabaseUrl && supabaseAnonKey) {
      try {
        this.client = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            storage: {
              getItem: (key) => {
                // Use localStorage for persistence
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
              },
              setItem: (key, value) => {
                localStorage.setItem(key, JSON.stringify(value));
              },
              removeItem: (key) => {
                localStorage.removeItem(key);
              },
            },
          },
        });
        this.isInitialized = true;
        console.log('🔐 SupabaseService - Client initialized');
        
        // Restore custom session if available
        this._restoreCustomSession();
        
      } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
      }
    }
    return this.client;
  }

  /**
   * Restore custom session from localStorage
   */
  _restoreCustomSession() {
    try {
      const storedSession = localStorage.getItem('supabase-custom-session');
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        this.customAccessToken = sessionData.access_token;
        this.customRefreshToken = sessionData.refresh_token;
        this.customUser = sessionData.user; // Store user info as well
        this.isCustomSession = true;

        // Clear any cached client to force recreation with restored token
        this.customAuthClient = null;
        this.cachedTokenForClient = null;

        console.log('🔐 SupabaseService - Custom session restored from localStorage', {
          hasUser: !!sessionData.user,
          userId: sessionData.user?.id,
          companyId: sessionData.user?.user_metadata?.companyId
        });
      }
    } catch (error) {
      console.error('🔐 SupabaseService - Error restoring custom session:', error);
      // Clear invalid stored session
      localStorage.removeItem('supabase-custom-session');
    }
  }

  /**
   * Set the session with tokens received from backend
   * Uses custom session management for backend-generated JWT tokens
   */
  async setSession(accessToken, refreshToken) {
    if (!accessToken) {
      console.warn('No Supabase access token provided');
      return { data: null, error: 'No access token provided' };
    }

    const client = this.initialize();
    if (!client) {
      return { data: null, error: 'Supabase client not initialized' };
    }

    console.log('🔐 SupabaseService - Setting custom JWT session from backend');

    try {
      // Parse JWT to extract user information
      let userInfo = null;
      try {
        const tokenParts = accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          userInfo = {
            id: payload.sub,
            email: payload.email || payload.user_metadata?.email,
            user_metadata: payload.user_metadata || {},
            app_metadata: payload.app_metadata || {},
            role: payload.role
          };
          console.log('🔐 SupabaseService - Extracted user info from JWT:', {
            userId: userInfo.id,
            email: userInfo.email,
            companyId: userInfo.user_metadata.companyId,
            roleId: userInfo.user_metadata.roleId
          });
        }
      } catch (e) {
        console.warn('⚠️ Could not parse JWT payload:', e);
      }

      // Store custom tokens and user info
      this.customAccessToken = accessToken;
      this.customRefreshToken = refreshToken || accessToken; // Use access token as refresh if not provided
      this.customUser = userInfo;
      this.isCustomSession = true;

      // Store in localStorage for persistence across page refreshes
      localStorage.setItem('supabase-custom-session', JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken || accessToken,
        user: userInfo,
        timestamp: Date.now()
      }));

      // Clear any cached client to force recreation with new token
      this.customAuthClient = null;
      this.cachedTokenForClient = null;

      // Create session data structure
      const sessionData = {
        session: {
          access_token: accessToken,
          refresh_token: refreshToken || accessToken,
          user: userInfo,
          token_type: 'bearer',
          expires_in: 999999999, // No expiry as requested
          expires_at: 999999999999 // Far future date
        }
      };

      console.log('🔐 SupabaseService - Custom JWT session established successfully');
      return { data: sessionData, error: null };

    } catch (error) {
      console.error('🔐 SupabaseService - Error setting custom session:', error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Get the current session
   */
  async getSession() {
    const client = this.initialize();
    if (!client) {
      return { data: { session: null }, error: 'Supabase client not initialized' };
    }

    // Return custom session if we have one
    if (this.isCustomSession && this.customAccessToken) {
      console.log('🔐 SupabaseService - Returning custom session with user metadata');
      const customSessionData = {
        session: {
          access_token: this.customAccessToken,
          refresh_token: this.customRefreshToken || this.customAccessToken,
          user: this.customUser,
          token_type: 'bearer',
          expires_in: 999999999, // No expiry
          expires_at: 999999999999
        }
      };
      return { data: customSessionData, error: null };
    }

    // Fall back to Supabase's native session
    try {
      const { data, error } = await client.auth.getSession();
      return { data, error };
    } catch (error) {
      console.error('Error getting Supabase session:', error);
      return { data: { session: null }, error: error.message };
    }
  }

  /**
   * Sign out and clear the session
   */
  async signOut() {
    const client = this.initialize();
    if (!client) {
      return { error: 'Supabase client not initialized' };
    }

    try {
      // Clear custom session and cached client
      if (this.isCustomSession) {
        this.customAccessToken = null;
        this.customRefreshToken = null;
        this.customUser = null;
        this.isCustomSession = false;
        this.customAuthClient = null;
        this.cachedTokenForClient = null;
        localStorage.removeItem('supabase-custom-session');
        console.log('🔐 SupabaseService - Custom session and cache cleared');
      }

      // Also clear native Supabase session
      const { error } = await client.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
        return { error: error.message };
      }
      
      console.log('🔐 SupabaseService - All sessions cleared');
      return { error: null };
    } catch (error) {
      console.error('Error during Supabase signOut:', error);
      return { error: error.message };
    }
  }

  /**
   * Get the Supabase client instance
   * Returns a client configured for custom JWT tokens if available
   */
  getClient() {
    const client = this.initialize();

    // If we have custom tokens, return cached client or create new one
    if (this.isCustomSession && this.customAccessToken && client) {
      // Check if we can reuse the cached client
      if (this.customAuthClient && this.cachedTokenForClient === this.customAccessToken) {
        console.log('🔐 SupabaseService - Reusing cached client with custom JWT');
        return this.customAuthClient;
      }

      console.log('🔐 SupabaseService - Creating new client with custom JWT authorization');
      console.log('🔐 SupabaseService - Token preview:', this.customAccessToken.substring(0, 50) + '...');

      // Decode JWT to inspect structure
      try {
        const tokenParts = this.customAccessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('🔐 SupabaseService - JWT payload structure:', {
            hasUserMetadata: !!payload.user_metadata,
            userMetadata: payload.user_metadata,
            sub: payload.sub,
            role: payload.role,
            exp: payload.exp
          });
        }
      } catch (e) {
        console.error('🔐 SupabaseService - Error decoding JWT:', e);
      }

      // Create a new client instance with custom headers
      this.customAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false, // Don't use Supabase's session management
          autoRefreshToken: false,
        },
        global: {
          headers: {
            'Authorization': `Bearer ${this.customAccessToken}`,
            'X-Source': 'frontend-main' // For RLS policies
          }
        }
      });

      // Cache the token for which this client was created
      this.cachedTokenForClient = this.customAccessToken;

      // Log the configured headers for debugging
      console.log('🔐 SupabaseService - Client configured with headers:', {
        hasAuthorization: true,
        hasXSource: true,
        tokenLength: this.customAccessToken.length
      });

      return this.customAuthClient;
    }

    // Clear cache if not using custom session
    if (this.customAuthClient) {
      console.log('🔐 SupabaseService - Clearing custom client cache');
      this.customAuthClient = null;
      this.cachedTokenForClient = null;
    }

    console.log('🔐 SupabaseService - Returning default client');
    return client;
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback) {
    const client = this.initialize();
    if (!client) {
      console.warn('Cannot subscribe to auth changes - client not initialized');
      return null;
    }

    const { data } = client.auth.onAuthStateChange((event, session) => {
      console.log('Supabase auth event:', event);
      callback(event, session);
    });

    return data.subscription;
  }

  /**
   * Get the current user
   */
  async getUser() {
    const client = this.initialize();
    if (!client) {
      return { data: { user: null }, error: 'Supabase client not initialized' };
    }

    try {
      const { data, error } = await client.auth.getUser();
      return { data, error };
    } catch (error) {
      console.error('Error getting Supabase user:', error);
      return { data: { user: null }, error: error.message };
    }
  }

  /**
   * Refresh the session token
   */
  async refreshSession() {
    const client = this.initialize();
    if (!client) {
      return { data: { session: null }, error: 'Supabase client not initialized' };
    }

    try {
      const { data, error } = await client.auth.refreshSession();
      if (error) {
        console.error('Failed to refresh Supabase session:', error);
        return { data: { session: null }, error: error.message };
      }
      
      console.log('Supabase session refreshed');
      return { data, error: null };
    } catch (error) {
      console.error('Error refreshing Supabase session:', error);
      return { data: { session: null }, error: error.message };
    }
  }
}

// Create and export a singleton instance
const supabaseService = new SupabaseService();
export default supabaseService;