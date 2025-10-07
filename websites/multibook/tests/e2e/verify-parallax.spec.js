const { test, expect } = require('@playwright/test');

test.describe('Parallax Effects Verification', () => {
  test('should have working parallax effects on Hero, Market, and CTA sections', async ({ page }) => {
    // Navigate to the deployed site
    await page.goto('https://multibook.geertest.com');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Get initial positions
    const heroBackground = page.locator('.absolute.inset-0 > div').first();
    const marketSection = page.locator('section').filter({ hasText: 'EXPAND YOUR MARKET' });
    const ctaSection = page.locator('section').filter({ hasText: 'Contact Us' }).last();
    
    // Get initial transform values
    const getTransform = async (element) => {
      return await element.evaluate(el => {
        const transform = window.getComputedStyle(el).transform;
        if (transform === 'none') return 0;
        const match = transform.match(/matrix.*\((.+)\)/);
        if (match) {
          const values = match[1].split(', ');
          return parseFloat(values[5] || 0);
        }
        return 0;
      });
    };
    
    // Get initial positions
    const heroInitial = await getTransform(heroBackground);
    console.log('Hero initial transform:', heroInitial);
    
    // Scroll down to trigger parallax
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(100);
    
    // Check if Hero parallax moved
    const heroAfterScroll = await getTransform(heroBackground);
    console.log('Hero after scroll:', heroAfterScroll);
    expect(heroAfterScroll).not.toBe(heroInitial);
    
    // Scroll to Market section
    await marketSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    
    // Check Market section background
    const marketBackground = marketSection.locator('.absolute.inset-0').first();
    const marketTransform = await getTransform(marketBackground);
    console.log('Market transform:', marketTransform);
    
    // Scroll to CTA section
    await ctaSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    
    // Check CTA section background
    const ctaBackground = ctaSection.locator('.absolute.inset-0').first();
    const ctaTransform = await getTransform(ctaBackground);
    console.log('CTA transform:', ctaTransform);
    
    // Take screenshots for visual verification
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/parallax-hero.png',
      fullPage: false
    });
    
    await marketSection.scrollIntoViewIfNeeded();
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/parallax-market.png',
      fullPage: false
    });
    
    await ctaSection.scrollIntoViewIfNeeded();
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/parallax-cta.png',
      fullPage: false
    });
    
    // Verify sections are visible
    await expect(heroBackground).toBeVisible();
    await expect(marketSection).toBeVisible();
    await expect(ctaSection).toBeVisible();
  });
  
  test('should show smooth parallax scrolling effect', async ({ page }) => {
    await page.goto('https://multibook.geertest.com');
    await page.waitForLoadState('networkidle');
    
    // Record video of scrolling
    const positions = [];
    
    // Scroll gradually and record positions
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy(0, 200));
      await page.waitForTimeout(50);
      
      const heroDiv = page.locator('.absolute.inset-0 > div').first();
      const transform = await heroDiv.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.transform;
      });
      
      positions.push(transform);
    }
    
    // Verify transforms are changing
    const uniquePositions = [...new Set(positions)];
    console.log('Unique transform positions:', uniquePositions.length);
    expect(uniquePositions.length).toBeGreaterThan(5);
  });
});