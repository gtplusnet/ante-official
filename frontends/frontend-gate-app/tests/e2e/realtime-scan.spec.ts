import { test, expect } from '@playwright/test';

test.describe('Realtime QR Code Scanning', () => {
  test('should display realtime updates when new scans occur', async ({ page, context }) => {
    // Enable console logging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[ScanPage]') || text.includes('Realtime') || text.includes('📺')) {
        console.log('Browser:', text);
      }
    });
    
    // Navigate to scan page
    await page.goto('http://100.80.38.96:9002/scan');
    
    // Wait for initialization
    await page.waitForTimeout(3000);
    
    // Check that the page loaded
    await expect(page.locator('h1:has-text("QR Code Scanner")')).toBeVisible();
    
    // Open a second tab to simulate another device scanning
    const page2 = await context.newPage();
    await page2.goto('http://100.80.38.96:9002/scan');
    await page2.waitForTimeout(2000);
    
    // Get initial scan count on first page
    const initialCount = await page.locator('[data-testid="scan-count"]').textContent();
    console.log('Initial scan count:', initialCount);
    
    // Simulate a QR code scan using manual input on second page
    await page2.click('button:has-text("Manual Input")');
    await page2.waitForTimeout(500);
    
    // Enter a test QR code
    const testQrCode = 'TEST-' + Date.now();
    await page2.fill('input[placeholder*="QR code"]', testQrCode);
    await page2.press('input[placeholder*="QR code"]', 'Enter');
    
    // Wait for scan to process
    await page2.waitForTimeout(2000);
    
    // Check if the scan appeared in realtime on the first page
    console.log('Checking for realtime update on first page...');
    
    // Wait for the recent scans to update (max 10 seconds)
    let found = false;
    for (let i = 0; i < 10; i++) {
      const recentScansText = await page.locator('[data-testid="recent-scans"]').textContent();
      if (recentScansText && recentScansText.includes(testQrCode)) {
        found = true;
        console.log('✅ Realtime update received!');
        break;
      }
      await page.waitForTimeout(1000);
    }
    
    if (!found) {
      // Check if polling picked it up
      console.log('⚠️ Realtime update not received, checking if polling worked...');
      await page.waitForTimeout(6000); // Wait for polling interval
      const recentScansText = await page.locator('[data-testid="recent-scans"]').textContent();
      if (recentScansText && recentScansText.includes(testQrCode)) {
        console.log('✅ Scan appeared via polling (realtime not working)');
      } else {
        console.log('❌ Scan did not appear at all');
      }
    }
    
    // Check console for realtime logs
    const consoleLogs = await page.evaluate(() => {
      return (window as any).__consoleLogs || [];
    });
    
    const realtimeLogs = consoleLogs.filter((log: string) => 
      log.includes('Realtime') || log.includes('📺')
    );
    
    console.log('Realtime-related logs found:', realtimeLogs.length);
    
    expect(found).toBeTruthy();
  });
  
  test('should show initialization logs', async ({ page }) => {
    const logs: string[] = [];
    
    page.on('console', msg => {
      logs.push(msg.text());
    });
    
    await page.goto('http://100.80.38.96:9002/scan');
    await page.waitForTimeout(3000);
    
    // Check for expected initialization logs
    const initLogs = logs.filter(log => log.includes('[ScanPage]'));
    console.log('\n=== Initialization Logs ===');
    initLogs.forEach(log => console.log(log));
    
    // Verify key initialization steps
    expect(logs.some(log => log.includes('Starting full initialization'))).toBeTruthy();
    expect(logs.some(log => log.includes('Starting init function'))).toBeTruthy();
    expect(logs.some(log => log.includes('About to call setupRealtime'))).toBeTruthy();
  });
});