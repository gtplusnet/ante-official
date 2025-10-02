import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

export class ScanPage extends BasePage {
  // License/Setup locators
  private readonly licenseKeyInput: Locator;
  private readonly licenseSubmitButton: Locator;
  private readonly setupContainer: Locator;
  private readonly deviceNameInput: Locator;
  private readonly locationInput: Locator;

  // Scanning interface locators
  private readonly scanContainer: Locator;
  private readonly cameraPreview: Locator;
  private readonly scanAreaOverlay: Locator;
  private readonly manualInputToggle: Locator;
  private readonly manualInputContainer: Locator;
  private readonly manualIdInput: Locator;
  private readonly manualScanButton: Locator;
  
  // Results and feedback locators
  private readonly scanResult: Locator;
  private readonly personInfo: Locator;
  private readonly scanStatus: Locator;
  private readonly errorMessage: Locator;
  private readonly successMessage: Locator;
  private readonly personPhoto: Locator;
  private readonly personName: Locator;
  private readonly scanTime: Locator;
  
  // Navigation and controls
  private readonly settingsButton: Locator;
  private readonly syncButton: Locator;
  private readonly tvModeButton: Locator;
  private readonly logHistoryButton: Locator;
  private readonly refreshButton: Locator;
  
  // Status indicators
  private readonly connectionStatus: Locator;
  private readonly syncStatus: Locator;
  private readonly lastSyncTime: Locator;
  private readonly offlineIndicator: Locator;
  
  // Recent scans
  private readonly recentScansList: Locator;
  private readonly scanHistoryEntries: Locator;

  constructor(page: Page) {
    super(page);
    
    // License/Setup
    this.licenseKeyInput = page.locator('input[placeholder*="license"], input[name*="license"], [data-testid="license-input"]');
    this.licenseSubmitButton = page.locator('button:has-text("Connect"), button:has-text("Validate"), button:has-text("Submit"), [data-testid="license-submit"]');
    this.setupContainer = page.locator('.setup-container, .license-setup, [data-testid="setup-container"]');
    this.deviceNameInput = page.locator('input[placeholder*="device"], input[name="deviceName"], [data-testid="device-name"]');
    this.locationInput = page.locator('input[placeholder*="location"], input[name="location"], [data-testid="location"]');

    // Scanning interface
    this.scanContainer = page.locator('.scan-container, .scanner, [data-testid="scan-container"]');
    this.cameraPreview = page.locator('video, .camera-preview, canvas, [data-testid="camera-preview"]');
    this.scanAreaOverlay = page.locator('.scan-area, .qr-overlay, [data-testid="scan-area"]');
    this.manualInputToggle = page.locator('button:has-text("Manual Input"), button:has-text("Manual"), .manual-toggle, [data-testid="manual-toggle"]');
    this.manualInputContainer = page.locator('.manual-input, .manual-scan, [data-testid="manual-input"], div:has(input[placeholder*="student"])');
    this.manualIdInput = page.locator('input[placeholder*="student"], input[placeholder*="guardian"], input[placeholder*="ID"], input[placeholder*="Number"], input[name="manualId"], [data-testid="manual-id-input"]');
    this.manualScanButton = page.locator('button:has-text("Submit Scan"), button:has-text("Submit"), button:has-text("Scan"), [data-testid="manual-scan-button"]');
    
    // Results and feedback
    this.scanResult = page.locator('.scan-result, .result-container, [data-testid="scan-result"]');
    this.personInfo = page.locator('.person-info, .scanned-person, [data-testid="person-info"]');
    this.scanStatus = page.locator('.scan-status, .status, [data-testid="scan-status"]');
    this.errorMessage = page.locator('.error-message, .scan-error, [role="alert"], [data-testid="error-message"]');
    this.successMessage = page.locator('.success-message, .scan-success, [data-testid="success-message"]');
    this.personPhoto = page.locator('.person-photo, .profile-photo, img[alt*="photo"], [data-testid="person-photo"]');
    this.personName = page.locator('.person-name, .name, h2, h3, [data-testid="person-name"]');
    this.scanTime = page.locator('.scan-time, .timestamp, [data-testid="scan-time"]');
    
    // Navigation and controls
    this.settingsButton = page.locator('button:has-text("Settings"), .settings-button, [data-testid="settings"]');
    this.syncButton = page.locator('button:has-text("Sync"), .sync-button, [data-testid="sync"]');
    this.tvModeButton = page.locator('button:has-text("TV Mode"), button:has-text("Display"), [data-testid="tv-mode"]');
    this.logHistoryButton = page.locator('button:has-text("History"), button:has-text("Logs"), [data-testid="log-history"]');
    this.refreshButton = page.locator('button:has-text("Refresh"), [data-testid="refresh"]');
    
    // Status indicators
    this.connectionStatus = page.locator('.connection-status, .online-status, [data-testid="connection-status"]');
    this.syncStatus = page.locator('.sync-status, [data-testid="sync-status"]');
    this.lastSyncTime = page.locator('.last-sync, .sync-time, [data-testid="last-sync"]');
    this.offlineIndicator = page.locator('.offline-indicator, .offline-status, [data-testid="offline"]');
    
    // Recent scans
    this.recentScansList = page.locator('.recent-scans, .scan-history, [data-testid="recent-scans"]');
    this.scanHistoryEntries = page.locator('.scan-entry, .history-item, [data-testid="scan-entry"]');
  }

