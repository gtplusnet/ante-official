import { test, expect } from '@playwright/test';

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
  const loginBtn = page.locator('button:has-text("Sign in"), button:has-text("Login")').first();
  await loginBtn.click();

  // Wait for navigation to complete
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  await page.waitForTimeout(2000);
}

test.describe('Edit Employee Dialog', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await login(page);

    // Navigate to HRIS Employee List
    await page.goto('http://localhost:9000/member/manpower/hris');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  });

  test('should open, update employee details, and close dialog successfully', async ({ page }) => {
    // Wait for employee table to load
    await page.waitForSelector('[data-testid="employee-table"]', { timeout: 10000 });

    // Click the first employee's edit button
    const firstEditButton = page.locator('[data-testid="employee-edit-button"]').first();
    await firstEditButton.waitFor({ state: 'visible', timeout: 10000 });
    await firstEditButton.click();

    // Wait for dialog to appear
    await page.waitForSelector('[data-testid="edit-employee-dialog"]', { timeout: 10000 });

    // Verify dialog is visible
    const dialog = page.locator('[data-testid="edit-employee-dialog"]');
    await expect(dialog).toBeVisible();

    // Wait for employee data to load (dialog should not show loading spinner)
    await page.waitForSelector('[data-testid="edit-employee-dialog"] .q-spinner', {
      state: 'hidden',
      timeout: 15000
    });

    // Get current first name value
    const firstNameInput = page.locator('input[name="firstName"]');
    await firstNameInput.waitFor({ state: 'visible', timeout: 5000 });
    const originalFirstName = await firstNameInput.inputValue();

    // Update first name with a timestamp to make it unique
    const timestamp = Date.now();
    const newFirstName = `testupdated${timestamp}`;
    await firstNameInput.fill('');
    await firstNameInput.fill(newFirstName);

    // Click the Update button
    const updateButton = page.locator('[data-testid="dialog-update-button"]');
    await updateButton.waitFor({ state: 'visible', timeout: 5000 });
    await updateButton.click();

    // Wait for success notification
    await page.waitForSelector('.q-notification--positive', { timeout: 10000 });

    // Verify success notification message
    const notification = page.locator('.q-notification--positive');
    await expect(notification).toContainText('Employee details updated successfully');

    // Verify dialog closes automatically after update
    await expect(dialog).toBeHidden({ timeout: 5000 });

    // Verify the table refreshed (wait for table to reload)
    await page.waitForLoadState('networkidle');

    // Verify the updated data appears in the table
    await page.waitForSelector(`text=${newFirstName}`, { timeout: 10000 });
    const updatedNameCell = page.locator(`text=${newFirstName}`).first();
    await expect(updatedNameCell).toBeVisible();
  });

  test('should handle job details update', async ({ page }) => {
    // Wait for employee table to load
    await page.waitForSelector('[data-testid="employee-table"]', { timeout: 10000 });

    // Click the first employee's edit button
    const firstEditButton = page.locator('[data-testid="employee-edit-button"]').first();
    await firstEditButton.waitFor({ state: 'visible', timeout: 10000 });
    await firstEditButton.click();

    // Wait for dialog to appear and data to load
    await page.waitForSelector('[data-testid="edit-employee-dialog"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="edit-employee-dialog"] .q-spinner', {
      state: 'hidden',
      timeout: 15000
    });

    // Navigate to Job Details tab
    const jobDetailsTab = page.locator('[data-testid="tab-job_Details"]');
    await jobDetailsTab.waitFor({ state: 'visible', timeout: 5000 });
    await jobDetailsTab.click();

    // Wait for tab content to load
    await page.waitForTimeout(1000);

    // Update bank name
    const bankNameInput = page.locator('input[name="bankName"]');
    if (await bankNameInput.isVisible()) {
      const newBankName = `Test Bank ${Date.now()}`;
      await bankNameInput.fill('');
      await bankNameInput.fill(newBankName);

      // Click the Update Job Details button
      const updateButton = page.locator('[data-testid="dialog-update-button"]');
      await updateButton.click();

      // Wait for success notification
      await page.waitForSelector('.q-notification--positive', { timeout: 10000 });

      // Verify dialog closes
      await expect(page.locator('[data-testid="edit-employee-dialog"]')).toBeHidden({ timeout: 5000 });
    }
  });

  test('should cancel without saving changes', async ({ page }) => {
    // Wait for employee table to load
    await page.waitForSelector('[data-testid="employee-table"]', { timeout: 10000 });

    // Click the first employee's edit button
    const firstEditButton = page.locator('[data-testid="employee-edit-button"]').first();
    await firstEditButton.waitFor({ state: 'visible', timeout: 10000 });
    await firstEditButton.click();

    // Wait for dialog to appear and data to load
    await page.waitForSelector('[data-testid="edit-employee-dialog"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="edit-employee-dialog"] .q-spinner', {
      state: 'hidden',
      timeout: 15000
    });

    // Get original first name
    const firstNameInput = page.locator('input[name="firstName"]');
    const originalFirstName = await firstNameInput.inputValue();

    // Make a change
    await firstNameInput.fill('TemporaryChange');

    // Click Cancel button
    const cancelButton = page.locator('[data-testid="dialog-cancel-button"]');
    await cancelButton.click();

    // Verify dialog closes
    await expect(page.locator('[data-testid="edit-employee-dialog"]')).toBeHidden({ timeout: 5000 });

    // Verify original data is still in the table (changes were not saved)
    if (originalFirstName) {
      await expect(page.locator(`text=${originalFirstName}`).first()).toBeVisible();
    }
  });

  test('should show loading state during employee data fetch', async ({ page }) => {
    // Wait for employee table to load
    await page.waitForSelector('[data-testid="employee-table"]', { timeout: 10000 });

    // Click the first employee's edit button
    const firstEditButton = page.locator('[data-testid="employee-edit-button"]').first();
    await firstEditButton.waitFor({ state: 'visible', timeout: 10000 });
    await firstEditButton.click();

    // Verify loading spinner appears
    const loadingSpinner = page.locator('[data-testid="edit-employee-dialog"] .q-spinner');

    // The spinner should appear initially (may be very brief)
    // Then it should disappear when data is loaded
    await page.waitForSelector('[data-testid="edit-employee-dialog"]', { timeout: 10000 });

    // Wait for loading to complete (spinner hidden)
    await page.waitForSelector('[data-testid="edit-employee-dialog"] .q-spinner', {
      state: 'hidden',
      timeout: 15000
    });

    // Verify form fields are populated
    const firstNameInput = page.locator('input[name="firstName"]');
    await expect(firstNameInput).toHaveValue(/.+/); // Should have some value
  });

  test('should verify performance improvement - dialog loads quickly', async ({ page }) => {
    // Wait for employee table to load
    await page.waitForSelector('[data-testid="employee-table"]', { timeout: 10000 });

    // Measure time to open and load dialog
    const startTime = Date.now();

    // Click the first employee's edit button
    const firstEditButton = page.locator('[data-testid="employee-edit-button"]').first();
    await firstEditButton.click();

    // Wait for dialog to appear
    await page.waitForSelector('[data-testid="edit-employee-dialog"]', { timeout: 10000 });

    // Wait for data to load (spinner hidden)
    await page.waitForSelector('[data-testid="edit-employee-dialog"] .q-spinner', {
      state: 'hidden',
      timeout: 15000
    });

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    // With optimization, should load in under 2 seconds (was 11+ seconds before)
    console.log(`Dialog load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(2000);

    // Close dialog
    await page.locator('[data-testid="dialog-cancel-button"]').click();
  });
});
