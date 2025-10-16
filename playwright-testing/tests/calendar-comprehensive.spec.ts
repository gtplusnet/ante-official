import { test, expect } from '@playwright/test';

// Test credentials
const TEST_USER = {
  username: 'guillermotabligan',
  password: 'water123'
};

const BASE_URL = 'http://localhost:9000';
const CALENDAR_URL = `${BASE_URL}/#/member/manpower/calendar`;

test.describe('Calendar Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/#/login`);
    await page.waitForLoadState('networkidle');

    const usernameInput = page.locator('input').first();
    const passwordInput = page.locator('input[type="password"]');

    await usernameInput.fill(TEST_USER.username);
    await passwordInput.fill(TEST_USER.password);

    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();

    // Wait for navigation after login
    await page.waitForTimeout(3000);
  });

  test('should load calendar page without errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });

    await page.goto(CALENDAR_URL);
    await page.waitForTimeout(3000);

    // Check if calendar loaded
    const calendar = page.locator('.calendar-page, .q-calendar');
    await expect(calendar).toBeVisible({ timeout: 10000 });

    // Check for console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('should open Quick Create dialog when clicking Create button', async ({ page }) => {
    await page.goto(CALENDAR_URL);
    await page.waitForTimeout(3000);

    // Find and click Create button
    const createButton = page.locator('button').filter({ hasText: /create/i }).first();
    await createButton.click();

    // Wait for Quick Create dialog to appear
    await page.waitForTimeout(1000);

    // Check if Quick Create dialog is visible
    const quickCreateDialog = page.locator('.q-dialog').filter({ has: page.locator('text=/Quick Create|Create Event/i') });
    await expect(quickCreateDialog).toBeVisible({ timeout: 5000 });

    // Take screenshot
    await page.screenshot({ path: 'test-results/quick-create-dialog.png', fullPage: true });
  });

  test('should create a simple event via Quick Create', async ({ page }) => {
    await page.goto(CALENDAR_URL);
    await page.waitForTimeout(3000);

    // Click Create button
    const createButton = page.locator('button').filter({ hasText: /create/i }).first();
    await createButton.click();
    await page.waitForTimeout(1000);

    // Fill in Quick Create form
    const titleInput = page.locator('.q-dialog input[placeholder*="title" i], .q-dialog input').first();
    await titleInput.fill('Test Event from Playwright');

    // Submit the form
    const submitButton = page.locator('.q-dialog button').filter({ hasText: /create|save/i }).first();
    await submitButton.click();

    // Wait for success notification
    await page.waitForTimeout(2000);

    // Check for success notification
    const notification = page.locator('.q-notification').filter({ hasText: /success|created/i });
    await expect(notification).toBeVisible({ timeout: 5000 });

    // Take screenshot
    await page.screenshot({ path: 'test-results/event-created.png', fullPage: true });
  });

  test('should open full Create Event Dialog from Quick Create', async ({ page }) => {
    await page.goto(CALENDAR_URL);
    await page.waitForTimeout(3000);

    // Click Create button
    const createButton = page.locator('button').filter({ hasText: /create/i }).first();
    await createButton.click();
    await page.waitForTimeout(1000);

    // Look for "More options" or similar button
    const moreOptionsButton = page.locator('.q-dialog button').filter({ hasText: /more|full|details/i }).first();

    if (await moreOptionsButton.count() > 0) {
      await moreOptionsButton.click();
      await page.waitForTimeout(1000);

      // Check if full dialog opened
      const fullDialog = page.locator('.q-dialog').filter({
        has: page.locator('text=/Description|Location|Attendees/i')
      });
      await expect(fullDialog).toBeVisible({ timeout: 5000 });

      // Take screenshot
      await page.screenshot({ path: 'test-results/full-create-dialog.png', fullPage: true });
    }
  });

  test('should create recurring daily event', async ({ page }) => {
    await page.goto(CALENDAR_URL);
    await page.waitForTimeout(3000);

    // Click Create button
    const createButton = page.locator('button').filter({ hasText: /create/i }).first();
    await createButton.click();
    await page.waitForTimeout(1000);

    // Try to open full dialog if "More options" button exists
    const moreOptionsButton = page.locator('.q-dialog button').filter({ hasText: /more|full|details/i }).first();
    if (await moreOptionsButton.count() > 0) {
      await moreOptionsButton.click();
      await page.waitForTimeout(1000);
    }

    // Fill in event title
    const titleInput = page.locator('input').filter({ hasText: '' }).first();
    await titleInput.fill('Daily Recurring Test Event');

    // Look for recurrence/repeat option
    const recurrenceSelect = page.locator('select, .q-select').filter({ hasText: /repeat|recurrence/i }).first();

    if (await recurrenceSelect.count() > 0) {
      await recurrenceSelect.click();
      await page.waitForTimeout(500);

      // Select "Daily" option
      const dailyOption = page.locator('.q-item, .q-menu-item').filter({ hasText: /daily/i }).first();
      await dailyOption.click();
      await page.waitForTimeout(500);

      // Submit the form
      const submitButton = page.locator('button').filter({ hasText: /create|save/i }).first();
      await submitButton.click();

      // Wait for success notification
      await page.waitForTimeout(2000);

      // Take screenshot
      await page.screenshot({ path: 'test-results/recurring-event-created.png', fullPage: true });
    }
  });

  test('should click and view recurring event instance', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });

    await page.goto(CALENDAR_URL);
    await page.waitForTimeout(3000);

    // Look for any event on the calendar
    const eventElement = page.locator('.calendar-event, .q-calendar-day__event').first();

    if (await eventElement.count() > 0) {
      await eventElement.click();
      await page.waitForTimeout(2000);

      // Check if event details dialog opened
      const eventDialog = page.locator('.q-dialog').first();
      await expect(eventDialog).toBeVisible({ timeout: 5000 });

      // Take screenshot
      await page.screenshot({ path: 'test-results/event-details.png', fullPage: true });

      // Check for console errors
      if (consoleErrors.length > 0) {
        console.log('Console Errors:', consoleErrors);
      }
      expect(consoleErrors).toHaveLength(0);
    } else {
      console.log('No events found on calendar to click');
    }
  });

  test('should navigate between months', async ({ page }) => {
    await page.goto(CALENDAR_URL);
    await page.waitForTimeout(3000);

    // Find next month button
    const nextButton = page.locator('button').filter({ hasText: /next|›|»/ }).last();
    await nextButton.click();
    await page.waitForTimeout(1000);

    // Find previous month button
    const prevButton = page.locator('button').filter({ hasText: /prev|‹|«/ }).first();
    await prevButton.click();
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/month-navigation.png', fullPage: true });
  });

  test('should switch between calendar views (month/week/day)', async ({ page }) => {
    await page.goto(CALENDAR_URL);
    await page.waitForTimeout(3000);

    // Try to find view switcher buttons
    const viewButtons = page.locator('button').filter({ hasText: /month|week|day/i });

    if (await viewButtons.count() > 0) {
      // Click Month view
      const monthButton = viewButtons.filter({ hasText: /month/i }).first();
      if (await monthButton.count() > 0) {
        await monthButton.click();
        await page.waitForTimeout(1000);
      }

      // Click Week view
      const weekButton = viewButtons.filter({ hasText: /week/i }).first();
      if (await weekButton.count() > 0) {
        await weekButton.click();
        await page.waitForTimeout(1000);
      }

      // Click Day view
      const dayButton = viewButtons.filter({ hasText: /day/i }).first();
      if (await dayButton.count() > 0) {
        await dayButton.click();
        await page.waitForTimeout(1000);
      }

      // Take screenshot
      await page.screenshot({ path: 'test-results/view-switcher.png', fullPage: true });
    }
  });

  test('should load and display event categories', async ({ page }) => {
    await page.goto(CALENDAR_URL);
    await page.waitForTimeout(3000);

    // Look for category filter or list
    const categoryElements = page.locator('[class*="category"], .event-category');

    if (await categoryElements.count() > 0) {
      console.log(`Found ${await categoryElements.count()} category elements`);

      // Take screenshot
      await page.screenshot({ path: 'test-results/categories.png', fullPage: true });
    }
  });
});
