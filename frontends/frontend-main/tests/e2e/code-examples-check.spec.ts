import { test } from '@playwright/test';

test('Check Code Examples section display', async ({ page }) => {
  await page.goto('http://localhost:3000/api/public/school-gate');
  await page.waitForLoadState('networkidle');

  // Scroll to Code Examples section
  const codeExamplesSection = await page.locator('#examples');
  await codeExamplesSection.scrollIntoViewIfNeeded();

  // Check if section exists
  const sectionExists = await codeExamplesSection.count() > 0;
  console.log('Code Examples section exists:', sectionExists);

  if (sectionExists) {
    // Get the HTML content
    const sectionHTML = await codeExamplesSection.innerHTML();
    console.log('\n=== Code Examples Section HTML ===');
    console.log(sectionHTML.substring(0, 500) + '...');

    // Check for code blocks
    const codeBlocks = await codeExamplesSection.locator('pre code');
    const codeBlockCount = await codeBlocks.count();
    console.log('\nFound', codeBlockCount, 'code blocks');

    // Check for tabs
    const tabs = await codeExamplesSection.locator('.tab');
    const tabCount = await tabs.count();
    console.log('Found', tabCount, 'tabs');

    // Check tab content
    const tabContent = await codeExamplesSection.locator('.tab-content');
    const tabContentCount = await tabContent.count();
    console.log('Found', tabContentCount, 'tab content areas');

    // Check if any tab content is visible
    for (let i = 0; i < tabContentCount; i++) {
      const isVisible = await tabContent.nth(i).isVisible();
      console.log(`Tab content ${i} visible:`, isVisible);
    }

    // Take screenshot
    await codeExamplesSection.screenshot({ path: 'tests/screenshots/code-examples.png' });
    console.log('\nScreenshot saved to tests/screenshots/code-examples.png');

    // Check computed styles
    if (tabCount > 0) {
      const firstTab = tabs.first();
      const styles = await firstTab.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity
        };
      });
      console.log('\nFirst tab styles:', styles);
    }
  }
});