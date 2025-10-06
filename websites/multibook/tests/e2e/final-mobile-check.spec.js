const { test, expect } = require('@playwright/test');

test('final mobile navigation check', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  
  await page.goto('https://multibook.geertest.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  const finalCheck = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    const logo = nav?.querySelector('img[alt*="Logo"]');
    const navRect = nav?.getBoundingClientRect();
    const logoRect = logo?.getBoundingClientRect();
    
    return {
      navHeight: navRect?.height,
      logoHeight: logoRect?.height,
      logoWidth: logoRect?.width,
      logoFitsInNav: logoRect && navRect && 
                     logoRect.top >= navRect.top && 
                     logoRect.bottom <= navRect.bottom,
      logoClasses: logo?.className,
      overflowAmount: logoRect && navRect ? 
                      Math.max(0, logoRect.bottom - navRect.bottom) : 0
    };
  });
  
  console.log('Final mobile check:', finalCheck);
  
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/mobile-final.png',
    fullPage: false
  });
  
  // Check mobile menu items
  await page.click('button.md\\:hidden');
  await page.waitForTimeout(500);
  
  const mobileMenuCheck = await page.evaluate(() => {
    const menuItems = document.querySelectorAll('a[class*="block py-3"]');
    return {
      itemCount: menuItems.length,
      hasHome: !!Array.from(menuItems).find(a => a.textContent === 'Home'),
      hasAbout: !!Array.from(menuItems).find(a => a.textContent === 'About Us'),
      hasServices: !!Array.from(menuItems).find(a => a.textContent === 'Services'),
      hasBookButton: !!document.querySelector('.bg-multibook-yellow.text-oxford-blue')
    };
  });
  
  console.log('Mobile menu:', mobileMenuCheck);
});