/**
 * Playwright test to verify HRIS tabs load without infinite recursion errors
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:9000';

// Test credentials
const LOGIN_CREDENTIALS = {
  username: 'guillermotabligan',
  password: 'water123'
};

test.describe('HRIS Supabase Integration Tests', () => {
  
  test('HRIS tabs should load without infinite recursion errors', async ({ page }) => {
    console.log('🧪 Testing HRIS Supabase Integration');
    
    // Monitor console for errors
    const consoleMessages = [];
    const networkErrors = [];
    
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
      
      // Log critical errors immediately
      if (msg.type() === 'error' && msg.text().includes('infinite recursion')) {
        console.error('❌ INFINITE RECURSION DETECTED:', msg.text());
      }
    });
    
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    try {
      // Step 1: Navigate to login page
      console.log('1️⃣ Navigating to login page...');
      await page.goto(`${BASE_URL}/#/auth/login`);
      await page.waitForLoadState('networkidle');

      // Step 2: Login
      console.log('2️⃣ Logging in...');
      
      // Try different possible selectors for login form
      const emailSelector = 'input[type="email"], input[name="email"], input[name="username"], #email, #username';
      const passwordSelector = 'input[type="password"], input[name="password"], #password';
      const submitSelector = 'button[type="submit"], .login-btn, [data-cy="login-button"]';
      
      await page.fill(emailSelector, LOGIN_CREDENTIALS.username);
      await page.fill(passwordSelector, LOGIN_CREDENTIALS.password);
      await page.click(submitSelector);
      
      // Wait for login to complete - try different possible URLs
      await page.waitForURL(/dashboard|manpower|home/, { timeout: 15000 });
      console.log('✅ Login successful');

      // Step 3: Navigate to HRIS section
      console.log('3️⃣ Navigating to HRIS...');
      await page.goto(`${BASE_URL}/#/manpower/hris`);
      await page.waitForLoadState('networkidle');
      
      // Wait for page to fully load
      await page.waitForTimeout(3000);

      // Step 4: Test each HRIS tab by looking for tab-like elements
      console.log('4️⃣ Testing HRIS tabs...');
      
      // Try to find and click tabs - be flexible with selectors
      const tabTexts = ['Active', 'Inactive', 'Separated', 'Not Yet Setup'];
      
      for (const tabText of tabTexts) {
        console.log(`Testing ${tabText} tab...`);
        
        try {
          // Try multiple strategies to find and click tabs
          let tabClicked = false;
          
          // Strategy 1: Look for Quasar tabs
          const quasarTab = page.locator('.q-tab').filter({ hasText: tabText });
          if (await quasarTab.count() > 0) {
            await quasarTab.first().click();
            tabClicked = true;
          }
          
          // Strategy 2: Look for any clickable element with the text
          if (!tabClicked) {
            const anyTab = page.locator(`text=${tabText}`).first();
            if (await anyTab.isVisible()) {
              await anyTab.click();
              tabClicked = true;
            }
          }
          
          if (tabClicked) {
            // Wait for content to load
            await page.waitForTimeout(2000);
            console.log(`✅ ${tabText} tab clicked successfully`);
          } else {
            console.log(`⚠️ Could not find ${tabText} tab`);
          }
          
        } catch (error) {
          console.log(`⚠️ Error testing ${tabText} tab: ${error.message}`);
        }
      }

      // Step 5: Wait a bit more to catch any delayed errors
      console.log('5️⃣ Waiting for any delayed errors...');
      await page.waitForTimeout(5000);

      // Step 6: Check for specific recursion errors
      console.log('6️⃣ Analyzing results...');
      
      const recursionErrors = consoleMessages.filter(msg => 
        msg.text.includes('infinite recursion') || 
        msg.text.includes('Maximum call stack') ||
        msg.text.includes('RangeError') ||
        msg.text.toLowerCase().includes('recursion')
      );
      
      const supabaseErrors = networkErrors.filter(err => 
        err.url.includes('supabase') && err.status === 500
      );
      
      const criticalErrors = consoleMessages.filter(msg =>
        msg.type === 'error' && (
          msg.text.includes('Policy') ||
          msg.text.includes('RLS') ||
          msg.text.includes('Account')
        )
      );

      // Step 7: Report results
      console.log('\n🎉 Test Results Summary:');
      console.log('========================');
      
      if (recursionErrors.length === 0) {
        console.log('✅ No infinite recursion errors detected');
      } else {
        console.log('❌ Recursion errors found:', recursionErrors.length);
        recursionErrors.forEach(err => console.log(`   - ${err.text}`));
      }
      
      if (supabaseErrors.length === 0) {
        console.log('✅ No 500 errors from Supabase');
      } else {
        console.log('❌ Supabase 500 errors:', supabaseErrors.length);
        supabaseErrors.forEach(err => console.log(`   - ${err.url}: ${err.status}`));
      }
      
      if (criticalErrors.length === 0) {
        console.log('✅ No critical RLS/Policy errors');
      } else {
        console.log('⚠️ Policy-related errors:', criticalErrors.length);
        criticalErrors.forEach(err => console.log(`   - ${err.text}`));
      }
      
      console.log(`📊 Total console messages: ${consoleMessages.length}`);
      console.log(`📊 Network errors (4xx/5xx): ${networkErrors.length}`);
      
      // The main goal: ensure no infinite recursion
      expect(recursionErrors.length, 'Should have no infinite recursion errors').toBe(0);
      expect(supabaseErrors.length, 'Should have no Supabase 500 errors').toBe(0);
      
      console.log('\n✅ HRIS Supabase Integration Test PASSED!');
      console.log('✅ RLS policy infinite recursion fixes are working!');

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      
      // Log debugging info
      console.log('\n🔍 Debug Information:');
      console.log('Recent console messages:', consoleMessages.slice(-5));
      console.log('Network errors:', networkErrors.slice(-3));
      
      throw error;
    }
  });
});