const { test, expect } = require('@playwright/test');

test('test About Us page', async ({ page }) => {
  await page.goto('https://multibook.geertest.com/about-us', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  // Check page structure
  const pageStructure = await page.evaluate(() => {
    const sections = [];
    
    // Check for About Us title
    const title = document.querySelector('h1');
    if (title) sections.push({ name: 'Title', text: title.textContent });
    
    // Check for video
    const video = document.querySelector('iframe[src*="youtube"]');
    if (video) sections.push({ name: 'Video', exists: true });
    
    // Check for Mission/Vision
    const mission = Array.from(document.querySelectorAll('h2')).find(h => h.textContent === 'Mission');
    const vision = Array.from(document.querySelectorAll('h2')).find(h => h.textContent === 'Vision');
    if (mission) sections.push({ name: 'Mission', exists: true });
    if (vision) sections.push({ name: 'Vision', exists: true });
    
    // Check for Core Values
    const coreValues = Array.from(document.querySelectorAll('h2')).find(h => h.textContent === 'Core Values');
    if (coreValues) sections.push({ name: 'Core Values', exists: true });
    
    // Check for CEO Message
    const ceoMessage = Array.from(document.querySelectorAll('h2')).find(h => h.textContent === 'Message from the CEO');
    if (ceoMessage) sections.push({ name: 'CEO Message', exists: true });
    
    return sections;
  });
  
  console.log('Page structure:', pageStructure);
  
  // Take screenshots
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/about-us-top.png',
    fullPage: false
  });
  
  // Scroll to each section and screenshot
  const sections = ['Mission', 'Core Values', 'Message from the CEO'];
  
  for (const section of sections) {
    await page.evaluate((sectionName) => {
      const heading = Array.from(document.querySelectorAll('h2')).find(h => h.textContent === sectionName);
      if (heading) heading.scrollIntoView({ behavior: 'smooth' });
    }, section);
    
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: `tests/e2e/screenshots/about-us-${section.toLowerCase().replace(/\s+/g, '-')}.png`,
      fullPage: false
    });
  }
  
  // Full page screenshot
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/about-us-full.png',
    fullPage: true
  });
});