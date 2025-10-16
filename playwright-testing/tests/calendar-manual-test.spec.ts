import { test, expect } from '@playwright/test';

// Test credentials
const TEST_USER = {
  username: 'guillermotabligan',
  password: 'water123'
};

const BASE_URL = 'http://localhost:9000';

test.describe('Calendar Manual Inspection', () => {
  test('inspect calendar quick create feature', async ({ page }) => {
    // Collect console messages
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(`Page Error: ${error.message}\n${error.stack}`);
    });

    // Step 1: Go to login page
    console.log('Step 1: Navigating to login page...');
    await page.goto(`${BASE_URL}/#/login`);
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/01-login-page.png', fullPage: true });

    // Step 2: Fill login form
    console.log('Step 2: Filling login form...');

    //Try to find the login input fields
    const usernameInput = page.locator('input').first();
    const passwordInput = page.locator('input[type="password"]');

    await usernameInput.fill(TEST_USER.username);
    await passwordInput.fill(TEST_USER.password);

    await page.screenshot({ path: 'test-results/02-login-filled.png', fullPage: true });

    // Step 3: Click login button
    console.log('Step 3: Clicking login button...');
    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/03-after-login.png', fullPage: true });

    // Step 4: Navigate to calendar
    console.log('Step 4: Navigating to calendar...');
    await page.goto(`${BASE_URL}/#/member/manpower/calendar`);
    await page.waitForTimeout(5000); // Give it time to load

    await page.screenshot({ path: 'test-results/04-calendar-page.png', fullPage: true });

    // Step 5: Try to click Create button
    console.log('Step 5: Looking for Create button...');

    // Try multiple selectors
    const createButtonSelectors = [
      '.calendar-toolbar button:has-text("Create")',
      '.calendar-toolbar .create-btn',
      'button:has-text("Create")',
      '.create-btn'
    ];

    let createButton = null;
    for (const selector of createButtonSelectors) {
      const btn = page.locator(selector);
      if (await btn.count() > 0) {
        console.log(`Found Create button with selector: ${selector}`);
        createButton = btn.first();
        break;
      }
    }

    if (createButton) {
      await createButton.click();
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'test-results/05-after-create-click.png', fullPage: true });

      // Check what dialogs/popovers are visible
      const menuCount = await page.locator('.q-menu').count();
      const dialogCount = await page.locator('.q-dialog').count();

      console.log(`Visible menus (popovers): ${menuCount}`);
      console.log(`Visible dialogs: ${dialogCount}`);

      // List all visible overlays
      const allOverlays = await page.locator('.q-menu, .q-dialog').all();
      console.log(`Total overlays found: ${allOverlays.length}`);

    } else {
      console.log('Create button not found!');
    }

    // Print console errors
    console.log('\n=== Console Errors ===');
    console.errors.forEach(err => console.log(err));

    console.log('\n=== All Console Logs (last 20) ===');
    consoleLogs.slice(-20).forEach(log => console.log(log));

    // Wait a bit before ending
    await page.waitForTimeout(2000);

    // Final screenshot
    await page.screenshot({ path: 'test-results/06-final-state.png', fullPage: true });

    // Log results
    console.log('\n=== Test Summary ===');
    console.log(`Console errors found: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Errors:', consoleErrors);
    }
  });
});
