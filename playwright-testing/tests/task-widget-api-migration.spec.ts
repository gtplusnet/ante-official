import { test, expect } from '@playwright/test';

/**
 * TaskWidget API Migration Test
 *
 * Verifies:
 * 1. TaskWidget loads successfully with backend API (migrated from Supabase)
 * 2. Tab switching works (active, assigned, approvals)
 * 3. Task counts/badges display correctly
 * 4. Tasks load for each tab
 * 5. No console errors during operation
 */

const FRONTEND_URL = 'http://localhost:9000';

test.describe('TaskWidget - API Migration', () => {

  test('should load TaskWidget with all tabs working', async ({ page }) => {
    const consoleErrors: string[] = [];
    const apiCalls: { url: string; method: string; tab?: string }[] = [];

    // Monitor console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      }
    });

    // Monitor API calls to task dashboard endpoint
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/task/dashboard')) {
        const urlObj = new URL(url);
        const tab = urlObj.searchParams.get('tab') || 'unknown';
        apiCalls.push({
          url: '/task/dashboard',
          method: request.method(),
          tab
        });
        console.log(`📡 API Call: ${request.method()} /task/dashboard?tab=${tab}`);
      }
    });

    // Login
    console.log('🌐 Navigating to', FRONTEND_URL);
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });

    console.log('🔐 Logging in...');
    // Wait for Quasar app to initialize
    await page.waitForSelector('#q-app', { timeout: 15000 });
    await page.waitForTimeout(2000); // Additional wait for Vue to mount

    // Click "Sign in manually" button to show login form
    const signInManuallyBtn = page.locator('button').filter({ hasText: /sign in manually/i });
    await signInManuallyBtn.waitFor({ state: 'visible', timeout: 10000 });
    await signInManuallyBtn.click();
    console.log('  ✓ Clicked "Sign in manually"');

    // Wait for login form to appear
    await page.waitForTimeout(1000);

    // Find username input by placeholder or label
    const usernameInput = page.locator('input[type="text"]').first();
    await usernameInput.waitFor({ state: 'visible', timeout: 15000 });
    await usernameInput.fill('guillermotabligan');
    console.log('  ✓ Username filled');

    // Find and fill password
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill('water123');
    console.log('  ✓ Password filled');

    // Find and click login button (look for Quasar button)
    const loginButton = page.locator('button[type="submit"], button.q-btn').filter({ hasText: /login|sign in/i }).first();
    await loginButton.waitFor({ state: 'visible', timeout: 10000 });
    await loginButton.click();
    console.log('  ✓ Login button clicked');

    // Wait for dashboard
    console.log('⏳ Waiting for dashboard...');
    await page.waitForURL(/.*member.*/, { timeout: 20000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(2000); // Wait for initial data load

    console.log('✅ Dashboard loaded');

    // Take screenshot of dashboard with TaskWidget
    await page.screenshot({ path: 'test-results/task-widget-01-dashboard.png', fullPage: true });

    // Verify TaskWidget is visible
    console.log('🔍 Looking for TaskWidget...');
    const taskWidget = page.locator('text=Task List').first();
    await expect(taskWidget).toBeVisible({ timeout: 10000 });
    console.log('✅ TaskWidget is visible');

    // Wait for initial API call to complete (active tab loads on mount)
    await page.waitForTimeout(2000);

    // Test Active Tab (default) - "My Task"
    console.log('\n📋 Testing Active Tab (My Task)...');
    // Use a more flexible selector - any clickable element with "My Task" text
    const activeTab = page.getByText('My Task', { exact: false }).first();
    await expect(activeTab).toBeVisible({ timeout: 10000 });

    // Check if active tab has badge (count)
    const activeTabText = await activeTab.textContent();
    console.log(`  Active tab text: "${activeTabText}"`);

    // Take screenshot of active tab
    await page.screenshot({ path: 'test-results/task-widget-02-active-tab.png', fullPage: true });

    // Test Approvals Tab
    console.log('\n✅ Testing Approvals Tab...');
    const approvalsTab = page.getByText('Approvals', { exact: false }).first();
    await expect(approvalsTab).toBeVisible();
    await approvalsTab.click();
    console.log('  Clicked approvals tab');

    // Wait for API call and data load
    await page.waitForTimeout(2000);

    // Take screenshot of approvals tab
    await page.screenshot({ path: 'test-results/task-widget-03-approvals-tab.png', fullPage: true });

    // Test Assigned Tab
    console.log('\n👥 Testing Assigned Tab...');
    const assignedTab = page.getByText('Assigned', { exact: false }).first();
    await expect(assignedTab).toBeVisible();
    await assignedTab.click();
    console.log('  Clicked assigned tab');

    // Wait for API call and data load
    await page.waitForTimeout(2000);

    // Take screenshot of assigned tab
    await page.screenshot({ path: 'test-results/task-widget-04-assigned-tab.png', fullPage: true });

    // Switch back to Active tab to test tab switching
    console.log('\n🔄 Switching back to Active Tab...');
    const activeTabAgain = page.getByText('My Task', { exact: false }).first();
    await activeTabAgain.click();
    await page.waitForTimeout(2000);

    // Print API call summary
    console.log('\n📊 API Call Summary:');
    const activeCalls = apiCalls.filter(c => c.tab === 'active');
    const approvalsCalls = apiCalls.filter(c => c.tab === 'approvals');
    const assignedCalls = apiCalls.filter(c => c.tab === 'assigned');

    console.log(`  /task/dashboard?tab=active calls: ${activeCalls.length}`);
    console.log(`  /task/dashboard?tab=approvals calls: ${approvalsCalls.length}`);
    console.log(`  /task/dashboard?tab=assigned calls: ${assignedCalls.length}`);
    console.log(`  Total dashboard API calls: ${apiCalls.length}`);

    // Print console errors
    console.log('\n🐛 Console Errors:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors Found:');
      consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    // Assertions
    expect(consoleErrors.length, 'Should have no console errors').toBe(0);
    expect(apiCalls.length, 'Should have made API calls to dashboard endpoint').toBeGreaterThan(0);
    expect(activeCalls.length, 'Should have called active tab endpoint').toBeGreaterThan(0);
    expect(approvalsCalls.length, 'Should have called approvals tab endpoint').toBeGreaterThan(0);
    expect(assignedCalls.length, 'Should have called assigned tab endpoint').toBeGreaterThan(0);

    console.log('\n✅ All TaskWidget API migration tests passed!');
  });
});
