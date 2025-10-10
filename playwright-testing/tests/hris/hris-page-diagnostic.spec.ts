import { test, expect } from '@playwright/test';

// Helper function to login
async function login(page: any) {
  await page.goto('http://localhost:9000');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  // Click "Sign in manually" button
  const signInManuallyBtn = page.locator('button:has-text("Sign in manually")');
  if (await signInManuallyBtn.isVisible().catch(() => false)) {
    await signInManuallyBtn.click();
    await page.waitForTimeout(1000);
  }

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

test('HRIS Page Diagnostic - Check what elements are present', async ({ page }) => {
  // Login
  await login(page);

  // Navigate to HRIS
  await page.goto('http://localhost:9000/member/manpower/hris');
  await page.waitForTimeout(8000); // Give it plenty of time to load

  console.log('=== PAGE DIAGNOSTIC ===');

  // Check if page loaded
  const title = await page.title();
  console.log(`Page title: ${title}`);

  // Check for table element
  const tables = await page.locator('table').count();
  console.log(`Number of tables found: ${tables}`);

  // Check for g-table
  const gTables = await page.locator('[tablekey="employeeListTable"]').count();
  console.log(`Number of g-tables with employeeListTable key: ${gTables}`);

  // Check for action menu buttons
  const actionMenus = await page.locator('[data-testid="employee-actions-menu"]').count();
  console.log(`Number of action menu buttons: ${actionMenus}`);

  // Check for employee name links
  const employeeLinks = await page.locator('[data-testid="employee-name-link"]').count();
  console.log(`Number of employee name links: ${employeeLinks}`);

  // Check for any table rows
  const tableRows = await page.locator('tr, .q-table__row, [role="row"]').count();
  console.log(`Number of table rows: ${tableRows}`);

  // Get all test IDs on the page
  const testIds = await page.locator('[data-testid]').allTextContents();
  console.log(`All data-testid elements:`, testIds.slice(0, 20)); // Show first 20

  // Check for loading indicators
  const loadingSpinners = await page.locator('.q-spinner, .q-loading').count();
  console.log(`Loading spinners present: ${loadingSpinners}`);

  // Check for any error messages
  const errors = await page.locator('.q-notification--negative, [role="alert"]').count();
  console.log(`Error notifications: ${errors}`);

  // Take a screenshot for visual inspection
  await page.screenshot({ path: '/tmp/hris-page-diagnostic.png', fullPage: true });
  console.log('Screenshot saved to /tmp/hris-page-diagnostic.png');

  // Print the page structure (limited)
  const bodyContent = await page.locator('body').innerHTML();
  console.log(`Page content length: ${bodyContent.length} characters`);

  console.log('=== END DIAGNOSTIC ===');
});
