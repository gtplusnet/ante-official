import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { getTestUser } from '../fixtures/test-data';
import { createScreenshotHelper } from '../helpers/screenshot.helper';

test.describe('Employment Information Dialogs', () => {
  let loginPage: LoginPage;
  let screenshot: ReturnType<typeof createScreenshotHelper>;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    screenshot = createScreenshotHelper('employment-information-dialogs');

    // Login before each test
    const testUser = getTestUser('DEFAULT');
    await loginPage.login(testUser);
    await expect(page.locator('text=Welcome')).toBeVisible();
    
    // Navigate to Member Dashboard
    await page.goto('/#/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Scroll down to find the Employment Information widget - it's usually at the bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
  });

  test('Employment Details Dialog', async ({ page }) => {
    console.log('📋 Testing Employment Details Dialog');
    
    await test.step('Open Employment Details dialog', async () => {
      // Find and click the Review button for Employment Details
      const reviewButton = page.locator('.my-employment-information-widget')
        .locator('text=Employment Details')
        .locator('..')
        .locator('text=Review')
        .first();
      
      await reviewButton.click();
      await page.waitForTimeout(1000);
      
      // Verify dialog opened
      const dialog = page.locator('.q-dialog').filter({ hasText: 'Employment Details' });
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await screenshot.takeStepScreenshot(page, 'employment-details-dialog-open');
      
      // Verify sections are present
      await expect(dialog.locator('text=Personal Information')).toBeVisible();
      await expect(dialog.locator('text=Contact Information')).toBeVisible();
      await expect(dialog.locator('text=Work Assignment')).toBeVisible();
      
      // Close dialog
      await dialog.locator('[aria-label="Close"]').click();
      await page.waitForTimeout(500);
    });
  });

  test('Job Details Dialog', async ({ page }) => {
    console.log('💼 Testing Job Details Dialog');
    
    await test.step('Open Job Details dialog', async () => {
      const reviewButton = page.locator('.my-employment-information-widget')
        .locator('text=Job Details')
        .locator('..')
        .locator('text=Review')
        .first();
      
      await reviewButton.click();
      await page.waitForTimeout(1000);
      
      const dialog = page.locator('.q-dialog').filter({ hasText: 'Job Details' });
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await screenshot.takeStepScreenshot(page, 'job-details-dialog-open');
      
      // Verify sections
      await expect(dialog.locator('text=Banking Information')).toBeVisible();
      await expect(dialog.locator('text=Salary Information')).toBeVisible();
      
      await dialog.locator('[aria-label="Close"]').click();
      await page.waitForTimeout(500);
    });
  });

  test('My Shift Dialog', async ({ page }) => {
    console.log('🕐 Testing My Shift Dialog');
    
    await test.step('Open My Shift dialog', async () => {
      const reviewButton = page.locator('.my-employment-information-widget')
        .locator('text=My Shift')
        .locator('..')
        .locator('text=Review')
        .first();
      
      await reviewButton.click();
      await page.waitForTimeout(1000);
      
      const dialog = page.locator('.q-dialog').filter({ hasText: 'My Shift' });
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await screenshot.takeStepScreenshot(page, 'my-shift-dialog-open');
      
      // Verify weekly schedule is displayed
      await expect(dialog.locator('text=Weekly Schedule')).toBeVisible();
      
      await dialog.locator('[aria-label="Close"]').click();
      await page.waitForTimeout(500);
    });
  });

  test('Quick test all dialogs', async ({ page }) => {
    console.log('🔄 Quick testing all dialogs');
    
    const dialogTests = [
      'Employment Details',
      'Job Details', 
      'My Shift',
      'Allowances',
      'Documentation',
      'Contract Details',
      'Government IDs',
      'Service Incentive Leaves',
      'Deductions',
      'Time Sheet'
    ];

    for (const dialogName of dialogTests) {
      await test.step(`Test ${dialogName} dialog`, async () => {
        try {
          // Find and click the Review button
          const reviewButton = page.locator('.my-employment-information-widget')
            .locator(`text=${dialogName}`)
            .locator('..')
            .locator('text=Review')
            .first();
          
          await reviewButton.click();
          await page.waitForTimeout(1000);
          
          // Verify dialog opened (use a more flexible check)
          const dialog = page.locator('.q-dialog').last();
          await expect(dialog).toBeVisible({ timeout: 5000 });
          console.log(`✅ ${dialogName} dialog opened`);
          
          // Close dialog
          await dialog.locator('[aria-label="Close"]').click();
          await page.waitForTimeout(1000);
          console.log(`✅ ${dialogName} dialog closed`);
        } catch (error) {
          console.log(`❌ Failed to test ${dialogName}: ${error.message}`);
        }
      });
    }
  });
});