import { test } from '@playwright/test';

test.describe('Visual Check of All Pages', () => {
  test('Login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/pages/login.png', fullPage: true });
  });

  test('Direct access to protected pages', async ({ page }) => {
    // Set localStorage to bypass auth
    await page.addInitScript(() => {
      localStorage.setItem('licenseKey', 'test-license-key');
    });

    // Dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/pages/dashboard.png', fullPage: true });

    // Scan Module
    await page.goto('/scan');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/pages/scan.png', fullPage: true });

    // TV Module
    await page.goto('/tv');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/pages/tv.png', fullPage: true });

    // Settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/pages/settings.png', fullPage: true });
  });

  test('Responsive views', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('licenseKey', 'test-license-key');
    });

    // Mobile views
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/dashboard');
    await page.screenshot({ path: 'tests/screenshots/responsive/mobile-dashboard.png', fullPage: true });
    
    await page.goto('/scan');
    await page.screenshot({ path: 'tests/screenshots/responsive/mobile-scan.png', fullPage: true });

    // Tablet views
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/tv');
    await page.screenshot({ path: 'tests/screenshots/responsive/tablet-tv.png', fullPage: true });
    
    await page.goto('/settings');
    await page.screenshot({ path: 'tests/screenshots/responsive/tablet-settings.png', fullPage: true });

    // Desktop wide view
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.goto('/tv');
    await page.screenshot({ path: 'tests/screenshots/responsive/desktop-tv.png', fullPage: true });
  });
});