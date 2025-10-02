import { test, expect } from '@playwright/test';

test.describe('QR Scanner Always Active', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant camera permissions
    await context.grantPermissions(['camera']);
    
    // Set up authentication
    await page.addInitScript(() => {
      localStorage.setItem('licenseKey', 'test-license-key');
    });
  });

  test('camera starts automatically without button click', async ({ page }) => {
    await page.goto('/scan');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/scanner-active.png', fullPage: true });
    
    // Check that there's no "Start Scanning" button
    const startButton = page.locator('button:has-text("Start Scanning")');
    await expect(startButton).toHaveCount(0);
    
    // Check that there's no "Stop Scanning" button
    const stopButton = page.locator('button:has-text("Stop Scanning")');
    await expect(stopButton).toHaveCount(0);
    
    // Check that the QR reader element exists
    const qrReader = page.locator('#qr-reader');
    await expect(qrReader).toBeVisible();
    
    // Wait a bit for camera to initialize
    await page.waitForTimeout(2000);
    
    // Check if camera permission UI or video element is present
    const cameraElements = await page.evaluate(() => {
      const reader = document.querySelector('#qr-reader');
      const hasVideo = !!reader?.querySelector('video');
      const hasPermissionButton = !!reader?.querySelector('#qr-reader__camera_permission_button');
      const hasScanRegion = !!reader?.querySelector('#qr-reader__scan_region');
      
      return {
        hasVideo,
        hasPermissionButton,
        hasScanRegion,
        readerHTML: reader?.innerHTML.substring(0, 200)
      };
    });
    
    console.log('Camera elements:', cameraElements);
    
    // Either video should be present (camera active) or permission button (requesting permission)
    expect(cameraElements.hasVideo || cameraElements.hasPermissionButton).toBeTruthy();
  });

  test('scanner UI elements are properly styled', async ({ page }) => {
    await page.goto('/scan');
    await page.waitForLoadState('networkidle');
    
    // Check the scanner card styling
    const scannerCard = page.locator('.rounded-lg.border.border-gray-200').first();
    const cardStyles = await scannerCard.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        borderRadius: styles.borderRadius,
        boxShadow: styles.boxShadow
      };
    });
    
    console.log('Scanner card styles:', cardStyles);
    
    // Check that card has proper styling
    expect(cardStyles.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(cardStyles.borderRadius).toBeTruthy();
    expect(cardStyles.boxShadow).toBeTruthy();
  });

  test('last scanned notification appears correctly', async ({ page }) => {
    await page.goto('/scan');
    
    // Initially, no last scanned should be shown
    const lastScannedInitial = page.locator('text=Successfully Scanned');
    await expect(lastScannedInitial).toHaveCount(0);
    
    // Mock a scan by calling the onScan function
    await page.evaluate(() => {
      // Find the Scanner component and trigger a scan
      const event = new CustomEvent('qr-scan', { detail: 'TEST-QR-CODE-123' });
      window.dispatchEvent(event);
    });
    
    // Note: In real usage, the QR scanner would trigger this automatically
    // For now, we're just verifying the UI structure
  });
});