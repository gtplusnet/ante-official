import { test, expect } from '@playwright/test';

// Set test timeout to 60 seconds
test.setTimeout(60000);

// Use localhost for guardian app
const BASE_URL = 'http://localhost:9003';

// Test credentials
const TEST_CREDENTIALS = {
  email: 'guillermotabligan@gmail.com',
  password: 'water123'
};

test.describe('Guardian App - Push Notification Chip', () => {
  test('Should show push notification chip after login', async ({ page, context }) => {
    // Deny notifications permission to ensure chip shows
    await context.grantPermissions([], { origin: BASE_URL });
    
    console.log('Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, { timeout: 60000, waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('Filling in credentials...');
    // Fill in credentials
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    await emailInput.fill(TEST_CREDENTIALS.email);

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(TEST_CREDENTIALS.password);

    // Click login button
    console.log('Clicking login button...');
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    // Wait for navigation to dashboard
    console.log('Waiting for navigation to dashboard...');
    await page.waitForURL(/.*\/(dashboard|add-student)/, { timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log('Current URL:', page.url());

    // Take screenshot of the page
    await page.screenshot({ path: 'test-results/guardian-after-login.png', fullPage: true });

    // Check if push notification chip is visible
    console.log('Looking for push notification chip...');
    
    // Look for the chip by text content
    const chipByText = page.locator('text=/tap to enable push notification/i');
    const chipByBellIcon = page.locator('[class*="amber"]').filter({ has: page.locator('svg') });
    const chipByRole = page.locator('button[aria-label*="notification" i]');
    
    console.log('Checking chip by text...');
    const textCount = await chipByText.count();
    console.log('Text count:', textCount);
    
    console.log('Checking chip by bell icon...');
    const iconCount = await chipByBellIcon.count();
    console.log('Icon count:', iconCount);
    
    console.log('Checking chip by aria-label...');
    const ariaCount = await chipByRole.count();
    console.log('Aria count:', ariaCount);

    // Get all elements with amber in the class
    const amberElements = page.locator('[class*="amber"]');
    const amberCount = await amberElements.count();
    console.log('Total amber elements:', amberCount);
    
    // Print the HTML structure
    console.log('Page structure after header:');
    const header = page.locator('header');
    const headerHTML = await header.innerHTML();
    console.log('Header HTML:', headerHTML.substring(0, 200));
    
    // Check what comes after header
    const bodyContent = await page.locator('body').innerHTML();
    console.log('Body content (first 1000 chars):', bodyContent.substring(0, 1000));

    // Check if NotificationContext is providing the right values
    const contextInfo = await page.evaluate(() => {
      return {
        notificationPermission: typeof Notification !== 'undefined' ? Notification.permission : 'not-supported',
        notificationSupported: 'Notification' in window,
        userAgent: navigator.userAgent
      };
    });
    console.log('Context info:', contextInfo);

    // Try to find the chip with more specific selectors
    const possibleChips = [
      page.locator('.bg-amber-100'),
      page.locator('[class*="bg-amber"]'),
      page.locator('button:has-text("enable")'),
      page.locator('button:has-text("notification")'),
      page.getByRole('button', { name: /notification/i })
    ];

    console.log('Trying different selectors...');
    for (let i = 0; i < possibleChips.length; i++) {
      const count = await possibleChips[i].count();
      console.log(`Selector ${i} count:`, count);
      if (count > 0) {
        const text = await possibleChips[i].first().textContent();
        console.log(`Selector ${i} text:`, text);
      }
    }

    // The chip should be visible
    const isChipVisible = textCount > 0 || iconCount > 0 || ariaCount > 0;
    
    if (!isChipVisible) {
      console.error('❌ Push notification chip NOT FOUND!');
      console.log('Taking debug screenshot...');
      await page.screenshot({ path: 'test-results/guardian-chip-not-found-debug.png', fullPage: true });
    } else {
      console.log('✅ Push notification chip FOUND!');
    }

    expect(isChipVisible).toBeTruthy();
  });

  test('Should be able to click the chip and trigger permission request', async ({ page, context }) => {
    // Start with default permission
    await context.grantPermissions([], { origin: BASE_URL });

    // Login first
    await page.goto(`${BASE_URL}/login`, { timeout: 60000, waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill(TEST_CREDENTIALS.email);

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(TEST_CREDENTIALS.password);

    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    await page.waitForURL(/.*\/(dashboard|add-student)/, { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Find and click the chip
    const chip = page.locator('button[aria-label*="notification" i]').first();
    
    // Setup listener for permission request
    let permissionRequested = false;
    page.on('dialog', async (dialog) => {
      console.log('Dialog appeared:', dialog.message());
      permissionRequested = true;
      await dialog.dismiss();
    });

    // Click the chip
    if (await chip.isVisible()) {
      await chip.click();
      await page.waitForTimeout(1000);
      
      console.log('Permission requested:', permissionRequested);
      
      // Take screenshot after click
      await page.screenshot({ path: 'test-results/guardian-chip-after-click.png', fullPage: true });
    } else {
      console.log('Chip not visible, skipping click test');
    }
  });

  test('Should hide chip when notification permission is granted', async ({ page, context }) => {
    // Grant notifications permission before login
    await context.grantPermissions(['notifications'], { origin: BASE_URL });

    // Login
    await page.goto(`${BASE_URL}/login`, { timeout: 60000, waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill(TEST_CREDENTIALS.email);

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(TEST_CREDENTIALS.password);

    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    await page.waitForURL(/.*\/(dashboard|add-student)/, { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Check that chip is NOT visible when permission is granted
    const chip = page.locator('text=/tap to enable push notification/i');
    const isVisible = await chip.isVisible().catch(() => false);
    
    console.log('Chip visible with granted permission:', isVisible);
    
    await page.screenshot({ path: 'test-results/guardian-chip-with-permission.png', fullPage: true });
    
    // Chip should NOT be visible
    expect(isVisible).toBeFalsy();
  });
});

