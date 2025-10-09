import { test, expect } from '@playwright/test';

test('Debug - Check what shows on board page', async ({ page }) => {
  // Capture failed API calls
  const failedRequests: string[] = [];
  page.on('response', (response) => {
    if (!response.ok() && response.status() !== 304) {
      failedRequests.push(`${response.status()} ${response.request().method()} ${response.url()}`);
    }
  });

  // Login
  await page.goto('http://localhost:9000');
  await page.waitForLoadState('networkidle');

  // Click "Sign in manually"
  await page.waitForSelector('[data-testid="manual-login-button"]', { timeout: 20000 });
  await page.click('[data-testid="manual-login-button"]');

  // Fill credentials
  await page.waitForSelector('[data-testid="login-username-input"]', { timeout: 10000 });
  await page.fill('[data-testid="login-username-input"]', 'guillermotabligan');
  await page.fill('[data-testid="login-password-input"]', 'water123');

  // Submit
  await page.click('[data-testid="login-submit-button"]');

  // Wait for dashboard
  await page.waitForURL('http://localhost:9000/#/member/dashboard', { timeout: 20000 });

  console.log('✓ Login successful');

  // Check if token is in localStorage
  const token = await page.evaluate(() => {
    const tokenData = localStorage.getItem('token');
    return tokenData ? tokenData.substring(0, 20) + '...' : 'NO TOKEN';
  });
  console.log('  - Token in localStorage:', token);

  // Navigate to project board
  await page.goto('http://localhost:9000/#/member/project/board');
  await page.waitForLoadState('networkidle');

  // Wait a bit for page to render
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: '/tmp/board-page-debug.png', fullPage: true });
  console.log('✓ Screenshot saved to /tmp/board-page-debug.png');

  // Log page HTML structure
  const bodyHTML = await page.locator('body').innerHTML();
  console.log('Page HTML (first 2000 chars):', bodyHTML.substring(0, 2000));

  // Check what's visible
  const hasSpinner = await page.locator('.q-spinner-dots').isVisible().catch(() => false);
  const hasBoardContainer = await page.locator('.board-container').isVisible().catch(() => false);
  const hasBoardColumn = await page.locator('.board-column').isVisible().catch(() => false);
  const hasError = await page.locator('.q-notification').isVisible().catch(() => false);

  console.log('Visibility check:');
  console.log('  - Has spinner:', hasSpinner);
  console.log('  - Has board container:', hasBoardContainer);
  console.log('  - Has board column:', hasBoardColumn);
  console.log('  - Has error notification:', hasError);

  // Get error message if visible
  if (hasError) {
    const errorText = await page.locator('.q-notification').textContent();
    console.log('  - Error message:', errorText);
  }

  // Log current URL
  console.log('Current URL:', page.url());

  // Log failed requests
  console.log('\nFailed API requests:');
  if (failedRequests.length === 0) {
    console.log('  - None');
  } else {
    failedRequests.forEach(req => console.log('  -', req));
  }

  // Check if there are any console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });

  // This test is just for debugging
  expect(true).toBe(true);
});
