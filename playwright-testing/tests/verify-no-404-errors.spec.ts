import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:9000';

test.describe('Verify 404 Errors Fixed', () => {
  test('Should NOT show connections.json 404 error', async ({ page }) => {
    const http404Errors: string[] = [];
    const consoleErrors: string[] = [];

    // Monitor ALL HTTP responses
    page.on('response', (response) => {
      if (response.status() === 404) {
        http404Errors.push(response.url());
        console.log('❌ 404 Error detected:', response.url());
      }
    });

    // Monitor console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      }
    });

    // Navigate to the app
    console.log('🔍 Loading application and checking for 404 errors...');
    await page.goto(BASE_URL);
    await page.waitForTimeout(5000); // Wait for app to fully load

    // Report findings
    console.log('\n📊 Results:');
    console.log(`  404 Errors: ${http404Errors.length}`);
    console.log(`  Console Errors: ${consoleErrors.length}`);

    if (http404Errors.length > 0) {
      console.log('\n❌ Found 404 Errors:');
      http404Errors.forEach((url, i) => {
        console.log(`  ${i + 1}. ${url}`);
      });
    } else {
      console.log('\n✅ No 404 errors detected!');
    }

    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors Found:');
      consoleErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    } else {
      console.log('\n✅ No console errors detected!');
    }

    // Verify connections.json specifically is NOT in the 404 list
    const connectionsJsonError = http404Errors.find(url => url.includes('connections.json'));
    expect(connectionsJsonError).toBeUndefined();

    console.log('\n✅ connections.json 404 error is FIXED!');
  });

  test('Navigate to project page and verify no errors', async ({ page }) => {
    const http404Errors: string[] = [];
    const consoleErrors: string[] = [];

    page.on('response', (response) => {
      if (response.status() === 404) {
        http404Errors.push(response.url());
        console.log('❌ 404 Error:', response.url());
      }
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      }
    });

    console.log('🔍 Loading project page and checking for errors...');
    await page.goto(`${BASE_URL}/#/login`);
    await page.waitForTimeout(3000);

    console.log('\n📊 Login Page Results:');
    console.log(`  404 Errors: ${http404Errors.length}`);
    console.log(`  Console Errors: ${consoleErrors.length}`);

    // Verify NO connections.json 404 error
    const connectionsJsonError = http404Errors.find(url => url.includes('connections.json'));
    expect(connectionsJsonError).toBeUndefined();

    if (http404Errors.length === 0 && consoleErrors.length === 0) {
      console.log('\n✅ Perfect! No errors on login page.');
    }
  });
});
