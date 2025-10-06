const { test, expect } = require('@playwright/test');

test('verify navigation transparency on homepage', async ({ page }) => {
  await page.goto('https://multibook.geertest.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  // Check navigation background when at top
  const navBackgroundTop = await page.locator('nav').evaluate(el => {
    return window.getComputedStyle(el).backgroundColor;
  });
  
  console.log('Navigation background at top:', navBackgroundTop);
  
  // Take screenshot at top
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/nav-transparent-top.png',
    fullPage: false
  });
  
  // Scroll down to trigger background
  await page.evaluate(() => window.scrollBy(0, 200));
  await page.waitForTimeout(500);
  
  // Check navigation background when scrolled
  const navBackgroundScrolled = await page.locator('nav').evaluate(el => {
    return window.getComputedStyle(el).backgroundColor;
  });
  
  console.log('Navigation background when scrolled:', navBackgroundScrolled);
  
  // Take screenshot when scrolled
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/nav-with-background.png',
    fullPage: false
  });
  
  // Verify transparency
  expect(navBackgroundTop).toBe('rgba(0, 0, 0, 0)'); // Should be transparent
  expect(navBackgroundScrolled).not.toBe('rgba(0, 0, 0, 0)'); // Should have background
});