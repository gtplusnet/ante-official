import { test, expect, Page } from '@playwright/test';

test.describe('Gate App Realtime Fix', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Navigate to login page
    await page.goto('http://100.80.38.96:9002/login');
    
    // Login with license key
    await page.fill('input[id="license"]', 'GATE-2025-DEMO');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to scan page
    await page.goto('http://100.80.38.96:9002/scan');
    await page.waitForTimeout(2000);
  });

  test('Debug why realtime is not working', async () => {
    // Enable console logging
    page.on('console', msg => {
      console.log('Browser console:', msg.text());
    });

    // Check if the page loads
    await expect(page).toHaveURL(/.*\/scan/);
    
    // Check for the scanner component
    const scanner = await page.locator('.scanner-container').count();
    console.log('Scanner containers found:', scanner);
    
    // Inject debugging code to check what's happening
    const debugInfo = await page.evaluate(() => {
      const info: any = {
        localStorage: {},
        hasSupabaseUrl: false,
        hasSupabaseKey: false,
        windowDebugFunctions: [],
        realtimeStatus: 'unknown'
      };
      
      // Check localStorage
      info.localStorage.companyId = localStorage.getItem('companyId');
      info.localStorage.licenseKey = localStorage.getItem('licenseKey');
      info.localStorage.supabase_session = localStorage.getItem('supabase_session') ? 'exists' : 'missing';
      info.localStorage.supabase_company_id = localStorage.getItem('supabase_company_id');
      
      // Check environment variables (they're exposed in the client)
      info.hasSupabaseUrl = !!(window as any).process?.env?.NEXT_PUBLIC_SUPABASE_URL || 
                            document.querySelector('script')?.textContent?.includes('NEXT_PUBLIC_SUPABASE_URL');
      info.hasSupabaseKey = !!(window as any).process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                            document.querySelector('script')?.textContent?.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      
      // Check for debug functions
      const w = window as any;
      if (w.debugDatabase) info.windowDebugFunctions.push('debugDatabase');
      if (w.testScan) info.windowDebugFunctions.push('testScan');
      if (w.checkIndexes) info.windowDebugFunctions.push('checkIndexes');
      if (w.forceDataSync) info.windowDebugFunctions.push('forceDataSync');
      
      return info;
    });
    
    console.log('Debug Info:', JSON.stringify(debugInfo, null, 2));
    
    // Now let's check why setupRealtime is not being called
    const setupRealtimeCheck = await page.evaluate(() => {
      // Check if the function exists in the component
      const checkInfo: any = {
        hasSetupRealtime: false,
        consoleLogsFound: [],
        errorMessages: []
      };
      
      // Override console.log to capture logs
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog.apply(console, args);
      };
      
      // Override console.error to capture errors
      const originalError = console.error;
      const errors: string[] = [];
      console.error = (...args) => {
        errors.push(args.join(' '));
        originalError.apply(console, args);
      };
      
      // Wait a bit to capture logs
      return new Promise((resolve) => {
        setTimeout(() => {
          checkInfo.consoleLogsFound = logs;
          checkInfo.errorMessages = errors;
          
          // Restore original console methods
          console.log = originalLog;
          console.error = originalError;
          
          resolve(checkInfo);
        }, 3000);
      });
    });
    
    console.log('SetupRealtime Check:', JSON.stringify(setupRealtimeCheck, null, 2));
    
    // Let's check the actual component code
    const componentCheck = await page.evaluate(() => {
      // Try to find React fiber to check component state
      const findReactFiber = (element: Element) => {
        for (const key in element) {
          if (key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')) {
            return (element as any)[key];
          }
        }
        return null;
      };
      
      const scanPageElement = document.querySelector('[class*="scan"]');
      const fiber = scanPageElement ? findReactFiber(scanPageElement) : null;
      
      return {
        hasScanPageElement: !!scanPageElement,
        hasFiber: !!fiber,
        fiberType: fiber?.type?.name || 'unknown'
      };
    });
    
    console.log('Component Check:', JSON.stringify(componentCheck, null, 2));
  });

  test('Test scanning functionality', async () => {
    // Listen to console
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    // Check if manual input mode is available
    const manualInputButton = await page.locator('button:has-text("Manual Input")').count();
    console.log('Manual input button found:', manualInputButton > 0);
    
    if (manualInputButton > 0) {
      // Click manual input button
      await page.click('button:has-text("Manual Input")');
      await page.waitForTimeout(500);
      
      // Enter a test QR code
      const testQRCode = 'student:25add33c-22ee-44e7-96a3-cabf488af1a1';
      await page.fill('input[placeholder*="QR"]', testQRCode);
      await page.keyboard.press('Enter');
      
      // Wait for scan to process
      await page.waitForTimeout(2000);
      
      // Check console logs for scan processing
      const scanLogs = consoleLogs.filter(log => 
        log.includes('SCAN DEBUG') || 
        log.includes('attendance') || 
        log.includes('realtime')
      );
      
      console.log('Scan-related logs:', scanLogs);
      
      // Check if the scan appeared in recent scans
      const recentScans = await page.locator('[class*="recent"]').textContent();
      console.log('Recent scans section:', recentScans);
    }
  });

  test('Fix realtime by injecting proper setup', async () => {
    // Inject a fix directly into the page
    const fixResult = await page.evaluate(async () => {
      console.log('🔧 Attempting to fix realtime setup...');
      
      // Try to manually initialize realtime
      try {
        // Import the attendance service
        const attendanceService = (window as any).attendanceSupabaseService;
        if (!attendanceService) {
          console.error('❌ Attendance service not found in window');
          return { success: false, error: 'No attendance service' };
        }
        
        // Try to setup realtime subscription
        const channel = attendanceService.current?.subscribeToAttendance?.((payload: any) => {
          console.log('📺 Manual realtime update received:', payload);
        });
        
        if (channel) {
          console.log('✅ Manual realtime subscription created');
          return { success: true, channel: 'created' };
        } else {
          console.error('❌ Failed to create channel');
          return { success: false, error: 'Channel creation failed' };
        }
      } catch (error: any) {
        console.error('❌ Fix attempt failed:', error);
        return { success: false, error: error.message };
      }
    });
    
    console.log('Fix Result:', fixResult);
    
    // Wait and check if realtime is now working
    await page.waitForTimeout(5000);
    
    // Check console for realtime messages
    const hasRealtimeLogs = await page.evaluate(() => {
      return new Promise((resolve) => {
        let found = false;
        const originalLog = console.log;
        console.log = (...args) => {
          const message = args.join(' ');
          if (message.includes('realtime') || message.includes('Realtime')) {
            found = true;
          }
          originalLog.apply(console, args);
        };
        
        setTimeout(() => {
          console.log = originalLog;
          resolve(found);
        }, 3000);
      });
    });
    
    console.log('Has realtime logs after fix:', hasRealtimeLogs);
  });
});