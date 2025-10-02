import { test } from '@playwright/test';

test.describe('Guardian App Login Debug', () => {
  test('Debug Supabase token issue', async ({ page }) => {
    // Enable all console logs
    page.on('console', msg => {
      console.log('Console:', msg.text());
    });

    // Navigate to Guardian App
    console.log('1. Navigating to Guardian App...');
    await page.goto('http://localhost:9003');
    await page.waitForLoadState('networkidle');
    
    // Check if we're on login page
    const url = page.url();
    console.log('Current URL:', url);
    
    if (url.includes('/login')) {
      console.log('2. On login page, filling credentials...');
      
      // Fill in login credentials
      await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', 'guillermotabligan@gmail.com');
      await page.fill('input[type="password"], input[name="password"], input[placeholder*="password" i]', 'water123');
      
      console.log('3. Clicking login button...');
      await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("Sign In")');
      
      // Wait for console logs about Supabase
      await page.waitForTimeout(5000);
      
      const afterLoginUrl = page.url();
      console.log('4. After login URL:', afterLoginUrl);
      
      if (afterLoginUrl.includes('/dashboard')) {
        console.log('✅ Login successful! On dashboard');
      } else {
        console.log('❌ Login failed or still on login page');
      }
    }
    
    // Keep page open to observe more logs
    await page.waitForTimeout(10000);
  });
});