import { test, expect } from '@playwright/test';

test.describe('Homepage Visual Verification', () => {
  test('should display all homepage sections with proper styling', async ({ page }) => {
    // Visit the deployed site
    await page.goto('https://multibook.geertest.com');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot of the full page
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/homepage-full.png',
      fullPage: true 
    });
    
    // Verify Hero Section
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();
    
    // Check hero text is white
    const heroHeadline = heroSection.locator('h1');
    await expect(heroHeadline).toBeVisible();
    await expect(heroHeadline).toHaveCSS('color', 'rgb(255, 255, 255)');
    
    // Verify Features Section
    const featuresSection = page.locator('section#features');
    await expect(featuresSection).toBeVisible();
    
    // Count feature cards
    const featureCards = featuresSection.locator('.bg-white.rounded-2xl');
    const featureCount = await featureCards.count();
    console.log(`Found ${featureCount} feature cards`);
    
    // Verify feature images are loaded
    for (let i = 0; i < featureCount; i++) {
      const card = featureCards.nth(i);
      const img = card.locator('img');
      await expect(img).toBeVisible();
      const src = await img.getAttribute('src');
      console.log(`Feature ${i + 1} image: ${src}`);
    }
    
    // Verify Market Section
    const marketSection = page.locator('section').filter({ hasText: 'EXPAND YOUR MARKET' });
    await expect(marketSection).toBeVisible();
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/market-section.png',
      clip: await marketSection.boundingBox() || undefined
    });
    
    // Verify Partners Section
    const partnersSection = page.locator('section').filter({ hasText: 'Endorsed by Industry Leaders' });
    await expect(partnersSection).toBeVisible();
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/partners-section.png',
      clip: await partnersSection.boundingBox() || undefined
    });
    
    // Verify Newsletter Section
    const newsletterSection = page.locator('section#newsletter');
    await expect(newsletterSection).toBeVisible();
    const newsletterCards = newsletterSection.locator('.bg-white.rounded-lg');
    const newsletterCount = await newsletterCards.count();
    console.log(`Found ${newsletterCount} newsletter items`);
    
    // Verify CTA Section
    const ctaSection = page.locator('section').filter({ has: page.locator('text="Contact Us"').last() });
    await expect(ctaSection).toBeVisible();
    
    // Verify Footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toHaveCSS('background-color', 'rgb(15, 31, 75)'); // Oxford blue
    
    // Log page structure for debugging
    const sections = await page.locator('section').count();
    console.log(`Total sections found: ${sections}`);
    
    // Check for any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });
  });
  
  test('should have responsive design', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('https://multibook.geertest.com');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/homepage-mobile.png',
      fullPage: true 
    });
    
    // Check mobile navigation
    const mobileMenuButton = page.locator('button[aria-label="Toggle menu"]');
    await expect(mobileMenuButton).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/homepage-tablet.png',
      fullPage: true 
    });
  });
});