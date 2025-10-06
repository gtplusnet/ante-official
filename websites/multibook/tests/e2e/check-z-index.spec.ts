import { test } from '@playwright/test';

test('check navigation z-index with newsletter', async ({ page }) => {
  console.log('Navigating to site...');
  await page.goto('https://multibook.geertest.com', { 
    waitUntil: 'domcontentloaded',
    timeout: 30000 
  });
  
  console.log('Page loaded, waiting for content...');
  await page.waitForTimeout(3000);
  
  // Scroll to newsletter section
  console.log('Scrolling to newsletter section...');
  await page.evaluate(() => {
    const newsletter = document.querySelector('#newsletter');
    if (newsletter) {
      newsletter.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/newsletter-nav-test.png',
    fullPage: false
  });
  
  // Check computed styles
  const navStyles = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    if (nav) {
      const styles = window.getComputedStyle(nav);
      return {
        zIndex: styles.zIndex,
        position: styles.position,
        backgroundColor: styles.backgroundColor
      };
    }
    return null;
  });
  
  console.log('Navigation styles:', navStyles);
  
  // Check newsletter card styles
  const cardStyles = await page.evaluate(() => {
    const cards = document.querySelectorAll('#newsletter .bg-white');
    const styles = [];
    cards.forEach((card, index) => {
      const computed = window.getComputedStyle(card);
      styles.push({
        index,
        zIndex: computed.zIndex,
        position: computed.position
      });
    });
    return styles;
  });
  
  console.log('Newsletter card styles:', cardStyles);
  
  // Scroll around to see overlap
  await page.evaluate(() => window.scrollBy(0, -200));
  await page.waitForTimeout(1000);
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/newsletter-nav-scroll1.png',
    fullPage: false
  });
  
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(1000);
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/newsletter-nav-scroll2.png',
    fullPage: false
  });
});