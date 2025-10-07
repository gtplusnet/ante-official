const { test, expect } = require('@playwright/test');

test.describe('Mobile Logo Check', () => {
  test('check logo on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    
    await page.goto('https://multibook.geertest.com', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Get navigation and logo information
    const logoInfo = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      const logo = nav?.querySelector('img[alt*="Logo"]');
      const navRect = nav?.getBoundingClientRect();
      const logoRect = logo?.getBoundingClientRect();
      
      return {
        nav: {
          width: navRect?.width,
          height: navRect?.height,
          left: navRect?.left,
          right: navRect?.right
        },
        logo: {
          width: logoRect?.width,
          height: logoRect?.height,
          left: logoRect?.left,
          right: logoRect?.right,
          src: logo?.src
        },
        overflow: {
          overflowsLeft: logoRect && logoRect.left < 0,
          overflowsRight: logoRect && logoRect.right > (navRect?.right || 0),
          overflowsTop: logoRect && logoRect.top < (navRect?.top || 0),
          overflowsBottom: logoRect && logoRect.bottom > (navRect?.bottom || 0)
        },
        classes: logo?.className
      };
    });
    
    console.log('Navigation info:', logoInfo.nav);
    console.log('Logo info:', logoInfo.logo);
    console.log('Overflow status:', logoInfo.overflow);
    console.log('Logo classes:', logoInfo.classes);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/mobile-logo-issue.png',
      fullPage: false
    });
    
    // Check different mobile sizes
    const mobileSizes = [
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'Galaxy S20', width: 360, height: 800 },
      { name: 'iPad Mini', width: 768, height: 1024 }
    ];
    
    for (const size of mobileSizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.waitForTimeout(500);
      
      const overflow = await page.evaluate(() => {
        const nav = document.querySelector('nav');
        const logo = nav?.querySelector('img[alt*="Logo"]');
        const navRect = nav?.getBoundingClientRect();
        const logoRect = logo?.getBoundingClientRect();
        
        return {
          navWidth: navRect?.width,
          logoWidth: logoRect?.width,
          logoRight: logoRect?.right,
          navRight: navRect?.right,
          overflows: logoRect && navRect && logoRect.right > navRect.right
        };
      });
      
      console.log(`\n${size.name} (${size.width}px):`, overflow);
      
      await page.screenshot({ 
        path: `tests/e2e/screenshots/mobile-${size.width}px.png`,
        fullPage: false
      });
    }
    
    // Check hamburger menu visibility
    const hamburgerVisible = await page.locator('button.md\\:hidden').isVisible();
    console.log('\nHamburger menu visible:', hamburgerVisible);
  });
});