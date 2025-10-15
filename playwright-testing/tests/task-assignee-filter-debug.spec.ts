import { test, expect, Page } from '@playwright/test';

/**
 * Task Assignee Filter Debug Test
 *
 * Captures ALL console logs to diagnose the assignee filter issue
 */

const BASE_URL = 'http://localhost:9000';
const TEST_USERNAME = 'guillermotabligan';
const TEST_PASSWORD = 'water123';

// Helper function to login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);

  // Click "Sign in manually" button if visible
  const manualButton = page.locator('[data-testid="manual-login-button"]');
  if (await manualButton.isVisible({ timeout: 5000 })) {
    await manualButton.click();
    await page.waitForTimeout(1000);
  }

  // Fill login credentials using data-testid
  const usernameInput = page.locator('[data-testid="login-username-input"]');
  await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
  await usernameInput.fill(TEST_USERNAME);

  const passwordInput = page.locator('[data-testid="login-password-input"]');
  await passwordInput.fill(TEST_PASSWORD);

  // Submit login
  const submitButton = page.locator('[data-testid="login-submit-button"]');
  await submitButton.click();

  // Wait for redirect
  try {
    await page.waitForURL(/\/(dashboard|member|task)/, { timeout: 20000 });
  } catch (e) {
    console.log('Login redirect timeout, proceeding...');
  }

  await page.waitForTimeout(3000);
}

// Helper function to navigate to All Tasks view
async function navigateToAllTasks(page: Page) {
  await page.goto(`${BASE_URL}/#/member/task/all`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000); // Wait for data to load
}

