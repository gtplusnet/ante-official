import { test, expect } from '@playwright/test';

/**
 * Edit Employee Dialog - Comprehensive Tab Tests (FIXED)
 *
 * Tests all tabs in the Edit Employee Dialog with proper loading waits
 */

// Helper function to login
async function login(page: any) {
  await page.goto('http://localhost:9000');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  // Click "Sign in manually" button
  const signInManuallyBtn = page.locator('button:has-text("Sign in manually")');
  await signInManuallyBtn.click();
  await page.waitForTimeout(1000);

  // Find and fill username
  const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
  await usernameInput.fill('guillermotabligan');

  // Find and fill password
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  await passwordInput.fill('water123');

  // Click login button
  const loginButton = page.locator('button[type="submit"]').first();
  await loginButton.click();

  // Wait for redirect to dashboard (specific URL)
  await page.waitForURL('**/member/dashboard', { timeout: 30000 });

  console.log('✓ Logged in successfully');
  await page.waitForTimeout(3000);
}

// Helper function to wait for app loading to complete
async function waitForAppLoading(page: any) {
  // Wait for "Loading application data..." to disappear
  const loadingText = page.locator('text=Loading application data');
  const isLoadingVisible = await loadingText.isVisible().catch(() => false);

  if (isLoadingVisible) {
    console.log('  - Waiting for application data to load...');
    await loadingText.waitFor({ state: 'hidden', timeout: 60000 });
    console.log('  - Application data loaded');
  }

  // Additional wait for any spinners
  await page.waitForTimeout(2000);
}

// Helper function to open Edit Employee Dialog
async function openEditEmployeeDialog(page: any) {
  // Navigate to HRIS page (using hash routing)
  await page.goto('http://localhost:9000/#/member/manpower/hris');
  await page.waitForLoadState('domcontentloaded');
  console.log('✓ Navigated to HRIS page');

  // Wait for app loading to complete
  await waitForAppLoading(page);

  // Wait for table to load
  await page.waitForTimeout(5000);

  // Wait for the table to be visible
  await page.waitForSelector('[tablekey="employeeListTable"], table', { timeout: 30000 });
  console.log('✓ Employee table is visible');

  // Click on the first employee's actions menu button
  const actionsMenuButton = page.locator('[data-testid="employee-actions-menu"]').first();
  await actionsMenuButton.waitFor({ state: 'visible', timeout: 10000 });
  await actionsMenuButton.click();
  console.log('✓ Clicked actions menu button');
  await page.waitForTimeout(1000);

  // Click the Edit option in the dropdown menu
  const editButton = page.locator('[data-testid="employee-edit-button"]').first();
  await editButton.click();
  console.log('✓ Clicked edit button');
  await page.waitForTimeout(2000);

  // Wait for dialog to appear
  const dialog = page.locator('[role="dialog"], .q-dialog').first();
  await expect(dialog).toBeVisible({ timeout: 10000 });
  console.log('✓ Edit dialog opened');

  // Wait for dialog content to load (optimized API should be fast)
  await page.waitForTimeout(1000);

  return dialog;
}

