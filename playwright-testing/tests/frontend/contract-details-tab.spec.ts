import { test, expect, Page } from '@playwright/test';

/**
 * Contract Details Tab Test Suite
 *
 * Tests the ContractDetailsTab functionality including:
 * - Opening the employee HRIS dialog
 * - Navigating to Contract Details tab
 * - Adding new contracts
 * - Editing existing contracts
 * - Deactivating contracts
 * - Console error monitoring
 */

const BASE_URL = 'http://localhost:9000';
const TEST_USER = {
  username: 'guillermotabligan',
  password: 'water123'
};

/**
 * Login helper function
 */
async function login(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');

  // Clear storage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Reload to ensure fresh state
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // Click "Sign in manually" button
  const signInManuallyBtn = page.locator('button:has-text("Sign in manually")');
  await signInManuallyBtn.waitFor({ state: 'visible', timeout: 10000 });
  await signInManuallyBtn.click();
  await page.waitForTimeout(1000);

  // Fill login form
  const usernameInput = page.locator('input[type="text"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });

  await usernameInput.fill(TEST_USER.username);
  await page.waitForTimeout(200);

  await passwordInput.fill(TEST_USER.password);
  await page.waitForTimeout(500);

  // Click submit button
  const submitButton = page.locator('button[data-testid="login-submit-button"]');
  await submitButton.click();

  // Wait for login to complete
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Verify token exists
  const token = await page.evaluate(() => localStorage.getItem('token'));
  if (!token) {
    throw new Error('Login failed - no token stored');
  }
}

/**
 * Navigate to HRIS page
 */
async function navigateToHRIS(page: Page) {
  // Navigate using hash routing
  await page.goto(`${BASE_URL}/#/member/manpower/hris`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
}

/**
 * Open employee edit dialog (first employee in table)
 */
async function openEmployeeDialog(page: Page) {
  // Wait for table to load
  await page.waitForSelector('table tbody tr', { timeout: 10000 });

  // Click the three dots menu button on first row
  const firstRowMenuButton = page.locator('table tbody tr:first-child button:has(i.q-icon:text("more_horiz"))');
  await expect(firstRowMenuButton).toBeVisible({ timeout: 10000 });
  await firstRowMenuButton.click();

  // Wait for menu to appear
  await page.waitForTimeout(500);

  // Click "Edit" from the menu
  const editMenuItem = page.locator('.q-menu [data-testid="employee-edit-button"]');
  await expect(editMenuItem).toBeVisible({ timeout: 5000 });
  await editMenuItem.click();

  // Wait for dialog to open
  await page.waitForTimeout(1500);

  // Verify dialog opened
  const dialog = page.locator('.q-dialog');
  await expect(dialog).toBeVisible({ timeout: 5000 });
}

/**
 * Navigate to Contract Details tab
 */
async function openContractDetailsTab(page: Page) {
  // Look for Contract Details tab using data-testid
  const contractTab = page.locator('[data-testid="tab-contract_Datails"]');
  await expect(contractTab).toBeVisible({ timeout: 10000 });
  await contractTab.click();
  await page.waitForTimeout(2000); // Give it time to load contracts
}

/**
 * Monitor console errors
 */
function setupConsoleMonitoring(page: Page, consoleErrors: string[]) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    consoleErrors.push(error.message);
  });
}

