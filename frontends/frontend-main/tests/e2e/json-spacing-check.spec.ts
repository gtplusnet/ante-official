import { test } from '@playwright/test';

test('Check JSON spacing in browser', async ({ page }) => {
  await page.goto('http://localhost:3000/api/public/school-gate');
  await page.waitForLoadState('networkidle');

  // Find the heartbeat endpoint section
  const heartbeatSection = await page.locator('text=/heartbeat').locator('..').locator('..');

  // Wait for JSON to be rendered by JavaScript
  await page.waitForFunction(() => {
    const blocks = document.querySelectorAll('.json-block code');
    return blocks.length > 0 && blocks[0].textContent.length > 0;
  });

  // Get the request body code block (now rendered by JavaScript)
  const requestBodyCode = await heartbeatSection.locator('text=Request Body').locator('..').locator('.json-block code');

  // Get the actual text content as seen in browser
  const jsonText = await requestBodyCode.textContent();

  console.log('JSON as displayed in browser:');
  console.log('---START---');
  console.log(jsonText);
  console.log('---END---');

  // Check if there's excessive indentation
  const lines = jsonText.split('\n');
  console.log('\nLine-by-line analysis:');
  lines.forEach((line, i) => {
    const leadingSpaces = line.match(/^(\s*)/)[1].length;
    console.log(`Line ${i}: [${leadingSpaces} spaces] "${line}"`);
  });

  // Take a screenshot of just the JSON section
  await requestBodyCode.screenshot({ path: 'tests/screenshots/json-spacing.png' });

  // Also check the computed style to see if CSS is affecting it
  const computedStyle = await requestBodyCode.evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      whiteSpace: styles.whiteSpace,
      textIndent: styles.textIndent,
      paddingLeft: styles.paddingLeft,
      marginLeft: styles.marginLeft
    };
  });

  console.log('\nComputed styles:');
  console.log(computedStyle);
});