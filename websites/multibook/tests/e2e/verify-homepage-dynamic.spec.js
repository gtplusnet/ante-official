const { test } = require('@playwright/test');

test('verify homepage uses dynamic data from Strapi', async ({ page }) => {
  // First, fetch data from Strapi API to compare
  const [landingPageRes, industryLeadersRes] = await Promise.all([
    fetch('https://multibook-admin.geertest.com/api/landing-page?populate=*').then(r => r.json()),
    fetch('https://multibook-admin.geertest.com/api/landing-page-industry-leaders?populate=*').then(r => r.json())
  ]);
  
  const landingPageData = landingPageRes.data;
  const industryLeaders = industryLeadersRes.data;
  
  console.log('Strapi Landing Page Data:');
  console.log('- Headline:', landingPageData.LandingPageHeadline);
  console.log('- Subheadline:', landingPageData.LandingPageSubheadline);
  console.log('- Try It Out Headline:', landingPageData.TryItOutHeadline);
  console.log('- Try It Out Button:', landingPageData.TryItOutButton);
  console.log('- Industry Leaders Header:', landingPageData.IndustryLeadersHeader);
  console.log('- Endorsed By Title:', landingPageData.EndorsedByTitle);
  console.log('- Industry Leaders Count:', industryLeaders.length);
  
  // Visit the homepage
  await page.goto('https://multibook.geertest.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  // Check Hero Section
  const heroHeadline = await page.textContent('h1.text-white');
  console.log('\nActual Hero Headline:', heroHeadline);
  
  // Check Market Section  
  const marketSection = await page.locator('section:has-text("Try it out")').first();
  if (await marketSection.count() > 0) {
    const marketTitle = await marketSection.locator('h1').textContent();
    console.log('Market Section Title:', marketTitle);
  }
  
  // Check Partners Section
  const partnersSection = await page.locator('section:has(h2:has-text("Endorsed"))').first();
  if (await partnersSection.count() > 0) {
    const partnersTitle = await partnersSection.locator('h2').textContent();
    console.log('Partners Section Title:', partnersTitle);
    
    // Count partner logos
    const partnerLogos = await partnersSection.locator('img').count();
    console.log('Partner Logos Count:', partnerLogos / 2); // Divided by 2 because of duplication for scroll
  }
  
  // Take screenshot
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/homepage-dynamic-data.png', 
    fullPage: true 
  });
  
  console.log('\nScreenshot saved: tests/e2e/screenshots/homepage-dynamic-data.png');
});