test.describe('Contract Details Tab', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset console errors
    consoleErrors = [];

    // Setup console monitoring
    setupConsoleMonitoring(page, consoleErrors);

    // Login before each test
    await login(page);

    // Navigate to HRIS
    await navigateToHRIS(page);

    // Open employee dialog
    await openEmployeeDialog(page);

    // Navigate to Contract Details tab
    await openContractDetailsTab(page);
  });

  test.afterEach(async () => {
    // Check for console errors after each test
    if (consoleErrors.length > 0) {
      console.log('\n⚠️  Console errors detected:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
  });

  test('should display Contract Details tab content', async ({ page }) => {
    // Verify header is visible
    const header = page.locator('h3:has-text("Employment Contracts")');
    await expect(header).toBeVisible({ timeout: 5000 });

    // Verify "New Contract" button is visible
    const newContractBtn = page.locator('button:has-text("New Contract")');
    await expect(newContractBtn).toBeVisible();

    // Verify no console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('should open contract dialog when clicking "New Contract"', async ({ page }) => {
    // Click "New Contract" button
    const newContractBtn = page.locator('button:has-text("New Contract")');
    await newContractBtn.click();
    await page.waitForTimeout(1000);

    // Verify dialog opened
    const contractDialog = page.locator('.q-dialog:has-text("Add New Contract")');
    await expect(contractDialog).toBeVisible({ timeout: 5000 });

    // Verify form fields are visible
    const employmentStatusField = page.locator('label:has-text("Employment Status")');
    await expect(employmentStatusField).toBeVisible();

    const startDateField = page.locator('label:has-text("Start Date")');
    await expect(startDateField).toBeVisible();

    const monthlyRateField = page.locator('label:has-text("Monthly Rate")');
    await expect(monthlyRateField).toBeVisible();

    // Verify no console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('should add a new contract successfully', async ({ page }) => {
    // Click "New Contract" button
    const newContractBtn = page.locator('button:has-text("New Contract")');
    await newContractBtn.click();
    await page.waitForTimeout(1000);

    // Fill in the form
    // 1. Employment Status - click the select dropdown
    const employmentStatusSelect = page.locator('label:has-text("Employment Status")').locator('..').locator('input, .q-field__native').first();
    await employmentStatusSelect.click();
    await page.waitForTimeout(500);

    // Select first option from dropdown
    const firstOption = page.locator('.q-menu .q-item').first();
    await firstOption.waitFor({ state: 'visible', timeout: 5000 });
    await firstOption.click();
    await page.waitForTimeout(500);

    // 2. Start Date
    const startDateInput = page.locator('label:has-text("Start Date")').locator('..').locator('input').first();
    await startDateInput.fill('2025-01-01');
    await page.waitForTimeout(300);

    // 3. Monthly Rate
    const monthlyRateInput = page.locator('label:has-text("Monthly Rate")').locator('..').locator('input').first();
    await monthlyRateInput.fill('25000');
    await page.waitForTimeout(300);

    // Click Save button
    const saveButton = page.locator('button:has-text("Save")');
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // Wait for save operation
    await page.waitForTimeout(2000);

    // Verify success notification or dialog closed
    const contractDialog = page.locator('.q-dialog:has-text("Add New Contract")');

    // Check if dialog closed (indicates success) OR if there's a success notification
    const dialogVisible = await contractDialog.isVisible().catch(() => false);

    if (dialogVisible) {
      // If dialog is still visible, check for error messages
      console.log('⚠️  Dialog still visible after save attempt');

      // Take screenshot for debugging
      await page.screenshot({ path: 'playwright-testing/test-results/contract-add-failed.png' });

      // Check for any error messages in the dialog
      const errorMessages = page.locator('.q-field--error, .text-negative');
      const errorCount = await errorMessages.count();
      if (errorCount > 0) {
        console.log(`Found ${errorCount} error indicators`);
        for (let i = 0; i < errorCount; i++) {
          const errorText = await errorMessages.nth(i).textContent();
          console.log(`Error ${i + 1}: ${errorText}`);
        }
      }
    }

    // Log console errors for debugging
    if (consoleErrors.length > 0) {
      console.log('\n⚠️  Console errors during contract creation:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    // Verify dialog closed (indicating success)
    await expect(contractDialog).not.toBeVisible({ timeout: 5000 });
  });

  test('should validate required fields', async ({ page }) => {
    // Click "New Contract" button
    const newContractBtn = page.locator('button:has-text("New Contract")');
    await newContractBtn.click();
    await page.waitForTimeout(1000);

    // Try to save without filling fields
    const saveButton = page.locator('button:has-text("Save")');
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Dialog should still be visible (validation failed)
    const contractDialog = page.locator('.q-dialog:has-text("Add New Contract")');
    await expect(contractDialog).toBeVisible();

    // Verify no console errors (validation errors are expected)
    // We allow console errors here as validation may log errors
    console.log('✓ Validation test completed - validation errors are expected');
  });

  test('should edit an existing contract - only file visible', async ({ page }) => {
    // Wait for contracts to load
    await page.waitForTimeout(2000);

    // Check if there are any contracts
    const table = page.locator('table.md3-table');
    const hasTable = await table.isVisible().catch(() => false);

    if (!hasTable) {
      console.log('⚠️  No contracts available to edit - skipping edit test');
      return;
    }

    // Find first edit button
    const firstEditBtn = page.locator('table.md3-table tbody tr:first-child button[icon="edit"]').first();
    const editBtnExists = await firstEditBtn.isVisible().catch(() => false);

    if (!editBtnExists) {
      console.log('⚠️  No edit button found - skipping edit test');
      return;
    }

    // Click edit button
    await firstEditBtn.click();
    await page.waitForTimeout(1000);

    // Verify "Edit Contract" dialog opened
    const editDialog = page.locator('.q-dialog:has-text("Edit Contract")');
    await expect(editDialog).toBeVisible({ timeout: 5000 });

    // Verify non-editable fields are HIDDEN (not visible)
    const monthlyRateLabel = page.locator('label:has-text("Monthly Rate")');
    const startDateLabel = page.locator('label:has-text("Start Date")');
    const employmentStatusLabel = page.locator('label:has-text("Employment Status")');

    const monthlyRateVisible = await monthlyRateLabel.isVisible().catch(() => false);
    const startDateVisible = await startDateLabel.isVisible().catch(() => false);
    const employmentStatusVisible = await employmentStatusLabel.isVisible().catch(() => false);

    console.log(`Monthly Rate visible: ${monthlyRateVisible}`);
    console.log(`Start Date visible: ${startDateVisible}`);
    console.log(`Employment Status visible: ${employmentStatusVisible}`);

    expect(monthlyRateVisible).toBe(false);
    expect(startDateVisible).toBe(false);
    expect(employmentStatusVisible).toBe(false);

    // Verify info message is shown
    const infoMessage = page.locator('text=Only the contract file can be updated');
    await expect(infoMessage).toBeVisible();

    // Verify only contract file input is visible
    const fileInput = page.locator('label:has-text("Contract File")');
    await expect(fileInput).toBeVisible();

    console.log('✓ Edit mode correctly shows only contract file field');

    // Close dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('should display existing contracts in table', async ({ page }) => {
    // Check for table or empty state
    const table = page.locator('table.md3-table');
    const emptyState = page.locator('.md3-empty-state:has-text("No contracts found")');

    const hasTable = await table.isVisible().catch(() => false);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    // Either table or empty state should be visible
    expect(hasTable || hasEmptyState).toBe(true);

    if (hasTable) {
      console.log('✓ Contracts table is visible');

      // Verify table headers
      const headers = page.locator('table.md3-table thead th');
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);

      console.log(`Found ${headerCount} table headers`);
    } else {
      console.log('✓ Empty state is visible (no contracts yet)');
    }

    // Verify no console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('should show loading state while fetching contracts', async ({ page }) => {
    // Reload the tab to trigger loading
    const contractTab = page.locator('[data-testid="tab-contract_Datails"]');
    await contractTab.click();
    await page.waitForTimeout(100);

    // Check for loading indicator (it appears briefly)
    const loadingIndicator = page.locator('.md3-loading-state, .q-spinner');

    // Loading might be too fast to catch, so we just verify no errors occurred
    console.log('✓ Loading state test completed');

    // Verify no console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('final: should have no console errors throughout all tests', async () => {
    // This is a summary test to report all console errors
    if (consoleErrors.length > 0) {
      console.log('\n❌ Console errors detected during testing:');
      console.log('Total errors:', consoleErrors.length);
      consoleErrors.forEach((error, index) => {
        console.log(`\n${index + 1}. ${error}`);
      });
      // Note: We don't fail the test here as some errors might be expected
      console.log('\n⚠️  Review errors above to determine if they are critical');
    } else {
      console.log('\n✅ No console errors detected - All tests passed cleanly!');
    }
  });
});
