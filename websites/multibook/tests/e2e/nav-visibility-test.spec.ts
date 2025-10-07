import { test } from '@playwright/test';

test('navigation visibility over content', async ({ page }) => {
  console.log('Loading page...');
  await page.goto('https://multibook.geertest.com', { 
    waitUntil: 'domcontentloaded',
    timeout: 30000 
  });
  
  await page.waitForTimeout(2000);
  
  // Take initial screenshot
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/nav-initial.png',
    fullPage: false
  });
  
  // Scroll down past hero
  console.log('Scrolling to features...');
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(1000);
  
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/nav-over-features.png',
    fullPage: false
  });
  
  // Check navigation visibility and styles
  const navInfo = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    if (!nav) return { found: false };
    
    const rect = nav.getBoundingClientRect();
    const styles = window.getComputedStyle(nav);
    
    return {
      found: true,
      visible: rect.width > 0 && rect.height > 0,
      position: styles.position,
      zIndex: styles.zIndex,
      backgroundColor: styles.backgroundColor,
      top: rect.top,
      height: rect.height
    };
  });
  
  console.log('Navigation info:', navInfo);
  
  // Scroll to newsletter
  console.log('Scrolling to newsletter...');
  await page.evaluate(() => {
    const newsletter = document.querySelector('#newsletter');
    if (newsletter) {
      newsletter.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  });
  
  await page.waitForTimeout(1000);
  
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/nav-over-newsletter.png',
    fullPage: false
  });
  
  // Check if navigation is still visible
  const navVisibleOverNewsletter = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    if (!nav) return false;
    
    const rect = nav.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.top === 0;
  });
  
  console.log('Navigation visible over newsletter:', navVisibleOverNewsletter);
});