import { test } from '@playwright/test';

test('Check code syntax highlighting and indentation', async ({ page }) => {
  await page.goto('http://localhost:3000/api/public/school-gate');
  await page.waitForLoadState('networkidle');

  // Scroll to Code Examples section
  const codeExamplesSection = await page.locator('#examples');
  await codeExamplesSection.scrollIntoViewIfNeeded();

  // Click on Python tab to ensure it's active
  const pythonTab = await page.locator('.tab:has-text("Python")').first();
  await pythonTab.click();

  // Get the first visible code block
  const codeBlock = await page.locator('.tab-content.active pre code').first();

  // Get the raw text content
  const codeText = await codeBlock.textContent();
  console.log('\n=== Raw Code Text ===');
  console.log(codeText?.substring(0, 500));

  // Check for syntax highlighting classes
  const hasHighlighting = await codeBlock.locator('span').count();
  console.log('\n=== Syntax Highlighting ===');
  console.log('Has syntax highlighting spans:', hasHighlighting > 0);

  // Get HTML to see if there are any highlighting classes
  const codeHTML = await codeBlock.innerHTML();
  console.log('\n=== Code HTML (first 500 chars) ===');
  console.log(codeHTML.substring(0, 500));

  // Check specific syntax highlighting elements
  const keywords = await codeBlock.locator('.keyword, .hljs-keyword, .token.keyword').count();
  const strings = await codeBlock.locator('.string, .hljs-string, .token.string').count();
  const functions = await codeBlock.locator('.function, .hljs-function, .token.function').count();

  console.log('\n=== Syntax Highlighting Classes Found ===');
  console.log('Keywords:', keywords);
  console.log('Strings:', strings);
  console.log('Functions:', functions);

  // Check indentation by analyzing lines
  const lines = codeText?.split('\n') || [];
  console.log('\n=== Indentation Analysis ===');
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i];
    const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
    console.log(`Line ${i}: [${leadingSpaces} spaces] "${line.substring(0, 50)}${line.length > 50 ? '...' : ''}"`);
  }

  // Check computed styles
  const computedStyles = await codeBlock.evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      fontFamily: styles.fontFamily,
      whiteSpace: styles.whiteSpace,
      fontSize: styles.fontSize,
      lineHeight: styles.lineHeight,
      color: styles.color
    };
  });

  console.log('\n=== Computed Styles ===');
  console.log(computedStyles);

  // Take screenshot for visual inspection
  await codeBlock.screenshot({ path: 'tests/screenshots/code-syntax-highlighting.png' });
  console.log('\nScreenshot saved to tests/screenshots/code-syntax-highlighting.png');

  // Also check Node.js tab
  const nodejsTab = await page.locator('.tab:has-text("Node.js")').first();
  await nodejsTab.click();

  const nodejsCodeBlock = await page.locator('.tab-content.active pre code').first();
  const nodejsCodeText = await nodejsCodeBlock.textContent();

  console.log('\n=== Node.js Code (first 300 chars) ===');
  console.log(nodejsCodeText?.substring(0, 300));

  // Check if code is properly formatted
  const hasProperIndentation = lines.some(line => line.startsWith('    ') || line.startsWith('\t'));
  console.log('\n=== Code Quality ===');
  console.log('Has proper indentation:', hasProperIndentation);
});