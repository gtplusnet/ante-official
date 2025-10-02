import { test } from '@playwright/test';

test.describe('Guardian App Login Final Test', () => {
  test('Test login with Supabase prefix fix', async ({ page }) => {
    // Enable console log monitoring
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('[AuthApi]') || text.includes('Supabase') || text.includes('Error') || text.includes('401')) {
        console.log('📝', text);
      }
    });

    // Monitor network errors
    page.on('response', response => {
      if (response.status() >= 400) {
        const url = response.url();
        if (url.includes('notification') || url.includes('Notification')) {
          console.log(`🔴 ${response.status()}: ${url.substring(0, 100)}`);
        }
      }
    });

    // Navigate to Guardian App
    console.log('1. Navigating to Guardian App...');
    await page.goto('http://localhost:9003');
    await page.waitForLoadState('networkidle');
    
    // Check if we're on login page
    const url = page.url();
    console.log('Current URL:', url);
    
    if (url.includes('/login')) {
      console.log('2. Filling login credentials...');
      
      // Fill in login credentials
      await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', 'guillermotabligan@gmail.com');
      await page.fill('input[type="password"], input[name="password"], input[placeholder*="password" i]', 'water123');
      
      console.log('3. Clicking login button...');
      
      // Monitor console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('Browser console error:', msg.text());
        }
      });
      
      // Click the button
      await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("Sign In")');
      
      // Wait for navigation with explicit URL check
      await page.waitForFunction(
        () => window.location.href.includes('/dashboard') || window.location.href.includes('/add-student'),
        { timeout: 10000 }
      ).catch(() => {
        console.log('Navigation did not occur within 10 seconds');
      });
      
      // Check for any error messages on the page
      const errorElement = await page.locator('.text-red-600, .text-red-500, .bg-red-50').first();
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        console.log('❌ Login error message:', errorText);
      }
      
      const afterLoginUrl = page.url();
      console.log('4. After login URL:', afterLoginUrl);
      
      if (afterLoginUrl.includes('/dashboard')) {
        console.log('✅ Login successful! Now on dashboard');
        
        // Wait for dashboard to load and check for errors
        await page.waitForTimeout(5000);
        
        // Check if Supabase tokens were received
        const supabaseTokenLog = consoleLogs.find(log => log.includes('[AuthApi] Checking for Supabase tokens'));
        if (supabaseTokenLog) {
          console.log('📊 Supabase token status:', supabaseTokenLog);
        }
        
        // Count 401 errors
        const errors401 = consoleLogs.filter(log => log.includes('401'));
        console.log(`📈 Total 401 errors: ${errors401.length}`);
        
        if (errors401.length === 0) {
          console.log('🎉 No permission errors! All fixed!');
        } else {
          console.log('⚠️ Still have permission errors to fix');
        }
        
      } else {
        console.log('❌ Login failed');
      }
    }
    
    // Keep page open briefly
    await page.waitForTimeout(3000);
  });
});