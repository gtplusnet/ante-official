import { test, expect } from '@playwright/test';

test.describe('Debug Supabase Session', () => {
  test('check session status and project query', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('🔐')) {
        console.log('Browser:', msg.text());
      }
    });

    // Login
    await page.goto('http://localhost:9001/#/login');

    // Wait for page to be ready
    await page.waitForLoadState('networkidle');

    // Click Manual Login button to show the form
    await page.click('button:has-text("Manual Login")');
    await page.waitForTimeout(500); // Wait for form to appear

    // Find and fill login form
    const usernameInput = page.locator('input[type="text"], input[placeholder*="username" i], input[placeholder*="user" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await usernameInput.fill('guillermotabligan');
    await passwordInput.fill('water123');

    // Click login button
    const loginButton = page.locator('button[type="submit"], button:has-text("Login")').first();
    await loginButton.click();

    // Wait for navigation
    await page.waitForURL(url => !url.hash?.includes('login'), { timeout: 10000 });

    // Navigate to debug page
    await page.goto('http://localhost:9001/#/member/project-debug');
    await page.waitForLoadState('networkidle');

    // Click test session button
    await page.click('button:has-text("Test Supabase Session")');
    await page.waitForTimeout(1000);

    // Get debug info
    const debugText = await page.locator('pre').textContent();
    console.log('\n=== Session Debug Info ===');
    console.log(debugText);

    // Click test project query button
    await page.click('button:has-text("Test Project Query")');
    await page.waitForTimeout(2000);

    // Get updated debug info
    const queryDebugText = await page.locator('pre').textContent();
    console.log('\n=== Query Debug Info ===');
    console.log(queryDebugText);

    // Check for errors
    expect(queryDebugText).not.toContain('0 rows');
    expect(queryDebugText).not.toContain('PGRST116');
  });
});