  /**
   * Navigate to Gate App scan page
   */
  async navigateToScanPage(): Promise<void> {
    console.log('🧭 Navigating to Gate App scan page...');
    await this.navigateTo('/scan');
    await this.waitForLoadingToComplete();
    console.log('✅ Scan page loaded');
  }

  /**
   * Setup gate app with license key
   */
  async setupWithLicense(licenseKey: string = 'test-license-e2e-automated', deviceName?: string, location?: string): Promise<void> {
    console.log(`🔑 Setting up Gate App with license: ${licenseKey}`);
    
    // Navigate to root and check if setup is needed
    await this.navigateTo('/');
    await this.waitForLoadingToComplete();
    
    // Check if license setup is required
    if (await this.isElementVisible(this.setupContainer, 5000) || await this.isElementVisible(this.licenseKeyInput, 3000)) {
      console.log('🔧 License setup required');
      
      // Fill license key
      await this.fillInput(this.licenseKeyInput, licenseKey);
      
      // Fill optional device information
      if (deviceName && await this.deviceNameInput.isVisible({ timeout: 3000 })) {
        await this.fillInput(this.deviceNameInput, deviceName);
      }
      
      if (location && await this.locationInput.isVisible({ timeout: 3000 })) {
        await this.fillInput(this.locationInput, location);
      }
      
      await this.takeStepScreenshot('gate-app-setup', 'license-filled');
      
      // Submit license
      await this.clickElement(this.licenseSubmitButton);
      
      // Wait for setup completion
      try {
        await this.page.waitForURL('**/scan', { timeout: 15000 });
        console.log('✅ License setup completed successfully');
      } catch (error) {
        // Check for error messages
        if (await this.errorMessage.isVisible({ timeout: 3000 })) {
          const errorText = await this.errorMessage.textContent();
          throw new Error(`License setup failed: ${errorText}`);
        }
        throw new Error('License setup may have failed - not redirected to scan page');
      }
    } else {
      console.log('ℹ️ Gate App already set up, navigating to scan page');
      await this.navigateToScanPage();
    }
    
    await this.takeStepScreenshot('gate-app-setup', 'setup-completed');
  }

  /**
   * Enable manual input mode
   */
  async enableManualInput(): Promise<void> {
    console.log('📝 Enabling manual input mode...');
    
    if (await this.manualInputToggle.isVisible({ timeout: 3000 })) {
      await this.clickElement(this.manualInputToggle);
      await this.waitForElement(this.manualInputContainer);
      console.log('✅ Manual input mode enabled');
    } else {
      // Check if manual input is already available
      if (!await this.isElementVisible(this.manualInputContainer, 3000)) {
        throw new Error('Manual input mode not available on this scan page');
      }
      console.log('ℹ️ Manual input already available');
    }
    
    await this.takeStepScreenshot('gate-app-scan', 'manual-input-enabled');
  }

