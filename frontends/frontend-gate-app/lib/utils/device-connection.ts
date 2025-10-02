import { SyncService } from '@/lib/services/sync.service';

interface DeviceConnectionResult {
  success: boolean;
  error?: string;
  deviceName?: string;
}

export class DeviceConnectionManager {
  private static instance: DeviceConnectionManager;
  private syncService: SyncService;
  private connectionPromise: Promise<DeviceConnectionResult> | null = null;
  private lastConnectionAttempt: number = 0;
  private readonly CONNECTION_RETRY_DELAY = 5000; // 5 seconds

  private constructor() {
    this.syncService = new SyncService();
  }

  static getInstance(): DeviceConnectionManager {
    if (!DeviceConnectionManager.instance) {
      DeviceConnectionManager.instance = new DeviceConnectionManager();
    }
    return DeviceConnectionManager.instance;
  }

  private generateDeviceInfo() {
    return {
      deviceName: `School Gatekeep - ${navigator.userAgent.substring(0, 50)}`,
      macAddress: 'WEB-' + Math.random().toString(36).substring(2, 15),
      ipAddress: 'Web Client',
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timestamp: new Date().toISOString()
      }
    };
  }

  async ensureDeviceConnected(licenseKey: string): Promise<DeviceConnectionResult> {
    // If we're already connecting, wait for that to complete
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Rate limit connection attempts
    const now = Date.now();
    if (now - this.lastConnectionAttempt < this.CONNECTION_RETRY_DELAY) {
      return { success: false, error: 'Too many connection attempts. Please wait.' };
    }

    this.lastConnectionAttempt = now;

    // Create a new connection promise
    this.connectionPromise = this.connectWithRetry(licenseKey);
    
    try {
      const result = await this.connectionPromise;
      return result;
    } finally {
      this.connectionPromise = null;
    }
  }

  private async connectWithRetry(licenseKey: string, retries = 3): Promise<DeviceConnectionResult> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // In authentication-only mode, device is always "connected"
        return { 
          success: true, 
          deviceName: 'Authentication Only Device'
        };
      } catch (error: any) {
        console.error(`Device connection attempt ${attempt} failed:`, error);
        
        // If it's the last attempt, return the error
        if (attempt === retries) {
          return { 
            success: false, 
            error: error.message || 'Failed to connect device' 
          };
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    return { 
      success: false, 
      error: 'Failed to connect device after multiple attempts' 
    };
  }

  async checkConnectionStatus(licenseKey: string): Promise<{
    isConnected: boolean;
    deviceName?: string;
    error?: string;
  }> {
    try {
      // In authentication-only mode, device is always "connected"
      return {
        isConnected: true,
        deviceName: 'Authentication Only Device'
      };
    } catch (error: any) {
      // Check if it's a "device not connected" error
      if (error.message?.includes('Device not connected')) {
        return {
          isConnected: false,
          error: 'Device not connected'
        };
      }
      
      // Other errors (invalid license, network issues, etc.)
      return {
        isConnected: false,
        error: error.message || 'Failed to check connection status'
      };
    }
  }
}