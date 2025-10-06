const { test, expect } = require('@playwright/test');

test('check features section spacing', async ({ page }) => {
  await page.goto('https://multibook.geertest.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  // Scroll to features
  await page.evaluate(() => {
    document.querySelector('#features')?.scrollIntoView();
  });
  await page.waitForTimeout(1000);
  
  // Check if there's horizontal scroll in features section
  const hasHorizontalScroll = await page.evaluate(() => {
    const features = document.querySelector('#features');
    return features ? features.scrollWidth > features.clientWidth : false;
  });
  
  console.log('Features section has horizontal scroll:', hasHorizontalScroll);
  
  // Get carousel container info
  const carouselInfo = await page.evaluate(() => {
    const carousel = document.querySelector('.overflow-hidden');
    const carouselInner = carousel?.querySelector('.flex');
    const firstCard = carouselInner?.querySelector('[class*="flex-"][class*="0_0_"]');
    
    return {
      carouselWidth: carousel?.offsetWidth,
      innerWidth: carouselInner?.offsetWidth,
      hasNegativeMargins: carouselInner?.className.includes('ml-[-15px]'),
      cardClass: firstCard?.className
    };
  });
  
  console.log('Carousel info:', carouselInfo);
  
  // Take screenshot
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/features-spacing-fixed.png',
    fullPage: false
  });
  
  // Check right edge
  const rightEdgeCheck = await page.evaluate(() => {
    const section = document.querySelector('#features');
    const cards = section?.querySelectorAll('.group');
    const lastVisibleCard = cards?.[2]; // Third card on desktop
    
    if (lastVisibleCard) {
      const rect = lastVisibleCard.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      return {
        cardRight: rect.right,
        viewportWidth: viewportWidth,
        gapToEdge: viewportWidth - rect.right
      };
    }
    return null;
  });
  
  console.log('Right edge check:', rightEdgeCheck);
});