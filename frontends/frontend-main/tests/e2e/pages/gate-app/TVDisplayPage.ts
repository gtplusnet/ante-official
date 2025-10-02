import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

export class TVDisplayPage extends BasePage {
  // Main display elements
  private readonly displayContainer: Locator;
  private readonly currentScanDisplay: Locator;
  private readonly recentScansDisplay: Locator;
  private readonly clockDisplay: Locator;
  private readonly dateDisplay: Locator;
  
  // Current scan information
  private readonly currentPersonPhoto: Locator;
  private readonly currentPersonName: Locator;
  private readonly currentPersonInfo: Locator;
  private readonly currentScanTime: Locator;
  private readonly currentScanStatus: Locator;
  
  // Recent scans list
  private readonly recentScansList: Locator;
  private readonly recentScanEntries: Locator;
  
  // Status and controls
  private readonly connectionStatus: Locator;
  private readonly fullscreenButton: Locator;
  private readonly refreshButton: Locator;
  private readonly backToScanButton: Locator;
  
  // Statistics display
  private readonly todayStatsContainer: Locator;
  private readonly totalScansToday: Locator;
  private readonly lastUpdateTime: Locator;

  constructor(page: Page) {
    super(page);
    
    // Main display elements
    this.displayContainer = page.locator('.tv-display, .display-container, [data-testid="tv-display"]');
    this.currentScanDisplay = page.locator('.current-scan, .latest-scan, [data-testid="current-scan"]');
    this.recentScansDisplay = page.locator('.recent-scans, .scan-history, [data-testid="recent-scans"]');
    this.clockDisplay = page.locator('.clock, .current-time, [data-testid="clock"]');
    this.dateDisplay = page.locator('.date, .current-date, [data-testid="date"]');
    
    // Current scan information
    this.currentPersonPhoto = page.locator('.current-person-photo, .latest-photo, [data-testid="current-person-photo"]');
    this.currentPersonName = page.locator('.current-person-name, .latest-name, h1, h2, [data-testid="current-person-name"]');
    this.currentPersonInfo = page.locator('.current-person-info, .person-details, [data-testid="current-person-info"]');
    this.currentScanTime = page.locator('.current-scan-time, .latest-time, [data-testid="current-scan-time"]');
    this.currentScanStatus = page.locator('.current-scan-status, .scan-status, [data-testid="current-scan-status"]');
    
    // Recent scans list
    this.recentScansList = page.locator('.recent-scans-list, .history-list, [data-testid="recent-scans-list"]');
    this.recentScanEntries = page.locator('.recent-scan-entry, .history-item, [data-testid="recent-scan-entry"]');
    
    // Status and controls
    this.connectionStatus = page.locator('.connection-status, .online-status, [data-testid="connection-status"]');
    this.fullscreenButton = page.locator('button:has-text("Fullscreen"), .fullscreen-btn, [data-testid="fullscreen"]');
    this.refreshButton = page.locator('button:has-text("Refresh"), [data-testid="refresh"]');
    this.backToScanButton = page.locator('button:has-text("Back to Scan"), a[href*="scan"], [data-testid="back-to-scan"]');
    
    // Statistics display
    this.todayStatsContainer = page.locator('.today-stats, .daily-stats, [data-testid="today-stats"]');
    this.totalScansToday = page.locator('.total-today, .today-count, [data-testid="total-today"]');
    this.lastUpdateTime = page.locator('.last-update, .updated-time, [data-testid="last-update"]');
  }

  /**
   * Navigate to TV Display page
   */
  async navigateToTVDisplay(): Promise<void> {
    console.log('📺 Navigating to TV Display...');
    await this.navigateTo('/tv');
    await this.waitForLoadingToComplete();
    await this.waitForElement(this.displayContainer);
    console.log('✅ TV Display loaded');
  }

