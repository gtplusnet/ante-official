import { test, expect } from '@playwright/test';

test.describe('Task Due Date Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:9000');

    // Click "Sign in manually" button to show login form
    await page.click('button:has-text("Sign in manually")');

    // Wait for login form to appear
    await page.waitForSelector('input[placeholder="Enter your username or email"]', { timeout: 5000 });

    // Login
    await page.fill('input[placeholder="Enter your username or email"]', 'guillermotabligan');
    await page.fill('input[placeholder="Enter your password"]', 'water123');
    await page.click('button:has-text("Sign In")');

    // Wait for navigation to complete
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to tasks page
    await page.click('text=Task');
    await page.waitForURL('**/member/task/**', { timeout: 10000 });

    // Wait for tasks to load
    await page.waitForSelector('text=To do', { timeout: 10000 });
  });

  test('Should open due date picker when clicking on date button', async ({ page }) => {
    // Wait for task rows to load
    await page.waitForSelector('.task-row', { timeout: 10000 });

    // Find first task row
    const firstTask = page.locator('.task-row').first();
    await expect(firstTask).toBeVisible();

    // Click on date button
    const dateButton = firstTask.locator('.date-button').first();
    await dateButton.click();

    // Check that date dropdown is visible
    const dateDropdown = page.locator('.date-dropdown');
    await expect(dateDropdown).toBeVisible({ timeout: 5000 });

    // Verify date picker header is present
    await expect(dateDropdown.locator('.date-picker-header')).toHaveText('Select date');

    // Verify date input is present
    const dateInput = dateDropdown.locator('input[type="date"]');
    await expect(dateInput).toBeVisible();
  });

  test('Should update due date when selecting a date', async ({ page }) => {
    // Wait for task rows to load
    await page.waitForSelector('.task-row', { timeout: 10000 });

    // Find a task with "Set date" text (no date set)
    const taskWithNoDate = page.locator('.task-row').filter({
      has: page.locator('.date-button:has-text("Set date")')
    }).first();

    // If no task without date, use first task
    const taskToUse = await taskWithNoDate.count() > 0 ? taskWithNoDate : page.locator('.task-row').first();
    await expect(taskToUse).toBeVisible();

    // Click on date button
    const dateButton = taskToUse.locator('.date-button').first();
    const initialDateText = await dateButton.textContent();
    console.log('Initial date text:', initialDateText);

    await dateButton.click();

    // Wait for date dropdown to appear
    const dateDropdown = page.locator('.date-dropdown');
    await expect(dateDropdown).toBeVisible({ timeout: 5000 });

    // Select a date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    const dateInput = dateDropdown.locator('input[type="date"]');

    // Use Playwright's fill which automatically triggers the change event
    await dateInput.fill(dateString);

    // Wait for dropdown to close and update to process
    await page.waitForTimeout(1000);

    // Verify dropdown is closed
    await expect(dateDropdown).not.toBeVisible();

    // Verify date was updated
    const updatedDateText = await dateButton.textContent();
    console.log('Updated date text:', updatedDateText);

    // Verify the date changed
    if (initialDateText === 'Set date') {
      // If it was unset, it should now have a date
      expect(updatedDateText).not.toBe('Set date');
    } else {
      // If it had a date, verify it's a valid date format
      expect(updatedDateText).toMatch(/\w+ \d+/); // Matches patterns like "Sep 15"
    }
  });

  test('Should close date picker when clicking outside', async ({ page }) => {
    // Wait for task rows to load
    await page.waitForSelector('.task-row', { timeout: 10000 });

    // Find first task row
    const firstTask = page.locator('.task-row').first();
    await expect(firstTask).toBeVisible();

    // Click on date button to open dropdown
    const dateButton = firstTask.locator('.date-button').first();
    await dateButton.click();

    // Verify date dropdown is visible
    const dateDropdown = page.locator('.date-dropdown');
    await expect(dateDropdown).toBeVisible({ timeout: 5000 });

    // Click outside the dropdown (on the page header for example)
    await page.locator('.task-list-view').click({ position: { x: 10, y: 10 } });

    // Wait a moment for the dropdown to close
    await page.waitForTimeout(500);

    // Verify dropdown is closed
    await expect(dateDropdown).not.toBeVisible();
  });

  test('Should not close date picker when clicking inside it', async ({ page }) => {
    // Wait for task rows to load
    await page.waitForSelector('.task-row', { timeout: 10000 });

    // Find first task row
    const firstTask = page.locator('.task-row').first();
    await expect(firstTask).toBeVisible();

    // Click on date button to open dropdown
    const dateButton = firstTask.locator('.date-button').first();
    await dateButton.click();

    // Verify date dropdown is visible
    const dateDropdown = page.locator('.date-dropdown');
    await expect(dateDropdown).toBeVisible({ timeout: 5000 });

    // Click inside the dropdown (on the header)
    await dateDropdown.locator('.date-picker-header').click();

    // Wait a moment
    await page.waitForTimeout(200);

    // Verify dropdown is still visible
    await expect(dateDropdown).toBeVisible();

    // Click on the date input field
    const dateInput = dateDropdown.locator('input[type="date"]');
    await dateInput.click();

    // Wait a moment
    await page.waitForTimeout(200);

    // Verify dropdown is still visible
    await expect(dateDropdown).toBeVisible();
  });

  test('Should handle multiple task date pickers correctly', async ({ page }) => {
    // Wait for task rows to load
    await page.waitForSelector('.task-row', { timeout: 10000 });

    // Get first and second task rows
    const firstTask = page.locator('.task-row').nth(0);
    const secondTask = page.locator('.task-row').nth(1);

    // Open first task's date picker
    const firstDateButton = firstTask.locator('.date-button').first();
    await firstDateButton.click();

    // Verify first task's dropdown is visible
    let dateDropdown = page.locator('.date-dropdown').first();
    await expect(dateDropdown).toBeVisible({ timeout: 5000 });

    // Close the first dropdown by clicking outside
    await page.locator('.task-list-view').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);

    // Now open second task's date picker
    const secondDateButton = secondTask.locator('.date-button').first();
    await secondDateButton.click();

    // Wait a moment for dropdown to appear
    await page.waitForTimeout(500);

    // Verify only one dropdown is visible
    const dropdownCount = await page.locator('.date-dropdown').count();
    expect(dropdownCount).toBe(1);

    // The dropdown should be visible
    dateDropdown = page.locator('.date-dropdown').first();
    await expect(dateDropdown).toBeVisible();
  });
});