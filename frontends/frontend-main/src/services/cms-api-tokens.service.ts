import { api } from 'src/boot/axios';

export interface APIToken {
  id: string;
  _id?: string; // MongoDB ObjectId
  name: string;
  token: string;
  rawToken?: string; // Raw token for read-only tokens (for testing)
  companyId: string;
  scopes: string[];
  createdAt: Date;
  lastUsedAt?: Date;
  revokedAt?: Date;
  active: boolean;
  usage: {
    totalRequests: number;
    lastUsedIP?: string;
    lastUserAgent?: string;
  };
}

export interface CreateAPITokenDto {
  name: string;
  scopes: string[];
}

export interface RegenerateTokenDto {
  tokenId: string;
  name?: string;
}

export interface APITokenUsage {
  tokenId: string;
  requests: Array<{
    timestamp: Date;
    endpoint: string;
    method: string;
    statusCode: number;
    ip: string;
    userAgent: string;
  }>;
  dailyStats: Array<{
    date: string;
    requestCount: number;
  }>;
}

export class CMSAPITokensService {
  /**
   * Get the current user's API token
   */
  static async getCurrentToken(): Promise<APIToken | null> {
    try {
      const response = await api.get('/cms/api-tokens/current');
      const tokenData = response.data.data;
      
      if (!tokenData) return null;
      
      return {
        ...tokenData,
        id: tokenData._id || tokenData.id,
        createdAt: new Date(tokenData.createdAt),
        lastUsedAt: tokenData.lastUsedAt ? new Date(tokenData.lastUsedAt) : undefined,
        revokedAt: tokenData.revokedAt ? new Date(tokenData.revokedAt) : undefined,
      };
    } catch (error: any) {
      console.error('Failed to fetch current API token:', error);
      if (error.response?.status === 404) {
        return null; // No token exists yet
      }
      throw error;
    }
  }

  /**
   * Get both current API tokens (read-only and full-access)
   */
  static async getCurrentTokens(): Promise<{ readOnly: APIToken; fullAccess: APIToken }> {
    try {
      const response = await api.get('/cms/api-tokens/current-tokens');
      const tokensData = response.data.data;
      
      const formatToken = (token: any): APIToken => ({
        ...token,
        id: token._id || token.id,
        createdAt: new Date(token.createdAt),
        lastUsedAt: token.lastUsedAt ? new Date(token.lastUsedAt) : undefined,
        revokedAt: token.revokedAt ? new Date(token.revokedAt) : undefined,
      });

      return {
        readOnly: formatToken(tokensData.readOnly),
        fullAccess: formatToken(tokensData.fullAccess),
      };
    } catch (error: any) {
      console.error('Failed to fetch current API tokens:', error);
      throw error;
    }
  }

  /**
   * Get all API tokens for the current user
   */
  static async getAllTokens(): Promise<APIToken[]> {
    try {
      const response = await api.get('/cms/api-tokens');
      const rawData = response.data.data || [];
      
      return rawData.map((token: any) => ({
        ...token,
        id: token._id || token.id,
        createdAt: new Date(token.createdAt),
        lastUsedAt: token.lastUsedAt ? new Date(token.lastUsedAt) : undefined,
        revokedAt: token.revokedAt ? new Date(token.revokedAt) : undefined,
      }));
    } catch (error) {
      console.error('Failed to fetch API tokens:', error);
      throw error;
    }
  }

  /**
   * Generate a new API token
   */
  static async generateToken(dto: CreateAPITokenDto): Promise<{token: APIToken, rawToken: string}> {
    try {
      const response = await api.post('/cms/api-tokens/generate', dto);
      const { token: tokenData, rawToken } = response.data;
      
      return {
        token: {
          ...tokenData,
          id: tokenData._id || tokenData.id,
          createdAt: new Date(tokenData.createdAt),
          lastUsedAt: tokenData.lastUsedAt ? new Date(tokenData.lastUsedAt) : undefined,
        },
        rawToken
      };
    } catch (error) {
      console.error('Failed to generate API token:', error);
      throw error;
    }
  }

  /**
   * Regenerate an existing API token
   */
  static async regenerateToken(dto: RegenerateTokenDto): Promise<{token: APIToken, rawToken: string}> {
    try {
      const response = await api.post(`/cms/api-tokens/${dto.tokenId}/regenerate`, {
        name: dto.name,
      });
      const { token: tokenData, rawToken } = response.data;
      
      return {
        token: {
          ...tokenData,
          id: tokenData._id || tokenData.id,
          createdAt: new Date(tokenData.createdAt),
          lastUsedAt: tokenData.lastUsedAt ? new Date(tokenData.lastUsedAt) : undefined,
        },
        rawToken
      };
    } catch (error) {
      console.error('Failed to regenerate API token:', error);
      throw error;
    }
  }

  /**
   * Revoke an API token
   */
  static async revokeToken(tokenId: string): Promise<void> {
    try {
      await api.post(`/cms/api-tokens/${tokenId}/revoke`);
    } catch (error) {
      console.error('Failed to revoke API token:', error);
      throw error;
    }
  }

