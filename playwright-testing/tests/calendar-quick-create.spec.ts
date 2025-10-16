import { test, expect, Page } from '@playwright/test';

// Test credentials
const TEST_USER = {
  username: 'guillermotabligan',
  password: 'water123'
};

const BASE_URL = 'http://localhost:9000';

// Helper function to login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/#/login`);
  await page.fill('input[type="text"]', TEST_USER.username);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/#\/member\/dashboard/, { timeout: 10000 });
}

// Helper function to navigate to calendar
async function navigateToCalendar(page: Page) {
  await page.goto(`${BASE_URL}/#/member/manpower/calendar`);
  await page.waitForSelector('.calendar-page', { timeout: 10000 });
}

// Helper function to collect console errors
function setupConsoleErrorListener(page: Page): string[] {
  const consoleErrors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push(`Page Error: ${error.message}`);
  });

  return consoleErrors;
}

test.describe('Calendar Quick Create Popover', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToCalendar(page);
  });

  test('should open Quick Create popover when clicking Create button in toolbar', async ({ page }) => {
    const consoleErrors = setupConsoleErrorListener(page);

    // Click the Create button in toolbar
    await page.click('.calendar-toolbar .create-btn');

    // Wait for Quick Create popover to appear
    const popover = await page.waitForSelector('.q-menu', { timeout: 5000 });
    expect(popover).toBeTruthy();

    // Verify Quick Create content is visible
    const titleInput = await page.waitForSelector('input[label="Event title *"]', { timeout: 2000 });
    expect(titleInput).toBeTruthy();

    // Check for console errors
    expect(consoleErrors).toEqual([]);
  });

  test('should open Quick Create popover when clicking Create button in sidebar', async ({ page }) => {
    const consoleErrors = setupConsoleErrorListener(page);

    // Click the Create button in sidebar
    await page.click('.calendar-sidebar .create-btn-sidebar');

    // Wait for Quick Create popover to appear
    const popover = await page.waitForSelector('.q-menu', { timeout: 5000 });
    expect(popover).toBeTruthy();

    // Verify Quick Create content is visible
    const titleInput = await page.waitForSelector('input[label="Event title *"]', { timeout: 2000 });
    expect(titleInput).toBeTruthy();

    // Check for console errors
    expect(consoleErrors).toEqual([]);
  });

  test('should open Quick Create popover with Shift+C keyboard shortcut', async ({ page }) => {
    const consoleErrors = setupConsoleErrorListener(page);

    // Press Shift+C
    await page.keyboard.press('Shift+KeyC');

    // Wait for Quick Create popover to appear
    const popover = await page.waitForSelector('.q-menu', { timeout: 5000 });
    expect(popover).toBeTruthy();

    // Check for console errors
    expect(consoleErrors).toEqual([]);
  });

  test('should create event from Quick Create popover', async ({ page }) => {
    const consoleErrors = setupConsoleErrorListener(page);

    // Open Quick Create
    await page.click('.calendar-toolbar .create-btn');
    await page.waitForSelector('.q-menu', { timeout: 5000 });

    // Fill in event details
    await page.fill('input[label="Event title *"]', 'Test Quick Event');

    // Set date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await page.fill('input[type="date"]', tomorrowStr);

    // Set time
    await page.fill('input[type="time"]', '14:00');

    // Click Create button
    await page.click('button[type="submit"]:has-text("Create")');

    // Wait for success notification
    await page.waitForSelector('.q-notification--positive', { timeout: 5000 });

    // Verify popover closed
    const popover = await page.locator('.q-menu').count();
    expect(popover).toBe(0);

    // Check for console errors
    expect(consoleErrors).toEqual([]);
  });

  test('should open full dialog when clicking "More options"', async ({ page }) => {
    const consoleErrors = setupConsoleErrorListener(page);

    // Open Quick Create
    await page.click('.calendar-toolbar .create-btn');
    await page.waitForSelector('.q-menu', { timeout: 5000 });

    // Fill in some data
    await page.fill('input[label="Event title *"]', 'Test Event with Options');

    // Click "More options" button
    await page.click('button:has-text("More options")');

    // Wait for full dialog to appear
    const dialog = await page.waitForSelector('.event-dialog', { timeout: 5000 });
    expect(dialog).toBeTruthy();

    // Verify popover is closed
    const popover = await page.locator('.q-menu').count();
    expect(popover).toBe(0);

    // Verify title was prefilled
    const titleValue = await page.inputValue('.event-dialog input[label="Title"]');
    expect(titleValue).toBe('Test Event with Options');

    // Check for console errors
    expect(consoleErrors).toEqual([]);
  });

  test('should close Quick Create when pressing ESC', async ({ page }) => {
    const consoleErrors = setupConsoleErrorListener(page);

    // Open Quick Create
    await page.keyboard.press('Shift+KeyC');
    await page.waitForSelector('.q-menu', { timeout: 5000 });

    // Press ESC
    await page.keyboard.press('Escape');

    // Verify popover closed
    await page.waitForTimeout(500);
    const popover = await page.locator('.q-menu').count();
    expect(popover).toBe(0);

    // Check for console errors
    expect(consoleErrors).toEqual([]);
  });

  test('should NOT open multiple dialogs simultaneously', async ({ page }) => {
    const consoleErrors = setupConsoleErrorListener(page);

    // Click Create button
    await page.click('.calendar-toolbar .create-btn');
    await page.waitForTimeout(1000);

    // Count visible dialogs/popovers
    const popoverCount = await page.locator('.q-menu').count();
    const dialogCount = await page.locator('.q-dialog').count();

    // Should have exactly 1 popover and 0 dialogs
    expect(popoverCount).toBe(1);
    expect(dialogCount).toBe(0);

    // Check for console errors
    expect(consoleErrors).toEqual([]);
  });

  test('should validate required fields', async ({ page }) => {
    const consoleErrors = setupConsoleErrorListener(page);

    // Open Quick Create
    await page.click('.calendar-toolbar .create-btn');
    await page.waitForSelector('.q-menu', { timeout: 5000 });

    // Try to submit without title
    await page.click('button[type="submit"]:has-text("Create")');

    // Should show validation error notification
    await page.waitForSelector('.q-notification--negative', { timeout: 5000 });

    // Popover should still be open
    const popover = await page.locator('.q-menu').count();
    expect(popover).toBe(1);

    // Check for console errors
    expect(consoleErrors).toEqual([]);
  });
});

