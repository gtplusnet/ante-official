import { test, expect, ConsoleMessage } from '@playwright/test';

/**
 * Gate App Final Verification Test
 *
 * Simple test to verify the gate app is working without console errors
 */

test.describe('Gate App - Final Verification', () => {
  const GATE_APP_URL = 'http://192.168.1.163:9002';
  const consoleErrors: ConsoleMessage[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg);
        console.log(`❌ [CONSOLE ERROR] ${msg.text()}`);
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      console.log(`❌ [PAGE ERROR] ${error.message}`);
    });

    // Capture failed requests
    page.on('requestfailed', (request) => {
      const failure = request.failure();
      if (failure) {
        console.log(`⚠️  [REQUEST FAILED] ${request.url()}: ${failure.errorText}`);
      }
    });
  });

  test('should load gate app without console errors', async ({ page }) => {
    console.log('🚀 Testing Gate App at:', GATE_APP_URL);

    // Navigate to gate app
    const response = await page.goto(GATE_APP_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log(`📡 Response status: ${response?.status()}`);
    expect(response?.status()).toBe(200);

    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({
      path: 'playwright-testing/test-results/gate-app-final-check.png',
      fullPage: true
    });

    // Get page title
    const title = await page.title();
    console.log(`📄 Page Title: "${title}"`);

    // Check for main content
    const mainContent = page.locator('main');
    const hasContent = await mainContent.count() > 0;
    console.log(`📦 Main content found: ${hasContent}`);

    // Print console error summary
    console.log(`\n📊 Test Results:`);
    console.log(`   Console Errors: ${consoleErrors.length}`);

    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors Found:');
      consoleErrors.forEach((msg, index) => {
        console.log(`   ${index + 1}. ${msg.text()}`);
      });
    } else {
      console.log('   ✅ No console errors detected!');
    }

    // Verify no console errors
    expect(consoleErrors.length,
      `Found ${consoleErrors.length} console errors`
    ).toBe(0);
  });

  test('should navigate and interact without errors', async ({ page }) => {
    await page.goto(GATE_APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const initialErrorCount = consoleErrors.length;
    console.log(`\n🧪 Testing interactions...`);
    console.log(`   Initial errors: ${initialErrorCount}`);

    // Try to find input fields
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    console.log(`   Found ${inputCount} input fields`);

    if (inputCount > 0) {
      // Try to interact with first input
      const firstInput = inputs.first();
      if (await firstInput.isVisible()) {
        console.log('   Typing in first input field...');
        await firstInput.fill('TEST123');
        await page.waitForTimeout(1000);
      }
    }

    // Check for any new errors after interaction
    const newErrors = consoleErrors.slice(initialErrorCount);
    console.log(`   New errors after interaction: ${newErrors.length}`);

    if (newErrors.length > 0) {
      console.log('\n❌ Errors during interaction:');
      newErrors.forEach((msg, index) => {
        console.log(`   ${index + 1}. ${msg.text()}`);
      });
    } else {
      console.log('   ✅ No errors during interaction!');
    }

    expect(newErrors.length,
      `Found ${newErrors.length} console errors during interaction`
    ).toBe(0);
  });

  test('should have correct page structure', async ({ page }) => {
    await page.goto(GATE_APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('\n🔍 Checking page structure...');

    // Check for main element
    const main = page.locator('main');
    const hasMain = await main.count() > 0;
    console.log(`   Main element: ${hasMain ? '✅' : '❌'}`);

    // Check for form element
    const form = page.locator('form');
    const hasForm = await form.count() > 0;
    console.log(`   Form element: ${hasForm ? '✅' : '❌'}`);

    // Check page title
    const title = await page.title();
    console.log(`   Page title: ${title}`);
    expect(title.length).toBeGreaterThan(0);

    // No console errors during structure check
    console.log(`   Console errors: ${consoleErrors.length === 0 ? '✅ None' : `❌ ${consoleErrors.length}`}`);
    expect(consoleErrors.length).toBe(0);
  });
});
