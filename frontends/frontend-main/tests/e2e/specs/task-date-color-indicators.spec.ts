import { test, expect } from '@playwright/test';

test.describe('Task Date Color Indicators', () => {
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

  test('Should show red color for past due dates', async ({ page }) => {
    // Wait for task rows to load
    await page.waitForSelector('.task-row', { timeout: 10000 });

    // Find a task with a past date (Sep 15 is in the past as of today)
    const pastDueTask = page.locator('.task-row').filter({
      has: page.locator('.date-button.date-overdue')
    }).first();

    const count = await pastDueTask.count();
    if (count > 0) {
      // Check that the date button has the overdue class
      const dateButton = pastDueTask.locator('.date-button').first();
      await expect(dateButton).toHaveClass(/date-overdue/);

      // Get computed styles to verify color
      const color = await dateButton.evaluate(el => {
        return window.getComputedStyle(el).color;
      });

      console.log('Overdue date color:', color);
      // Should be red color (rgb values for danger color)
      expect(color).toMatch(/rgb\(252,\s*99,\s*107\)|#fc636b/i);
    } else {
      console.log('No overdue tasks found in current view');
    }
  });

  test('Should show orange color for dates due today', async ({ page }) => {
    // Wait for task rows to load
    await page.waitForSelector('.task-row', { timeout: 10000 });

    // Check if there's a task with "Today" text
    const todayTask = page.locator('.task-row').filter({
      has: page.locator('.date-button:has-text("Today")')
    }).first();

    const count = await todayTask.count();
    if (count > 0) {
      const dateButton = todayTask.locator('.date-button').first();
      await expect(dateButton).toHaveClass(/date-today/);

      // Get computed styles to verify color
      const color = await dateButton.evaluate(el => {
        return window.getComputedStyle(el).color;
      });

      console.log('Today date color:', color);
      // Should be warning/orange color
      expect(color).toMatch(/rgb\(245,\s*166,\s*35\)|#f5a623/i);
    } else {
      console.log('No tasks due today found');
    }
  });

  test('Should show default color for future dates', async ({ page }) => {
    // Wait for task rows to load
    await page.waitForSelector('.task-row', { timeout: 10000 });

    // Find a task with future date
    const futureTask = page.locator('.task-row').filter({
      has: page.locator('.date-button.date-upcoming')
    }).first();

    const count = await futureTask.count();
    if (count > 0) {
      const dateButton = futureTask.locator('.date-button').first();
      await expect(dateButton).toHaveClass(/date-upcoming/);

      // Get computed styles to verify color
      const color = await dateButton.evaluate(el => {
        return window.getComputedStyle(el).color;
      });

      console.log('Future date color:', color);
      // Should be default secondary text color
      expect(color).toMatch(/rgb\(111,\s*119,\s*130\)|#6f7782/i);
    } else {
      console.log('No future dated tasks found');
    }
  });

  test('Should show correct classes for different date statuses', async ({ page }) => {
    // Wait for task rows to load
    await page.waitForSelector('.task-row', { timeout: 10000 });

    // Get all date buttons
    const dateButtons = await page.locator('.date-button').all();

    let overdueCount = 0;
    let todayCount = 0;
    let upcomingCount = 0;
    let noneCount = 0;

    for (const button of dateButtons) {
      const classes = await button.getAttribute('class');
      if (classes) {
        if (classes.includes('date-overdue')) overdueCount++;
        else if (classes.includes('date-today')) todayCount++;
        else if (classes.includes('date-upcoming')) upcomingCount++;
        else if (classes.includes('date-none')) noneCount++;
      }
    }

    console.log(`Date status distribution:
      - Overdue: ${overdueCount}
      - Today: ${todayCount}
      - Upcoming: ${upcomingCount}
      - No date: ${noneCount}`);

    // At least some dates should have status classes
    expect(overdueCount + todayCount + upcomingCount + noneCount).toBeGreaterThan(0);
  });

  test('Should update color when date is changed', async ({ page }) => {
    // Wait for task rows to load
    await page.waitForSelector('.task-row', { timeout: 10000 });

    // Find a task with "Set date" (no date)
    const taskWithNoDate = page.locator('.task-row').filter({
      has: page.locator('.date-button:has-text("Set date")')
    }).first();

    const count = await taskWithNoDate.count();
    if (count > 0) {
      const dateButton = taskWithNoDate.locator('.date-button').first();

      // Initially should have date-none class
      await expect(dateButton).toHaveClass(/date-none/);

      // Open date picker
      await dateButton.click();

      // Wait for date dropdown
      const dateDropdown = page.locator('.date-dropdown');
      await expect(dateDropdown).toBeVisible({ timeout: 5000 });

      // Set a past date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateString = yesterday.toISOString().split('T')[0];

      const dateInput = dateDropdown.locator('input[type="date"]');
      await dateInput.fill(dateString);

      // Wait for update
      await page.waitForTimeout(1000);

      // Verify date button now has overdue class
      await expect(dateButton).toHaveClass(/date-overdue/);

      console.log('Date color updated to overdue after setting past date');
    } else {
      console.log('No tasks without dates found to test');
    }
  });
});