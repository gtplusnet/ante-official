const { test } = require('@playwright/test');

test('check About Us sections in detail', async ({ page }) => {
  // Test Next.js version
  await page.goto('https://multibook.geertest.com/about-us', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  // Check each section
  const sections = [
    {
      name: 'Mission/Vision',
      action: async () => {
        await page.evaluate(() => {
          const mission = Array.from(document.querySelectorAll('h2')).find(h => h.textContent === 'Mission');
          if (mission) mission.scrollIntoView({ behavior: 'smooth' });
        });
      }
    },
    {
      name: 'Core Values',
      action: async () => {
        await page.evaluate(() => {
          const values = Array.from(document.querySelectorAll('h2')).find(h => h.textContent === 'Core Values');
          if (values) values.scrollIntoView({ behavior: 'smooth' });
        });
      }
    },
    {
      name: 'CEO Message',
      action: async () => {
        await page.evaluate(() => {
          const ceo = Array.from(document.querySelectorAll('h2')).find(h => h.textContent?.includes('Message from'));
          if (ceo) ceo.scrollIntoView({ behavior: 'smooth' });
        });
      }
    }
  ];
  
  for (const section of sections) {
    await section.action();
    await page.waitForTimeout(1500);
    
    await page.screenshot({ 
      path: `tests/e2e/screenshots/nextjs-about-${section.name.toLowerCase().replace(/[\/\s]+/g, '-')}.png`,
      fullPage: false
    });
  }
  
  // Check specific design elements
  const designCheck = await page.evaluate(() => {
    // Mission/Vision
    const missionSection = Array.from(document.querySelectorAll('h2')).find(h => h.textContent === 'Mission')?.closest('section');
    const missionStyle = missionSection ? {
      backgroundColor: window.getComputedStyle(missionSection).backgroundColor,
      layout: missionSection.querySelector('.grid') ? 'grid' : 'other'
    } : null;
    
    // Core Values
    const coreValuesTitle = Array.from(document.querySelectorAll('h2')).find(h => h.textContent === 'Core Values');
    const coreValuesSection = coreValuesTitle?.closest('section');
    const coreValuesStyle = coreValuesSection ? {
      backgroundColor: window.getComputedStyle(coreValuesSection).backgroundColor,
      titleSize: window.getComputedStyle(coreValuesTitle).fontSize,
      hasCarousel: !!coreValuesSection.querySelector('[class*="overflow-hidden"]')
    } : null;
    
    // CEO Message
    const ceoTitle = Array.from(document.querySelectorAll('h2')).find(h => h.textContent?.includes('Message from'));
    const ceoSection = ceoTitle?.closest('section');
    const ceoStyle = ceoSection ? {
      hasGradient: window.getComputedStyle(ceoSection).background.includes('gradient') || 
                   !!ceoSection.querySelector('[class*="gradient"]'),
      titleColor: window.getComputedStyle(ceoTitle).color
    } : null;
    
    return {
      mission: missionStyle,
      coreValues: coreValuesStyle,
      ceo: ceoStyle
    };
  });
  
  console.log('Design elements:', JSON.stringify(designCheck, null, 2));
});