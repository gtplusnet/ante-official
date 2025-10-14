import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:9000';
const TEST_USER = {
  username: 'guillermotabligan',
  password: 'water123'
};

async function login(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');

  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  const signInManuallyBtn = page.locator('button:has-text("Sign in manually")');
  await signInManuallyBtn.waitFor({ state: 'visible', timeout: 10000 });
  await signInManuallyBtn.click();
  await page.waitForTimeout(1000);

  const usernameInput = page.locator('input[type="text"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });

  await usernameInput.fill(TEST_USER.username);
  await page.waitForTimeout(200);

  await passwordInput.fill(TEST_USER.password);
  await page.waitForTimeout(500);

  const submitButton = page.locator('button[data-testid="login-submit-button"]');
  await submitButton.click();

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  const token = await page.evaluate(() => localStorage.getItem('token'));
  if (!token) {
    throw new Error('Login failed - no token stored');
  }
}

test('debug: inspect employee dialog tabs', async ({ page }) => {
  await login(page);

  // Navigate to HRIS
  await page.goto(`${BASE_URL}/#/member/manpower/hris`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  // Click three dots menu
  const firstRowMenuButton = page.locator('table tbody tr:first-child button:has(i.q-icon:text("more_horiz"))');
  await firstRowMenuButton.click();
  await page.waitForTimeout(500);

  // Click Edit
  const editMenuItem = page.locator('.q-menu [data-testid="employee-edit-button"]');
  await editMenuItem.click();
  await page.waitForTimeout(3000); // Give it more time to load

  // Wait for dialog to fully load
  await page.waitForSelector('.q-dialog', { timeout: 10000 });

  // Take screenshot of dialog
  await page.screenshot({ path: 'playwright-testing/employee-dialog.png', fullPage: true });

  // Find all tabs (try multiple selectors)
  const tabs1 = await page.locator('.q-tab').all();
  console.log(`Found ${tabs1.length} .q-tab elements`);

  const tabs2 = await page.locator('[role="tab"]').all();
  console.log(`Found ${tabs2.length} [role="tab"] elements`);

  const tabs3 = await page.locator('.q-tabs__content .q-tab').all();
  console.log(`Found ${tabs3.length} .q-tabs__content .q-tab elements`);

  // Use the selector that found tabs
  const tabs = tabs1.length > tabs2.length ? tabs1 : tabs2;

  for (let i = 0; i < tabs.length; i++) {
    const tabText = await tabs[i].textContent().catch(() => '');
    const tabAriaLabel = await tabs[i].getAttribute('aria-label').catch(() => '');
    const tabClass = await tabs[i].getAttribute('class').catch(() => '');
    console.log(`Tab ${i + 1}: text="${tabText?.trim()}" aria-label="${tabAriaLabel}" class="${tabClass}"`);
  }

  // Check dialog HTML
  const dialog = page.locator('.q-dialog').first();
  const dialogHTML = await dialog.innerHTML();
  console.log('\n--- Searching for "Contract" in dialog HTML ---');
  const hasContract = dialogHTML.toLowerCase().includes('contract');
  console.log(`Has "contract" text: ${hasContract}`);

  if (hasContract) {
    const lines = dialogHTML.split('\n');
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes('contract')) {
        console.log(`Line ${index}: ${line.trim().substring(0, 100)}`);
      }
    });
  }

  console.log('\n✅ Debug inspection complete');
});
