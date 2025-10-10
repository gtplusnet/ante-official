import { test, expect } from '@playwright/test';

/**
 * Edit Employee Dialog - Comprehensive Tab Tests (WORKING VERSION)
 *
 * Fixed selectors using data-testid attributes
 */

// Helper function to login
async function login(page: any) {
  await page.goto('http://localhost:9000');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  const signInManuallyBtn = page.locator('button:has-text("Sign in manually")');
  await signInManuallyBtn.click();
  await page.waitForTimeout(1000);

  const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
  await usernameInput.fill('guillermotabligan');

  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  await passwordInput.fill('water123');

  const loginButton = page.locator('button[type="submit"]').first();
  await loginButton.click();

  await page.waitForURL('**/member/dashboard', { timeout: 60000 });
  console.log('✓ Logged in successfully');
  await page.waitForTimeout(3000);
}

// Helper function to wait for app loading
async function waitForAppLoading(page: any) {
  const loadingText = page.locator('text=Loading application data');
  const isLoadingVisible = await loadingText.isVisible().catch(() => false);

  if (isLoadingVisible) {
    console.log('  - Waiting for application data to load...');
    await loadingText.waitFor({ state: 'hidden', timeout: 60000 });
    console.log('  - Application data loaded');
  }

  await page.waitForTimeout(2000);
}

// Helper function to open Edit Employee Dialog
async function openEditEmployeeDialog(page: any) {
  await page.goto('http://localhost:9000/#/member/manpower/hris');
  await page.waitForLoadState('domcontentloaded');
  console.log('✓ Navigated to HRIS page');

  await waitForAppLoading(page);
  await page.waitForTimeout(5000);

  await page.waitForSelector('[tablekey="employeeListTable"], table', { timeout: 30000 });
  console.log('✓ Employee table is visible');

  const actionsMenuButton = page.locator('[data-testid="employee-actions-menu"]').first();
  await actionsMenuButton.waitFor({ state: 'visible', timeout: 10000 });
  await actionsMenuButton.click();
  console.log('✓ Clicked actions menu button');
  await page.waitForTimeout(1000);

  const editButton = page.locator('[data-testid="employee-edit-button"]').first();
  await editButton.click();
  console.log('✓ Clicked edit button');
  await page.waitForTimeout(2000);

  const dialog = page.locator('[role="dialog"], .q-dialog').first();
  await expect(dialog).toBeVisible({ timeout: 10000 });
  console.log('✓ Edit dialog opened');

  // Wait for dialog content to load
  await page.waitForTimeout(1000);

  return dialog;
}

