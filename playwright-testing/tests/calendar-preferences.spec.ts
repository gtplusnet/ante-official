import { test, expect } from '@playwright/test';

test.describe('Calendar Preferences', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:9000/#/login');

    // Click "Sign in manually" button to reveal login form
    await page.click('button:has-text("Sign in manually")');
    await page.waitForSelector('input[type="text"]', { timeout: 5000 });

    await page.fill('input[type="text"]', 'guillermotabligan');
    await page.fill('input[type="password"]', 'water123');
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForURL('**/member/**', { timeout: 10000 });

    // Navigate to calendar
    await page.goto('http://localhost:9000/#/member/manpower/calendar');
    await page.waitForLoadState('networkidle');
  });

  test('should save and persist calendar source preferences', async ({ page }) => {
    console.log('Test: Calendar preferences persistence');

    // Wait for calendar page to load
    await page.waitForSelector('.calendar-sidebar', { timeout: 10000 });

    // Check initial state - all checkboxes should be unchecked
    const initialCheckboxes = await page.$$('.calendar-sidebar input[type="checkbox"]');
    console.log(`Found ${initialCheckboxes.length} checkboxes`);

    for (const checkbox of initialCheckboxes) {
      const isChecked = await checkbox.isChecked();
      console.log(`Checkbox checked: ${isChecked}`);
    }

    // Find and check "Task (Task Deadline)" checkbox
    const taskCheckbox = page.locator('.calendar-sidebar').locator('text=Task (Task Deadline)').locator('..').locator('input[type="checkbox"]');
    await taskCheckbox.check();

    // Wait for auto-save (500ms debounce)
    await page.waitForTimeout(1000);

    // Verify no console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Refresh the page to test persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.calendar-sidebar', { timeout: 10000 });

    // Verify the checkbox is still checked after refresh
    const taskCheckboxAfterRefresh = page.locator('.calendar-sidebar').locator('text=Task (Task Deadline)').locator('..').locator('input[type="checkbox"]');
    await expect(taskCheckboxAfterRefresh).toBeChecked();

    // Check for console errors
    if (consoleErrors.length > 0) {
      console.log('Console errors found:');
      consoleErrors.forEach(err => console.log(`  - ${err}`));
      throw new Error(`Found ${consoleErrors.length} console errors`);
    }

    console.log('✓ Calendar preferences saved and persisted successfully');
  });

  test('should toggle all sources in a category', async ({ page }) => {
    console.log('Test: Toggle all sources in category');

    // Wait for calendar page to load
    await page.waitForSelector('.calendar-sidebar', { timeout: 10000 });

    // Find "Personal" checkbox (category toggle)
    const personalCategoryCheckbox = page.locator('.calendar-sidebar').locator('text=Personal').locator('..').locator('input[type="checkbox"]').first();

    // Check the category checkbox (should enable all personal sources)
    await personalCategoryCheckbox.check();

    // Wait for auto-save
    await page.waitForTimeout(1000);

    // Verify all personal sources are checked
    const personalSources = ['Task (Task Deadline)', 'Shifting Schedule', 'Leaves'];
    for (const sourceName of personalSources) {
      const sourceCheckbox = page.locator('.calendar-sidebar').locator(`text=${sourceName}`).locator('..').locator('input[type="checkbox"]');
      await expect(sourceCheckbox).toBeChecked();
    }

    // Uncheck the category checkbox
    await personalCategoryCheckbox.uncheck();

    // Wait for auto-save
    await page.waitForTimeout(1000);

    // Verify all personal sources are unchecked
    for (const sourceName of personalSources) {
      const sourceCheckbox = page.locator('.calendar-sidebar').locator(`text=${sourceName}`).locator('..').locator('input[type="checkbox"]');
      await expect(sourceCheckbox).not.toBeChecked();
    }

    console.log('✓ Category toggle working correctly');
  });
});
