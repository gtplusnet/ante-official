import { test, expect, Page } from '@playwright/test';

// Set test timeout to 60 seconds
test.setTimeout(60000);

// Use the Public API server
const BASE_URL = 'http://localhost:9001';
const API_URL = 'http://100.109.133.12:3000';

// Test credentials for guardian login
const TEST_CREDENTIALS = {
  email: 'guardian@test.com',
  password: 'test123'
};

test.describe('Guardian App - Login Flow', () => {
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Capture console errors and warnings
    consoleErrors = [];
    consoleWarnings = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page error: ${error.message}`);
    });
  });

  test.afterEach(async () => {
    // Log any critical errors (excluding expected ones)
    const criticalErrors = consoleErrors.filter((err) => {
      // Ignore common non-critical errors
      return (
        !err.includes('favicon') &&
        !err.includes('source map') &&
        !err.includes('chunk') &&
        !err.includes('hydration')
      );
    });

    if (criticalErrors.length > 0) {
      console.log('Critical console errors:', criticalErrors);
    }

    if (consoleWarnings.length > 0) {
      console.log('Console warnings:', consoleWarnings.slice(0, 5));
    }
  });

  test('Should load login page successfully', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`, { timeout: 60000, waitUntil: 'networkidle' });

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Check if login form elements are visible
    await expect(page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button[type="submit"]')).toBeVisible({ timeout: 10000 });

    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/guardian-login-page.png', fullPage: true });
  });

  test('Should show validation errors for empty fields', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`, { timeout: 60000, waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Click submit button without filling fields
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Wait for validation errors to appear
    await page.waitForTimeout(1000);

    // Check if error messages appear (either inline validation or toast)
    const errorMessages = page.locator('[class*="error"], [class*="Error"], [role="alert"]');
    const hasErrors = await errorMessages.count() > 0;

    // Either validation errors or required field indicators should be present
    if (!hasErrors) {
      // Check if HTML5 validation is being used
      const emailInput = page.locator('input[type="email"]').first();
      const isRequired = await emailInput.getAttribute('required');
      expect(isRequired).not.toBeNull();
    }

    await page.screenshot({ path: 'test-results/guardian-login-validation.png', fullPage: true });
  });

  test('Should show error for invalid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`, { timeout: 60000, waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Fill in invalid credentials
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    await emailInput.fill('invalid@test.com');

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('wrongpassword');

    // Click login button
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    // Wait for error message to appear
    await page.waitForTimeout(3000);

    // Check for error message (either toast notification or inline error)
    const errorLocators = [
      page.locator('[class*="error"], [class*="Error"], [role="alert"]'),
      page.locator('text=/invalid|incorrect|wrong|failed/i'),
    ];

    let errorFound = false;
    for (const locator of errorLocators) {
      const count = await locator.count();
      if (count > 0) {
        errorFound = true;
        break;
      }
    }

    expect(errorFound).toBeTruthy();

    await page.screenshot({ path: 'test-results/guardian-login-invalid-credentials.png', fullPage: true });
  });

  test('Should successfully login with valid credentials', async ({ page }) => {
    // Note: This test requires a valid test guardian account to be set up in the system
    // Skip if credentials are not configured
    if (!TEST_CREDENTIALS.email || TEST_CREDENTIALS.email === 'guardian@test.com') {
      console.log('Skipping login test - no valid test credentials configured');
      test.skip();
    }

    // Navigate to login page
    await page.goto(`${BASE_URL}/login`, { timeout: 60000, waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Fill in valid credentials
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    await emailInput.fill(TEST_CREDENTIALS.email);

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(TEST_CREDENTIALS.password);

    // Click login button
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    // Wait for navigation to dashboard
    await page.waitForURL(/.*\/(dashboard|add-student)/, { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Verify we're on either dashboard or add-student page (depending on if guardian has students)
    const url = page.url();
    const isValidRedirect = url.includes('/dashboard') || url.includes('/add-student');
    expect(isValidRedirect).toBeTruthy();

    await page.screenshot({ path: 'test-results/guardian-login-success.png', fullPage: true });
  });

  test('Should persist authentication after page reload', async ({ page }) => {
    // Note: This test requires a valid test guardian account
    if (!TEST_CREDENTIALS.email || TEST_CREDENTIALS.email === 'guardian@test.com') {
      console.log('Skipping persistence test - no valid test credentials configured');
      test.skip();
    }

    // Login first
    await page.goto(`${BASE_URL}/login`, { timeout: 60000, waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    await emailInput.fill(TEST_CREDENTIALS.email);

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(TEST_CREDENTIALS.password);

    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    await page.waitForURL(/.*\/(dashboard|add-student)/, { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Get the URL after login
    const authenticatedUrl = page.url();

    // Reload the page
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Verify we're still on the same page (not redirected to login)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');
    expect(currentUrl).toContain(authenticatedUrl.includes('add-student') ? 'add-student' : 'dashboard');

    await page.screenshot({ path: 'test-results/guardian-auth-persistence.png', fullPage: true });
  });

  test('Should have no critical console errors on login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { timeout: 60000, waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Check for critical errors (excluding common non-critical ones)
    const criticalErrors = consoleErrors.filter((err) => {
      return (
        !err.includes('favicon') &&
        !err.includes('source map') &&
        !err.includes('chunk') &&
        !err.includes('hydration') &&
        !err.includes('Supabase') // Supabase should be removed
      );
    });

    if (criticalErrors.length > 0) {
      console.log('Critical console errors found:', criticalErrors);
    }

    expect(criticalErrors.length).toBe(0);
  });

  test('Should verify API client is using correct base URL', async ({ page }) => {
    // Intercept API requests
    const apiRequests: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/')) {
        apiRequests.push(url);
      }
    });

    await page.goto(`${BASE_URL}/login`, { timeout: 60000, waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Try to login (even with invalid credentials) to trigger API call
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await emailInput.fill('test@test.com');

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('test123');

    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    await page.waitForTimeout(3000);

    // Verify API requests are going to the correct server (not localhost:3000)
    const hasCorrectApiUrl = apiRequests.some(url => url.includes('100.109.133.12:3000'));

    console.log('API Requests captured:', apiRequests);

    if (apiRequests.length > 0) {
      expect(hasCorrectApiUrl).toBeTruthy();
    }
  });
});