  /**
   * Verify TV display is loaded and functional
   */
  async verifyTVDisplayLoaded(): Promise<boolean> {
    console.log('🔍 Verifying TV Display is loaded...');
    
    try {
      const isOnTVPage = this.page.url().includes('/tv');
      const hasDisplayContainer = await this.isElementVisible(this.displayContainer, 5000);
      const hasTimeDisplay = await this.isElementVisible(this.clockDisplay, 3000) || 
                            await this.isElementVisible(this.dateDisplay, 3000);
      
      const isLoaded = isOnTVPage && hasDisplayContainer && hasTimeDisplay;
      
      console.log(`✅ TV Display loaded: ${isLoaded}`);
      return isLoaded;
    } catch (error) {
      console.log('❌ Error verifying TV display:', error);
      return false;
    }
  }

  /**
   * Get current scan information displayed
   */
  async getCurrentScanInfo(): Promise<{ name?: string, time?: string, status?: string, hasPhoto?: boolean } | null> {
    console.log('📋 Getting current scan information...');
    
    if (!await this.isElementVisible(this.currentScanDisplay, 3000)) {
      console.log('ℹ️ No current scan displayed');
      return null;
    }
    
    const scanInfo: any = {};
    
    try {
      // Get person name
      if (await this.currentPersonName.isVisible({ timeout: 2000 })) {
        scanInfo.name = await this.currentPersonName.textContent() || '';
      }
      
      // Get scan time
      if (await this.currentScanTime.isVisible({ timeout: 2000 })) {
        scanInfo.time = await this.currentScanTime.textContent() || '';
      }
      
      // Get scan status
      if (await this.currentScanStatus.isVisible({ timeout: 2000 })) {
        scanInfo.status = await this.currentScanStatus.textContent() || '';
      }
      
      // Check if photo is displayed
      if (await this.currentPersonPhoto.isVisible({ timeout: 2000 })) {
        scanInfo.hasPhoto = true;
      }
      
      console.log('📋 Current scan info:', scanInfo);
      return scanInfo;
    } catch (error) {
      console.error('Error getting current scan info:', error);
      return null;
    }
  }

  /**
   * Get recent scans displayed on TV
   */
  async getRecentScansFromDisplay(limit: number = 10): Promise<Array<{ name: string, time: string, status?: string }>> {
    console.log(`📋 Getting recent scans from TV display (limit: ${limit})...`);
    
    const scans: Array<{ name: string, time: string, status?: string }> = [];
    
    if (await this.recentScansList.isVisible({ timeout: 3000 })) {
      const scanEntries = await this.recentScanEntries.first(limit).all();
      
      for (const entry of scanEntries) {
        try {
          const nameElement = entry.locator('.name, .person-name, h3, h4, h5').first();
          const timeElement = entry.locator('.time, .timestamp, .scan-time').first();
          const statusElement = entry.locator('.status, .scan-status').first();
          
          const name = await nameElement.textContent() || 'Unknown';
          const time = await timeElement.textContent() || 'Unknown';
          const status = await statusElement.isVisible({ timeout: 1000 }) ? 
                        await statusElement.textContent() || undefined : undefined;
          
          scans.push({ 
            name: name.trim(), 
            time: time.trim(), 
            ...(status && { status: status.trim() })
          });
        } catch (error) {
          console.warn('Error extracting scan entry from TV display:', error);
        }
      }
    }
    
    console.log(`📋 Found ${scans.length} recent scans on TV display`);
    return scans;
  }

  /**
   * Get today's statistics from TV display
   */
  async getTodayStatistics(): Promise<{ totalScans: number, lastUpdate?: string }> {
    console.log('📊 Getting today\'s statistics from TV display...');
    
    const stats = { totalScans: 0, lastUpdate: undefined };
    
    // Get total scans for today
    if (await this.totalScansToday.isVisible({ timeout: 3000 })) {
      const totalText = await this.totalScansToday.textContent() || '0';
      const totalMatch = totalText.match(/(\d+)/);
      stats.totalScans = totalMatch ? parseInt(totalMatch[1], 10) : 0;
    }
    
    // Get last update time
    if (await this.lastUpdateTime.isVisible({ timeout: 3000 })) {
      stats.lastUpdate = await this.lastUpdateTime.textContent() || undefined;
    }
    
    console.log(`📊 Today's stats - Total scans: ${stats.totalScans}, Last update: ${stats.lastUpdate}`);
    return stats;
  }

