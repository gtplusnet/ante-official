import { test, expect, ConsoleMessage } from '@playwright/test';

/**
 * Gate App Console Error Detection Test
 *
 * This test navigates through the gate app and captures all console errors,
 * warnings, and messages to identify issues.
 */

test.describe('Gate App - Console Error Detection', () => {
  const GATE_APP_URL = 'http://192.168.1.163:9002';
  const consoleMessages: ConsoleMessage[] = [];
  const consoleErrors: ConsoleMessage[] = [];
  const consoleWarnings: ConsoleMessage[] = [];

  test.beforeEach(async ({ page }) => {
    // Clear arrays for each test
    consoleMessages.length = 0;
    consoleErrors.length = 0;
    consoleWarnings.length = 0;

    // Capture all console messages
    page.on('console', (msg) => {
      consoleMessages.push(msg);

      if (msg.type() === 'error') {
        consoleErrors.push(msg);
        console.log(`[BROWSER ERROR] ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg);
        console.log(`[BROWSER WARNING] ${msg.text()}`);
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      console.log(`[PAGE ERROR] ${error.message}`);
      console.log(error.stack);
    });

    // Capture failed requests
    page.on('requestfailed', (request) => {
      console.log(`[REQUEST FAILED] ${request.url()}: ${request.failure()?.errorText}`);
    });
  });

  test('should load gate app without console errors', async ({ page }) => {
    console.log('🚀 Starting Gate App test...');

    // Navigate to gate app
    await page.goto(GATE_APP_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for app to initialize
    await page.waitForTimeout(3000);

    // Take screenshot of initial state
    await page.screenshot({
      path: 'playwright-testing/test-results/gate-app-initial.png',
      fullPage: true
    });

    console.log(`📊 Console Messages: ${consoleMessages.length}`);
    console.log(`❌ Console Errors: ${consoleErrors.length}`);
    console.log(`⚠️  Console Warnings: ${consoleWarnings.length}`);

    // Print all console errors
    if (consoleErrors.length > 0) {
      console.log('\n=== CONSOLE ERRORS ===');
      consoleErrors.forEach((msg, index) => {
        console.log(`${index + 1}. ${msg.text()}`);
        console.log(`   Type: ${msg.type()}`);
        console.log(`   Location: ${msg.location().url}`);
      });
    }

    // Print all console warnings
    if (consoleWarnings.length > 0) {
      console.log('\n=== CONSOLE WARNINGS ===');
      consoleWarnings.forEach((msg, index) => {
        console.log(`${index + 1}. ${msg.text()}`);
      });
    }

    // Fail test if there are console errors
    expect(consoleErrors.length,
      `Found ${consoleErrors.length} console errors. See logs above.`
    ).toBe(0);
  });

  test('should navigate through main sections without errors', async ({ page }) => {
    await page.goto(GATE_APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Clear errors from initial load
    const initialErrorCount = consoleErrors.length;
    console.log(`Initial load errors: ${initialErrorCount}`);

    // Try to find and click navigation items
    const navigationSelectors = [
      'a[href*="dashboard"]',
      'a[href*="attendance"]',
      'a[href*="students"]',
      'button:has-text("Menu")',
      'nav a',
      '.q-drawer a',
    ];

    for (const selector of navigationSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`Found navigation element: ${selector}`);
          await element.click();
          await page.waitForTimeout(2000);

          // Check for new errors after navigation
          const newErrors = consoleErrors.slice(initialErrorCount);
          if (newErrors.length > 0) {
            console.log(`❌ New errors after clicking ${selector}:`);
            newErrors.forEach(msg => console.log(`   - ${msg.text()}`));
          }

          break; // Exit after first successful navigation
        }
      } catch (e) {
        // Element not found or not visible, continue
        continue;
      }
    }

    await page.screenshot({
      path: 'playwright-testing/test-results/gate-app-navigation.png',
      fullPage: true
    });

    // Check for errors during navigation
    const navigationErrors = consoleErrors.slice(initialErrorCount);
    expect(navigationErrors.length,
      `Found ${navigationErrors.length} console errors during navigation`
    ).toBe(0);
  });

  test('should check for critical UI elements', async ({ page }) => {
    await page.goto(GATE_APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    console.log('\n🔍 Checking for critical UI elements...');

    // Check for common Quasar/Vue elements
    const criticalElements = [
      { selector: '#q-app', name: 'Quasar App Root' },
      { selector: '.q-layout', name: 'Quasar Layout' },
      { selector: 'header, .q-header', name: 'Header' },
      { selector: 'main, .q-page-container', name: 'Main Content' },
    ];

    for (const { selector, name } of criticalElements) {
      const element = page.locator(selector).first();
      const exists = await element.count() > 0;
      console.log(`${exists ? '✅' : '❌'} ${name} (${selector}): ${exists ? 'Found' : 'Missing'}`);

      if (exists) {
        const isVisible = await element.isVisible({ timeout: 1000 }).catch(() => false);
        console.log(`   Visible: ${isVisible}`);
      }
    }

    // Get page title
    const title = await page.title();
    console.log(`\n📄 Page Title: "${title}"`);

    // Get HTML structure (first 500 chars)
    const htmlStart = await page.evaluate(() => {
      return document.body.innerHTML.substring(0, 500);
    });
    console.log(`\n📝 HTML Start:\n${htmlStart}...`);

    // No assertions here, just information gathering
  });

  test('should check network requests', async ({ page }) => {
    const failedRequests: string[] = [];
    const slowRequests: Array<{ url: string; time: number }> = [];

    page.on('requestfailed', (request) => {
      failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`);
    });

    page.on('response', (response) => {
      const timing = response.timing();
      const totalTime = timing.responseEnd;

      if (totalTime > 3000) { // Requests slower than 3 seconds
        slowRequests.push({ url: response.url(), time: totalTime });
      }
    });

    await page.goto(GATE_APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    console.log('\n🌐 Network Analysis:');
    console.log(`Failed Requests: ${failedRequests.length}`);
    console.log(`Slow Requests (>3s): ${slowRequests.length}`);

    if (failedRequests.length > 0) {
      console.log('\n❌ Failed Requests:');
      failedRequests.forEach((req, i) => console.log(`${i + 1}. ${req}`));
    }

    if (slowRequests.length > 0) {
      console.log('\n🐌 Slow Requests:');
      slowRequests.forEach((req, i) =>
        console.log(`${i + 1}. ${req.url} (${req.time}ms)`)
      );
    }

    // Don't fail on slow requests, just log them
    expect(failedRequests.length,
      `Found ${failedRequests.length} failed network requests`
    ).toBe(0);
  });

  test('should check for JavaScript errors in specific features', async ({ page }) => {
    await page.goto(GATE_APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const initialErrors = consoleErrors.length;
    console.log(`\n🧪 Testing interactive features...`);

    // Try to interact with buttons
    const buttons = page.locator('button').all();
    const buttonList = await buttons;
    console.log(`Found ${buttonList.length} buttons`);

    // Click first few visible buttons
    for (let i = 0; i < Math.min(3, buttonList.length); i++) {
      try {
        const button = buttonList[i];
        if (await button.isVisible({ timeout: 1000 })) {
          const buttonText = await button.textContent();
          console.log(`Clicking button: "${buttonText}"`);
          await button.click();
          await page.waitForTimeout(1000);

          // Check for new errors
          const newErrors = consoleErrors.slice(initialErrors);
          if (newErrors.length > 0) {
            console.log(`❌ Errors after clicking "${buttonText}":`);
            newErrors.forEach(msg => console.log(`   - ${msg.text()}`));
          }
        }
      } catch (e) {
        console.log(`Failed to click button ${i}: ${e}`);
      }
    }

    await page.screenshot({
      path: 'playwright-testing/test-results/gate-app-interactions.png',
      fullPage: true
    });

    const interactionErrors = consoleErrors.slice(initialErrors);
    expect(interactionErrors.length,
      `Found ${interactionErrors.length} console errors during interactions`
    ).toBe(0);
  });
});