test.describe('Calendar Event Creation - Full Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToCalendar(page);
  });

  test('should create event with all fields from full dialog', async ({ page }) => {
    const consoleErrors = setupConsoleErrorListener(page);

    // Open Quick Create
    await page.click('.calendar-toolbar .create-btn');
    await page.waitForSelector('.q-menu', { timeout: 5000 });

    // Fill initial data
    await page.fill('input[label="Event title *"]', 'Comprehensive Test Event');

    // Click More options
    await page.click('button:has-text("More options")');
    await page.waitForSelector('.event-dialog', { timeout: 5000 });

    // Fill in additional fields
    await page.fill('textarea[label="Description"]', 'This is a test event description');
    await page.fill('input[label="Location"]', 'Test Location');

    // Expand Advanced Options
    const advancedOptions = await page.locator('.advanced-options');
    if (await advancedOptions.count() > 0) {
      await advancedOptions.click();
    }

    // Click Save/Create button in dialog
    await page.click('.dialog-actions button:has-text("Create")');

    // Wait for success notification
    await page.waitForSelector('.q-notification--positive', { timeout: 5000 });

    // Verify dialog closed
    await page.waitForTimeout(500);
    const dialogCount = await page.locator('.q-dialog').count();
    expect(dialogCount).toBe(0);

    // Check for console errors
    expect(consoleErrors).toEqual([]);
  });
});
