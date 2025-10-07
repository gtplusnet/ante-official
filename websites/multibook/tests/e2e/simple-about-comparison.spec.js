const { test } = require('@playwright/test');

test('compare About Us pages', async ({ page }) => {
  console.log('Testing Quasar About Us page...');
  
  // First capture Quasar
  await page.goto('http://localhost:8080/about-us', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  // Capture Quasar sections
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/quasar-about-hero.png',
    fullPage: false
  });
  
  // Scroll to video section
  await page.evaluate(() => {
    const video = document.querySelector('iframe');
    if (video) video.scrollIntoView();
  });
  await page.waitForTimeout(1000);
  
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/quasar-about-video.png',
    fullPage: false
  });
  
  // Get Quasar design info
  const quasarDesign = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const sections = document.querySelectorAll('section').length;
    const hasVideo = !!document.querySelector('iframe');
    const hasMission = !!Array.from(document.querySelectorAll('*')).find(el => el.textContent === 'Mission');
    const hasVision = !!Array.from(document.querySelectorAll('*')).find(el => el.textContent === 'Vision');
    const hasCoreValues = !!Array.from(document.querySelectorAll('*')).find(el => el.textContent === 'Core Values');
    const hasCEO = !!Array.from(document.querySelectorAll('*')).find(el => el.textContent?.includes('Message from'));
    
    return {
      h1Text: h1?.textContent,
      h1FontSize: h1 ? window.getComputedStyle(h1).fontSize : null,
      sectionsCount: sections,
      hasVideo,
      hasMission,
      hasVision,
      hasCoreValues,
      hasCEO
    };
  });
  
  console.log('Quasar About Us:', quasarDesign);
  
  // Now test Next.js
  console.log('\nTesting Next.js About Us page...');
  
  await page.goto('https://multibook.geertest.com/about-us', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  // Capture Next.js sections
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/nextjs-about-hero.png',
    fullPage: false
  });
  
  // Scroll to video section
  await page.evaluate(() => {
    const video = document.querySelector('iframe');
    if (video) video.scrollIntoView();
  });
  await page.waitForTimeout(1000);
  
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/nextjs-about-video.png',
    fullPage: false
  });
  
  // Get Next.js design info
  const nextjsDesign = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const sections = document.querySelectorAll('section').length;
    const hasVideo = !!document.querySelector('iframe');
    const hasMission = !!Array.from(document.querySelectorAll('*')).find(el => el.textContent === 'Mission');
    const hasVision = !!Array.from(document.querySelectorAll('*')).find(el => el.textContent === 'Vision');
    const hasCoreValues = !!Array.from(document.querySelectorAll('*')).find(el => el.textContent === 'Core Values');
    const hasCEO = !!Array.from(document.querySelectorAll('*')).find(el => el.textContent?.includes('Message from'));
    
    return {
      h1Text: h1?.textContent,
      h1FontSize: h1 ? window.getComputedStyle(h1).fontSize : null,
      sectionsCount: sections,
      hasVideo,
      hasMission,
      hasVision,
      hasCoreValues,
      hasCEO
    };
  });
  
  console.log('Next.js About Us:', nextjsDesign);
  
  // Compare results
  console.log('\n=== Comparison ===');
  console.log('Title match:', quasarDesign.h1Text === nextjsDesign.h1Text);
  console.log('Has all sections:', 
    nextjsDesign.hasVideo && 
    nextjsDesign.hasMission && 
    nextjsDesign.hasVision && 
    nextjsDesign.hasCoreValues && 
    nextjsDesign.hasCEO
  );
  
  // Take full screenshots
  await page.goto('http://localhost:8080/about-us', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/quasar-about-full.png',
    fullPage: true
  });
  
  await page.goto('https://multibook.geertest.com/about-us', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/nextjs-about-full.png',
    fullPage: true
  });
});