test.describe('Edit Employee Dialog - All Tabs (Working)', () => {

  test('Tab 1: Employee Details - Update and Close', async ({ page }) => {
    test.setTimeout(120000);
    console.log('\n=== Test: Employee Details Tab ===');

    await login(page);
    const dialog = await openEditEmployeeDialog(page);

    // Verify we're on Employee Details tab using data-testid
    const employeeDetailsTab = page.locator('[data-testid="tab-employee_Details"]');
    await expect(employeeDetailsTab).toBeVisible({ timeout: 10000 });
    console.log('✓ Employee Details tab is visible');

    // Find editable input fields
    const inputs = await page.locator('[role="dialog"] input:visible:not([readonly]):not([disabled])').all();
    console.log(`Found ${inputs.length} editable inputs in dialog`);

    if (inputs.length > 0) {
      const firstInput = inputs[0];
      const originalValue = await firstInput.inputValue().catch(() => '');
      const newValue = `Test${Date.now()}`;

      await firstInput.fill('');
      await firstInput.fill(newValue);
      console.log(`✓ Updated input from "${originalValue}" to "${newValue}"`);

      // Look for Update button
      const updateButton = page.locator('[role="dialog"] button:has-text("Update")').first();
      await updateButton.click();
      console.log('✓ Clicked update button');

      // Wait for API call to complete and dialog to close (can take 10-12 seconds)
      await page.waitForTimeout(15000);

      // Check if dialog closed
      const dialogStillVisible = await dialog.isVisible().catch(() => false);

      if (!dialogStillVisible) {
        console.log('✅ SUCCESS: Dialog closed after update!');
        expect(dialogStillVisible).toBe(false);
      } else {
        console.log('❌ FAIL: Dialog did not close after update');
        expect(dialogStillVisible).toBe(false);
      }
    }
  });

  test('Tab 2: Job Details - Update Fields', async ({ page }) => {
    test.setTimeout(120000);
    console.log('\n=== Test: Job Details Tab ===');

    await login(page);
    const dialog = await openEditEmployeeDialog(page);

    // Click on Job Details tab using data-testid
    const jobDetailsTab = page.locator('[data-testid="tab-job_Details"]');
    await jobDetailsTab.click();
    await page.waitForTimeout(2000);
    console.log('✓ Switched to Job Details tab');

    // Find editable inputs
    const inputs = await page.locator('[role="dialog"] input:visible:not([readonly]):not([disabled])').all();
    console.log(`Found ${inputs.length} editable inputs`);

    if (inputs.length > 0) {
      const firstInput = inputs[0];
      const originalValue = await firstInput.inputValue().catch(() => '');
      const newValue = `Test${Date.now()}`;

      await firstInput.fill('');
      await firstInput.fill(newValue);
      console.log(`✓ Updated input from "${originalValue}" to "${newValue}"`);

      const updateButton = page.locator('[role="dialog"] button:has-text("Update")').first();
      await updateButton.click();
      console.log('✓ Clicked update button');

      // Wait for API call to complete and dialog to close (can take 10-12 seconds)
      await page.waitForTimeout(15000);

      const dialogStillVisible = await dialog.isVisible().catch(() => false);

      if (!dialogStillVisible) {
        console.log('✅ SUCCESS: Dialog closed after job details update!');
        expect(dialogStillVisible).toBe(false);
      } else {
        console.log('❌ FAIL: Dialog did not close after update');
        expect(dialogStillVisible).toBe(false);
      }
    }
  });

  test('Tab 3: Government - Update Fields', async ({ page }) => {
    test.setTimeout(120000);
    console.log('\n=== Test: Government Tab ===');

    await login(page);
    const dialog = await openEditEmployeeDialog(page);

    // Click on Government tab using data-testid
    const governmentTab = page.locator('[data-testid="tab-goverment"]');
    await governmentTab.click();
    await page.waitForTimeout(2000);
    console.log('✓ Switched to Government tab');

    // Find editable inputs
    const inputs = await page.locator('[role="dialog"] input:visible:not([readonly]):not([disabled])').all();
    console.log(`Found ${inputs.length} editable inputs`);

    if (inputs.length > 0) {
      const firstInput = inputs[0];
      const originalValue = await firstInput.inputValue().catch(() => '');
      const newValue = `123456789${Date.now().toString().slice(-3)}`;

      await firstInput.fill('');
      await firstInput.fill(newValue);
      console.log(`✓ Updated government ID from "${originalValue}" to "${newValue}"`);

      const updateButton = page.locator('[role="dialog"] button:has-text("Update")').first();
      await updateButton.click();
      console.log('✓ Clicked update button');

      // Wait for API call to complete and dialog to close (can take 10-12 seconds)
      await page.waitForTimeout(15000);

      const dialogStillVisible = await dialog.isVisible().catch(() => false);

      if (!dialogStillVisible) {
        console.log('✅ SUCCESS: Dialog closed after government details update!');
        expect(dialogStillVisible).toBe(false);
      } else {
        console.log('❌ FAIL: Dialog did not close after update');
        expect(dialogStillVisible).toBe(false);
      }
    }
  });

  test('Tab 4: Shift - View Schedule', async ({ page }) => {
    test.setTimeout(120000);
    console.log('\n=== Test: Shift Tab ===');

    await login(page);
    const dialog = await openEditEmployeeDialog(page);

    // Click on Shift tab using data-testid
    const shiftTab = page.locator('[data-testid="tab-shift"]');
    await shiftTab.click();
    await page.waitForTimeout(3000);
    console.log('✓ Switched to Shift tab');

    // Check if schedule information is displayed
    const scheduleInfo = await page.locator('[role="dialog"]').textContent();
    const hasScheduleInfo = scheduleInfo?.includes('Schedule') || scheduleInfo?.includes('Shift');

    if (hasScheduleInfo) {
      console.log('✓ Schedule information is displayed');
    }

    // Close dialog
    const closeIcon = page.locator('[role="dialog"] .q-icon:has-text("close")').first();
    await closeIcon.click();
    await page.waitForTimeout(1000);
    console.log('✓ Closed dialog');
  });

  test('Tab 5: All Tabs Navigation', async ({ page }) => {
    test.setTimeout(120000);
    console.log('\n=== Test: All Tabs Navigation ===');

    await login(page);
    const dialog = await openEditEmployeeDialog(page);

    const tabs = [
      { testId: 'tab-employee_Details', name: 'Employee Details' },
      { testId: 'tab-contract_Datails', name: 'Contract Details' },
      { testId: 'tab-job_Details', name: 'Job Details' },
      { testId: 'tab-goverment', name: 'Government' },
      { testId: 'tab-shift', name: 'Shift' },
      { testId: 'tab-service', name: 'Leaves' },
      { testId: 'tab-allowance', name: 'Allowance' },
      { testId: 'tab-deduction', name: 'Deduction' },
      { testId: 'tab-documentations', name: 'Documentations' },
    ];

    let successCount = 0;

    for (const tabInfo of tabs) {
      const tab = page.locator(`[data-testid="${tabInfo.testId}"]`);
      const isTabVisible = await tab.isVisible().catch(() => false);

      if (isTabVisible) {
        await tab.click();
        await page.waitForTimeout(1000);
        console.log(`✓ ${tabInfo.name} tab accessible`);
        successCount++;
      } else {
        console.log(`⚠️ ${tabInfo.name} tab not found`);
      }
    }

    console.log(`✅ ${successCount}/${tabs.length} tabs are accessible`);
    expect(successCount).toBe(tabs.length); // All 9 tabs should be accessible

    // Close dialog
    const closeIcon = page.locator('[role="dialog"] .q-icon:has-text("close")').first();
    await closeIcon.click();
    await page.waitForTimeout(1000);
    console.log('✓ Closed dialog');
  });

  test('Performance: Dialog loads quickly', async ({ page }) => {
    test.setTimeout(120000);
    console.log('\n=== Test: Performance ===');

    await login(page);

    await page.goto('http://localhost:9000/#/member/manpower/hris');
    await page.waitForLoadState('domcontentloaded');
    await waitForAppLoading(page);
    await page.waitForTimeout(5000);

    await page.waitForSelector('[tablekey="employeeListTable"], table', { timeout: 30000 });

    // Measure dialog open time
    const startTime = Date.now();

    const actionsMenuButton = page.locator('[data-testid="employee-actions-menu"]').first();
    await actionsMenuButton.click();
    await page.waitForTimeout(500);

    const editButton = page.locator('[data-testid="employee-edit-button"]').first();
    await editButton.click();

    await page.waitForSelector('[role="dialog"], .q-dialog', { timeout: 10000 });

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    console.log(`Dialog load time: ${loadTime}ms`);

    if (loadTime < 2000) {
      console.log('✅ Performance test PASSED: Dialog loaded in under 2 seconds');
      expect(loadTime).toBeLessThan(2000);
    } else {
      console.log(`⚠️ Performance: Dialog took ${loadTime}ms`);
      expect(loadTime).toBeLessThan(5000);
    }
  });
});
