import { test, expect } from '@playwright/test';

/**
 * Simple Global Stores Test
 *
 * Verifies:
 * 1. No console errors during login and navigation
 * 2. API calls are not duplicated (stores prevent multiple calls)
 */

const FRONTEND_URL = 'http://localhost:9000';

test.describe('Global Stores - Simple Verification', () => {

  test('should login and load stores without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    const apiCalls: { url: string; method: string }[] = [];

    // Monitor console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      } else if (msg.type() === 'warning' && !msg.text().includes('DevTools')) {
        consoleWarnings.push(msg.text());
      }
    });

    // Monitor API calls
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/task/users') || (url.includes('/supabase/query') && url.includes('Project'))) {
        apiCalls.push({
          url: url.substring(url.indexOf('/task') !== -1 ? url.indexOf('/task') : url.indexOf('/supabase')),
          method: request.method()
        });
        console.log(`📡 API Call: ${request.method()} ${url.includes('/task/users') ? '/task/users' : 'Project query'}`);
      }
    });

    // Go to frontend
    console.log('🌐 Navigating to', FRONTEND_URL);
    await page.goto(FRONTEND_URL);

    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/01-login-page.png', fullPage: true });

    // Wait for page to be ready
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Find and fill username - be very flexible with selectors
    console.log('🔍 Looking for username field...');
    const usernameInput = page.locator('input').filter({ hasText: '' }).first();
    await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
    await usernameInput.fill('guillermotabligan');
    console.log('✅ Username filled');

    // Find and fill password
    console.log('🔍 Looking for password field...');
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill('water123');
    console.log('✅ Password filled');

    // Take screenshot before login
    await page.screenshot({ path: 'test-results/02-before-login.png', fullPage: true });

    // Find and click login button
    console.log('🔍 Looking for login button...');
    const loginButton = page.locator('button').filter({ hasText: /login|sign in/i }).first();
    await loginButton.waitFor({ state: 'visible', timeout: 10000 });
    await loginButton.click();
    console.log('✅ Login button clicked');

    // Wait for navigation
    console.log('⏳ Waiting for dashboard...');
    await page.waitForURL(/.*member.*/, { timeout: 20000 });
    console.log('✅ Navigated to member area');

    // Wait for stores to initialize
    await page.waitForTimeout(3000);

    // Take screenshot of dashboard
    await page.screenshot({ path: 'test-results/03-after-login.png', fullPage: true });

    // Print API call summary
    console.log('\n📊 API Call Summary:');
    const taskUsersCalls = apiCalls.filter(c => c.url.includes('/task/users'));
    const projectCalls = apiCalls.filter(c => c.url.includes('Project'));

    console.log(`  /task/users calls: ${taskUsersCalls.length}`);
    console.log(`  Project query calls: ${projectCalls.length}`);

    // Print console error summary
    console.log('\n🐛 Console Errors:', consoleErrors.length);
    console.log('⚠️  Console Warnings:', consoleWarnings.filter(w => !w.includes('DevTools')).length);

    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors Found:');
      consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    // Assertions
    expect(consoleErrors.length, 'Should have no console errors').toBe(0);

    // Stores should prevent excessive API calls
    expect(taskUsersCalls.length, '/task/users should be called at most 2 times').toBeLessThanOrEqual(2);
    expect(projectCalls.length, 'Project query should be called at most 2 times').toBeLessThanOrEqual(2);

    console.log('\n✅ All tests passed!');
  });
});
