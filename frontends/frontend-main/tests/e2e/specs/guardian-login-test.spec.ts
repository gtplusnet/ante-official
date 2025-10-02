import { test } from '@playwright/test';

test.describe('Guardian App Login Test', () => {
  test('Login to Guardian App with guillermotabligan@gmail.com', async ({ page }) => {
    // Enable console log monitoring
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Error') || text.includes('error') || text.includes('401') || text.includes('403') || text.includes('permission')) {
        console.log('🔴 Console Error:', text);
      }
    });

    // Monitor network errors
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`🔴 Network Error ${response.status()}: ${response.url()}`);
      }
    });

    // Navigate to Guardian App
    console.log('1. Navigating to Guardian App at http://localhost:9003...');
    await page.goto('http://localhost:9003');
    await page.waitForLoadState('networkidle');
    
    // Check if we're on login page
    const url = page.url();
    console.log('Current URL:', url);
    
    if (url.includes('/login')) {
      console.log('2. On login page, proceeding with login...');
      
      // Take screenshot before login
      await page.screenshot({ path: 'screenshots/guardian-login-before.png', fullPage: true });
      
      // Fill in login credentials
      console.log('3. Filling in credentials...');
      await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', 'guillermotabligan@gmail.com');
      await page.fill('input[type="password"], input[name="password"], input[placeholder*="password" i]', 'water123');
      
      // Click login button
      console.log('4. Clicking login button...');
      await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("Sign In")');
      
      // Wait for navigation or error
      try {
        await page.waitForURL('**/dashboard/**', { timeout: 10000 });
        console.log('✅ Successfully navigated to dashboard');
      } catch (e) {
        console.log('⚠️ Did not navigate to dashboard, checking current state...');
      }
      
      await page.waitForTimeout(3000);
      
      const afterLoginUrl = page.url();
      console.log('5. After login URL:', afterLoginUrl);
      
      // Take screenshot after login
      await page.screenshot({ path: 'screenshots/guardian-login-after.png', fullPage: true });
      
      if (afterLoginUrl.includes('/dashboard')) {
        console.log('✅ Login successful! Now on dashboard');
        
        // Wait for dashboard to fully load
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        // Check for any error messages on dashboard
        const errorElements = await page.$$('text=/error/i, text=/unauthorized/i, text=/permission/i, text=/401/i, text=/403/i');
        if (errorElements.length > 0) {
          console.log('⚠️ Found potential error messages on dashboard:');
          for (const element of errorElements) {
            const text = await element.textContent();
            console.log('  - Error text:', text);
          }
        } else {
          console.log('✅ No visible errors on dashboard');
        }
        
        // Take final screenshot
        await page.screenshot({ path: 'screenshots/guardian-dashboard.png', fullPage: true });
        
        // Check console for any errors
        console.log('6. Waiting to catch any delayed errors...');
        await page.waitForTimeout(5000);
        
      } else if (afterLoginUrl.includes('/login')) {
        console.log('❌ Still on login page, checking for error messages...');
        
        // Check for error messages
        const errorMessage = await page.textContent('.error, .alert, [role="alert"], .text-red-500, .text-danger').catch(() => null);
        if (errorMessage) {
          console.log('Login error message:', errorMessage);
        }
        
        // Check if there's a form validation error
        const validationErrors = await page.$$eval('.error-message, .field-error, .invalid-feedback', elements => 
          elements.map(el => el.textContent)
        ).catch(() => []);
        
        if (validationErrors.length > 0) {
          console.log('Validation errors:', validationErrors);
        }
      } else {
        console.log('❌ Unexpected page:', afterLoginUrl);
      }
    } else if (url.includes('/dashboard')) {
      console.log('Already logged in, on dashboard');
      await page.screenshot({ path: 'screenshots/guardian-dashboard-direct.png', fullPage: true });
    } else {
      console.log('Unexpected initial page:', url);
    }
    
    // Final wait to observe any delayed errors
    console.log('7. Final check for delayed errors...');
    await page.waitForTimeout(5000);
    
    console.log('Test completed!');
  });
});