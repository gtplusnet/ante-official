import { test, expect } from '@playwright/test';

test.describe('Test Realtime After Fix', () => {
  test('Check if realtime is now working', async ({ page }) => {
    // Collect console logs
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
      console.log('Browser:', text);
    });

    // Navigate to login first
    await page.goto('http://100.80.38.96:9002/login');
    
    // Login with demo license
    await page.fill('input[id="license"]', 'GATE-2025-DEMO');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Now navigate to scan page
    await page.goto('http://100.80.38.96:9002/scan');
    
    // Wait for page to fully load
    await page.waitForTimeout(5000);
    
    // Check if realtime setup logs appeared
    const realtimeLogs = consoleLogs.filter(log => 
      log.includes('setupRealtime') || 
      log.includes('Starting realtime') ||
      log.includes('Initializing attendance service') ||
      log.includes('Creating realtime subscription') ||
      log.includes('Realtime subscription') ||
      log.includes('AttendanceSupabaseService')
    );
    
    console.log('\n=== REALTIME SETUP LOGS ===');
    realtimeLogs.forEach(log => console.log(log));
    
    // Check for error logs
    const errorLogs = consoleLogs.filter(log => 
      log.includes('Failed') || 
      log.includes('Error') || 
      log.includes('error') ||
      log.includes('❌')
    );
    
    if (errorLogs.length > 0) {
      console.log('\n=== ERROR LOGS ===');
      errorLogs.forEach(log => console.log(log));
    }
    
    // Check if periodic refresh is working
    const periodicLogs = consoleLogs.filter(log => 
      log.includes('Periodic refresh')
    );
    
    console.log('\n=== PERIODIC REFRESH LOGS ===');
    console.log(`Found ${periodicLogs.length} periodic refresh logs`);
    
    // Now test scanning with manual input
    console.log('\n=== TESTING SCAN FUNCTIONALITY ===');
    
    // Check if manual input button exists
    const manualButton = page.locator('button:has-text("Manual Input")');
    const hasManualButton = await manualButton.count() > 0;
    
    if (hasManualButton) {
      console.log('Manual input button found, clicking...');
      await manualButton.click();
      await page.waitForTimeout(500);
      
      // Enter a test QR code
      const testQR = 'student:25add33c-22ee-44e7-96a3-cabf488af1a1';
      await page.fill('input[placeholder*="QR" i], input[placeholder*="code" i]', testQR);
      await page.keyboard.press('Enter');
      
      console.log('Submitted QR code:', testQR);
      
      // Wait for scan to process
      await page.waitForTimeout(3000);
      
      // Check recent scans section
      const recentScansSection = page.locator('text=/recent scan/i').first();
      const hasRecentScans = await recentScansSection.count() > 0;
      
      console.log('Recent scans section found:', hasRecentScans);
      
      // Check if the scan appears in recent scans
      const scanLogs = consoleLogs.filter(log => 
        log.includes('SCAN DEBUG') || 
        log.includes('Recording attendance') ||
        log.includes('New attendance record')
      );
      
      console.log('\n=== SCAN PROCESSING LOGS ===');
      scanLogs.forEach(log => console.log(log));
    } else {
      console.log('Manual input button not found');
    }
    
    // Final check: Is realtime connected?
    const realtimeStatus = await page.evaluate(() => {
      // Try to check if realtime is connected
      const localStorage_data = {
        companyId: localStorage.getItem('companyId'),
        licenseKey: localStorage.getItem('licenseKey'),
        supabase_session: localStorage.getItem('supabase_session') ? 'exists' : 'missing',
        supabase_auth_mode: localStorage.getItem('supabase_auth_mode')
      };
      
      return localStorage_data;
    });
    
    console.log('\n=== FINAL STATUS ===');
    console.log('LocalStorage:', JSON.stringify(realtimeStatus, null, 2));
    console.log('Total console logs collected:', consoleLogs.length);
    console.log('Realtime setup logs found:', realtimeLogs.length);
    console.log('Error logs found:', errorLogs.length);
    
    // Assert that realtime setup logs exist
    expect(realtimeLogs.length).toBeGreaterThan(0);
  });

  test('Test realtime updates between tabs', async ({ browser }) => {
    // Create two contexts (like two different browser tabs)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Setup console logging for both pages
    const logs1: string[] = [];
    const logs2: string[] = [];
    
    page1.on('console', msg => {
      const text = msg.text();
      logs1.push(text);
      if (text.includes('realtime') || text.includes('Realtime')) {
        console.log('Page1:', text);
      }
    });
    
    page2.on('console', msg => {
      const text = msg.text();
      logs2.push(text);
      if (text.includes('realtime') || text.includes('Realtime')) {
        console.log('Page2:', text);
      }
    });
    
    // Login on both pages
    for (const page of [page1, page2]) {
      await page.goto('http://100.80.38.96:9002/login');
      await page.fill('input[id="license"]', 'GATE-2025-DEMO');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await page.goto('http://100.80.38.96:9002/scan');
    }
    
    // Wait for both pages to initialize
    await page1.waitForTimeout(5000);
    await page2.waitForTimeout(5000);
    
    console.log('\n=== TESTING REALTIME BETWEEN TABS ===');
    
    // Scan on page1
    const manualButton1 = page1.locator('button:has-text("Manual Input")');
    if (await manualButton1.count() > 0) {
      await manualButton1.click();
      await page1.waitForTimeout(500);
      
      const testQR = 'student:0ea44d53-78c6-4e9b-b7cc-f11bab2d491d';
      await page1.fill('input[placeholder*="QR" i], input[placeholder*="code" i]', testQR);
      await page1.keyboard.press('Enter');
      
      console.log('Scanned on Page1:', testQR);
      
      // Wait for realtime update on page2
      await page2.waitForTimeout(3000);
      
      // Check if page2 received realtime update
      const realtimeUpdateLogs = logs2.filter(log => 
        log.includes('Received realtime') || 
        log.includes('New attendance record') ||
        log.includes('📺')
      );
      
      console.log('\n=== REALTIME UPDATE LOGS ON PAGE2 ===');
      realtimeUpdateLogs.forEach(log => console.log(log));
      
      // Check if the scan appears in page2's recent scans
      const recentScansText = await page2.locator('[class*="recent"]').textContent();
      console.log('Page2 recent scans content:', recentScansText?.substring(0, 200));
      
      console.log('\n=== RESULTS ===');
      console.log('Realtime updates received on Page2:', realtimeUpdateLogs.length > 0);
    }
    
    // Cleanup
    await context1.close();
    await context2.close();
  });
});