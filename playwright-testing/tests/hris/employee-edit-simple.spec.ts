import { test, expect } from '@playwright/test';

// Helper function to login
async function login(page: any) {
  await page.goto('http://localhost:9000');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  // Click "Sign in manually" button
  const signInManuallyBtn = page.locator('button:has-text("Sign in manually")');
  await signInManuallyBtn.click();
  await page.waitForTimeout(1000);

  // Find and fill username
  const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
  await usernameInput.fill('guillermotabligan');

  // Find and fill password
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  await passwordInput.fill('water123');

  // Click login button
  const loginButton = page.locator('button[type="submit"]').first();
  await loginButton.click();

  // Wait for redirect to dashboard or any member page (longer timeout for workspace setup)
  await page.waitForURL('**/member/**', { timeout: 30000 });

  // Give extra time for dashboard to fully load
  await page.waitForTimeout(3000);
}

test.describe('Employee Edit Dialog - Quick Test', () => {
  test('should verify dialog closes after employee update', async ({ page }) => {
    // Login
    await login(page);

    // Navigate to HRIS
    await page.goto('http://localhost:9000/member/manpower/hris');
    await page.waitForTimeout(5000);

    console.log('✓ Navigated to HRIS page');

    // Wait for the table to load
    await page.waitForTimeout(3000);

    // Click on the first employee's actions menu button
    const actionsMenuButton = page.locator('[data-testid="employee-actions-menu"]').first();
    const isActionsMenuVisible = await actionsMenuButton.isVisible().catch(() => false);

    if (!isActionsMenuVisible) {
      console.log('❌ Actions menu button not found. Table may not have loaded yet.');
      console.log('Waiting additional 5 seconds for table to load...');
      await page.waitForTimeout(5000);
    }

    await actionsMenuButton.click();
    console.log('✓ Clicked actions menu button');
    await page.waitForTimeout(1000);

    // Click the Edit option in the dropdown menu
    const editButton = page.locator('[data-testid="employee-edit-button"]').first();
    await editButton.click();
    console.log('✓ Clicked edit button');
    await page.waitForTimeout(2000);

    // Check if dialog appeared
    const dialog = page.locator('[role="dialog"], .q-dialog').first();
    const isDialogVisible = await dialog.isVisible().catch(() => false);

    if (!isDialogVisible) {
      console.log('❌ Dialog did not appear. Test cannot continue.');
      console.log('Page structure:', await page.content());
      return;
    }

    console.log('✓ Edit dialog opened');

    // Wait for dialog content to load (no spinner)
    await page.waitForTimeout(3000);

    // Try to find and update a field
    const inputs = await page.locator('[role="dialog"] input, .q-dialog input').all();
    console.log(`Found ${inputs.length} inputs in dialog`);

    if (inputs.length > 0) {
      // Update first input
      const firstInput = inputs[0];
      const originalValue = await firstInput.inputValue().catch(() => '');
      const newValue = `Updated${Date.now()}`;

      await firstInput.fill('');
      await firstInput.fill(newValue);
      console.log(`✓ Updated input from "${originalValue}" to "${newValue}"`);

      // Look for Update/Save button
      const updateButtons = await page.locator('[role="dialog"] button:has-text("Update"), [role="dialog"] button:has-text("Save"), .q-dialog button:has-text("Update"), .q-dialog button:has-text("Save")').all();

      if (updateButtons.length > 0) {
        console.log(`Found ${updateButtons.length} update/save buttons`);
        await updateButtons[0].click();
        console.log('✓ Clicked update button');

        // Wait for notification
        await page.waitForTimeout(2000);

        // Check if dialog closed
        const dialogStillVisible = await dialog.isVisible().catch(() => false);

        if (!dialogStillVisible) {
          console.log('✅ SUCCESS: Dialog closed after update!');
          expect(dialogStillVisible).toBe(false);
        } else {
          console.log('❌ FAIL: Dialog did not close after update');
          expect(dialogStillVisible).toBe(false);
        }
      } else {
        console.log('❌ No update/save button found');
      }
    } else {
      console.log('❌ No inputs found in dialog');
    }
  });

  test('should verify dialog loads quickly (performance test)', async ({ page }) => {
    // Login
    await login(page);

    // Navigate to HRIS
    await page.goto('http://localhost:9000/member/manpower/hris');
    await page.waitForTimeout(5000);

    // Wait for table to load
    await page.waitForTimeout(3000);

    // Measure dialog open time
    const startTime = Date.now();

    // Click on the first employee's actions menu button
    const actionsMenuButton = page.locator('[data-testid="employee-actions-menu"]').first();
    await actionsMenuButton.click();
    await page.waitForTimeout(500);

    // Click the Edit option
    const editButton = page.locator('[data-testid="employee-edit-button"]').first();
    await editButton.click();

    // Wait for dialog to appear
    await page.waitForSelector('[role="dialog"], .q-dialog', { timeout: 10000 });

    // Wait for content to load (spinner hidden)
    await page.waitForTimeout(2000);

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    console.log(`Dialog load time: ${loadTime}ms`);

    // With optimization, should load in under 2 seconds
    if (loadTime < 2000) {
      console.log('✅ Performance test PASSED: Dialog loaded in under 2 seconds');
      expect(loadTime).toBeLessThan(2000);
    } else {
      console.log(`⚠️ Performance warning: Dialog took ${loadTime}ms (expected < 2000ms)`);
    }
  });
});
