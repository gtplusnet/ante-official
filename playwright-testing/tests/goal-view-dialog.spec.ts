import { test, expect } from '@playwright/test';

test.describe('GoalViewDialog Console Errors', () => {
  test('should load goal view dialog without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    // Capture console errors and warnings
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`ERROR: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(`WARNING: ${msg.text()}`);
      }
    });

    // Login
    await page.goto('http://localhost:9000/#/login');
    await page.click('button:has-text("Sign in manually")');
    await page.fill('input[type="text"]', 'guillermotabligan');
    await page.fill('input[type="password"]', 'water123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/member/**', { timeout: 10000 });

    // Navigate to Goals page
    await page.goto('http://localhost:9000/#/member/manpower/task/goal-list');

    // Wait for page to load (either goal cards or empty state message)
    await page.waitForTimeout(3000);
    await page.waitForSelector('.goal-list-container', { timeout: 10000 });

    // Check if there are any goals
    const hasGoals = await page.locator('.goal-card').count() > 0;

    if (hasGoals) {
      // Click on the first goal to open the dialog
      await page.locator('.goal-card').first().click();

      // Wait for dialog to appear
      await page.waitForSelector('.q-dialog', { timeout: 5000 });

      // Wait for chart or stats to render
      await page.waitForTimeout(2000);

      // Take screenshot for debugging
      await page.screenshot({ path: 'goal-view-dialog-state.png', fullPage: true });

      console.log('Console errors detected:', consoleErrors.length);
      console.log('Console warnings detected:', consoleWarnings.length);

      if (consoleErrors.length > 0) {
        console.log('Errors:', consoleErrors);
      }

      if (consoleWarnings.length > 0) {
        console.log('Warnings:', consoleWarnings);
      }

      // Fail if there are console errors
      if (consoleErrors.length > 0) {
        throw new Error(`Found ${consoleErrors.length} console errors:\n${consoleErrors.join('\n')}`);
      }

      expect(consoleErrors).toHaveLength(0);
      expect(consoleWarnings).toHaveLength(0);
    } else {
      console.log('No goals found to test. Skipping dialog test.');
    }
  });

  test('should display burn-down chart when goal has tasks and deadline', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`ERROR: ${msg.text()}`);
      }
    });

    // Login
    await page.goto('http://localhost:9000/#/login');
    await page.click('button:has-text("Sign in manually")');
    await page.fill('input[type="text"]', 'guillermotabligan');
    await page.fill('input[type="password"]', 'water123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/member/**', { timeout: 10000 });

    // Navigate to Goals page
    await page.goto('http://localhost:9000/#/member/manpower/task/goal-list');

    // Wait for page to load (either goal cards or empty state message)
    await page.waitForTimeout(3000);
    await page.waitForSelector('.goal-list-container', { timeout: 10000 });

    // Check if there are any goals
    const hasGoals = await page.locator('.goal-card').count() > 0;

    if (hasGoals) {
      // Click on the first goal
      await page.locator('.goal-card').first().click();

      // Wait for dialog to appear
      await page.waitForSelector('.q-dialog', { timeout: 5000 });

      // Wait for content to render
      await page.waitForTimeout(2000);

      // Check if chart or "no data" message is displayed
      const hasChart = await page.locator('canvas').count() > 0;
      const hasNoDataMessage = await page.locator('.no-data-message').count() > 0;

      console.log('Has chart:', hasChart);
      console.log('Has no data message:', hasNoDataMessage);

      // Either chart or no-data message should be visible
      expect(hasChart || hasNoDataMessage).toBeTruthy();

      // Fail if there are console errors
      expect(consoleErrors).toHaveLength(0);
    } else {
      console.log('No goals found to test. Skipping chart test.');
    }
  });

  test('should display 2-column layout with stats and chart', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`ERROR: ${msg.text()}`);
      }
    });

    // Login
    await page.goto('http://localhost:9000/#/login');
    await page.click('button:has-text("Sign in manually")');
    await page.fill('input[type="text"]', 'guillermotabligan');
    await page.fill('input[type="password"]', 'water123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/member/**', { timeout: 10000 });

    // Navigate to Goals page
    await page.goto('http://localhost:9000/#/member/manpower/task/goal-list');

    // Wait for page to load (either goal cards or empty state message)
    await page.waitForTimeout(3000);
    await page.waitForSelector('.goal-list-container', { timeout: 10000 });

    // Check if there are any goals
    const hasGoals = await page.locator('.goal-card').count() > 0;

    if (hasGoals) {
      // Click on the first goal
      await page.locator('.goal-card').first().click();

      // Wait for dialog to appear
      await page.waitForSelector('.q-dialog', { timeout: 5000 });

      // Wait for content to render
      await page.waitForTimeout(2000);

      // Verify 2-column layout exists
      const statsColumn = await page.locator('.goal-stats-column').count();
      const chartColumn = await page.locator('.goal-chart-column').count();

      console.log('Stats column found:', statsColumn > 0);
      console.log('Chart column found:', chartColumn > 0);

      expect(statsColumn).toBeGreaterThan(0);
      expect(chartColumn).toBeGreaterThan(0);

      // Fail if there are console errors
      expect(consoleErrors).toHaveLength(0);
    } else {
      console.log('No goals found to test. Skipping layout test.');
    }
  });
});
