import { test, expect } from '@playwright/test';

test.describe('Gate App Login with new IP', () => {
  test('should login using license key', async ({ page }) => {
    // Navigate to Gate App using the new IP
    await page.goto('http://100.80.38.96:9002');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
    
    // Wait for the login form to be visible
    await page.waitForSelector('form', { timeout: 5000 });
    
    // Look for the license key input field
    const licenseInput = await page.locator('input[placeholder*="License"]').first() || 
                         await page.locator('input[type="text"]').first() ||
                         await page.locator('input').first();
    
    // Enter a test license key
    await licenseInput.fill('TEST-LICENSE-KEY-123');
    
    // Find and click the submit button
    const submitButton = await page.locator('button[type="submit"]').first() ||
                         await page.locator('button:has-text("Login")').first() ||
                         await page.locator('button:has-text("Submit")').first() ||
                         await page.locator('button').first();
    
    await submitButton.click();
    
    // Wait for response
    await page.waitForLoadState('networkidle');
    
    // Log the result
    const currentUrl = page.url();
    console.log('URL after login attempt:', currentUrl);
    
    // Take screenshot for debugging
    await page.screenshot({ 
      path: 'tests/screenshots/gate-login-result.png',
      fullPage: true 
    });
    
    // Check if we got an error message
    const errorMessage = await page.locator('.error, .alert, [role="alert"]').first();
    if (await errorMessage.isVisible()) {
      console.log('Error message:', await errorMessage.textContent());
    }
  });
});