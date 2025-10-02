import { test, expect } from '@playwright/test';

test.describe('API Documentation', () => {
  test('Check School Gate API Documentation JSON formatting and styling', async ({ page }) => {
    // Navigate to the School Gate API documentation
    await page.goto('http://localhost:3000/api/public/school-gate');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Take a screenshot for reference
    await page.screenshot({ path: 'tests/screenshots/school-gate-api.png', fullPage: false });

    // Check if JSON is properly formatted
    const requestBodyElements = await page.locator('h4:has-text("Request Body")').all();
    console.log(`Found ${requestBodyElements.length} Request Body sections`);

    // Check the first request body
    if (requestBodyElements.length > 0) {
      const firstRequestBody = await requestBodyElements[0].locator('..').locator('pre code').textContent();
      console.log('First Request Body JSON:');
      console.log(firstRequestBody);

      // Check if it's properly formatted (has newlines and indentation)
      expect(firstRequestBody).toContain('\n');
      expect(firstRequestBody).toContain('  '); // Check for indentation
    }

    // Check response examples
    const responseElements = await page.locator('h4:has-text("Response Example")').all();
    console.log(`Found ${responseElements.length} Response Example sections`);

    if (responseElements.length > 0) {
      const firstResponse = await responseElements[0].locator('..').locator('pre code').textContent();
      console.log('First Response Example JSON:');
      console.log(firstResponse);

      // Check if it's properly formatted
      expect(firstResponse).toContain('\n');
      expect(firstResponse).toContain('  ');
    }

    // Check current styling of code blocks
    const codeElement = await page.locator('pre code').first();
    const styles = await codeElement.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontFamily: computed.fontFamily,
        display: computed.display
      };
    });

    console.log('\nCurrent code block styling:');
    console.log('Color:', styles.color);
    console.log('Background:', styles.backgroundColor);
    console.log('Font:', styles.fontFamily);

    // Check if pre elements have proper styling
    const preElement = await page.locator('pre').first();
    const preStyles = await preElement.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        padding: computed.padding,
        borderRadius: computed.borderRadius
      };
    });

    console.log('\nPre element styling:');
    console.log('Background:', preStyles.backgroundColor);
    console.log('Padding:', preStyles.padding);
    console.log('Border Radius:', preStyles.borderRadius);
  });
});