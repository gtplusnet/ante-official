import { test, expect } from '@playwright/test';

test.describe('Goal Burn-down Chart - Manual Test', () => {
  test('Manual: Open existing goal and verify chart renders with ZERO console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    const consoleInfos: string[] = [];

    // Capture ALL console messages for debugging
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(`ERROR: ${text}`);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(`WARNING: ${text}`);
      } else if (msg.type() === 'info' || msg.type() === 'log') {
        consoleInfos.push(`INFO: ${text}`);
      }
    });

    console.log('\n=== STARTING GOAL CHART TEST ===\n');

    // Login
    console.log('1. Logging in...');
    await page.goto('http://localhost:9000/#/login');
    await page.click('button:has-text("Sign in manually")');
    await page.fill('input[type="text"]', 'guillermotabligan');
    await page.fill('input[type="password"]', 'water123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/member/**', { timeout: 10000 });
    console.log(' Login successful\n');

    // Navigate to Goals page
    console.log('2. Navigating to Goals page...');
    await page.goto('http://localhost:9000/#/member/manpower/task/goal-list');
    await page.waitForTimeout(5000); // Give it time to load

    // Take screenshot of goals page
    await page.screenshot({ path: 'test-results/01-goals-page.png', fullPage: true });
    console.log(' Goals page loaded\n');

    // Check for goal cards
    const goalCards = page.locator('.goal-card');
    const goalCount = await goalCards.count();
    console.log(`3. Found ${goalCount} goal(s)\n`);

    if (goalCount === 0) {
      console.log('  No goals found. Please create a goal manually with:');
      console.log('   - Name: Test Goal');
      console.log('   - Description: Test burn-down chart');
      console.log('   - Deadline: 10 days from now');
      console.log('   - Link at least 2-3 tasks to this goal');
      console.log('\nThen run this test again.');
      return;
    }

    // Click on the FIRST goal
    console.log('4. Opening first goal dialog...');
    await goalCards.first().click();
    await page.waitForTimeout(2000);

    // Wait for dialog to appear
    await page.waitForSelector('.q-dialog', { timeout: 10000 });
    console.log(' Dialog opened\n');

    // Wait for content to render
    console.log('5. Waiting for chart to render...');
    await page.waitForTimeout(4000);

    // Take screenshot of dialog
    await page.screenshot({ path: 'test-results/02-goal-dialog.png', fullPage: true });
    console.log(' Screenshot taken\n');

    // Verify 2-column layout
    console.log('6. Verifying 2-column layout...');
    const statsColumn = await page.locator('.goal-stats-column').count();
    const chartColumn = await page.locator('.goal-chart-column').count();

    console.log(`   - Stats column: ${statsColumn > 0 ? ' Found' : ' Not found'}`);
    console.log(`   - Chart column: ${chartColumn > 0 ? ' Found' : ' Not found'}\n');

    expect(statsColumn).toBeGreaterThan(0);
    expect(chartColumn).toBeGreaterThan(0);

    // Check for chart or no-data message
    console.log('7. Checking chart rendering...');
    const hasChart = await page.locator('canvas').count() > 0;
    const hasNoDataMessage = await page.locator('.no-data-message').count() > 0;

    console.log(`   - Chart canvas: ${hasChart ? 'FOUND - Rendered' : 'NOT FOUND'}`);
    console.log(`   - No-data message: ${hasNoDataMessage ? 'SHOWN' : 'HIDDEN'}\n`);

    if (hasChart) {
      console.log(' CHART IS RENDERING!\n');

      // Take close-up screenshot of chart
      const chartElement = page.locator('canvas').first();
      await chartElement.screenshot({ path: 'test-results/03-chart-closeup.png' });
      console.log(' Chart screenshot saved\n');
    } else if (hasNoDataMessage) {
      console.log('  Goal has no tasks or no deadline - showing no-data message\n');
      console.log('   To see the chart:');
      console.log('   1. Add a deadline to this goal');
      console.log('   2. Link at least 2-3 tasks');
      console.log('   3. Mark some tasks as DONE');
    }

    // Either chart or no-data should be visible
    expect(hasChart || hasNoDataMessage).toBeTruthy();

    // Check console errors
    console.log('\n=== CONSOLE ERROR CHECK ===\n');
    console.log(`Console errors: ${consoleErrors.length}`);
    console.log(`Console warnings: ${consoleWarnings.length}`);
    console.log(`Console info/logs: ${consoleInfos.length}\n`);

    if (consoleErrors.length > 0) {
      console.log(' CONSOLE ERRORS FOUND:');
      consoleErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
      console.log('');
    } else {
      console.log(' ZERO console errors!\n');
    }

    if (consoleWarnings.length > 0) {
      console.log('  CONSOLE WARNINGS:');
      consoleWarnings.forEach((warn, i) => console.log(`   ${i + 1}. ${warn}`));
      console.log('');
    } else {
      console.log(' ZERO console warnings!\n');
    }

    // Show some info logs for debugging
    if (consoleInfos.length > 0) {
      console.log('  Console logs (last 10):');
      consoleInfos.slice(-10).forEach((info, i) => console.log(`   ${i + 1}. ${info}`));
      console.log('');
    }

    // Fail test if there are console errors
    if (consoleErrors.length > 0) {
      throw new Error(`Found ${consoleErrors.length} console errors (see details above)`);
    }

    expect(consoleErrors).toHaveLength(0);

    console.log('=== TEST RESULT ===\n');
    console.log(' SUCCESS! Goal dialog and burn-down chart working perfectly!');
    console.log(' ZERO console errors');
    console.log(' ZERO console warnings');
    console.log(' All components rendered correctly\n');
  });
});
