const { test, expect } = require('@playwright/test');

test('verify mobile navigation fixes', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  
  await page.goto('https://multibook.geertest.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  // Check logo size and position
  const logoCheck = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    const logo = nav?.querySelector('img[alt*="Logo"]');
    const navRect = nav?.getBoundingClientRect();
    const logoRect = logo?.getBoundingClientRect();
    
    return {
      nav: {
        height: navRect?.height,
        paddingTop: window.getComputedStyle(nav).paddingTop,
        paddingBottom: window.getComputedStyle(nav).paddingBottom
      },
      logo: {
        width: logoRect?.width,
        height: logoRect?.height,
        classes: logo?.className,
        fitsInNav: logoRect && navRect && 
                   logoRect.top >= navRect.top && 
                   logoRect.bottom <= navRect.bottom
      }
    };
  });
  
  console.log('Logo check:', logoCheck);
  
  // Check hamburger menu visibility
  const hamburgerCheck = await page.evaluate(() => {
    const hamburger = document.querySelector('button.md\\:hidden');
    const desktopMenu = document.querySelector('.hidden.md\\:flex');
    const bookButton = document.querySelector('button.hidden.md\\:block');
    
    return {
      hamburgerVisible: hamburger && window.getComputedStyle(hamburger).display !== 'none',
      desktopMenuHidden: !desktopMenu || window.getComputedStyle(desktopMenu).display === 'none',
      bookButtonHidden: !bookButton || window.getComputedStyle(bookButton).display === 'none'
    };
  });
  
  console.log('Hamburger check:', hamburgerCheck);
  
  // Take screenshot
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/mobile-fixed.png',
    fullPage: false
  });
  
  // Test hamburger menu click
  await page.click('button.md\\:hidden');
  await page.waitForTimeout(500);
  
  const mobileMenuVisible = await page.evaluate(() => {
    const mobileMenu = document.querySelector('.fixed.inset-0.z-\\[2000\\]') || 
                       document.querySelector('[class*="translate-x-0"]');
    return mobileMenu && !mobileMenu.className.includes('-translate-x-full');
  });
  
  console.log('Mobile menu opens:', mobileMenuVisible);
  
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/mobile-menu-open.png',
    fullPage: false
  });
});