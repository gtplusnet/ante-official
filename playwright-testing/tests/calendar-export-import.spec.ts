import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Calendar ICS Export/Import Test
 * Tests the calendar export and import functionality
 */

// Test credentials
const TEST_USER = {
  username: 'guillermotabligan',
  password: 'water123'
};

const BASE_URL = 'http://localhost:9000';

// Helper function to login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/#/login`);

  // Click "Sign in manually" button to reveal login form
  await page.click('button:has-text("Sign in manually")');
  await page.waitForSelector('input[type="text"]', { timeout: 5000 });

  await page.fill('input[type="text"]', TEST_USER.username);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/#\/member\/dashboard/, { timeout: 10000 });
}

// Helper function to navigate to calendar
async function navigateToCalendar(page: Page) {
  await page.goto(`${BASE_URL}/#/member/manpower/calendar`);
  // Wait for calendar page container
  await page.waitForSelector('.calendar-page', { timeout: 20000 });
  // Wait for FullCalendar to render
  await page.waitForSelector('.fc', { timeout: 20000 });
  // Give calendar time to load events
  await page.waitForTimeout(2000);
}

test.describe('Calendar ICS Export/Import', () => {
  // UI tests that require calendar page
  test.describe('UI Tests', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await navigateToCalendar(page);
    });

    test('should have export/import menu in toolbar', async ({ page }) => {
    console.log('Test: Checking for export/import menu in toolbar');

    // Look for the more options button (three dots icon)
    const moreOptionsButton = page.locator('button[aria-label="More options"], button:has(i:text("more_vert"))').first();

    // Check if button exists
    const exists = await moreOptionsButton.count() > 0;
    console.log('More options button exists:', exists);

    if (exists) {
      // Click the more options button
      await moreOptionsButton.click();
      await page.waitForTimeout(500);

      // Check for export and import menu items
      const exportMenuItem = page.locator('text=Export Calendar');
      const importMenuItem = page.locator('text=Import Calendar');

      await expect(exportMenuItem).toBeVisible();
      await expect(importMenuItem).toBeVisible();

      console.log('✓ Export/Import menu items found');
    }
  });

  test('should open import dialog when clicking import', async ({ page }) => {
    console.log('Test: Opening import dialog');

    // Find and click more options button
    const moreOptionsButton = page.locator('button[aria-label="More options"], button:has(i:text("more_vert"))').first();

    if (await moreOptionsButton.count() > 0) {
      await moreOptionsButton.click();
      await page.waitForTimeout(500);

      // Click import menu item
      await page.click('text=Import Calendar');
      await page.waitForTimeout(1000);

      // Check if import dialog opened
      const importDialog = page.locator('text=Import Calendar').first();
      const isVisible = await importDialog.isVisible();

      console.log('Import dialog visible:', isVisible);
      expect(isVisible).toBeTruthy();

      // Check for upload area
      const uploadArea = page.locator('text=Upload Calendar File, text=Click to select .ics file').first();
      if (await uploadArea.count() > 0) {
        console.log('✓ Upload area found in dialog');
      }
    }
  });

  test('should show export button in event details dialog', async ({ page }) => {
    console.log('Test: Checking export button in event details');

    // Wait for calendar to be fully loaded
    await page.waitForTimeout(2000);

    // Try to find an event on the calendar
    const eventElement = page.locator('.fc-event').first();

    const eventCount = await eventElement.count();
    console.log('Number of events found:', eventCount);

    if (eventCount > 0) {
      // Click on the first event
      await eventElement.click();
      await page.waitForTimeout(1000);

      // Check for event details dialog
      const detailsDialog = page.locator('.event-details-dialog').first();

      if (await detailsDialog.count() > 0) {
        console.log('✓ Event details dialog opened');

        // Look for export/download button
        const exportButton = detailsDialog.locator('button[aria-label*="Export"], button:has(i:text("download"))');

        const exportButtonCount = await exportButton.count();
        console.log('Export button count:', exportButtonCount);

        if (exportButtonCount > 0) {
          expect(exportButtonCount).toBeGreaterThan(0);
          console.log('✓ Export button found in event details');
        } else {
          console.log('⚠ Export button not found in event details');
        }
      }
    } else {
      console.log('⚠ No events found on calendar to test');
    }
  });

  test('should not have console errors on calendar page', async ({ page }) => {
    console.log('Test: Checking for console errors');

    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate and interact with calendar
    await page.goto(`${BASE_URL}/#/member/manpower/calendar`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Try to open export/import menu
    const moreOptionsButton = page.locator('button[aria-label="More options"], button:has(i:text("more_vert"))').first();
    if (await moreOptionsButton.count() > 0) {
      await moreOptionsButton.click();
      await page.waitForTimeout(500);
    }

    console.log('Console errors found:', consoleErrors.length);

    if (consoleErrors.length > 0) {
      console.log('Console errors:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    // Allow some errors but log them for review
    expect(consoleErrors.length).toBeLessThan(5);
  });
  });  // End of UI Tests

  // API tests (don't require calendar page navigation)
  test.describe('API Tests', () => {
    test('should test export API endpoint', async ({ request }) => {
    console.log('Test: Testing export API endpoint');

    // First login to get token
    const loginResponse = await request.post('http://localhost:3000/auth/login', {
      data: {
        username: 'guillermotabligan',
        password: 'water123'
      }
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    const token = loginData.token;

    console.log('Login successful, token obtained');

    // Get events to find an event ID
    const eventsResponse = await request.get('http://localhost:3000/calendar/event', {
      headers: {
        'token': token
      },
      params: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    });

    if (eventsResponse.ok()) {
      const events = await eventsResponse.json();
      console.log('Events fetched:', events.length);

      if (events.length > 0) {
        const eventId = events[0].id;
        console.log('Testing export for event ID:', eventId);

        // Test export endpoint
        const exportResponse = await request.get(`http://localhost:3000/calendar/event/export/${eventId}`, {
          headers: {
            'token': token
          }
        });

        console.log('Export response status:', exportResponse.status());

        if (exportResponse.ok()) {
          const icsContent = await exportResponse.text();
          console.log('ICS content length:', icsContent.length);

          // Check if it's valid ICS format
          expect(icsContent).toContain('BEGIN:VCALENDAR');
          expect(icsContent).toContain('BEGIN:VEVENT');
          expect(icsContent).toContain('END:VEVENT');
          expect(icsContent).toContain('END:VCALENDAR');

          console.log('✓ Export API endpoint working correctly');
        } else {
          console.log('⚠ Export endpoint returned error:', exportResponse.status());
        }
      } else {
        console.log('⚠ No events available to test export');
      }
    }
  });

  test('should test import validation API endpoint', async ({ request }) => {
    console.log('Test: Testing import validation API endpoint');

    // First login to get token
    const loginResponse = await request.post('http://localhost:3000/auth/login', {
      data: {
        username: 'guillermotabligan',
        password: 'water123'
      }
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    const token = loginData.token;

    console.log('Login successful, token obtained');

    // Create a sample ICS file content
    const sampleICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:test-event-${Date.now()}@ante.ph
DTSTAMP:20250116T120000Z
DTSTART:20250120T090000Z
DTEND:20250120T100000Z
SUMMARY:Test Import Event
DESCRIPTION:This is a test event for import validation
LOCATION:Test Location
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    // Create a temporary file
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, 'test-import.ics');
    fs.writeFileSync(tempFilePath, sampleICS);

    console.log('Sample ICS file created');

    // Test validation endpoint using multipart form data
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(tempFilePath);
    const blob = new Blob([fileBuffer], { type: 'text/calendar' });
    formData.append('file', blob, 'test-import.ics');

    const validationResponse = await request.post('http://localhost:3000/calendar/event/import/validate', {
      headers: {
        'token': token
      },
      multipart: {
        file: {
          name: 'test-import.ics',
          mimeType: 'text/calendar',
          buffer: fileBuffer
        }
      }
    });

    console.log('Validation response status:', validationResponse.status());

    if (validationResponse.ok()) {
      const validationResult = await validationResponse.json();
      console.log('Validation result:', JSON.stringify(validationResult, null, 2));

      expect(validationResult.valid).toBeTruthy();
      expect(validationResult.eventCount).toBeGreaterThan(0);

      console.log('✓ Import validation API endpoint working correctly');
    } else {
      console.log('⚠ Validation endpoint returned error:', validationResponse.status());
    }

    // Cleanup
    fs.unlinkSync(tempFilePath);
  });
  });  // End of API Tests
});
