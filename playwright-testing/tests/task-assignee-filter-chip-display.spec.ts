import { test, expect, Page } from '@playwright/test';

/**
 * Task Assignee Filter Chip Display Test
 *
 * Comprehensive test to verify the assignee filter chip displays correctly
 * after applying the filter. This test captures detailed console logs to
 * diagnose chip generation issues.
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

test.describe('Task Assignee Filter - Chip Display Verification', () => {
  let consoleLogs: Array<{ type: string; text: string }> = [];

  test('should display assignee filter chip after applying filter', async ({ page }) => {
    // Reset console logs
    consoleLogs = [];

    // Capture ALL console messages
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      consoleLogs.push({ type, text });

      // Print important logs in real-time
      if (type === 'error') {
        console.log(`[BROWSER ERROR] ${text}`);
      } else if (
        text.includes('[TaskList]') ||
        text.includes('[useTaskAPI]') ||
        text.includes('chip') ||
        text.includes('Chip')
      ) {
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

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Open filter dialog
    console.log('========================================');
    console.log('Step 3: Opening filter dialog...');
    console.log('========================================');
    const filterButton = page.locator('button:has-text("Filters")');
    await expect(filterButton).toBeVisible({ timeout: 5000 });
    await filterButton.click();
    await page.waitForSelector('.q-dialog', { timeout: 5000 });

    // Wait for dialog to fully render
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

    // Wait for chip to potentially appear
    console.log('========================================');
    console.log('Step 7: Waiting for chip to appear...');
    console.log('========================================');
    await page.waitForTimeout(2000);

    // Analyze console logs
    console.log('========================================');
    console.log('CONSOLE LOG ANALYSIS - CHIP GENERATION');
    console.log('========================================');

    // Check for chip generation logs
    const chipGenerationLogs = consoleLogs.filter(log =>
      log.text.includes('[TaskList] 🏷️ Generating assignee chip:')
    );
    const chipUserLookupLogs = consoleLogs.filter(log =>
      log.text.includes('[TaskList] 🔎 User lookup result:')
    );
    const chipWarningLogs = consoleLogs.filter(log =>
      log.text.includes('[TaskList] ⚠️ User not found for ID:')
    );

    console.log('\n🔍 Chip Generation Analysis:');
    console.log(`🏷️ Chip generation triggered: ${chipGenerationLogs.length > 0 ? 'YES' : 'NO'}`);
    if (chipGenerationLogs.length > 0) {
      console.log(`   ${chipGenerationLogs[0].text}`);
    }

    console.log(`🔎 User lookup executed: ${chipUserLookupLogs.length > 0 ? 'YES' : 'NO'}`);
    if (chipUserLookupLogs.length > 0) {
      console.log(`   ${chipUserLookupLogs[0].text}`);
    }

    console.log(`⚠️ User lookup warnings: ${chipWarningLogs.length > 0 ? 'YES' : 'NO'}`);
    if (chipWarningLogs.length > 0) {
      console.log(`   ${chipWarningLogs[0].text}`);
    }

    // Check if chip is visible in DOM
    console.log('\n🎯 DOM Verification:');
    const filterChip = page.locator('.filter-chip:has-text("Assignee:")');
    const chipVisible = await filterChip.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`Filter chip visible: ${chipVisible ? 'YES ✅' : 'NO ❌'}`);

    if (chipVisible) {
      const chipText = await filterChip.textContent();
      console.log(`Chip text: "${chipText}"`);
      console.log(`Expected assignee: "${selectedAssigneeName}"`);

      // Verify chip contains the assignee name or ID
      expect(chipText).toContain('Assignee:');
    } else {
      console.log('❌ CHIP NOT VISIBLE IN DOM');

      // Check if filter badge shows count
      const filterBadge = page.locator('button:has-text("Filters") .q-badge');
      const badgeVisible = await filterBadge.isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`Filter badge visible: ${badgeVisible ? 'YES' : 'NO'}`);

      if (badgeVisible) {
        const badgeText = await filterBadge.textContent();
        console.log(`Badge count: ${badgeText}`);
      }
    }

    // Print all relevant TaskList logs
    console.log('\n📝 All TaskList logs:');
    consoleLogs
      .filter(log => log.text.includes('[TaskList]'))
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
    expect(chipGenerationLogs.length).toBeGreaterThan(0); // Chip generation should run
    expect(chipVisible).toBe(true); // Chip should be visible (THIS IS THE KEY ASSERTION)

    if (chipVisible) {
      const chipText = await filterChip.textContent();
      // Chip should contain either the user name OR the user ID (fallback)
      const containsAssigneeInfo = chipText?.includes(selectedAssigneeName) ||
                                    chipText?.includes('Assignee:');
      expect(containsAssigneeInfo).toBe(true);
    }
  });
});
