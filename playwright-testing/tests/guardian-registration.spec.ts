import { test, expect } from '@playwright/test';

test.describe('Guardian Registration', () => {
  const baseUrl = 'http://localhost:5010';
  const uniqueEmail = `test.guardian.${Date.now()}@example.com`;

  test.beforeEach(async ({ page }) => {
    // Monitor console for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });

    // Monitor page errors
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
    });
  });

  test('should successfully register a new guardian', async ({ page }) => {
    // Capture console errors and logs
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(text);
      console.log(text);
    });

    // Navigate to registration page
    await page.goto(`${baseUrl}/register`);

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Account Registration/i })).toBeVisible();

    // Fill in registration form using input names and placeholders
    await page.locator('input[name="lastName"]').fill('TestGuardian');
    await page.locator('input[name="firstName"]').fill('John');
    await page.locator('input[name="middleName"]').fill('Michael');

    // Fill date of birth (must be 18+)
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 25);
    const dateString = eighteenYearsAgo.toISOString().split('T')[0];
    await page.locator('input[name="dateOfBirth"]').fill(dateString);

    await page.locator('input[name="email"]').fill(uniqueEmail);

    // Fill contact number (Philippine format: 10 digits starting with 9)
    await page.getByPlaceholder('9XXXXXXXXX').fill('9171234567');

    // Fill password fields
    await page.locator('input[name="password"]').fill('TestPass123');
    await page.locator('input[name="confirmPassword"]').fill('TestPass123');

    // Take screenshot before submission
    await page.screenshot({ path: 'playwright-testing/screenshots/guardian-registration-before-submit.png' });

    // Submit form
    await page.getByRole('button', { name: /Submit/i }).click();

    // Wait a bit for the request to complete
    await page.waitForTimeout(3000);

    // Take screenshot after submission
    await page.screenshot({ path: 'playwright-testing/screenshots/guardian-registration-after-submit.png' });

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after registration:', currentUrl);
    console.log('Console messages:', consoleMessages.join('\n'));

    // Wait for either add-student or dashboard page
    try {
      await page.waitForURL(/\/(dashboard|add-student)/, { timeout: 5000 });
    } catch (e) {
      // Check if there's an error message on the page
      const errorElement = await page.locator('.text-red-600').first().textContent().catch(() => null);
      if (errorElement) {
        console.log('Error message on page:', errorElement);
      }
      throw new Error(`Failed to navigate. Current URL: ${page.url()}, Error: ${errorElement || 'Unknown'}`);
    }

    // Verify successful registration by checking if we're logged in
    const finalUrl = page.url();
    console.log('Final URL after registration:', finalUrl);

    // Verify we're not on the login or register page anymore
    expect(finalUrl).not.toContain('/login');
    expect(finalUrl).not.toContain('/register');
  });

  test('should show validation error for duplicate email', async ({ page }) => {
    // First registration
    await page.goto(`${baseUrl}/register`);

    const duplicateEmail = `duplicate.${Date.now()}@example.com`;

    // Fill form
    await page.locator('input[name="lastName"]').fill('TestGuardian');
    await page.locator('input[name="firstName"]').fill('John');

    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 25);
    const dateString = eighteenYearsAgo.toISOString().split('T')[0];
    await page.locator('input[name="dateOfBirth"]').fill(dateString);

    await page.locator('input[name="email"]').fill(duplicateEmail);
    await page.getByPlaceholder('9XXXXXXXXX').fill('9171234567');
    await page.locator('input[name="password"]').fill('TestPass123');
    await page.locator('input[name="confirmPassword"]').fill('TestPass123');

    // Submit first registration
    await page.getByRole('button', { name: /Submit/i }).click();
    await page.waitForURL(/\/(dashboard|home|$)/, { timeout: 10000 });

    // Try to register again with same email
    await page.goto(`${baseUrl}/register`);

    await page.locator('input[name="lastName"]').fill('AnotherGuardian');
    await page.locator('input[name="firstName"]').fill('Jane');
    await page.locator('input[name="dateOfBirth"]').fill(dateString);
    await page.locator('input[name="email"]').fill(duplicateEmail); // Same email
    await page.getByPlaceholder('9XXXXXXXXX').fill('9181234567');
    await page.locator('input[name="password"]').fill('TestPass456');
    await page.locator('input[name="confirmPassword"]').fill('TestPass456');

    // Submit second registration
    await page.getByRole('button', { name: /Submit/i }).click();

    // Should show error message about duplicate email
    await expect(page.getByText(/already registered|email.*exists/i)).toBeVisible({ timeout: 5000 });

    // Take screenshot of error
    await page.screenshot({ path: 'playwright-testing/screenshots/guardian-registration-duplicate-error.png' });
  });

  test('should validate age requirement (18+)', async ({ page }) => {
    await page.goto(`${baseUrl}/register`);

    // Fill form with age less than 18
    await page.locator('input[name="lastName"]').fill('TestGuardian');
    await page.locator('input[name="firstName"]').fill('Young');

    // Set date of birth to 15 years ago
    const fifteenYearsAgo = new Date();
    fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
    const dateString = fifteenYearsAgo.toISOString().split('T')[0];
    await page.locator('input[name="dateOfBirth"]').fill(dateString);

    await page.locator('input[name="email"]').fill(`young.${Date.now()}@example.com`);
    await page.getByPlaceholder('9XXXXXXXXX').fill('9171234567');
    await page.locator('input[name="password"]').fill('TestPass123');
    await page.locator('input[name="confirmPassword"]').fill('TestPass123');

    // Submit form
    await page.getByRole('button', { name: /Submit/i }).click();

    // Should show age validation error
    await expect(page.getByText(/at least 18 years old/i)).toBeVisible({ timeout: 5000 });

    // Take screenshot of age validation error
    await page.screenshot({ path: 'playwright-testing/screenshots/guardian-registration-age-error.png' });
  });

  test('should validate password match', async ({ page }) => {
    await page.goto(`${baseUrl}/register`);

    await page.locator('input[name="lastName"]').fill('TestGuardian');
    await page.locator('input[name="firstName"]').fill('John');

    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 25);
    const dateString = eighteenYearsAgo.toISOString().split('T')[0];
    await page.locator('input[name="dateOfBirth"]').fill(dateString);

    await page.locator('input[name="email"]').fill(`mismatch.${Date.now()}@example.com`);
    await page.getByPlaceholder('9XXXXXXXXX').fill('9171234567');

    // Mismatched passwords
    await page.locator('input[name="password"]').fill('TestPass123');
    await page.locator('input[name="confirmPassword"]').fill('DifferentPass456');

    // Submit form
    await page.getByRole('button', { name: /Submit/i }).click();

    // Should show password mismatch error
    await expect(page.getByText(/passwords.*do not match/i)).toBeVisible({ timeout: 5000 });

    // Take screenshot of password mismatch error
    await page.screenshot({ path: 'playwright-testing/screenshots/guardian-registration-password-mismatch.png' });
  });

  test('should validate phone number format', async ({ page }) => {
    await page.goto(`${baseUrl}/register`);

    await page.locator('input[name="lastName"]').fill('TestGuardian');
    await page.locator('input[name="firstName"]').fill('John');

    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 25);
    const dateString = eighteenYearsAgo.toISOString().split('T')[0];
    await page.locator('input[name="dateOfBirth"]').fill(dateString);

    await page.locator('input[name="email"]').fill(`invalid.phone.${Date.now()}@example.com`);

    // Invalid phone format (doesn't start with 9)
    await page.getByPlaceholder('9XXXXXXXXX').fill('1234567890');

    await page.locator('input[name="password"]').fill('TestPass123');
    await page.locator('input[name="confirmPassword"]').fill('TestPass123');

    // Submit form
    await page.getByRole('button', { name: /Submit/i }).click();

    // Should show phone validation error
    await expect(page.getByText(/valid.*mobile number|10-digit/i)).toBeVisible({ timeout: 5000 });

    // Take screenshot of phone validation error
    await page.screenshot({ path: 'playwright-testing/screenshots/guardian-registration-phone-error.png' });
  });
});
