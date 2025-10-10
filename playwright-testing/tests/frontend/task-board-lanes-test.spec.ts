import { test, expect } from '@playwright/test';

test.describe('Task Board Lanes - Backend Integration', () => {
  test('Board lanes should render', async ({ page }) => {
    console.log('\n=== Test: Board lanes should render ===');

    // Navigate to login page
    console.log('  - Navigating to login page');
    await page.goto('http://localhost:9000');
    await page.waitForTimeout(2000);

    // Click "Sign in manually"
    console.log('  - Clicking "Sign in manually"');
    const signInManuallyButton = page.locator('text=Sign in manually');
    await signInManuallyButton.click();
    await page.waitForTimeout(1000);

    // Fill in login credentials
    console.log('  - Filling credentials');
    const usernameInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await usernameInput.fill('guillermotabligan');
    await passwordInput.fill('water123');

    // Submit login
    console.log('  - Submitting login');
    const submitButton = page.locator('button:has-text("Sign in")').first();
    await submitButton.click();

    // Wait for navigation to dashboard
    console.log('  - Waiting for dashboard');
    await page.waitForTimeout(3000);

    // Verify we're logged in by checking for token in localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    console.log(`  - Token stored: ${token ? '✅' : '❌'}`);

    if (!token) {
      console.log('❌ Login failed - no token');
      throw new Error('Login failed - no token stored');
    }

    // Navigate to Task Board
    console.log('  - Navigating to Task Board');
    await page.goto('http://localhost:9000/#/member/task/board');
    await page.waitForTimeout(3000);

    // Monitor console for errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Monitor network requests for board-lane endpoint
    let boardLaneRequest: any = null;
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/board-lane')) {
        console.log(`  🌐 REQUEST: ${request.method()} ${url}`);
        boardLaneRequest = request;
      }
    });

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/board-lane')) {
        console.log(`  📥 RESPONSE: ${response.status()} ${url}`);
        try {
          const body = await response.json();
          console.log(`  📦 Response data:`, JSON.stringify(body, null, 2).substring(0, 500));
        } catch (e) {
          console.log(`  ⚠️  Could not parse response`);
        }
      }
    });

    // Wait for board columns to render
    console.log('  - Waiting for board columns');
    await page.waitForSelector('.board-column', { timeout: 10000 });

    // Count board columns
    const boardColumns = page.locator('.board-column');
    const count = await boardColumns.count();
    console.log(`  - Found ${count} board columns`);

    // Verify at least one column exists
    expect(count).toBeGreaterThan(0);

    // Get column titles
    const columnTitles = await page.locator('.column-title').allTextContents();
    console.log(`  - Column titles:`, columnTitles);

    // Check for console errors
    if (consoleErrors.length > 0) {
      console.log('⚠️  Console errors:', consoleErrors);
    }

    console.log('✅ Board lanes rendered successfully');
  });
});
