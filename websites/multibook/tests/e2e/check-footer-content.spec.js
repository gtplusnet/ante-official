const { test, expect } = require('@playwright/test');

test('check footer content', async ({ page }) => {
  await page.goto('https://multibook.geertest.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  // Scroll to bottom to see footer
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  
  // Get page content
  const pageContent = await page.content();
  console.log('Checking for footer content...');
  
  // Check if footer exists
  const hasFooter = pageContent.includes('bg-oxford-blue');
  console.log('Has footer class:', hasFooter);
  
  // Check for specific footer text
  const hasFooterText = pageContent.includes('Company') && pageContent.includes('Services') && pageContent.includes('Help');
  console.log('Has footer text:', hasFooterText);
  
  // Check for copyright
  const hasCopyright = pageContent.includes('Copyright');
  console.log('Has copyright:', hasCopyright);
  
  // Take screenshot
  await page.screenshot({ 
    path: 'tests/e2e/screenshots/footer-check.png',
    fullPage: true
  });
  
  // Get all text content at bottom of page
  const footerArea = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const bottomElements = [];
    const viewportHeight = window.innerHeight;
    const scrollHeight = document.body.scrollHeight;
    
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      if (top > scrollHeight - viewportHeight * 2) {
        const text = el.textContent?.trim();
        if (text && text.length > 0 && text.length < 100) {
          bottomElements.push(text);
        }
      }
    });
    
    return bottomElements.slice(-50);
  });
  
  console.log('Bottom elements:', footerArea);
});