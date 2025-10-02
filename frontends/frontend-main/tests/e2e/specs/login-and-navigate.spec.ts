import { test, expect } from '@playwright/test';

test.describe('Login and Navigate to Project', () => {
  test('should login and navigate to project 123', async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('🔐')) {
        console.log('Browser:', msg.text());
      }
      if (msg.type() === 'error') {
        console.log('Browser Error:', msg.text());
      }
    });

    // Step 1: Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:9000/#/login');
    await page.waitForLoadState('networkidle');

    // Step 2: Check if we need to click Manual Login or if form is already visible
    console.log('2. Checking login form...');

    // Try to find the username input field first
    let usernameInput = page.locator('input[placeholder*="username" i], input[placeholder*="email" i]').first();

    // If not visible, click Manual Login button
    if (!(await usernameInput.isVisible({ timeout: 1000 }).catch(() => false))) {
      console.log('   Clicking Manual Login button...');
      const manualLoginBtn = page.locator('button:has-text("Manual Login"), [data-testid="manual-login-button"]').first();
      if (await manualLoginBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await manualLoginBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Step 3: Fill in login credentials
    console.log('3. Filling login form...');
    // Re-select inputs after potential button click
    usernameInput = page.locator('input[placeholder*="username" i], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await expect(usernameInput).toBeVisible({ timeout: 5000 });
    await usernameInput.fill('guillermotabligan');
    await passwordInput.fill('water123');

    // Step 4: Submit the login form
    console.log('4. Submitting login...');
    const submitBtn = page.locator('button:has-text("Sign In"), button[type="submit"]').first();
    await submitBtn.click();

    // Step 5: Wait for workspace setup to complete
    console.log('5. Waiting for workspace setup...');
    // Wait for the "Setting up your workspace" message to appear and disappear
    const workspaceSetup = page.locator('text=Setting up your workspace');
    if (await workspaceSetup.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('   Workspace setup in progress...');
      // Wait for it to disappear
      await workspaceSetup.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    }

    // Now wait for navigation to dashboard or member area
    console.log('   Waiting for navigation...');
    await page.waitForURL(url => {
      const hash = new URL(url).hash;
      return hash.includes('dashboard') || hash.includes('member') || !hash.includes('login');
    }, { timeout: 15000 });
    console.log('✓ Login successful');

    // Step 6: Navigate to project 123
    console.log('6. Navigating to project 123...');
    await page.goto('http://localhost:9000/#/member/project/123');
    await page.waitForLoadState('networkidle');

    // Step 7: Check for errors
    console.log('7. Checking for errors...');
    const pageContent = await page.textContent('body');

    // Check for permission denied errors
    const hasPermissionError = pageContent.includes('permission denied') ||
                              pageContent.includes('403') ||
                              pageContent.includes('Forbidden');

    if (hasPermissionError) {
      console.log('❌ Permission denied error found on project page');
    } else {
      console.log('✓ No permission errors found');
    }

    // Check if project info is displayed (even if empty)
    const hasProjectContent = pageContent.includes('Project') ||
                             pageContent.includes('project');

    if (hasProjectContent) {
      console.log('✓ Project page loaded');
    }

    // Take screenshot for debugging
    await page.screenshot({ path: 'screenshots/project-123-page.png' });
    console.log('8. Screenshot saved to screenshots/project-123-page.png');

    // Assert no permission errors
    expect(hasPermissionError).toBe(false);
  });
});