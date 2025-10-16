import { test, expect } from '@playwright/test';

test.describe('Calendar Console Errors', () => {
  test('should load calendar page without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    // Capture console errors and warnings
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`ERROR: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(`WARNING: ${msg.text()}`);
      } else {
        console.log(`CONSOLE: ${msg.text()}`);
      }
    });

    // Capture page errors
    page.on('pageerror', err => {
      consoleErrors.push(`PAGE ERROR: ${err.message}`);
    });

    // Login
    await page.goto('http://localhost:9000/#/login');
    await page.click('button:has-text("Sign in manually")');
    await page.waitForSelector('input[type="text"]', { timeout: 5000 });

    await page.fill('input[type="text"]', 'guillermotabligan');
    await page.fill('input[type="password"]', 'water123');
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL('**/member/**', { timeout: 10000 });

    // Navigate to calendar
    console.log('Navigating to calendar page...');
    await page.goto('http://localhost:9000/#/member/manpower/calendar');

    // Wait a bit for calendar to render
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({ path: 'calendar-state.png' });

    // Check page content
    const pageContent = await page.content();
    console.log('Page HTML length:', pageContent.length);

    // Try to find calendar elements
    const hasCalendarPage = await page.locator('.calendar-page').count();
    const hasCalendarSidebar = await page.locator('.calendar-sidebar').count();
    const hasCalendarMain = await page.locator('.calendar-main').count();

    console.log('Has .calendar-page:', hasCalendarPage);
    console.log('Has .calendar-sidebar:', hasCalendarSidebar);
    console.log('Has .calendar-main:', hasCalendarMain);

    // Print all errors
    console.log('\n=== CONSOLE ERRORS ===');
    consoleErrors.forEach(err => console.log(err));

    console.log('\n=== CONSOLE WARNINGS ===');
    consoleWarnings.forEach(warn => console.log(warn));

    // Fail if there are console errors
    if (consoleErrors.length > 0) {
      throw new Error(`Found ${consoleErrors.length} console errors`);
    }

    expect(consoleErrors).toHaveLength(0);
  });
});
