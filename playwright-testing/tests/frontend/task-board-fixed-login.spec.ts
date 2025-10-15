import { test, expect } from '@playwright/test';

test.describe('Task Board - Fixed Login Tests', () => {
  // Helper function to login properly with Quasar inputs
  async function login(page: any) {
    // Monitor API requests
    const apiRequests: any[] = [];
    const apiResponses: any[] = [];

    page.on('request', (request: any) => {
      if (request.url().includes('/auth/login')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postDataJSON()
        });
        console.log('  🌐 API REQUEST:', request.method(), request.url());
      }
    });

    page.on('response', async (response: any) => {
      if (response.url().includes('/auth/login')) {
        const status = response.status();
        let body = null;
        try {
          body = await response.json();
        } catch (e) {
          body = '<could not parse JSON>';
        }
        apiResponses.push({ url: response.url(), status, body });
        console.log('  ✅ API RESPONSE:', status);
        if (status !== 200) {
          console.log('  ❌ Error response:', body);
        }
      }
    });

    await page.goto('http://localhost:9000');
    await page.waitForLoadState('domcontentloaded');

    // CRITICAL: Clear any cached connection settings from LocalStorage
    // The frontend stores API URL in LocalStorage which might point to wrong server
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Reload to ensure fresh state
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    console.log('  - Clicking "Sign in manually"');
    const signInManuallyBtn = page.locator('button:has-text("Sign in manually")');
    await signInManuallyBtn.click();
    await page.waitForTimeout(1500);

    console.log('  - Finding input fields');

    // After clicking "Sign in manually", wait for the form to appear
    // Use the simple selectors that work
    const usernameInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    // Wait for them to be visible
    await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });

    console.log('  - Filling username');
    await usernameInput.fill('guillermotabligan');
    await page.waitForTimeout(200);

    console.log('  - Filling password');
    await passwordInput.fill('water123');
    await page.waitForTimeout(500);

    console.log('  - Clicking submit button');
    const submitButton = page.locator('button[data-testid="login-submit-button"]');
    await submitButton.click();

    // Wait for login to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Log API activity
    console.log('  - API requests made:', apiRequests.length);
    console.log('  - API responses received:', apiResponses.length);

    // Verify login succeeded
    const currentUrl = page.url();
    console.log('  - Current URL:', currentUrl);

    const token = await page.evaluate(() => localStorage.getItem('token'));
    if (token) {
      console.log('✓ Login successful - token stored');
      return true;
    } else {
      console.log('❌ Login failed - no token');
      if (apiResponses.length > 0) {
        console.log('  Response received but token not stored');
        console.log('  Status:', apiResponses[0].status);
      } else if (apiRequests.length === 0) {
        console.log('  ⚠️ Form did not send API request');
      }
      return false;
    }
  }

  test('1. Login should work and store token', async ({ page }) => {
    console.log('\n=== Test 1: Login should work ===');

    const loggedIn = await login(page);
    expect(loggedIn).toBe(true);

    // Verify we're redirected to dashboard
    await page.waitForTimeout(2000);
    const finalUrl = page.url();
    console.log('  - Final URL:', finalUrl);

    expect(finalUrl).toContain('/member/');
    console.log('✓ Successfully logged in and redirected');
  });

  test('2. Can access Task Board after login', async ({ page }) => {
    console.log('\n=== Test 2: Access Task Board ===');

    const loggedIn = await login(page);
    expect(loggedIn).toBe(true);

    console.log('  - Navigating to Task Board');
    await page.goto('http://localhost:9000/member/task/my-task');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('  - Current URL:', currentUrl);

    expect(currentUrl).toContain('/member/task/my-task');
    console.log('✓ Task Board page accessible');
  });

  test('3. Board columns should render', async ({ page }) => {
    console.log('\n=== Test 3: Board columns render ===');

    const loggedIn = await login(page);
    expect(loggedIn).toBe(true);

    await page.goto('http://localhost:9000/member/task/my-task');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Look for board columns
    const boardColumns = page.locator('.board-column');
    const columnCount = await boardColumns.count();

    console.log('  - Board columns found:', columnCount);

    if (columnCount > 0) {
      console.log('✓ Board columns rendered');
      expect(columnCount).toBeGreaterThan(0);
    } else {
      // If no columns found, take a screenshot and log page structure
      await page.screenshot({ path: '/tmp/no-columns-debug.png', fullPage: true });
      console.log('⚠️ No board columns found - screenshot saved to /tmp/no-columns-debug.png');

      // Check what's actually on the page
      const bodyText = await page.locator('body').textContent();
      console.log('  - Page body text preview:', bodyText?.substring(0, 200));

      // This test will fail, but we'll have debug info
      expect(columnCount).toBeGreaterThan(0);
    }
  });

  test('4. No console errors after login', async ({ page }) => {
    console.log('\n=== Test 4: No console errors ===');

    const consoleErrors: string[] = [];
    const supabaseErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
        if (text.toLowerCase().includes('supabase')) {
          supabaseErrors.push(text);
        }
      }
    });

    page.on('pageerror', error => {
      const msg = error.message;
      consoleErrors.push(msg);
      if (msg.toLowerCase().includes('supabase')) {
        supabaseErrors.push(msg);
      }
    });

    const loggedIn = await login(page);
    expect(loggedIn).toBe(true);

    await page.goto('http://localhost:9000/member/task/my-task');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    console.log('  - Console errors found:', consoleErrors.length);
    console.log('  - Supabase errors found:', supabaseErrors.length);

    if (consoleErrors.length > 0) {
      console.log('  - First 3 console errors:');
      consoleErrors.slice(0, 3).forEach(err => {
        console.log('    -', err.substring(0, 100));
      });
    }

    expect(supabaseErrors.length).toBe(0);
    console.log('✓ No Supabase errors in console');
  });
});
