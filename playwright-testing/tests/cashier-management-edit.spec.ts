import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:9000';

const TEST_USER = {
  username: 'guillermotabligan',
  password: 'water123'
};

// Helper function to login
async function login(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  // Check if we need to switch to manual login mode
  const manualLoginButton = page.locator('[data-testid="manual-login-button"]');
  const isManualButtonVisible = await manualLoginButton.isVisible().catch(() => false);

  if (isManualButtonVisible) {
    await manualLoginButton.click();
    await page.waitForTimeout(500);
  }

  // Fill in credentials
  await page.fill('[data-testid="login-username-input"]', TEST_USER.username);
  await page.fill('[data-testid="login-password-input"]', TEST_USER.password);

  // Click submit
  await page.click('[data-testid="login-submit-button"]');

  // Wait for navigation (hash-based routing)
  await page.waitForURL(/.*#\/member\/.*/, { timeout: 15000 });
  await page.waitForTimeout(2000);
}

test.describe('Cashier Management - Edit Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);

    // Navigate to cashier management
    await page.goto(`${BASE_URL}/#/member/manpower/cashier-management`);
    await page.waitForTimeout(3000);

    // Wait for table to load
    await page.waitForSelector('[data-testid="cashier-name-link"]', { timeout: 10000 });
  });

  test('should display branch field correctly when editing cashier', async ({ page }) => {
    // Click on the first cashier's name to edit
    await page.click('[data-testid="cashier-name-link"]');

    // Wait for dialog to open
    await page.waitForSelector('.q-dialog', { state: 'visible', timeout: 5000 });

    // Wait for the branch select component to load
    await page.waitForSelector('.branch-tree-select', { timeout: 5000 });

    // Wait for the component to fully render and the watcher to process
    await page.waitForTimeout(2000);

    // Check if the selected-branch-text span has content (this is what displays the selected branch)
    const selectedBranchText = page.locator('.q-dialog .selected-branch-text');
    const branchTextCount = await selectedBranchText.count();

    // If the fix worked, the selected-branch-text should be visible and have content
    if (branchTextCount > 0) {
      const text = await selectedBranchText.textContent();
      expect(text).toBeTruthy();
      expect(text?.trim()).not.toBe('');
      console.log(`✓ Branch field is populated correctly: "${text?.trim()}"`);
    } else {
      // If selected-branch-text is not rendered, the branch is blank (BUG)
      throw new Error('Branch field is blank - selected-branch-text not found');
    }
  });

  test('should display branch field using actions menu', async ({ page }) => {
    // Click on the actions menu (three dots) for the first cashier
    await page.click('[data-testid="cashier-actions-menu"]');

    // Wait for menu to appear
    await page.waitForSelector('[data-testid="cashier-edit-button"]', { state: 'visible', timeout: 3000 });

    // Click edit button in menu
    await page.click('[data-testid="cashier-edit-button"]');

    // Wait for dialog to open
    await page.waitForSelector('.q-dialog', { state: 'visible', timeout: 5000 });

    // Wait for the branch select component to load
    await page.waitForSelector('.branch-tree-select', { timeout: 5000 });

    // Wait for component to fully render and the watcher to process
    await page.waitForTimeout(2000);

    // Check if the selected-branch-text span has content
    const selectedBranchText = page.locator('.q-dialog .selected-branch-text');
    const branchTextCount = await selectedBranchText.count();

    // If the fix worked, the selected-branch-text should be visible and have content
    if (branchTextCount > 0) {
      const text = await selectedBranchText.textContent();
      expect(text).toBeTruthy();
      expect(text?.trim()).not.toBe('');
      console.log(`✓ Branch field is populated correctly via actions menu: "${text?.trim()}"`);
    } else {
      // If selected-branch-text is not rendered, the branch is blank (BUG)
      throw new Error('Branch field is blank - selected-branch-text not found');
    }
  });
});
