/**
 * Authentication helper for gate app
 * Handles license key validation with backend API
 */

export interface LicenseValidationResult {
  licenseId: string;
  gateId: string;
  gateName: string;
  companyId: number;
  isActive: boolean;
}

export class AuthHelperService {
  private baseUrl: string;
  private apiBase: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    this.apiBase = `${this.baseUrl}/api/public/school-gate`;
  }

  /**
   * Validate license key with backend
   * Replaces Supabase authentication with license-based authentication
   */
  async validateLicense(licenseKey: string): Promise<LicenseValidationResult | null> {
    try {
      console.log('[AuthHelper] Validating license key...');

      const response = await fetch(`${this.apiBase}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-license-key': licenseKey,
        },
        body: JSON.stringify({
          deviceInfo: {
            deviceName: localStorage.getItem('deviceName') || 'Unknown Device',
            userAgent: navigator.userAgent,
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[AuthHelper] License validation failed:', error.message);
        return null;
      }

      const result = await response.json();

      if (result.success && result.data) {
        console.log('[AuthHelper] License validated successfully:', result.data);

        // Store license info in localStorage
        localStorage.setItem('licenseKey', licenseKey);
        localStorage.setItem('licenseId', result.data.licenseId);
        localStorage.setItem('gateId', result.data.gateId);
        localStorage.setItem('gateName', result.data.gateName || 'Main Gate');
        localStorage.setItem('companyId', result.data.companyId.toString());
        localStorage.setItem('deviceId', result.data.gateId); // Use gateId as deviceId

        return {
          licenseId: result.data.licenseId,
          gateId: result.data.gateId,
          gateName: result.data.gateName,
          companyId: result.data.companyId,
          isActive: result.data.isActive,
        };
      }

      console.error('[AuthHelper] Invalid response format');
      return null;
    } catch (error) {
      console.error('[AuthHelper] License validation error:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated (has valid license key)
   */
  isAuthenticated(): boolean {
    const licenseKey = localStorage.getItem('licenseKey');
    const companyId = localStorage.getItem('companyId');
    return !!(licenseKey && companyId);
  }

  /**
   * Logout - clear license data
   */
  logout(): void {
    localStorage.removeItem('licenseKey');
    localStorage.removeItem('licenseId');
    localStorage.removeItem('gateId');
    localStorage.removeItem('gateName');
    localStorage.removeItem('companyId');
    localStorage.removeItem('deviceId');
    localStorage.removeItem('cached_students');
    localStorage.removeItem('cached_guardians');
    localStorage.removeItem('last_student_sync');
    localStorage.removeItem('last_guardian_sync');
    console.log('[AuthHelper] Logged out - cleared license data');
  }

  /**
   * Get current license info from localStorage
   */
  getLicenseInfo(): LicenseValidationResult | null {
    const licenseKey = localStorage.getItem('licenseKey');
    const licenseId = localStorage.getItem('licenseId');
    const gateId = localStorage.getItem('gateId');
    const gateName = localStorage.getItem('gateName');
    const companyId = localStorage.getItem('companyId');

    if (!licenseKey || !licenseId || !gateId || !companyId) {
      return null;
    }

    return {
      licenseId,
      gateId,
      gateName: gateName || 'Main Gate',
      companyId: parseInt(companyId),
      isActive: true,
    };
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use validateLicense() instead
   */
  async authenticateGateApp(companyId: number): Promise<{
    supabaseToken: string;
    supabaseRefreshToken: string;
  } | null> {
    console.warn('[AuthHelper] authenticateGateApp() is deprecated');
    console.warn('[AuthHelper] Use validateLicense() instead');
    return null;
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