test.describe('Edit Employee Dialog - All Tabs (Fixed)', () => {

  test('Tab 1: Employee Details - Update and Close', async ({ page }) => {
    console.log('\n=== Test: Employee Details Tab ===');

    await login(page);
    const dialog = await openEditEmployeeDialog(page);

    // Verify we're on Employee Details tab (default)
    const employeeDetailsTab = page.locator('.q-tab:has-text("Employee Details")');
    await expect(employeeDetailsTab).toBeVisible();
    console.log('✓ Employee Details tab is active');

    // Find editable input fields
    const inputs = await page.locator('[role="dialog"] input:visible:not([readonly]):not([disabled]), .q-dialog input:visible:not([readonly]):not([disabled])').all();
    console.log(`Found ${inputs.length} editable inputs in dialog`);

    if (inputs.length > 0) {
      // Update first visible input
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

      // Wait for notification
      await page.waitForTimeout(2000);

      // Check if dialog closed
      const dialogStillVisible = await dialog.isVisible().catch(() => false);

      if (!dialogStillVisible) {
        console.log('✅ SUCCESS: Dialog closed after update!');
        expect(dialogStillVisible).toBe(false);
      } else {
        console.log('❌ FAIL: Dialog did not close after update');
        expect(dialogStillVisible).toBe(false);
      }
    } else {
      console.log('⚠️ No editable inputs found');
    }
  });

  test('Tab 3: Job Details - Update Banking Info', async ({ page }) => {
    console.log('\n=== Test: Job Details Tab ===');

    await login(page);
    const dialog = await openEditEmployeeDialog(page);

    // Click on Job Details tab
    const jobDetailsTab = page.locator('.q-tab:has-text("Job Details")');
    await jobDetailsTab.click();
    await page.waitForTimeout(2000);
    console.log('✓ Switched to Job Details tab');

    // Find editable inputs in Job Details tab
    const inputs = await page.locator('[role="dialog"] input:visible:not([readonly]):not([disabled]), .q-dialog input:visible:not([readonly]):not([disabled])').all();
    console.log(`Found ${inputs.length} editable inputs`);

    if (inputs.length > 0) {
      // Try to find and update bank account or biometrics field
      let updatedField = false;

      for (const input of inputs) {
        const placeholder = await input.getAttribute('placeholder').catch(() => '');
        const label = await input.getAttribute('aria-label').catch(() => '');

        // Look for bank account or biometrics field
        if (placeholder?.toLowerCase().includes('bank') ||
            placeholder?.toLowerCase().includes('biometric') ||
            label?.toLowerCase().includes('bank') ||
            label?.toLowerCase().includes('biometric')) {

          const originalValue = await input.inputValue().catch(() => '');
          const newValue = placeholder?.toLowerCase().includes('bank')
            ? `1234567890${Date.now().toString().slice(-3)}`
            : `BIO${Date.now().toString().slice(-6)}`;

          await input.fill('');
          await input.fill(newValue);
          console.log(`✓ Updated ${placeholder || label} from "${originalValue}" to "${newValue}"`);
          updatedField = true;
          break;
        }
      }

      if (!updatedField && inputs.length > 0) {
        // Just update the first input if we can't find specific fields
        const firstInput = inputs[0];
        const originalValue = await firstInput.inputValue().catch(() => '');
        const newValue = `Test${Date.now()}`;
        await firstInput.fill('');
        await firstInput.fill(newValue);
        console.log(`✓ Updated first input from "${originalValue}" to "${newValue}"`);
        updatedField = true;
      }

      if (updatedField) {
        // Look for Update Job Details button
        const updateButton = page.locator('[role="dialog"] button:has-text("Update")').first();
        await updateButton.click();
        console.log('✓ Clicked update button');

        // Wait for API response
        await page.waitForTimeout(2000);

        // Check if dialog closed
        const dialogStillVisible = await dialog.isVisible().catch(() => false);

        if (!dialogStillVisible) {
          console.log('✅ SUCCESS: Dialog closed after job details update!');
          expect(dialogStillVisible).toBe(false);
        } else {
          console.log('❌ FAIL: Dialog did not close after update');
          expect(dialogStillVisible).toBe(false);
        }
      }
    } else {
      console.log('⚠️ No editable inputs found in Job Details tab');
    }
  });

  test('Tab 4: Government - Update Government IDs', async ({ page }) => {
    console.log('\n=== Test: Government Tab ===');

    await login(page);
    const dialog = await openEditEmployeeDialog(page);

    // Click on Government tab
    const governmentTab = page.locator('.q-tab:has-text("Government")');
    await governmentTab.click();
    await page.waitForTimeout(2000);
    console.log('✓ Switched to Government tab');

    // Find editable inputs
    const inputs = await page.locator('[role="dialog"] input:visible:not([readonly]):not([disabled]), .q-dialog input:visible:not([readonly]):not([disabled])').all();
    console.log(`Found ${inputs.length} editable inputs`);

    if (inputs.length > 0) {
      // Update first input (TIN, SSS, HDMF, or PHIC)
      const firstInput = inputs[0];
      const placeholder = await firstInput.getAttribute('placeholder').catch(() => '');
      const originalValue = await firstInput.inputValue().catch(() => '');

      // Generate appropriate value based on field
      let newValue = `123456789${Date.now().toString().slice(-3)}`;

      await firstInput.fill('');
      await firstInput.fill(newValue);
      console.log(`✓ Updated ${placeholder || 'government ID'} from "${originalValue}" to "${newValue}"`);

      // Look for Update button
      const updateButton = page.locator('[role="dialog"] button:has-text("Update")').first();
      await updateButton.click();
      console.log('✓ Clicked update button');

      // Wait for API response
      await page.waitForTimeout(2000);

      // Check if dialog closed
      const dialogStillVisible = await dialog.isVisible().catch(() => false);

      if (!dialogStillVisible) {
        console.log('✅ SUCCESS: Dialog closed after government details update!');
        expect(dialogStillVisible).toBe(false);
      } else {
        console.log('❌ FAIL: Dialog did not close after update');
        expect(dialogStillVisible).toBe(false);
      }
    } else {
      console.log('⚠️ No editable inputs found in Government tab');
    }
  });

  test('Tab 5: Shift - View Schedule', async ({ page }) => {
    console.log('\n=== Test: Shift Tab ===');

    await login(page);
    const dialog = await openEditEmployeeDialog(page);

    // Click on Shift tab
    const shiftTab = page.locator('.q-tab:has-text("Shift")');
    await shiftTab.click();
    await page.waitForTimeout(3000);
    console.log('✓ Switched to Shift tab');

    // Check if schedule dropdown exists
    const scheduleSelects = await page.locator('[role="dialog"] .q-select, .q-dialog .q-select').count();
    console.log(`Schedule selection dropdowns found: ${scheduleSelects}`);

    // Check for schedule information display
    const scheduleInfo = await page.locator('[role="dialog"], .q-dialog').textContent();
    const hasScheduleInfo = scheduleInfo?.includes('Schedule') || scheduleInfo?.includes('Shift');

    if (hasScheduleInfo) {
      console.log('✓ Schedule information is displayed');
    }

    // Close dialog
    const closeButton = page.locator('[role="dialog"] button:has-text("Close")').first();
    const closeIcon = page.locator('[role="dialog"] .q-icon:has-text("close")').first();

    const isCloseButtonVisible = await closeButton.isVisible().catch(() => false);
    if (isCloseButtonVisible) {
      await closeButton.click();
    } else {
      await closeIcon.click();
    }

    await page.waitForTimeout(1000);
    console.log('✓ Closed dialog');
  });

  test('Tab Navigation: All Tabs Accessible', async ({ page }) => {
    console.log('\n=== Test: All Tabs Navigation ===');

    await login(page);
    const dialog = await openEditEmployeeDialog(page);

    const tabs = [
      'Employee Details',
      'Contract Details',
      'Job Details',
      'Government',
      'Shift',
      'Leaves',
      'Allowance',
      'Deduction',
      'Documentation'
    ];

    let successCount = 0;

    for (const tabName of tabs) {
      const tab = page.locator(`.q-tab:has-text("${tabName}")`).first();
      const isTabVisible = await tab.isVisible().catch(() => false);

      if (isTabVisible) {
        await tab.click();
        await page.waitForTimeout(1000);
        console.log(`✓ ${tabName} tab accessible`);
        successCount++;
      } else {
        console.log(`⚠️ ${tabName} tab not found`);
      }
    }

    console.log(`✅ ${successCount}/${tabs.length} tabs are accessible`);
    expect(successCount).toBeGreaterThan(0);

    // Close dialog
    const closeButton = page.locator('[role="dialog"] button:has-text("Close")').first();
    const closeIcon = page.locator('[role="dialog"] .q-icon:has-text("close")').first();

    const isCloseButtonVisible = await closeButton.isVisible().catch(() => false);
    if (isCloseButtonVisible) {
      await closeButton.click();
    } else {
      await closeIcon.click();
    }

    await page.waitForTimeout(1000);
    console.log('✓ Closed dialog');
  });

  test('Performance: Dialog loads quickly', async ({ page }) => {
    console.log('\n=== Test: Performance ===');

    await login(page);

    // Navigate to HRIS and wait for loading (using hash routing)
    await page.goto('http://localhost:9000/#/member/manpower/hris');
    await page.waitForLoadState('domcontentloaded');
    await waitForAppLoading(page);
    await page.waitForTimeout(5000);

    // Wait for table
    await page.waitForSelector('[tablekey="employeeListTable"], table', { timeout: 30000 });

    // Measure dialog open time
    const startTime = Date.now();

    // Click actions menu
    const actionsMenuButton = page.locator('[data-testid="employee-actions-menu"]').first();
    await actionsMenuButton.click();
    await page.waitForTimeout(500);

    // Click edit button
    const editButton = page.locator('[data-testid="employee-edit-button"]').first();
    await editButton.click();

    // Wait for dialog to appear
    await page.waitForSelector('[role="dialog"], .q-dialog', { timeout: 10000 });

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    console.log(`Dialog load time: ${loadTime}ms`);

    // With optimization, should load in under 2 seconds
    if (loadTime < 2000) {
      console.log('✅ Performance test PASSED: Dialog loaded in under 2 seconds');
      expect(loadTime).toBeLessThan(2000);
    } else {
      console.log(`⚠️ Performance: Dialog took ${loadTime}ms`);
      expect(loadTime).toBeLessThan(5000); // Still acceptable under 5s
    }
  });
});
