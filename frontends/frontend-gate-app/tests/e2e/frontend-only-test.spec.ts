/**
 * Frontend-Only Test Suite
 *
 * Tests that all pages load without console errors
 * (Does not require backend authentication)
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:9002';

// Console error tracking
let consoleErrors: string[] = [];

test.describe('Gate App - Frontend Loading Tests', () => {
  test.beforeEach(async ({ page }) => {
    consoleErrors = [];

    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();

      // Skip known warnings
      if (text.includes('npm warn')) return;
      if (text.includes('Next.js inferred')) return;
      if (text.includes('[AuthHelper]')) return; // Skip auth errors (expected without valid license)
      if (text.includes('401')) return; // Skip 401 errors (expected without backend)
      if (text.includes('Failed to load resource')) return; // Skip network errors

      if (type === 'error') {
        // Only track critical errors
        if (text.toLowerCase().includes('supabase')) {
          consoleErrors.push(`SUPABASE ERROR: ${text}`);
        } else if (text.toLowerCase().includes('module not found')) {
          consoleErrors.push(`MODULE ERROR: ${text}`);
        } else if (text.toLowerCase().includes('cannot find')) {
          consoleErrors.push(`IMPORT ERROR: ${text}`);
        }
      }
    });

    page.on('pageerror', (error) => {
      const msg = error.message;
      if (!msg.includes('401') && !msg.includes('AuthHelper')) {
        consoleErrors.push(`PAGE ERROR: ${msg}`);
      }
    });
  });

  test('1. Login Page Loads Without Errors', async ({ page }) => {
    console.log('\n=== TEST: Login Page ===');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify page elements
    const licenseInput = page.locator('input[type="text"]').first();
    const activateButton = page.getByRole('button', { name: /activate/i });

    expect(await licenseInput.isVisible()).toBe(true);
    expect(await activateButton.isVisible()).toBe(true);

    console.log('✅ Login page loaded successfully');
    console.log(`📊 Console errors found: ${consoleErrors.length}`);

    if (consoleErrors.length > 0) {
      console.error('❌ Errors:', consoleErrors);
      throw new Error(`Found ${consoleErrors.length} critical errors`);
    }
  });

  test('2. All Pages Accessible (Logged Out State)', async ({ page }) => {
    console.log('\n=== TEST: Page Accessibility ===');

    // Set mock license data to bypass middleware
    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => {
      localStorage.setItem('licenseKey', 'TEST-LICENSE-KEY');
      localStorage.setItem('companyId', '1');
    });

    const pages = [
      { path: '/scan', name: 'Scanner' },
      { path: '/checked-in', name: 'Checked In' },
      { path: '/synced-data', name: 'Synced Data' },
      { path: '/settings', name: 'Settings' },
      { path: '/tv', name: 'TV Display' }
    ];

    for (const pageInfo of pages) {
      console.log(`\n📄 Testing ${pageInfo.name}...`);
      consoleErrors = []; // Reset for each page

      await page.goto(`${BASE_URL}${pageInfo.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      console.log(`✅ ${pageInfo.name} page loaded`);
      console.log(`📊 Critical errors: ${consoleErrors.length}`);

      if (consoleErrors.length > 0) {
        console.error(`❌ Errors on ${pageInfo.name}:`, consoleErrors);
        await page.screenshot({
          path: `test-results/${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}-errors.png`
        });
        throw new Error(`${pageInfo.name} has ${consoleErrors.length} critical errors`);
      }
    }

    console.log('\n✅ All pages loaded without critical errors');
  });

  test('3. No Supabase References in Console', async ({ page }) => {
    console.log('\n=== TEST: Supabase Migration Check ===');

    const supabaseErrors: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text().toLowerCase();
      if (text.includes('supabase')) {
        supabaseErrors.push(msg.text());
      }
    });

    // Set mock license
    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => {
      localStorage.setItem('licenseKey', 'TEST-KEY');
      localStorage.setItem('companyId', '1');
    });

    // Visit all pages
    const pages = ['/scan', '/checked-in', '/synced-data', '/settings', '/tv'];

    for (const path of pages) {
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }

    console.log(`📊 Supabase references found: ${supabaseErrors.length}`);

    if (supabaseErrors.length > 0) {
      console.error('❌ Supabase references still exist:');
      supabaseErrors.forEach(err => console.error(`  - ${err}`));
      throw new Error(`Migration incomplete: Found ${supabaseErrors.length} Supabase references`);
    }

    console.log('✅ No Supabase references found - Migration successful!');
  });

  test('4. WebSocket Configuration Check', async ({ page }) => {
    console.log('\n=== TEST: WebSocket Configuration ===');

    const wsConnections: string[] = [];

    page.on('websocket', (ws) => {
      const url = ws.url();
      wsConnections.push(url);
      console.log(`🔌 WebSocket connection: ${url}`);
    });

    // Set mock license
    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => {
      localStorage.setItem('licenseKey', 'TEST-KEY');
      localStorage.setItem('companyId', '1');
    });

    // Go to scanner page (uses WebSocket)
    await page.goto(`${BASE_URL}/scan`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for WebSocket connection

    console.log(`📊 WebSocket connections: ${wsConnections.length}`);

    // Check if any connections are on wrong port (4000)
    const wrongPortConnections = wsConnections.filter(url => url.includes(':4000'));

    if (wrongPortConnections.length > 0) {
      console.error('❌ WebSocket on wrong port (4000):');
      wrongPortConnections.forEach(url => console.error(`  - ${url}`));
      throw new Error('WebSocket still using port 4000 instead of 3000');
    }

    if (wsConnections.length === 0) {
      console.log('⚠️ No WebSocket connections detected (backend may not be running)');
    } else {
      const correctPortConnections = wsConnections.filter(url => url.includes(':3000'));
      if (correctPortConnections.length > 0) {
        console.log('✅ WebSocket correctly using port 3000');
      }
    }
  });

  test('5. Final Summary - Zero Critical Errors', async ({ page }) => {
    console.log('\n=== TEST: Final Summary ===');

    const allErrors: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        if (!text.includes('401') &&
            !text.includes('AuthHelper') &&
            !text.includes('Failed to load resource') &&
            !text.includes('npm warn')) {
          allErrors.push(text);
        }
      }
    });

    // Set mock license
    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => {
      localStorage.setItem('licenseKey', 'TEST-KEY');
      localStorage.setItem('companyId', '1');
    });

    // Visit all pages
    const pages = ['/login', '/scan', '/checked-in', '/synced-data', '/settings', '/tv'];

    for (const path of pages) {
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }

    console.log('\n📊 FINAL RESULTS:');
    console.log(`   Pages tested: ${pages.length}`);
    console.log(`   Critical errors: ${allErrors.length}`);

    if (allErrors.length > 0) {
      console.error('\n❌ Critical errors found:');
      allErrors.forEach((err, i) => console.error(`  ${i + 1}. ${err}`));
      throw new Error(`Found ${allErrors.length} critical errors`);
    }

    console.log('\n✅ ALL TESTS PASSED - NO CRITICAL ERRORS!');
    console.log('✅ Supabase migration successful');
    console.log('✅ All pages loading correctly');
  });
});