  /**
   * Wait for new scan to appear on TV display
   */
  async waitForNewScan(expectedName: string, timeout: number = 30000): Promise<boolean> {
    console.log(`⏳ Waiting for new scan to appear on TV display: ${expectedName} (timeout: ${timeout}ms)`);
    
    try {
      // Wait for the expected name to appear in current scan or recent scans
      await this.page.waitForFunction(
        (name) => {
          // Check current scan display
          const currentScanElements = document.querySelectorAll('[data-testid="current-person-name"], .current-person-name, .latest-name, h1, h2');
          for (const element of currentScanElements) {
            if (element.textContent?.includes(name)) {
              return true;
            }
          }
          
          // Check recent scans
          const recentScanElements = document.querySelectorAll('[data-testid="recent-scan-entry"] .name, .recent-scan-entry .person-name, .history-item .name');
          for (const element of recentScanElements) {
            if (element.textContent?.includes(name)) {
              return true;
            }
          }
          
          return false;
        },
        expectedName,
        { timeout }
      );
      
      console.log(`✅ New scan appeared on TV display: ${expectedName}`);
      await this.takeStepScreenshot('tv-display', 'new-scan-appeared');
      return true;
    } catch (error) {
      console.log(`❌ New scan did not appear within timeout: ${expectedName}`);
      await this.takeStepScreenshot('tv-display', 'scan-timeout');
      return false;
    }
  }

  /**
   * Check connection status on TV display
   */
  async checkConnectionStatus(): Promise<{ isConnected: boolean, statusText?: string }> {
    console.log('🌐 Checking connection status on TV display...');
    
    const status = { isConnected: true, statusText: undefined };
    
    if (await this.connectionStatus.isVisible({ timeout: 3000 })) {
      const statusText = await this.connectionStatus.textContent() || '';
      status.statusText = statusText.trim();
      status.isConnected = statusText.toLowerCase().includes('online') || 
                          statusText.toLowerCase().includes('connected');
      
      console.log(`🌐 Connection status: ${status.isConnected ? 'Connected' : 'Disconnected'} - ${statusText}`);
    } else {
      console.log('🌐 Connection status indicator not visible - assuming connected');
    }
    
    return status;
  }

  /**
   * Enter fullscreen mode
   */
  async enterFullscreen(): Promise<void> {
    console.log('📺 Entering fullscreen mode...');
    
    if (await this.fullscreenButton.isVisible({ timeout: 3000 })) {
      await this.clickElement(this.fullscreenButton);
      await this.page.waitForTimeout(1000); // Wait for fullscreen transition
      console.log('✅ Fullscreen mode activated');
    } else {
      // Fallback: use browser fullscreen API
      await this.page.evaluate(() => {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        }
      });
      console.log('✅ Fullscreen mode activated (via API)');
    }
    