  /**
   * Perform manual scan simulation (alternative to QR scanning)
   */
  async performManualScan(personId: string): Promise<{ success: boolean, personInfo?: any, error?: string }> {
    console.log(`📷 Performing manual scan for person ID: ${personId}`);
    
    // Ensure we're on the scan page and manual input is enabled
    if (!this.page.url().includes('/scan')) {
      await this.navigateToScanPage();
    }
    
    await this.enableManualInput();
    
    // Fill the manual ID input
    await this.fillInput(this.manualIdInput, personId);
    await this.takeStepScreenshot('gate-app-scan', 'manual-id-entered');
    
    // Submit the manual scan
    await this.clickElement(this.manualScanButton);
    
    // Wait for scan result
    await this.page.waitForTimeout(2000); // Give time for processing
    
    try {
      // Check for success
      if (await this.successMessage.isVisible({ timeout: 5000 }) || await this.personInfo.isVisible({ timeout: 5000 })) {
        console.log('✅ Manual scan successful');
        
        // Extract person information
        const personInfo = await this.extractPersonInfo();
        
        await this.takeStepScreenshot('gate-app-scan', 'scan-successful');
        return { success: true, personInfo };
      }
      
      // Check for error
      if (await this.errorMessage.isVisible({ timeout: 5000 })) {
        const errorText = await this.errorMessage.textContent() || 'Unknown error';
        console.log(`❌ Manual scan failed: ${errorText}`);
        await this.takeStepScreenshot('gate-app-scan', 'scan-failed');
        return { success: false, error: errorText };
      }
      
      // No clear success or error - check scan status
      if (await this.scanStatus.isVisible({ timeout: 3000 })) {
        const statusText = await this.scanStatus.textContent() || '';
        if (statusText.toLowerCase().includes('success') || statusText.toLowerCase().includes('found')) {
          const personInfo = await this.extractPersonInfo();
          return { success: true, personInfo };
        } else {
          return { success: false, error: statusText };
        }
      }
      
      console.log('⚠️ Manual scan result unclear');
      await this.takeStepScreenshot('gate-app-scan', 'scan-result-unclear');
      return { success: false, error: 'Scan result unclear' };
      
    } catch (error) {
      console.error('Exception during manual scan:', error);
      await this.takeStepScreenshot('gate-app-scan', 'scan-exception');
      return { success: false, error: `Exception: ${error}` };
    }
  }

  /**
   * Simulate QR code scanning with text data
   */
  async simulateQRScan(qrData: string): Promise<{ success: boolean, personInfo?: any, error?: string }> {
    console.log(`📷 Simulating QR scan with data: ${qrData}`);
    
    // Try manual input first as it's more reliable for testing
    return await this.performManualScan(qrData);
  }

  /**
   * Extract person information from scan result
   */
  private async extractPersonInfo(): Promise<any> {
    const personInfo: any = { scannedAt: new Date().toISOString() };
    
    try {
      // Extract name
      if (await this.personName.isVisible({ timeout: 3000 })) {
        personInfo.name = await this.personName.textContent() || 'Unknown';
      }
      
      // Extract scan time
      if (await this.scanTime.isVisible({ timeout: 3000 })) {
        personInfo.scanTime = await this.scanTime.textContent() || '';
      }
      
      // Check if photo is available
      if (await this.personPhoto.isVisible({ timeout: 3000 })) {
        personInfo.hasPhoto = true;
        personInfo.photoSrc = await this.personPhoto.getAttribute('src');
      }
      
      // Extract any additional info from person info container
      if (await this.personInfo.isVisible({ timeout: 3000 })) {
        const infoText = await this.personInfo.textContent() || '';
        personInfo.additionalInfo = infoText;
        
        // Try to extract specific details
        const details = infoText.split('\n').filter(line => line.trim());
        personInfo.details = details;
      }
      
      console.log('📋 Extracted person info:', personInfo);
      return personInfo;
    } catch (error) {
      console.warn('Error extracting person info:', error);
      return personInfo;
    }
  }

