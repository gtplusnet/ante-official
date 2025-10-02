import { test, expect } from '@playwright/test';

test.describe('Verify All Pages Styling', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication
    await page.goto('/login');
    await page.fill('input[type="text"]', 'test-license-key');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('Dashboard page has proper styling', async ({ page }) => {
    await page.goto('/dashboard');
    await page.screenshot({ path: 'tests/screenshots/dashboard.png', fullPage: true });
    
    const title = await page.locator('h1');
    await expect(title).toHaveText('Welcome to School Gatekeep');
    
    const navigation = await page.locator('nav');
    await expect(navigation).toBeVisible();
  });

  test('Scan module has proper styling', async ({ page }) => {
    await page.goto('/scan');
    await page.screenshot({ path: 'tests/screenshots/scan-module.png', fullPage: true });
    
    const title = await page.locator('h1');
    await expect(title).toHaveText('QR Code Scanner');
    
    // Check for scanner card
    const scannerCard = await page.locator('text=Scanner').first();
    await expect(scannerCard).toBeVisible();
  });

  test('TV module has proper styling', async ({ page }) => {
    await page.goto('/tv');
    await page.screenshot({ path: 'tests/screenshots/tv-module.png', fullPage: true });
    
    const title = await page.locator('h1');
    await expect(title).toHaveText('Attendance Display');
    
    // Check for attendance cards
    const latestCheckin = await page.locator('text=Latest Check-in').first();
    await expect(latestCheckin).toBeVisible();
  });

  test('Settings page has proper styling', async ({ page }) => {
    await page.goto('/settings');
    await page.screenshot({ path: 'tests/screenshots/settings.png', fullPage: true });
    
    const title = await page.locator('h1');
    await expect(title).toHaveText('Settings');
    
    // Check for settings cards
    const generalSettings = await page.locator('text=General Settings').first();
    await expect(generalSettings).toBeVisible();
  });

  test('Responsive design works', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.screenshot({ path: 'tests/screenshots/mobile-dashboard.png', fullPage: true });
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/scan');
    await page.screenshot({ path: 'tests/screenshots/tablet-scan.png', fullPage: true });
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/tv');
    await page.screenshot({ path: 'tests/screenshots/desktop-tv.png', fullPage: true });
  });
});