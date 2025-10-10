import { test, expect } from '@playwright/test';

/**
 * Network Debug Test - Capture API requests for Government Details update
 */

async function login(page: any) {
  await page.goto('http://localhost:9000');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  const signInManuallyBtn = page.locator('button:has-text("Sign in manually")');
  await signInManuallyBtn.click();
  await page.waitForTimeout(1000);

  const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
  await usernameInput.fill('guillermotabligan');

  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  await passwordInput.fill('water123');

  const loginButton = page.locator('button[type="submit"]').first();
  await loginButton.click();

  await page.waitForURL('**/member/dashboard', { timeout: 30000 });
  console.log('✓ Logged in successfully');
  await page.waitForTimeout(3000);
}

async function waitForAppLoading(page: any) {
  const loadingText = page.locator('text=Loading application data');
  const isLoadingVisible = await loadingText.isVisible().catch(() => false);

  if (isLoadingVisible) {
    console.log('  - Waiting for application data to load...');
    await loadingText.waitFor({ state: 'hidden', timeout: 60000 });
    console.log('  - Application data loaded');
  }

  await page.waitForTimeout(2000);
}

test.describe('Edit Employee Dialog - Government Tab Network Test', () => {
  test('Government Tab - Capture Network Requests', async ({ page }) => {
    test.setTimeout(120000);

    // Capture network requests
    const networkRequests: any[] = [];
    const networkResponses: any[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/hris/employee')) {
        console.log(`📤 REQUEST: ${request.method()} ${url}`);
        networkRequests.push({
          method: request.method(),
          url: url,
          timestamp: new Date().toISOString(),
        });
      }
    });

    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/hris/employee')) {
        console.log(`📥 RESPONSE: ${response.status()} ${url}`);
        networkResponses.push({
          status: response.status(),
          url: url,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Capture console logs
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('DEBUG')) {
        console.log(`BROWSER [${msg.type()}]:`, text);
      }
    });

    console.log('\n=== Starting Government Tab Network Test ===');

    await login(page);

    await page.goto('http://localhost:9000/#/member/manpower/hris');
    await page.waitForLoadState('domcontentloaded');
    console.log('✓ Navigated to HRIS page');

    await waitForAppLoading(page);
    await page.waitForTimeout(5000);

    await page.waitForSelector('[tablekey="employeeListTable"], table', { timeout: 30000 });
    console.log('✓ Employee table is visible');

    const actionsMenuButton = page.locator('[data-testid="employee-actions-menu"]').first();
    await actionsMenuButton.waitFor({ state: 'visible', timeout: 10000 });
    await actionsMenuButton.click();
    console.log('✓ Clicked actions menu button');
    await page.waitForTimeout(1000);

    const editButton = page.locator('[data-testid="employee-edit-button"]').first();
    await editButton.click();
    console.log('✓ Clicked edit button');
    await page.waitForTimeout(2000);

    const dialog = page.locator('[role="dialog"], .q-dialog').first();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    console.log('✓ Edit dialog opened');
    await page.waitForTimeout(1000);

    // Click on Government tab
    const governmentTab = page.locator('[data-testid="tab-goverment"]');
    await governmentTab.click();
    await page.waitForTimeout(2000);
    console.log('✓ Switched to Government tab');

    // Find editable inputs
    const inputs = await page.locator('[role="dialog"] input:visible:not([readonly]):not([disabled])').all();
    console.log(`Found ${inputs.length} editable inputs`);

    if (inputs.length > 0) {
      const firstInput = inputs[0];
      const originalValue = await firstInput.inputValue().catch(() => '');
      const newValue = `GovTest${Date.now()}`;

      await firstInput.fill('');
      await firstInput.fill(newValue);
      console.log(`✓ Updated input from "${originalValue}" to "${newValue}"`);

      // Clear previous network logs
      networkRequests.length = 0;
      networkResponses.length = 0;

      // Click Update button
      console.log('\n=== Clicking Update Button ===');
      const updateButton = page.locator('[role="dialog"] button:has-text("Update")').first();
      await updateButton.click();
      console.log('✓ Update button clicked');

      // Wait to capture network activity
      console.log('\n=== Waiting 15 seconds to capture network activity ===');
      await page.waitForTimeout(15000);

      const dialogStillVisible = await dialog.isVisible().catch(() => false);
      console.log(`\n=== Dialog still visible after 15 seconds: ${dialogStillVisible} ===`);

      // Print network activity summary
      console.log('\n=== NETWORK ACTIVITY SUMMARY ===');
      console.log(`Total requests captured: ${networkRequests.length}`);
      console.log(`Total responses captured: ${networkResponses.length}`);

      if (networkRequests.length > 0) {
        console.log('\n=== REQUESTS ===');
        networkRequests.forEach((req, index) => {
          console.log(`${index + 1}. ${req.method} ${req.url}`);
          console.log(`   Time: ${req.timestamp}`);
        });
      }

      if (networkResponses.length > 0) {
        console.log('\n=== RESPONSES ===');
        networkResponses.forEach((res, index) => {
          console.log(`${index + 1}. ${res.status} ${res.url}`);
          console.log(`   Time: ${res.timestamp}`);
        });
      }

      // Calculate API call duration
      const updateRequest = networkRequests.find(r => r.url.includes('update-government-details'));
      const updateResponse = networkResponses.find(r => r.url.includes('update-government-details'));

      if (updateRequest && updateResponse) {
        const duration = (new Date(updateResponse.timestamp).getTime() - new Date(updateRequest.timestamp).getTime()) / 1000;
        console.log(`\n=== API Call Duration: ${duration.toFixed(2)} seconds ===`);
      }

      // Test assertion
      expect(dialogStillVisible).toBe(false);
    }
  });
});
