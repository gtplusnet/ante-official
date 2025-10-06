const { test, expect } = require('@playwright/test');

test('check horizontal scrollbar issue', async ({ page }) => {
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
      overflow: window.getComputedStyle(document.body).overflow,
      overflowX: window.getComputedStyle(document.body).overflowX
    };
  });
  
  console.log('Scroll info:', scrollInfo);
  
  // Find elements causing overflow
  const overflowingElements = await page.evaluate(() => {
    const elements = [];
    const all = document.querySelectorAll('*');
    const viewportWidth = document.documentElement.clientWidth;
    
    all.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > viewportWidth || rect.left < 0) {
        elements.push({
          tag: el.tagName,
          class: el.className,
          id: el.id,
          rect: {
            left: rect.left,
            right: rect.right,
            width: rect.width
          },
          text: el.textContent?.substring(0, 50)
        });
      }
    });
    
    return elements;
  });
  
  console.log('Overflowing elements:', overflowingElements);
  
  // Take screenshot
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/horizontal-scroll-issue.png',
    fullPage: false
  });
});