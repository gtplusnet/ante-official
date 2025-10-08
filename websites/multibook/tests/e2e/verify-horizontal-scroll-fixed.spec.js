const { test, expect } = require('@playwright/test');

test('verify horizontal scrollbar is fixed', async ({ page }) => {
  await page.goto('https://multibook.geertest.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  // Check if horizontal scrollbar exists
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  
  console.log('Has horizontal scroll:', hasHorizontalScroll);
  
  // Get the scroll widths
  const scrollInfo = await page.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
      htmlOverflowX: window.getComputedStyle(document.documentElement).overflowX,
      bodyOverflowX: window.getComputedStyle(document.body).overflowX
    };
  });
  
  console.log('Scroll info:', scrollInfo);
  
  // Take screenshot
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/horizontal-scroll-fixed.png',
    fullPage: false
  });
  
  // Verify no horizontal scroll
  expect(hasHorizontalScroll).toBe(false);
});