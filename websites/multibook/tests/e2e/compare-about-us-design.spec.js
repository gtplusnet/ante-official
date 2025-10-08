const { test, expect } = require('@playwright/test');

test.describe('Compare About Us Page Design', () => {
  test('capture and compare both About Us pages', async ({ browser }) => {
    // First, let's start the Quasar dev server
    console.log('Starting Quasar dev server...');
    
    // Create contexts for both sites
    const context1 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const context2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    
    const nextPage = await context1.newPage();
    const quasarPage = await context2.newPage();
    
    // Try to load Quasar first - check if it's running
    let quasarUrl = 'http://localhost:8080/about-us';
    let quasarRunning = false;
    
    try {
      await quasarPage.goto(quasarUrl, { waitUntil: 'networkidle', timeout: 5000 });
      quasarRunning = true;
    } catch (error) {
      console.log('Quasar not running on 8080, checking other options...');
      
      // Try port 9000
      try {
        quasarUrl = 'http://localhost:9000/about-us';
        await quasarPage.goto(quasarUrl, { waitUntil: 'networkidle', timeout: 5000 });
        quasarRunning = true;
      } catch (error2) {
        console.log('Could not connect to Quasar dev server');
      }
    }
    
    if (!quasarRunning) {
      console.log('Quasar server not running. Please start it with "npm run dev" in the Quasar project directory.');
      await context1.close();
      await context2.close();
      return;
    }
    
    // Load Next.js page
    await nextPage.goto('https://multibook.geertest.com/about-us', { waitUntil: 'networkidle' });
    
    // Wait for content to load
    await nextPage.waitForTimeout(3000);
    await quasarPage.waitForTimeout(3000);
    
    console.log('\n=== Design Comparison: About Us Page ===\n');
    
    // Compare page sections
    const sections = [
      { name: 'hero', selector: 'h1' },
      { name: 'video', selector: 'iframe' },
      { name: 'mission-vision', action: async (p) => {
        const mission = await p.locator('h2:has-text("Mission")').first();
        if (await mission.isVisible()) {
          await mission.scrollIntoViewIfNeeded();
        }
      }},
      { name: 'core-values', action: async (p) => {
        const values = await p.locator('h2:has-text("Core Values")').first();
        if (await values.isVisible()) {
          await values.scrollIntoViewIfNeeded();
        }
      }},
      { name: 'ceo-message', action: async (p) => {
        const ceo = await p.locator('h2:has-text("Message from")').first();
        if (await ceo.isVisible()) {
          await ceo.scrollIntoViewIfNeeded();
        }
      }}
    ];
    
    // Take screenshots of each section
    for (const section of sections) {
      if (section.action) {
        await section.action(nextPage);
        await section.action(quasarPage);
        await nextPage.waitForTimeout(1000);
        await quasarPage.waitForTimeout(1000);
      }
      
      await nextPage.screenshot({ 
        path: `tests/e2e/screenshots/about-nextjs-${section.name}.png`,
        fullPage: false
      });
      
      await quasarPage.screenshot({ 
        path: `tests/e2e/screenshots/about-quasar-${section.name}.png`,
        fullPage: false
      });
    }
    
    // Compare specific design elements
    
    // 1. Hero Section
    const nextHero = await nextPage.evaluate(() => {
      const h1 = document.querySelector('h1');
      return {
        text: h1?.textContent,
        fontSize: window.getComputedStyle(h1 || {}).fontSize,
        color: window.getComputedStyle(h1 || {}).color,
        textAlign: window.getComputedStyle(h1 || {}).textAlign
      };
    });
    
    const quasarHero = await quasarPage.evaluate(() => {
      const h1 = document.querySelector('h1');
      return {
        text: h1?.textContent,
        fontSize: window.getComputedStyle(h1 || {}).fontSize,
        color: window.getComputedStyle(h1 || {}).color,
        textAlign: window.getComputedStyle(h1 || {}).textAlign
      };
    });
    
    console.log('1. Hero Title:');
    console.log('   Next.js:', nextHero);
    console.log('   Quasar:', quasarHero);
    
    // 2. Video Section
    const nextVideo = await nextPage.evaluate(() => {
      const video = document.querySelector('iframe');
      const container = video?.closest('section');
      return {
        hasVideo: !!video,
        backgroundColor: container ? window.getComputedStyle(container).backgroundColor : null,
        padding: container ? window.getComputedStyle(container).padding : null
      };
    });
    
    const quasarVideo = await quasarPage.evaluate(() => {
      const video = document.querySelector('iframe');
      const container = video?.closest('section') || video?.closest('.video-section');
      return {
        hasVideo: !!video,
        backgroundColor: container ? window.getComputedStyle(container).backgroundColor : null,
        padding: container ? window.getComputedStyle(container).padding : null
      };
    });
    
    console.log('\n2. Video Section:');
    console.log('   Next.js:', nextVideo);
    console.log('   Quasar:', quasarVideo);
    
    // 3. Mission/Vision Layout
    const nextMissionVision = await nextPage.evaluate(() => {
      const mission = Array.from(document.querySelectorAll('h2')).find(h => h.textContent === 'Mission');
      const vision = Array.from(document.querySelectorAll('h2')).find(h => h.textContent === 'Vision');
      const container = mission?.closest('section');
      
      return {
        hasMission: !!mission,
        hasVision: !!vision,
        layout: container?.querySelector('.grid') ? 'grid' : 'other',
        backgroundColor: container ? window.getComputedStyle(container).backgroundColor : null
      };
    });
    
    const quasarMissionVision = await quasarPage.evaluate(() => {
      const mission = Array.from(document.querySelectorAll('h2')).find(h => h.textContent === 'Mission');
      const vision = Array.from(document.querySelectorAll('h2')).find(h => h.textContent === 'Vision');
      const container = mission?.closest('.q-pa-xl') || mission?.closest('section');
      
      return {
        hasMission: !!mission,
        hasVision: !!vision,
        layout: container?.querySelector('.row') ? 'row/grid' : 'other',
        backgroundColor: container ? window.getComputedStyle(container).backgroundColor : null
      };
    });
    
    console.log('\n3. Mission/Vision:');
    console.log('   Next.js:', nextMissionVision);
    console.log('   Quasar:', quasarMissionVision);
    
    // 4. Core Values
    const nextCoreValues = await nextPage.evaluate(() => {
      const title = Array.from(document.querySelectorAll('h2')).find(h => h.textContent === 'Core Values');
      const carousel = document.querySelector('[class*="embla"]') || document.querySelector('[class*="carousel"]');
      
      return {
        hasTitle: !!title,
        hasCarousel: !!carousel,
        titleColor: title ? window.getComputedStyle(title).color : null
      };
    });
    
    const quasarCoreValues = await quasarPage.evaluate(() => {
      const title = Array.from(document.querySelectorAll('h2')).find(h => h.textContent === 'Core Values');
      const carousel = document.querySelector('.carousel') || document.querySelector('[class*="carousel"]');
      
      return {
        hasTitle: !!title,
        hasCarousel: !!carousel,
        titleColor: title ? window.getComputedStyle(title).color : null
      };
    });
    
    console.log('\n4. Core Values:');
    console.log('   Next.js:', nextCoreValues);
    console.log('   Quasar:', quasarCoreValues);
    
    // 5. CEO Message
    const nextCEO = await nextPage.evaluate(() => {
      const title = Array.from(document.querySelectorAll('h2')).find(h => h.textContent?.includes('Message from'));
      const section = title?.closest('section');
      
      return {
        hasTitle: !!title,
        hasGradientBg: section ? window.getComputedStyle(section).background.includes('gradient') : false,
        titleColor: title ? window.getComputedStyle(title).color : null
      };
    });
    
    const quasarCEO = await quasarPage.evaluate(() => {
      const title = Array.from(document.querySelectorAll('h2')).find(h => h.textContent?.includes('Message from'));
      const section = title?.closest('.ceo-section') || title?.closest('section');
      
      return {
        hasTitle: !!title,
        hasGradientBg: section ? window.getComputedStyle(section).background.includes('gradient') : false,
        titleColor: title ? window.getComputedStyle(title).color : null
      };
    });
    
    console.log('\n5. CEO Message:');
    console.log('   Next.js:', nextCEO);
    console.log('   Quasar:', quasarCEO);
    
    // Take full page screenshots
    await nextPage.screenshot({ 
      path: 'tests/e2e/screenshots/about-nextjs-full.png',
      fullPage: true
    });
    
    await quasarPage.screenshot({ 
      path: 'tests/e2e/screenshots/about-quasar-full.png',
      fullPage: true
    });
    
    console.log('\n=== Summary ===');
    console.log('Screenshots saved for visual comparison.');
    console.log('Check the screenshots folder to compare the designs side by side.');
    
    await context1.close();
    await context2.close();
  });
});