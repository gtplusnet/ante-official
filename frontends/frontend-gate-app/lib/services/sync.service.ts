export interface ValidateLicenseResponse {
  valid: boolean;
  companyId?: number;
  companyName?: string;
  licenseType?: string;
  gateName?: string;
  supabaseToken?: string;
  supabaseRefreshToken?: string;
}

export class SyncService {
  private baseUrl: string;
  
  constructor() {
    // Use the backend API URL directly
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  private getHeaders(licenseKey: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-License-Key': licenseKey,
    };
  }

  async validateLicense(licenseKey: string): Promise<ValidateLicenseResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/school/sync/validate`, {
        method: 'POST',
        headers: this.getHeaders(licenseKey),
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      // Handle wrapped response format from backend
      return result.data || result;
    } catch {
      return null;
    }
  }
}

// Singleton instance
let syncServiceInstance: SyncService | null = null;

export function getSyncService(): SyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService();
  }
  return syncServiceInstance;
}

export const syncService = getSyncService();