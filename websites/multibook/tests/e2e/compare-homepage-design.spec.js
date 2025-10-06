const { test, expect } = require('@playwright/test');

test.describe('Compare Homepage Design', () => {
  test('capture both homepages for comparison', async ({ browser }) => {
    // Create two browser contexts
    const context1 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const context2 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Load both sites
    await Promise.all([
      page1.goto('https://multibook.geertest.com', { waitUntil: 'networkidle' }),
      page2.goto('https://multibook.geertest.com:8080', { waitUntil: 'networkidle' })
    ]);
    
    // Wait for content to load
    await page1.waitForTimeout(3000);
    await page2.waitForTimeout(3000);
    
    // Take screenshots of different sections
    const sections = [
      { name: 'hero', selector: null, fullPage: false },
      { name: 'features', action: async (p) => await p.evaluate(() => document.querySelector('#features')?.scrollIntoView()) },
      { name: 'market', action: async (p) => await p.evaluate(() => document.querySelector('h1:has-text("Try it out today")')?.scrollIntoView()) },
      { name: 'partners', action: async (p) => await p.evaluate(() => document.querySelector('h2:has-text("Endorsed by Industry Leaders")')?.scrollIntoView()) },
      { name: 'newsletter', action: async (p) => await p.evaluate(() => document.querySelector('h2:has-text("Newsletter")')?.scrollIntoView()) },
      { name: 'footer', action: async (p) => await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)) }
    ];
    
    for (const section of sections) {
      if (section.action) {
        await section.action(page1);
        await section.action(page2);
        await page1.waitForTimeout(1000);
        await page2.waitForTimeout(1000);
      }
      
      await page1.screenshot({ 
        path: `tests/e2e/screenshots/nextjs-${section.name}.png`,
        fullPage: section.fullPage !== false
      });
      
      await page2.screenshot({ 
        path: `tests/e2e/screenshots/quasar-${section.name}.png`,
        fullPage: section.fullPage !== false
      });
    }
    
    // Check specific design elements
    console.log('\n=== Design Comparison ===\n');
    
    // Check navigation
    const nextNav = await page1.locator('nav').first().evaluate(el => ({
      bgColor: window.getComputedStyle(el).backgroundColor,
      height: el.offsetHeight,
      hasLogo: !!el.querySelector('img')
    }));
    
    const quasarNav = await page2.locator('.navigation').first().evaluate(el => ({
      bgColor: window.getComputedStyle(el).backgroundColor,
      height: el.offsetHeight,
      hasLogo: !!el.querySelector('img')
    }));
    
    console.log('Navigation:');
    console.log('- Next.js:', nextNav);
    console.log('- Quasar:', quasarNav);
    
    // Check hero text
    const nextHero = await page1.locator('h1').first().evaluate(el => ({
      text: el.textContent,
      fontSize: window.getComputedStyle(el).fontSize,
      color: window.getComputedStyle(el).color
    }));
    
    const quasarHero = await page2.locator('h1').first().evaluate(el => ({
      text: el.textContent,
      fontSize: window.getComputedStyle(el).fontSize,
      color: window.getComputedStyle(el).color
    }));
    
    console.log('\nHero Text:');
    console.log('- Next.js:', nextHero);
    console.log('- Quasar:', quasarHero);
    
    // Check features section
    const nextFeatures = await page1.evaluate(() => {
      const section = document.querySelector('#features');
      return section ? {
        bgColor: window.getComputedStyle(section).backgroundColor,
        borderRadius: window.getComputedStyle(section).borderTopLeftRadius,
        marginTop: window.getComputedStyle(section).marginTop
      } : null;
    });
    
    const quasarFeatures = await page2.evaluate(() => {
      const section = document.querySelector('.features-section');
      return section ? {
        bgColor: window.getComputedStyle(section).backgroundColor,
        borderRadius: window.getComputedStyle(section).borderTopLeftRadius,
        marginTop: window.getComputedStyle(section).marginTop
      } : null;
    });
    
    console.log('\nFeatures Section:');
    console.log('- Next.js:', nextFeatures);
    console.log('- Quasar:', quasarFeatures);
    
    // Check footer
    const nextFooter = await page1.evaluate(() => {
      const footer = document.querySelector('div.bg-oxford-blue');
      const footerWhite = footer?.querySelector('.bg-white');
      return {
        bgColor: footer ? window.getComputedStyle(footer).backgroundColor : null,
        borderRadius: footerWhite ? window.getComputedStyle(footerWhite).borderBottomLeftRadius : null,
        hasRoundedBottom: footerWhite?.className.includes('rounded-b')
      };
    });
    
    const quasarFooter = await page2.evaluate(() => {
      const footer = document.querySelector('.main');
      const footerFloat = footer?.querySelector('.footer-float');
      return {
        bgColor: footer ? window.getComputedStyle(footer).backgroundColor : null,
        borderRadius: footerFloat ? window.getComputedStyle(footerFloat).borderBottomLeftRadius : null,
        hasRoundedBottom: true
      };
    });
    
    console.log('\nFooter:');
    console.log('- Next.js:', nextFooter);
    console.log('- Quasar:', quasarFooter);
    
    await context1.close();
    await context2.close();
  });
});