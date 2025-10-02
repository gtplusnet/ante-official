import { test, expect } from '@playwright/test';

test.describe('API Documentation JSON Color Highlighting', () => {
  test('Verify JSON syntax highlighting colors', async ({ page }) => {
    // Navigate to the School Gate API documentation
    await page.goto('http://localhost:3000/api/public/school-gate');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if JSON key elements have proper colors
    const jsonKey = await page.locator('.json-key').first();
    const keyColor = await jsonKey.evaluate(el => window.getComputedStyle(el).color);
    const keyWeight = await jsonKey.evaluate(el => window.getComputedStyle(el).fontWeight);

    console.log('JSON Key styling:');
    console.log('  Color:', keyColor);
    console.log('  Font Weight:', keyWeight);

    // Check JSON string elements
    const jsonString = await page.locator('.json-string').first();
    const stringColor = await jsonString.evaluate(el => window.getComputedStyle(el).color);

    console.log('\nJSON String styling:');
    console.log('  Color:', stringColor);

    // Check JSON number elements
    const jsonNumber = await page.locator('.json-number').first();
    if (await jsonNumber.count() > 0) {
      const numberColor = await jsonNumber.evaluate(el => window.getComputedStyle(el).color);
      console.log('\nJSON Number styling:');
      console.log('  Color:', numberColor);
    }

    // Check JSON boolean elements
    const jsonBoolean = await page.locator('.json-boolean').first();
    if (await jsonBoolean.count() > 0) {
      const booleanColor = await jsonBoolean.evaluate(el => window.getComputedStyle(el).color);
      const booleanWeight = await jsonBoolean.evaluate(el => window.getComputedStyle(el).fontWeight);
      console.log('\nJSON Boolean styling:');
      console.log('  Color:', booleanColor);
      console.log('  Font Weight:', booleanWeight);
    }

    // Take a screenshot with colors
    await page.screenshot({
      path: 'tests/screenshots/school-gate-api-colored.png',
      fullPage: false,
      clip: { x: 0, y: 300, width: 1200, height: 600 }
    });

    // Test dark theme
    await page.click('.theme-toggle');
    await page.waitForTimeout(500);

    const darkKeyColor = await jsonKey.evaluate(el => window.getComputedStyle(el).color);
    console.log('\nDark theme JSON Key color:', darkKeyColor);

    // Take dark theme screenshot
    await page.screenshot({
      path: 'tests/screenshots/school-gate-api-dark.png',
      fullPage: false,
      clip: { x: 0, y: 300, width: 1200, height: 600 }
    });

    // Verify colors are applied (not default black)
    expect(keyColor).not.toBe('rgb(0, 0, 0)');
    expect(keyColor).not.toBe('rgb(33, 33, 33)');
  });

  test('Check Manpower API JSON colors', async ({ page }) => {
    // Navigate to the Manpower API documentation
    await page.goto('http://localhost:3000/api/public/manpower');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if JSON syntax highlighting is applied
    const jsonKeys = await page.locator('.json-key').count();
    const jsonStrings = await page.locator('.json-string').count();

    console.log('\nManpower API JSON highlighting:');
    console.log('  JSON keys found:', jsonKeys);
    console.log('  JSON strings found:', jsonStrings);

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/manpower-api-colored.png',
      fullPage: false,
      clip: { x: 0, y: 300, width: 1200, height: 600 }
    });

    // Verify elements exist
    expect(jsonKeys).toBeGreaterThan(0);
    expect(jsonStrings).toBeGreaterThan(0);
  });
});