    await this.takeStepScreenshot('tv-display', 'fullscreen-mode');
  }

  /**
   * Exit fullscreen mode
   */
  async exitFullscreen(): Promise<void> {
    console.log('📺 Exiting fullscreen mode...');
    
    try {
      // Use browser API to exit fullscreen
      await this.page.evaluate(() => {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      });
      
      await this.page.waitForTimeout(1000); // Wait for transition
      console.log('✅ Fullscreen mode exited');
    } catch (error) {
      console.log('ℹ️ Could not exit fullscreen mode:', error);
    }
  }

  /**
   * Refresh TV display data
   */
  async refreshDisplay(): Promise<void> {
    console.log('🔄 Refreshing TV display data...');
    
    if (await this.refreshButton.isVisible({ timeout: 3000 })) {
      await this.clickElement(this.refreshButton);
      await this.waitForLoadingToComplete();
    } else {
      // Fallback: reload page
      await this.reloadPage();
    }
    
    console.log('✅ TV display refreshed');
  }

  /**
   * Navigate back to scan page from TV display
   */
  async navigateBackToScan(): Promise<void> {
    console.log('🔙 Navigating back to scan page...');
    
    if (await this.backToScanButton.isVisible({ timeout: 3000 })) {
      await this.clickElement(this.backToScanButton);
    } else {
      // Fallback: direct navigation
      await this.navigateTo('/scan');
    }
    
    await this.waitForLoadingToComplete();
    console.log('✅ Navigated back to scan page');
  }

  /**
   * Get current time and date displayed
   */
  async getCurrentTimeAndDate(): Promise<{ time?: string, date?: string }> {
    console.log('🕒 Getting current time and date from display...');
    
    const timeData: { time?: string, date?: string } = {};
    
    if (await this.clockDisplay.isVisible({ timeout: 3000 })) {
      timeData.time = await this.clockDisplay.textContent() || undefined;
    }
    
    if (await this.dateDisplay.isVisible({ timeout: 3000 })) {
      timeData.date = await this.dateDisplay.textContent() || undefined;
    }
    
    console.log('🕒 Time and date:', timeData);
    return timeData;
  }

  /**
   * Monitor TV display for changes (useful for real-time testing)
   */
  async monitorDisplayForChanges(duration: number = 30000): Promise<Array<{ timestamp: string, change: string }>> {
    console.log(`👀 Monitoring TV display for changes (${duration}ms)...`);
    
    const changes: Array<{ timestamp: string, change: string }> = [];
    const startTime = Date.now();
    let lastScanInfo = await this.getCurrentScanInfo();
    let lastRecentCount = (await this.getRecentScansFromDisplay(1)).length;
    
    while (Date.now() - startTime < duration) {
      await this.page.waitForTimeout(2000); // Check every 2 seconds
      
      // Check for changes in current scan
      const currentScanInfo = await this.getCurrentScanInfo();
      if (JSON.stringify(currentScanInfo) !== JSON.stringify(lastScanInfo)) {
        changes.push({
          timestamp: new Date().toISOString(),
          change: `Current scan changed: ${JSON.stringify(currentScanInfo)}`
        });
        lastScanInfo = currentScanInfo;
      }
      
      // Check for new entries in recent scans
      const currentRecentCount = (await this.getRecentScansFromDisplay(1)).length;
      if (currentRecentCount > lastRecentCount) {
        changes.push({
          timestamp: new Date().toISOString(),
          change: `New scan entry appeared in recent scans list`
        });
        lastRecentCount = currentRecentCount;
      }
    }
    
    console.log(`👀 Monitoring completed. Found ${changes.length} changes`);
    return changes;
  }

  /**
   * Verify TV display shows real-time updates
   */
  async verifyRealTimeUpdates(): Promise<boolean> {
    console.log('⚡ Verifying TV display shows real-time updates...');
    
    // Get initial state
    const initialStats = await this.getTodayStatistics();
    const initialRecentScans = await this.getRecentScansFromDisplay(5);
    
    // Check if display is updating by monitoring for a short period
    const changes = await this.monitorDisplayForChanges(10000); // Monitor for 10 seconds
    
    // Get final state
    const finalStats = await this.getTodayStatistics();
    const finalRecentScans = await this.getRecentScansFromDisplay(5);
    
    // Check if there were any changes
    const hasChanges = changes.length > 0 || 
                      JSON.stringify(initialStats) !== JSON.stringify(finalStats) ||
                      JSON.stringify(initialRecentScans) !== JSON.stringify(finalRecentScans);
    
    console.log(`⚡ Real-time updates verified: ${hasChanges}`);
    return hasChanges;
  }
}