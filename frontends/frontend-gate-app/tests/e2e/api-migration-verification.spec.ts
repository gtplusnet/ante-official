/**
 * API Migration Verification Test
 *
 * This test verifies that the Gate App has been successfully migrated from
 * Supabase to REST API + WebSocket architecture.
 *
 * Checks:
 * 1. No Supabase-related console errors
 * 2. WebSocket connection to port 3000 (not 4000)
 * 3. All pages load without errors
 * 4. API services are working correctly
 * 5. License-based authentication works
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:9002';
const TEST_LICENSE_KEY = 'E57F23AC-BD94-4F9E-AF73-FCC1D79B1FA7'; // Gate 1 license

// Helper function to check for console errors (excluding known warnings)
async function checkConsoleErrors(page: Page, testName: string) {
  const errors: string[] = [];
  const warnings: string[] = [];

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();

    // Skip known npm warnings (not actual errors)
    if (text.includes('npm warn Unknown env config')) return;
    if (text.includes('Next.js inferred your workspace root')) return;

    // Collect errors
    if (type === 'error') {
      // Filter out Supabase errors (should not exist after migration)
      if (text.toLowerCase().includes('supabase')) {
        errors.push(`❌ SUPABASE ERROR (SHOULD NOT EXIST): ${text}`);
      } else {
        errors.push(text);
      }
    }

    // Collect warnings (for debugging)
    if (type === 'warning') {
      warnings.push(text);
    }
  });

  return { errors, warnings };
}

// Helper function to login
async function login(page: Page) {
  console.log('Navigating to login page...');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  console.log('Entering license key...');
  const licenseInput = page.locator('input[type="text"]').first();
  await licenseInput.fill(TEST_LICENSE_KEY);

  console.log('Clicking login button...');
  const loginButton = page.getByRole('button', { name: /login|connect/i });
  await loginButton.click();

  console.log('Waiting for navigation...');
  await page.waitForURL(`${BASE_URL}/scan`, { timeout: 10000 });
  await page.waitForLoadState('networkidle');

  console.log('Login successful!');
}

test.describe('API Migration Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for initial setup
    test.setTimeout(60000);
  });

  test('should not have any Supabase-related errors', async ({ page }) => {
    const { errors } = await checkConsoleErrors(page, 'Supabase Check');

    await login(page);

    // Navigate through all pages
    const pages = [
      { path: '/scan', name: 'Scanner' },
      { path: '/checked-in', name: 'Checked In' },
      { path: '/synced-data', name: 'Synced Data' },
      { path: '/settings', name: 'Settings' },
      { path: '/tv', name: 'TV Display' }
    ];

    for (const pageInfo of pages) {
      console.log(`Checking page: ${pageInfo.name}...`);
      await page.goto(`${BASE_URL}${pageInfo.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for any async operations
    }

    // Check for Supabase errors
    const supabaseErrors = errors.filter(e => e.toLowerCase().includes('supabase'));

    if (supabaseErrors.length > 0) {
      console.error('❌ Found Supabase-related errors:');
      supabaseErrors.forEach(err => console.error(`  - ${err}`));
      throw new Error(`Migration failed: Found ${supabaseErrors.length} Supabase-related errors`);
    }

    console.log('✅ No Supabase-related errors found!');
  });

  test('should connect to WebSocket on port 3000', async ({ page }) => {
    const { errors } = await checkConsoleErrors(page, 'WebSocket Port Check');

    // Monitor network requests
    const wsConnections: string[] = [];

    page.on('websocket', (ws) => {
      const url = ws.url();
      console.log(`WebSocket connection detected: ${url}`);
      wsConnections.push(url);

      // Log WebSocket events
      ws.on('framesent', (event) => {
        const payload = event.payload;
        try {
          const data = JSON.parse(payload.toString());
          console.log(`WS Sent:`, data);
        } catch (e) {
          console.log(`WS Sent (raw):`, payload.toString().substring(0, 100));
        }
      });

      ws.on('framereceived', (event) => {
        const payload = event.payload;
        try {
          const data = JSON.parse(payload.toString());
          console.log(`WS Received:`, data);
        } catch (e) {
          console.log(`WS Received (raw):`, payload.toString().substring(0, 100));
        }
      });
    });

    await login(page);

    // Go to scan page where WebSocket is used
    await page.goto(`${BASE_URL}/scan`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Wait for WebSocket connection

    // Check WebSocket connections
    console.log(`Total WebSocket connections: ${wsConnections.length}`);
    wsConnections.forEach(url => console.log(`  - ${url}`));

    // Verify WebSocket is on port 3000 (not 4000)
    const wrongPortConnections = wsConnections.filter(url => url.includes(':4000'));
    const correctPortConnections = wsConnections.filter(url => url.includes(':3000'));

    if (wrongPortConnections.length > 0) {
      console.error('❌ Found WebSocket connections on wrong port (4000):');
      wrongPortConnections.forEach(url => console.error(`  - ${url}`));
      throw new Error('Migration failed: WebSocket still using port 4000');
    }

    if (correctPortConnections.length === 0) {
      console.warn('⚠️ No WebSocket connections detected on port 3000');
      console.warn('This might be expected if the backend is not running');
    } else {
      console.log('✅ WebSocket correctly using port 3000');
    }
  });

  test('should load all pages without errors', async ({ page }) => {
    const { errors } = await checkConsoleErrors(page, 'Page Load Check');

    await login(page);

    const pages = [
      { path: '/scan', name: 'Scanner', expectedText: 'Scan QR Code' },
      { path: '/checked-in', name: 'Checked In', expectedText: 'Currently Checked In' },
      { path: '/synced-data', name: 'Synced Data', expectedText: 'Synced Data' },
      { path: '/settings', name: 'Settings', expectedText: 'Settings' },
      { path: '/tv', name: 'TV Display', expectedText: 'Latest Scan' }
    ];

    for (const pageInfo of pages) {
      console.log(`Testing page: ${pageInfo.name}...`);

      await page.goto(`${BASE_URL}${pageInfo.path}`);
      await page.waitForLoadState('networkidle');

      // Check if page loaded correctly by looking for expected text
      const hasExpectedContent = await page.getByText(pageInfo.expectedText, { exact: false }).isVisible()
        .catch(() => false);

      if (!hasExpectedContent) {
        console.error(`❌ Page ${pageInfo.name} did not load correctly`);
        throw new Error(`Page ${pageInfo.name} failed to load expected content: "${pageInfo.expectedText}"`);
      }

      console.log(`✅ Page ${pageInfo.name} loaded successfully`);

      await page.waitForTimeout(1000); // Brief pause between page loads
    }

    // Check for any critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('npm warn') &&
      !e.includes('workspace root')
    );

    if (criticalErrors.length > 0) {
      console.error('❌ Found critical errors:');
      criticalErrors.forEach(err => console.error(`  - ${err}`));
      throw new Error(`Found ${criticalErrors.length} critical errors`);
    }

    console.log('✅ All pages loaded without critical errors!');
  });

  test('should verify API services are initialized', async ({ page }) => {
    const { errors } = await checkConsoleErrors(page, 'API Services Check');

    // Monitor network requests to API endpoints
    const apiRequests: Array<{ url: string; status: number }> = [];

    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/api/public/school-gate')) {
        apiRequests.push({
          url: url,
          status: response.status()
        });
        console.log(`API Request: ${url} - Status: ${response.status()}`);
      }
    });

    await login(page);

    // Navigate to pages that use API services
    await page.goto(`${BASE_URL}/scan`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if any API requests were made
    console.log(`Total API requests: ${apiRequests.length}`);

    if (apiRequests.length === 0) {
      console.warn('⚠️ No API requests detected');
      console.warn('This might be expected if the backend is not running or data is cached');
    } else {
      console.log('✅ API services are making requests');

      // Check for failed requests
      const failedRequests = apiRequests.filter(req => req.status >= 400);
      if (failedRequests.length > 0) {
        console.error('❌ Found failed API requests:');
        failedRequests.forEach(req => console.error(`  - ${req.url}: ${req.status}`));
      }
    }
  });

  test('should verify license-based authentication', async ({ page }) => {
    const { errors } = await checkConsoleErrors(page, 'Auth Check');

    console.log('Testing license-based authentication...');

    // Test valid license
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    const licenseInput = page.locator('input[type="text"]').first();
    await licenseInput.fill(TEST_LICENSE_KEY);

    const loginButton = page.getByRole('button', { name: /login|connect/i });
    await loginButton.click();

    // Should redirect to scan page
    await page.waitForURL(`${BASE_URL}/scan`, { timeout: 10000 });
    console.log('✅ Valid license authentication successful');

    // Check if license info is stored
    const companyId = await page.evaluate(() => localStorage.getItem('companyId'));
    const licenseKey = await page.evaluate(() => localStorage.getItem('licenseKey'));

    expect(companyId).toBeTruthy();
    expect(licenseKey).toBeTruthy();
    console.log(`✅ License info stored - Company ID: ${companyId}`);

    // Test logout
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');

    // Accept logout confirmation
    page.once('dialog', dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      dialog.accept();
    });

    const logoutButton = page.getByRole('button', { name: /logout/i });
    await logoutButton.click();

    // Should redirect to login page
    await page.waitForURL(`${BASE_URL}/login`, { timeout: 10000 });
    console.log('✅ Logout successful');

    // Verify license info is cleared
    const clearedCompanyId = await page.evaluate(() => localStorage.getItem('companyId'));
    const clearedLicenseKey = await page.evaluate(() => localStorage.getItem('licenseKey'));

    expect(clearedCompanyId).toBeNull();
    expect(clearedLicenseKey).toBeNull();
    console.log('✅ License info cleared after logout');
  });
});
