import { test, expect, Page } from '@playwright/test';

/**
 * Debug test to inspect HRIS page structure
 */

const BASE_URL = 'http://localhost:9000';
const TEST_USER = {
  username: 'guillermotabligan',
  password: 'water123'
};

/**
 * Login helper function
 */
async function login(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');

  // Clear storage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Reload to ensure fresh state
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // Click "Sign in manually" button
  const signInManuallyBtn = page.locator('button:has-text("Sign in manually")');
  await signInManuallyBtn.waitFor({ state: 'visible', timeout: 10000 });
  await signInManuallyBtn.click();
  await page.waitForTimeout(1000);

  // Fill login form
  const usernameInput = page.locator('input[type="text"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });

  await usernameInput.fill(TEST_USER.username);
  await page.waitForTimeout(200);

  await passwordInput.fill(TEST_USER.password);
  await page.waitForTimeout(500);

  // Click submit button
  const submitButton = page.locator('button[data-testid="login-submit-button"]');
  await submitButton.click();

  // Wait for login to complete
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Verify token exists
  const token = await page.evaluate(() => localStorage.getItem('token'));
  if (!token) {
    throw new Error('Login failed - no token stored');
  }
}

test('debug: inspect HRIS page structure', async ({ page }) => {
  await login(page);

  // Navigate to HRIS
  await page.goto(`${BASE_URL}/#/member/manpower/hris`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: 'playwright-testing/test-results/hris-page-structure.png', fullPage: true });

  // Log page HTML for inspection
  const bodyHTML = await page.locator('body').innerHTML();
  console.log('Page has table:', bodyHTML.includes('<table'));
  console.log('Page has tbody:', bodyHTML.includes('<tbody'));

  // Check for various button selectors
  const buttons = await page.locator('button').all();
  console.log(`Found ${buttons.length} buttons on page`);

  // Look for any edit-like buttons
  const editButtons = await page.locator('button:has(i.q-icon), button[aria-label*="edit" i], button[title*="edit" i]').all();
  console.log(`Found ${editButtons.length} potential edit buttons`);

  // Log first few button texts
  for (let i = 0; i < Math.min(10, buttons.length); i++) {
    const buttonText = await buttons[i].textContent().catch(() => '');
    const buttonAriaLabel = await buttons[i].getAttribute('aria-label').catch(() => '');
    const buttonTitle = await buttons[i].getAttribute('title').catch(() => '');
    console.log(`Button ${i + 1}: text="${buttonText?.trim()}" aria-label="${buttonAriaLabel}" title="${buttonTitle}"`);
  }

  // Check for table structure
  const tableRows = await page.locator('table tbody tr').all();
  console.log(`Found ${tableRows.length} table rows`);

  if (tableRows.length > 0) {
    // Inspect first row
    const firstRow = tableRows[0];
    const firstRowHTML = await firstRow.innerHTML();
    console.log('\nFirst row HTML (truncated):');
    console.log(firstRowHTML.substring(0, 500));

    // Look for buttons in first row
    const firstRowButtons = await firstRow.locator('button').all();
    console.log(`\nFirst row has ${firstRowButtons.length} buttons`);

    for (let i = 0; i < firstRowButtons.length; i++) {
      const btn = firstRowButtons[i];
      const btnText = await btn.textContent().catch(() => '');
      const btnAriaLabel = await btn.getAttribute('aria-label').catch(() => '');
      const btnTitle = await btn.getAttribute('title').catch(() => '');
      const hasIcon = await btn.locator('i.q-icon').count() > 0;
      const iconText = hasIcon ? await btn.locator('i.q-icon').first().textContent().catch(() => '') : '';

      console.log(`  Button ${i + 1}:`);
      console.log(`    text: "${btnText?.trim()}"`);
      console.log(`    aria-label: "${btnAriaLabel}"`);
      console.log(`    title: "${btnTitle}"`);
      console.log(`    has icon: ${hasIcon}, icon text: "${iconText}"`);
    }
  }

  // Try clicking the three dots menu
  if (tableRows.length > 0) {
    console.log('\n--- Testing three dots menu ---');
    const firstRowMenu = tableRows[0].locator('button:has(i.q-icon:text("more_horiz"))');
    await firstRowMenu.click();
    await page.waitForTimeout(1000);

    // Check what appears
    const menu = page.locator('.q-menu');
    const menuVisible = await menu.isVisible().catch(() => false);
    console.log(`Menu visible: ${menuVisible}`);

    if (menuVisible) {
      // Take screenshot first
      await page.screenshot({ path: 'playwright-testing/hris-menu-open.png', fullPage: true });

      // Get menu HTML
      const menuHTML = await menu.innerHTML();
      console.log(`Menu HTML (first 500 chars):\n${menuHTML.substring(0, 500)}`);

      // Get all descendants
      const allElements = await menu.locator('*').all();
      console.log(`Found ${allElements.length} total elements in menu`);

      // Try different selectors
      const items1 = await menu.locator('[role="menuitem"]').all();
      console.log(`Found ${items1.length} items with role="menuitem"`);

      const items2 = await menu.locator('div').all();
      console.log(`Found ${items2.length} div elements`);

      // Get menu items text
      const menuText = await menu.textContent();
      console.log(`Menu text content: "${menuText}"`);
    }
  }

  // Log success
  console.log('\n✅ Debug inspection complete - check screenshot and logs');
});
