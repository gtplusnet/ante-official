import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private adminClient: SupabaseClient;
  private readonly supabaseUrl: string;
  private readonly supabaseServiceKey: string;
  private readonly supabaseJwtSecret: string;

  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    this.supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;

    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      this.logger.warn(
        'Supabase configuration missing. Dual auth will be disabled.',
      );
      return;
    }

    // Create admin client with service role key (bypasses RLS)
    this.adminClient = createClient(this.supabaseUrl, this.supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    this.logger.log('Supabase service initialized');
  }

  /**
   * Check if Supabase is configured and available
   */
  isAvailable(): boolean {
    return !!this.adminClient;
  }

  /**
   * Create a new auth user in Supabase
   */
  async createAuthUser(
    email: string,
    password: string,
    metadata: {
      accountId: string;
      roleId: string;
      companyId?: number;
      firstName?: string;
      lastName?: string;
    },
  ) {
    if (!this.isAvailable()) {
      this.logger.warn('Supabase not available, skipping user creation');
      return { data: null, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await this.adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          ...metadata,
          created_via: 'ante_backend',
          created_at: new Date().toISOString(),
        },
      });

      if (error) {
        this.logger.error(`Failed to create Supabase user: ${error.message}`);
        return { data: null, error: error.message };
      }

      this.logger.log(`Supabase user created: ${data.user.id}`);
      return {
        data: {
          userId: data.user.id,
          email: data.user.email,
        },
        error: null,
      };
    } catch (error) {
      this.logger.error('Supabase createUser error:', error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Update user metadata in Supabase
   */
  async updateAuthUser(
    userId: string,
    updates: {
      email?: string;
      password?: string;
      metadata?: any;
    },
  ) {
    if (!this.isAvailable()) {
      return { data: null, error: 'Supabase not configured' };
    }

    try {
      const updateData: any = {};
      if (updates.email) updateData.email = updates.email;
      if (updates.password) updateData.password = updates.password;
      if (updates.metadata) updateData.user_metadata = updates.metadata;

      const { data, error } = await this.adminClient.auth.admin.updateUserById(
        userId,
        updateData,
      );

      if (error) {
        this.logger.error(`Failed to update Supabase user: ${error.message}`);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      this.logger.error('Supabase updateUser error:', error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Delete a user from Supabase
   */
  async deleteAuthUser(userId: string) {
    if (!this.isAvailable()) {
      return { data: null, error: 'Supabase not configured' };
    }

    try {
      const { data, error } =
        await this.adminClient.auth.admin.deleteUser(userId);

      if (error) {
        this.logger.error(`Failed to delete Supabase user: ${error.message}`);
        return { data: null, error: error.message };
      }

      this.logger.log(`Supabase user deleted: ${userId}`);
      return { data, error: null };
    } catch (error) {
      this.logger.error('Supabase deleteUser error:', error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Generate access and refresh tokens for a user
   * This creates a custom JWT that can be used by the frontend
   */
  async generateAccessToken(
    userId: string,
    claims: {
      email: string;
      accountId: string;
      roleId: string;
      companyId?: number;
    },
  ) {
    if (!this.isAvailable() || !this.supabaseJwtSecret) {
      return {
        accessToken: null,
        refreshToken: null,
        error: 'Supabase not configured',
      };
    }

    try {
      // Create JWT payload following Supabase's exact structure
      // Set expiry to year 2099 to effectively never expire
      const farFutureExpiry = Math.floor(new Date('2099-12-31').getTime() / 1000);

      const payload = {
        aud: 'authenticated',
        exp: farFutureExpiry, // Token expires in 2099
        sub: userId,
        email: claims.email,
        phone: '',
        app_metadata: {
          provider: 'email',
          providers: ['email'],
        },
        user_metadata: {
          accountId: claims.accountId,
          roleId: claims.roleId,
          companyId: claims.companyId,
          email: claims.email,
          email_verified: true,
        },
        role: 'authenticated',
        aal: 'aal1',
        amr: [{ method: 'password', timestamp: Math.floor(Date.now() / 1000) }],
        session_id: uuidv4(), // Generate proper UUID for session
        iat: Math.floor(Date.now() / 1000),
        iss: this.supabaseUrl + '/auth/v1',
        nbf: Math.floor(Date.now() / 1000),
      };

      // Sign with Supabase JWT secret
      const accessToken = jwt.sign(payload, this.supabaseJwtSecret, {
        algorithm: 'HS256',
      });

      // Create refresh token with same far future expiry
      const refreshPayload = {
        ...payload,
        exp: farFutureExpiry, // Same expiry as access token
      };

      const refreshToken = jwt.sign(refreshPayload, this.supabaseJwtSecret, {
        algorithm: 'HS256',
      });

      // Debug: Log token metadata for troubleshooting
      this.logger.debug(
        `Generated non-expiring access token for user ${userId} with metadata:`,
        {
          companyId: claims.companyId,
          accountId: claims.accountId,
          email: claims.email,
          roleId: claims.roleId,
          tokenSubject: payload.sub,
          expiresAt: new Date(farFutureExpiry * 1000).toISOString(),
        },
      );

      return { accessToken, refreshToken, error: null };
    } catch (error) {
      this.logger.error('Failed to generate tokens:', error);
      return {
        accessToken: null,
        refreshToken: null,
        error: error.message,
      };
    }
  }

  /**
   * Get user by email from Supabase
   */
  async getUserByEmail(email: string) {
    if (!this.isAvailable()) {
      return { data: null, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await this.adminClient.auth.admin.listUsers({
        perPage: 1000,
        page: 1,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      const user = data.users.find((u: any) => u.email === email);
      return { data: user || null, error: null };
    } catch (error) {
      this.logger.error('Failed to get user by email:', error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Validate if a supabaseUserId actually exists in Supabase
   * Returns true if valid, false if invalid/missing
   */
  async validateSupabaseUserId(userId: string): Promise<boolean> {
    if (!this.isAvailable() || !userId) {
      return false;
    }

    try {
      const { data, error } =
        await this.adminClient.auth.admin.getUserById(userId);

      if (error) {
        this.logger.warn(
          `Supabase user validation failed for ${userId}: ${error.message}`,
        );
        return false;
      }

      if (!data || !data.user) {
        this.logger.warn(`Supabase user not found: ${userId}`);
        return false;
      }

      this.logger.log(`Supabase user validated: ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Supabase user validation error for ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get user by ID from Supabase
   */
  async getUserById(userId: string) {
    if (!this.isAvailable()) {
      return { data: null, error: 'Supabase not configured' };
    }

    try {
      const { data, error } =
        await this.adminClient.auth.admin.getUserById(userId);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data?.user || null, error: null };
    } catch (error) {
      this.logger.error('Failed to get user by ID:', error);
      return { data: null, error: error.message };
    }
  }

  /**
   * Refresh access token using refresh token
   * Implements token rotation for enhanced security
   */
  async refreshAccessTokenWithRefreshToken(
    refreshToken: string,
    userId: string,
  ): Promise<{
    accessToken: string;
    newRefreshToken?: string;
    expiresIn: number;
    error?: string;
  } | null> {
    if (!this.isAvailable() || !this.supabaseJwtSecret) {
      return {
        accessToken: null,
        error: 'Supabase not configured',
        expiresIn: 0,
      };
    }

    try {
      // Verify the refresh token first
      const decoded = this.verifyToken(refreshToken);

      if (!decoded || decoded.sub !== userId) {
        this.logger.error('Invalid refresh token or user ID mismatch');
        return {
          accessToken: null,
          error: 'Invalid refresh token',
          expiresIn: 0,
        };
      }

      // Generate new access token
      const accessTokenTTL =
        parseInt(process.env.SUPABASE_ACCESS_TOKEN_TTL) || 3600;
      const accessPayload = {
        aud: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + accessTokenTTL,
        sub: userId,
        email: decoded.email,
        role: 'authenticated',
        app_metadata: decoded.app_metadata,
        iat: Math.floor(Date.now() / 1000),
        iss: this.supabaseUrl + '/auth/v1',
      };

      const newAccessToken = jwt.sign(accessPayload, this.supabaseJwtSecret, {
        algorithm: 'HS256',
      });

      // Generate new refresh token if rotation is enabled
      let newRefreshToken: string | undefined;
      if (process.env.SUPABASE_ENABLE_TOKEN_ROTATION === 'true') {
        const refreshTokenTTL =
          parseInt(process.env.SUPABASE_REFRESH_TOKEN_TTL) || 2592000;
        const refreshPayload = {
          ...accessPayload,
          exp: Math.floor(Date.now() / 1000) + refreshTokenTTL,
          token_use: 'refresh',
          rotation_id: this.generateRotationId(),
        };

        newRefreshToken = jwt.sign(refreshPayload, this.supabaseJwtSecret, {
          algorithm: 'HS256',
        });
      }

      return {
        accessToken: newAccessToken,
        newRefreshToken,
        expiresIn: accessTokenTTL,
      };
    } catch (error) {
      this.logger.error('Failed to refresh token:', error);
      return {
        accessToken: null,
        error: error.message,
        expiresIn: 0,
      };
    }
  }

  /**
   * Verify a JWT token without making an API call
   */
  verifyToken(token: string): any {
    if (!this.supabaseJwtSecret) {
      throw new Error('Supabase JWT secret not configured');
    }

    try {
      return jwt.verify(token, this.supabaseJwtSecret, {
        algorithms: ['HS256'],
        issuer: this.supabaseUrl + '/auth/v1',
      });
    } catch (error) {
      this.logger.error('Token verification failed:', error.message);
      return null;
    }
  }

  /**
   * Decode token claims without verification
   */
  decodeTokenClaims(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      this.logger.error('Token decode failed:', error.message);
      return null;
    }
  }

  /**
   * Generate a unique rotation ID for refresh tokens
   */
  private generateRotationId(): string {
    return `rot_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Sign in user with email and password to get session tokens
   * Used for existing users who need Supabase tokens
   */
  async signInWithPassword(email: string, password: string) {
    if (!this.isAvailable()) {
      return { data: null, error: 'Supabase not configured' };
    }

    try {
      // Create a temporary client for this sign-in
      const tempClient = createClient(
        this.supabaseUrl,
        process.env.SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        },
      );

      const { data, error } = await tempClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        this.logger.error(`Supabase sign-in failed: ${error.message}`);
        return { data: null, error: error.message };
      }

      return {
        data: {
          userId: data.user.id,
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
        },
        error: null,
      };
    } catch (error) {
      this.logger.error('Supabase signIn error:', error);
      return { data: null, error: error.message };
    }
  }
}