test.describe('Task Assignee Filter - Debug Mode', () => {
  let consoleLogs: Array<{ type: string; text: string }> = [];

  test('should capture console logs when applying assignee filter', async ({ page }) => {
    // Reset console logs
    consoleLogs = [];

    // Capture ALL console messages
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      consoleLogs.push({ type, text });

      // Print in real-time for debugging
      if (type === 'error') {
        console.log(`[BROWSER ERROR] ${text}`);
      } else if (text.includes('[TaskList]') || text.includes('[useTaskAPI]')) {
        console.log(`[BROWSER LOG] ${text}`);
      }
    });

    // Login
    console.log('========================================');
    console.log('Step 1: Logging in...');
    console.log('========================================');
    await login(page);

    // Navigate to All Tasks
    console.log('========================================');
    console.log('Step 2: Navigating to All Tasks...');
    console.log('========================================');
    await navigateToAllTasks(page);

    // Check initial task count
    const initialTaskCount = await page.locator('.task-item').count();
    console.log(`Initial task count: ${initialTaskCount}`);

    // Open filter dialog
    console.log('========================================');
    console.log('Step 3: Opening filter dialog...');
    console.log('========================================');
    await page.click('button:has-text("Filters")');
    await page.waitForSelector('.q-dialog', { timeout: 5000 });

    // Wait a bit for dialog to fully render
    await page.waitForTimeout(500);

    // Find and click assignee dropdown
    console.log('========================================');
    console.log('Step 4: Clicking assignee dropdown...');
    console.log('========================================');
    const dialog = page.locator('.q-dialog');
    const assigneeSelect = dialog.locator('.q-select').filter({
      has: page.locator('.q-icon:has-text("person")')
    });
    await assigneeSelect.click();
    await page.waitForTimeout(500);

    // Wait for dropdown menu
    await page.waitForSelector('.q-menu', { timeout: 5000 });

    // Get all assignee options
    const options = page.locator('.q-menu .q-item');
    const optionCount = await options.count();
    console.log(`Found ${optionCount} assignee options`);

    // Find and select a valid user
    let selectedAssigneeName = '';
    let selectedAssigneeId = '';
    let optionSelected = false;

    for (let i = 0; i < optionCount; i++) {
      const optionText = await options.nth(i).textContent();
      if (optionText &&
          optionText !== 'None' &&
          optionText !== 'Unassigned' &&
          optionText !== 'All Assignees') {
        selectedAssigneeName = optionText.trim();
        console.log(`========================================`);
        console.log(`Step 5: Selecting assignee: ${selectedAssigneeName}`);
        console.log(`========================================`);
        await options.nth(i).click();
        optionSelected = true;
        break;
      }
    }

    expect(optionSelected).toBe(true);
    await page.waitForTimeout(500);

    // Click Apply button
    console.log('========================================');
    console.log('Step 6: Clicking Apply button...');
    console.log('========================================');
    const applyButton = dialog.locator('button:has-text("Apply")');
    await applyButton.click();

    // Wait for dialog to close
    await page.waitForSelector('.q-dialog', { state: 'hidden', timeout: 5000 });

    // Wait for tasks to reload
    console.log('========================================');
    console.log('Step 7: Waiting for tasks to reload...');
    console.log('========================================');
    await page.waitForTimeout(2000);

    // Get filtered task count
    const filteredTaskCount = await page.locator('.task-item').count();
    console.log(`Filtered task count: ${filteredTaskCount}`);

    // Analyze console logs
    console.log('========================================');
    console.log('CONSOLE LOG ANALYSIS');
    console.log('========================================');

    // Check for key log messages
    const applyFiltersLogs = consoleLogs.filter(log => log.text.includes('[TaskList] ✅ Apply filters called with:'));
    const assigneeValueLogs = consoleLogs.filter(log => log.text.includes('[TaskList] 👤 Assignee filter value:'));
    const watcherLogs = consoleLogs.filter(log => log.text.includes('[TaskList] 🔄 Watcher triggered!'));
    const settingFilterLogs = consoleLogs.filter(log => log.text.includes('[TaskList] 🔍 Setting assignee filter:'));
    const finalFiltersLogs = consoleLogs.filter(log => log.text.includes('[TaskList] 📋 Final API filters:'));
    const apiAssigneeLogs = consoleLogs.filter(log => log.text.includes('[useTaskAPI] 👤 Assignee filter detected:'));
    const apiRequestLogs = consoleLogs.filter(log => log.text.includes('[useTaskAPI] API request params:'));
    const apiFetchedLogs = consoleLogs.filter(log => log.text.includes('[useTaskAPI] Fetched'));

    console.log('\n📊 Log Summary:');
    console.log(`✅ Apply filters called: ${applyFiltersLogs.length > 0 ? 'YES' : 'NO'}`);
    if (applyFiltersLogs.length > 0) console.log(`   ${applyFiltersLogs[0].text}`);

    console.log(`👤 Assignee value logged: ${assigneeValueLogs.length > 0 ? 'YES' : 'NO'}`);
    if (assigneeValueLogs.length > 0) console.log(`   ${assigneeValueLogs[0].text}`);

    console.log(`🔄 Watcher triggered: ${watcherLogs.length > 0 ? 'YES' : 'NO'}`);
    if (watcherLogs.length > 0) console.log(`   ${watcherLogs[0].text}`);

    console.log(`🔍 Setting filter logged: ${settingFilterLogs.length > 0 ? 'YES' : 'NO'}`);
    if (settingFilterLogs.length > 0) console.log(`   ${settingFilterLogs[0].text}`);

    console.log(`📋 Final filters logged: ${finalFiltersLogs.length > 0 ? 'YES' : 'NO'}`);
    if (finalFiltersLogs.length > 0) console.log(`   ${finalFiltersLogs[0].text}`);

    console.log(`🔌 API assignee detected: ${apiAssigneeLogs.length > 0 ? 'YES' : 'NO'}`);
    if (apiAssigneeLogs.length > 0) console.log(`   ${apiAssigneeLogs[0].text}`);

    console.log(`📡 API request logged: ${apiRequestLogs.length > 0 ? 'YES' : 'NO'}`);
    if (apiRequestLogs.length > 0) console.log(`   ${apiRequestLogs[0].text}`);

    console.log(`📥 API fetched logged: ${apiFetchedLogs.length > 0 ? 'YES' : 'NO'}`);
    if (apiFetchedLogs.length > 0) console.log(`   ${apiFetchedLogs[apiFetchedLogs.length - 1].text}`);

    console.log('\n📝 All TaskList and useTaskAPI logs:');
    consoleLogs
      .filter(log => log.text.includes('[TaskList]') || log.text.includes('[useTaskAPI]'))
      .forEach(log => console.log(`   [${log.type}] ${log.text}`));

    // Check for errors
    const errors = consoleLogs.filter(log => log.type === 'error');
    if (errors.length > 0) {
      console.log('\n❌ Errors found:');
      errors.forEach(err => console.log(`   ${err.text}`));
    }

    console.log('\n========================================');
    console.log('TEST COMPLETE');
    console.log('========================================');

    // Assertions
    expect(applyFiltersLogs.length).toBeGreaterThan(0);
    expect(watcherLogs.length).toBeGreaterThan(0);
  });
});