  /**
   * Update API token metadata (name, scopes)
   */
  static async updateToken(tokenId: string, updates: Partial<CreateAPITokenDto>): Promise<APIToken> {
    try {
      const response = await api.patch(`/cms/api-tokens/${tokenId}`, updates);
      const tokenData = response.data.data;
      
      return {
        ...tokenData,
        id: tokenData._id || tokenData.id,
        createdAt: new Date(tokenData.createdAt),
        lastUsedAt: tokenData.lastUsedAt ? new Date(tokenData.lastUsedAt) : undefined,
        revokedAt: tokenData.revokedAt ? new Date(tokenData.revokedAt) : undefined,
      };
    } catch (error) {
      console.error('Failed to update API token:', error);
      throw error;
    }
  }

  /**
   * Get API token usage statistics
   */
  static async getTokenUsage(tokenId: string, days: number = 30): Promise<APITokenUsage> {
    try {
      const response = await api.get(`/cms/api-tokens/${tokenId}/usage`, {
        params: { days },
      });
      
      const usageData = response.data.data;
      
      return {
        ...usageData,
        requests: usageData.requests.map((req: any) => ({
          ...req,
          timestamp: new Date(req.timestamp),
        })),
      };
    } catch (error) {
      console.error('Failed to fetch token usage:', error);
      throw error;
    }
  }

  /**
   * Test API token validity
   */
  static async testToken(token: string): Promise<boolean> {
    try {
      const response = await api.post('/cms/api-tokens/test', { token });
      return response.data.data.valid === true;
    } catch (error) {
      console.error('Failed to test API token:', error);
      return false;
    }
  }

  /**
   * Get available scopes for API tokens
   */
  static async getAvailableScopes(): Promise<Array<{name: string, description: string}>> {
    try {
      const response = await api.get('/cms/api-tokens/scopes');
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch available scopes:', error);
      return [
        { name: 'read', description: 'Read access to content' },
        { name: 'write', description: 'Write access to content' },
        { name: 'admin', description: 'Full administrative access' },
      ];
    }
  }

  /**
   * Generate API documentation for specific content types
   */
  static async generateDocumentation(contentTypeIds?: string[]): Promise<{
    endpoints: Array<{
      method: string;
      path: string;
      description: string;
      parameters: any[];
      responses: any[];
      contentType?: string;
    }>;
    baseUrl: string;
  }> {
    try {
      const response = await api.get('/cms/api-tokens/documentation', {
        params: { contentTypes: contentTypeIds?.join(',') },
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Failed to generate API documentation:', error);
      throw error;
    }
  }

  /**
   * Copy token to clipboard with proper error handling
   */
  static async copyToClipboard(token: string): Promise<boolean> {
    if (!token) return false;
    
    try {
      await navigator.clipboard.writeText(token);
      return true;
    } catch (error) {
      // Fallback for older browsers or when clipboard API is not available
      try {
        const textArea = document.createElement('textarea');
        textArea.value = token;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (fallbackError) {
        console.error('Failed to copy to clipboard:', fallbackError);
        return false;
      }
    }
  }

  /**
   * Format token for display (masking for security)
   */
  static formatTokenForDisplay(token: string, visible: boolean = false): string {
    if (!token) return '';
    if (visible) return token;
    
    const visibleChars = Math.min(12, Math.floor(token.length * 0.3));
    const maskedChars = token.length - visibleChars;
    
    return token.substring(0, visibleChars) + '*'.repeat(maskedChars);
  }

  /**
   * Validate token format
   */
  static isValidTokenFormat(token: string): boolean {
    if (!token) return false;
    
    // CMS tokens should start with 'cms_' and have a specific format
    const cmsTokenRegex = /^cms_[a-zA-Z0-9]+_[a-fA-F0-9]{40,64}$/;
    return cmsTokenRegex.test(token);
  }

  /**
   * Get token strength/security score
   */
  static getTokenStrength(token: string): {
    score: number;
    level: 'weak' | 'medium' | 'strong' | 'very-strong';
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 0;
    
    if (!token) {
      return { score: 0, level: 'weak', issues: ['No token provided'] };
    }
    
    // Length check
    if (token.length >= 60) score += 30;
    else if (token.length >= 40) score += 20;
    else if (token.length >= 20) score += 10;
    else issues.push('Token is too short');
    
    // Format check
    if (this.isValidTokenFormat(token)) score += 25;
    else issues.push('Invalid token format');
    
    // Character diversity
    if (/[a-z]/.test(token)) score += 10;
    if (/[A-Z]/.test(token)) score += 10;
    if (/[0-9]/.test(token)) score += 15;
    if (/[^a-zA-Z0-9]/.test(token)) score += 10;
    
    // Determine level
    let level: 'weak' | 'medium' | 'strong' | 'very-strong';
    if (score >= 90) level = 'very-strong';
    else if (score >= 70) level = 'strong';
    else if (score >= 50) level = 'medium';
    else level = 'weak';
    
    return { score, level, issues };
  }
}