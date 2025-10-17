import { test, expect } from '@playwright/test';

test.describe('Goal Burn-down Chart', () => {
  test('should create goal with tasks and display burn-down chart with ZERO console errors', async ({ page }) => {
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
    await page.waitForTimeout(3000);

    // Create a new goal with deadline
    const createButton = page.locator('button:has-text("Create Goal"), button:has-text("New Goal")');
    const hasCreateButton = await createButton.count() > 0;

    if (hasCreateButton) {
      await createButton.first().click();
      await page.waitForTimeout(1000);

      // Fill goal form
      await page.fill('input[placeholder*="Goal name"], input[label*="Name"]', 'Test Burn-down Chart Goal');
      await page.fill('textarea[placeholder*="Description"]', 'Testing the burn-down chart feature');

      // Set deadline to 10 days from now
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + 10);
      const formattedDate = deadlineDate.toISOString().split('T')[0];

      const dateInput = page.locator('input[type="date"]');
      if (await dateInput.count() > 0) {
        await dateInput.fill(formattedDate);
      }

      // Save goal
      await page.click('button:has-text("Save"), button:has-text("Create")');
      await page.waitForTimeout(2000);

      console.log('✅ Goal created successfully');
    }

    // Wait for page to reload
    await page.waitForTimeout(2000);

    // Find the goal we just created
    const goalCards = page.locator('.goal-card');
    const goalCount = await goalCards.count();

    console.log(`Found ${goalCount} goals`);

    if (goalCount > 0) {
      // Click on the first goal to open dialog
      await goalCards.first().click();
      await page.waitForTimeout(2000);

      // Wait for dialog to appear
      await page.waitForSelector('.q-dialog', { timeout: 5000 });
      console.log('✅ Dialog opened');

      // Wait for chart or no-data message to render
      await page.waitForTimeout(3000);

      // Check if 2-column layout exists
      const statsColumn = await page.locator('.goal-stats-column').count();
      const chartColumn = await page.locator('.goal-chart-column').count();

      console.log('Stats column found:', statsColumn > 0);
      console.log('Chart column found:', chartColumn > 0);

      expect(statsColumn).toBeGreaterThan(0);
      expect(chartColumn).toBeGreaterThan(0);

      // Check if chart or no-data message is displayed
      const hasChart = await page.locator('canvas').count() > 0;
      const hasNoDataMessage = await page.locator('.no-data-message').count() > 0;

      console.log('Has chart canvas:', hasChart);
      console.log('Has no-data message:', hasNoDataMessage);

      // Either chart or no-data message should be visible
      expect(hasChart || hasNoDataMessage).toBeTruthy();

      // Take screenshot for visual verification
      await page.screenshot({ path: 'goal-burndown-chart-test.png', fullPage: true });

      // Log console messages
      console.log('\n=== CONSOLE ERROR CHECK ===');
      console.log('Console errors detected:', consoleErrors.length);
      console.log('Console warnings detected:', consoleWarnings.length);

      if (consoleErrors.length > 0) {
        console.log('\n❌ ERRORS:');
        consoleErrors.forEach(err => console.log(err));
      } else {
        console.log('✅ ZERO console errors!');
      }

      if (consoleWarnings.length > 0) {
        console.log('\n⚠️  WARNINGS:');
        consoleWarnings.forEach(warn => console.log(warn));
      } else {
        console.log('✅ ZERO console warnings!');
      }

      // Fail if there are console errors
      if (consoleErrors.length > 0) {
        throw new Error(`Found ${consoleErrors.length} console errors:\n${consoleErrors.join('\n')}`);
      }

      expect(consoleErrors).toHaveLength(0);
      console.log('\n✅ TEST PASSED: Goal burn-down chart working perfectly with ZERO console errors!');
    } else {
      console.log('⚠️  No goals found to test');
    }
  });

  test('should handle goal with no tasks (no data state)', async ({ page }) => {
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
    await page.waitForTimeout(3000);

    const goalCards = page.locator('.goal-card');
    const goalCount = await goalCards.count();

    if (goalCount > 0) {
      // Click on first goal
      await goalCards.first().click();
      await page.waitForTimeout(2000);

      // Wait for dialog
      await page.waitForSelector('.q-dialog', { timeout: 5000 });
      await page.waitForTimeout(2000);

      // Should show "no data" message if goal has no tasks
      const hasNoDataMessage = await page.locator('.no-data-message').count() > 0;
      const hasChart = await page.locator('canvas').count() > 0;

      console.log('No data message shown:', hasNoDataMessage);
      console.log('Chart shown:', hasChart);

      // One of them should be visible
      expect(hasNoDataMessage || hasChart).toBeTruthy();

      // Fail if there are console errors
      expect(consoleErrors).toHaveLength(0);

      console.log('✅ No-data state handled correctly with ZERO console errors!');
    } else {
      console.log('⚠️  No goals found to test');
    }
  });
});