  /**
   * Get recent scan history
   */
  async getRecentScans(limit: number = 10): Promise<Array<{ name: string, time: string, status: string }>> {
    console.log(`📋 Getting recent scans (limit: ${limit})...`);
    
    const scans: Array<{ name: string, time: string, status: string }> = [];
    
    if (await this.recentScansList.isVisible({ timeout: 3000 })) {
      const scanEntries = await this.scanHistoryEntries.first(limit).all();
      
      for (const entry of scanEntries) {
        try {
          const nameElement = entry.locator('.name, .person-name, h4, h5').first();
          const timeElement = entry.locator('.time, .timestamp, .scan-time').first();
          const statusElement = entry.locator('.status, .scan-status').first();
          
          const name = await nameElement.textContent() || 'Unknown';
          const time = await timeElement.textContent() || 'Unknown';
          const status = await statusElement.textContent() || 'Success';
          
          scans.push({ name: name.trim(), time: time.trim(), status: status.trim() });
        } catch (error) {
          console.warn('Error extracting scan entry:', error);
        }
      }
    }
    
    console.log(`📋 Found ${scans.length} recent scans`);
    return scans;
  }

  /**
   * Sync data with server
   */
  async syncData(): Promise<{ success: boolean, message?: string }> {
    console.log('🔄 Syncing data with server...');
    
    if (await this.syncButton.isVisible({ timeout: 3000 })) {
      await this.clickElement(this.syncButton);
      
      // Wait for sync to complete
      await this.waitForLoadingToComplete();
      
      // Check sync status
      if (await this.syncStatus.isVisible({ timeout: 5000 })) {
        const statusText = await this.syncStatus.textContent() || '';
        const success = statusText.toLowerCase().includes('success') || statusText.toLowerCase().includes('complete');
        
        console.log(`🔄 Sync result: ${success ? 'Success' : 'Failed'} - ${statusText}`);
        await this.takeStepScreenshot('gate-app-scan', 'sync-completed');
        
        return { success, message: statusText };
      }
      
      console.log('✅ Sync initiated (status not visible)');
      return { success: true, message: 'Sync initiated' };
    } else {
      console.log('ℹ️ Sync button not available');
      return { success: false, message: 'Sync not available' };
    }
  }

  /**
   * Check connection status
   */
  async checkConnectionStatus(): Promise<{ isOnline: boolean, lastSync?: string }> {
    console.log('🌐 Checking connection status...');
    
    const status = { isOnline: true, lastSync: undefined };
    
    // Check offline indicator
    if (await this.offlineIndicator.isVisible({ timeout: 2000 })) {
      status.isOnline = false;
      console.log('📶 Status: OFFLINE');
    }
    
    // Check connection status indicator
    if (await this.connectionStatus.isVisible({ timeout: 2000 })) {
      const connectionText = await this.connectionStatus.textContent() || '';
      status.isOnline = connectionText.toLowerCase().includes('online') || connectionText.toLowerCase().includes('connected');
      console.log(`📶 Connection status: ${connectionText}`);
    }
    
    // Get last sync time
    if (await this.lastSyncTime.isVisible({ timeout: 2000 })) {
      status.lastSync = await this.lastSyncTime.textContent() || undefined;
      console.log(`🕒 Last sync: ${status.lastSync}`);
    }
    
    return status;
  }

  /**
   * Navigate to settings
   */
  async navigateToSettings(): Promise<void> {
    console.log('⚙️ Navigating to settings...');
    
    if (await this.settingsButton.isVisible({ timeout: 3000 })) {
      await this.clickElement(this.settingsButton);
      await this.waitForLoadingToComplete();
    } else {
      // Fallback: direct navigation
      await this.navigateTo('/settings');
    }
    
    console.log('✅ Settings page loaded');
  }

