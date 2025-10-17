import { test, expect } from '@playwright/test';

test('Goal chart - Simple test', async ({ page }) => {
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Login
  await page.goto('http://localhost:9000/#/login');
  await page.click('button:has-text("Sign in manually")');
  await page.fill('input[type="text"]', 'guillermotabligan');
  await page.fill('input[type="password"]', 'water123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/member/**', { timeout: 10000 });

  // Go to goals
  await page.goto('http://localhost:9000/#/member/manpower/task/goal-list');
  await page.waitForTimeout(5000);

  // Screenshot
  await page.screenshot({ path: 'goal-page.png' });

  const goals = await page.locator('.goal-card').count();
  console.log('Goals found:', goals);

  if (goals > 0) {
    // Open first goal
    await page.locator('.goal-card').first().click();
    await page.waitForTimeout(3000);

    // Screenshot dialog
    await page.screenshot({ path: 'goal-dialog.png' });

    const hasChart = await page.locator('canvas').count() > 0;
    const hasNoData = await page.locator('.no-data-message').count() > 0;

    console.log('Chart found:', hasChart);
    console.log('No-data message:', hasNoData);
    console.log('Console errors:', errors.length);

    if (errors.length > 0) {
      errors.forEach(e => console.log('ERROR:', e));
    }

    expect(errors).toHaveLength(0);
  }
});