  /**
   * Navigate to TV mode
   */
  async navigateToTVMode(): Promise<void> {
    console.log('📺 Navigating to TV mode...');
    
    if (await this.tvModeButton.isVisible({ timeout: 3000 })) {
      await this.clickElement(this.tvModeButton);
      await this.waitForLoadingToComplete();
    } else {
      // Fallback: direct navigation
      await this.navigateTo('/tv');
    }
    
    console.log('✅ TV mode loaded');
  }

  /**
   * Get scan statistics
   */
  async getScanStatistics(): Promise<{ totalScans: number, todayScans: number, recentActivity: number }> {
    console.log('📊 Getting scan statistics...');
    
    const stats = { totalScans: 0, todayScans: 0, recentActivity: 0 };
    
    // Look for stats container
    const statsContainer = this.page.locator('.stats, .scan-stats, .statistics, [data-testid="scan-stats"]');
    
    if (await statsContainer.isVisible({ timeout: 3000 })) {
      const statsText = await statsContainer.textContent() || '';
      
      // Extract numbers using regex
      const totalMatch = statsText.match(/total[:\s]*(\d+)/i);
      const todayMatch = statsText.match(/today[:\s]*(\d+)/i);
      const recentMatch = statsText.match(/recent[:\s]*(\d+)/i);
      
      stats.totalScans = totalMatch ? parseInt(totalMatch[1], 10) : 0;
      stats.todayScans = todayMatch ? parseInt(todayMatch[1], 10) : 0;
      stats.recentActivity = recentMatch ? parseInt(recentMatch[1], 10) : 0;
    }
    
    // Fallback: count recent scans directly
    if (stats.totalScans === 0) {
      const recentScans = await this.getRecentScans(50);
      stats.recentActivity = recentScans.length;
    }
    
    console.log(`📊 Scan statistics - Total: ${stats.totalScans}, Today: ${stats.todayScans}, Recent: ${stats.recentActivity}`);
    return stats;
  }

  /**
   * Wait for scan interface to be ready
   */
  async waitForScanReady(): Promise<void> {
    console.log('⏳ Waiting for scan interface to be ready...');
    
    // Wait for main scan container
    await this.waitForElement(this.scanContainer);
    
    // Wait for either camera preview or manual input to be available
    try {
      await Promise.race([
        this.waitForElement(this.cameraPreview, 5000),
        this.waitForElement(this.manualInputContainer, 5000),
        this.waitForElement(this.manualInputToggle, 5000)
      ]);
      
      console.log('✅ Scan interface ready');
    } catch (error) {
      console.log('⚠️ Scan interface may not be fully ready, but continuing...');
    }
  }

  /**
   * Verify scan page is loaded and functional
   */
  async verifyScanPageLoaded(): Promise<boolean> {
    console.log('🔍 Verifying scan page is loaded and functional...');
    
    try {
      const isOnScanPage = this.page.url().includes('/scan');
      const hasScanInterface = await this.isElementVisible(this.scanContainer, 5000);
      const hasInputMethod = await this.isElementVisible(this.manualInputToggle, 3000) || 
                            await this.isElementVisible(this.manualInputContainer, 3000) ||
                            await this.isElementVisible(this.cameraPreview, 3000);
      
      const isLoaded = isOnScanPage && hasScanInterface && hasInputMethod;
      
      console.log(`✅ Scan page loaded: ${isLoaded} (URL: ${isOnScanPage}, Interface: ${hasScanInterface}, Input: ${hasInputMethod})`);
      return isLoaded;
    } catch (error) {
      console.log('❌ Error verifying scan page:', error);
      return false;
    }
  }

  /**
   * Clear any error messages or previous scan results
   */
  async clearScanResults(): Promise<void> {
    console.log('🧹 Clearing scan results and errors...');
    
    // Look for clear/reset buttons
    const clearButton = this.page.locator('button:has-text("Clear"), button:has-text("Reset"), button:has-text("New Scan"), [data-testid="clear-scan"]');
    
    if (await clearButton.isVisible({ timeout: 3000 })) {
      await this.clickElement(clearButton);
    } else {
      // Fallback: refresh the page
      await this.reloadPage();
      await this.waitForScanReady();
    }
    
    console.log('✅ Scan results cleared');
  }
}