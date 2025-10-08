const { test, expect } = require('@playwright/test');

test.describe('Visual Design Comparison', () => {
  test('check Next.js implementation against requirements', async ({ page }) => {
    await page.goto('https://multibook.geertest.com', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    console.log('\n=== Next.js Homepage Design Check ===\n');
    
    // 1. Navigation Check
    const navCheck = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      const navStyle = window.getComputedStyle(nav);
      return {
        position: navStyle.position,
        backgroundColor: navStyle.backgroundColor,
        hasLogo: !!nav.querySelector('img[alt*="Logo"]'),
        hasBookButton: !!nav.querySelector('button:has-text("Book a Consultation")'),
        bookButtonColor: nav.querySelector('button:has-text("Book a Consultation")')?.style.backgroundColor || 
                        window.getComputedStyle(nav.querySelector('button:has-text("Book a Consultation")') || {}).backgroundColor
      };
    });
    console.log('1. Navigation:', navCheck);
    
    // 2. Hero Section Check
    const heroCheck = await page.evaluate(() => {
      const hero = document.querySelector('section');
      const h1 = hero?.querySelector('h1');
      const h2 = hero?.querySelector('h2');
      return {
        headline: h1?.textContent,
        headlineSize: window.getComputedStyle(h1 || {}).fontSize,
        subheadline: h2?.textContent,
        hasCarouselBackground: !!hero?.querySelector('img'),
        hasOverlay: !!hero?.querySelector('[class*="overlay"]') || !!hero?.querySelector('[class*="bg-black"]')
      };
    });
    console.log('\n2. Hero Section:', heroCheck);
    
    // 3. Features Section Check
    const featuresCheck = await page.evaluate(() => {
      const features = document.querySelector('#features');
      const style = window.getComputedStyle(features || {});
      return {
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderTopLeftRadius,
        title: features?.querySelector('h2')?.textContent,
        hasCarousel: !!features?.querySelector('[class*="carousel"]') || !!features?.querySelector('[class*="embla"]'),
        hasDots: !!features?.querySelector('button[aria-label*="slide"]')
      };
    });
    console.log('\n3. Features Section:', featuresCheck);
    
    // 4. Market Section Check
    await page.evaluate(() => {
      document.querySelector('h1:has-text("Try it out today")')?.scrollIntoView();
    });
    await page.waitForTimeout(1000);
    
    const marketCheck = await page.evaluate(() => {
      const market = Array.from(document.querySelectorAll('section')).find(s => 
        s.textContent?.includes('Try it out today')
      );
      return {
        title: market?.querySelector('h1')?.textContent,
        hasBackgroundImage: !!market?.querySelector('img'),
        hasContactButton: !!market?.querySelector('a:has-text("Contact Us")'),
        expandText: market?.querySelector('h4')?.textContent
      };
    });
    console.log('\n4. Market Section:', marketCheck);
    
    // 5. Partners Section Check
    await page.evaluate(() => {
      document.querySelector('h2:has-text("Endorsed by Industry Leaders")')?.scrollIntoView();
    });
    await page.waitForTimeout(1000);
    
    const partnersCheck = await page.evaluate(() => {
      const partners = Array.from(document.querySelectorAll('section')).find(s => 
        s.textContent?.includes('Endorsed by Industry Leaders')
      );
      const logos = partners?.querySelectorAll('img[alt*="logo"]') || [];
      return {
        title: partners?.querySelector('h2')?.textContent,
        titleColor: window.getComputedStyle(partners?.querySelector('h2') || {}).color,
        hasAnimation: !!partners?.querySelector('[class*="animate"]'),
        logoCount: logos.length,
        logos: Array.from(logos).slice(0, 5).map(img => img.alt)
      };
    });
    console.log('\n5. Partners Section:', partnersCheck);
    
    // 6. Newsletter Section Check
    await page.evaluate(() => {
      document.querySelector('h2:has-text("Newsletter")')?.scrollIntoView();
    });
    await page.waitForTimeout(1000);
    
    const newsletterCheck = await page.evaluate(() => {
      const newsletter = Array.from(document.querySelectorAll('section')).find(s => 
        s.querySelector('h2')?.textContent === 'Newsletter'
      );
      const cards = newsletter?.querySelectorAll('[class*="rounded"]') || [];
      return {
        title: newsletter?.querySelector('h2')?.textContent,
        backgroundColor: window.getComputedStyle(newsletter || {}).backgroundColor,
        cardCount: cards.length,
        hasGrid: !!newsletter?.querySelector('[class*="grid"]')
      };
    });
    console.log('\n6. Newsletter Section:', newsletterCheck);
    
    // 7. Footer Check
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    const footerCheck = await page.evaluate(() => {
      const footer = document.querySelector('[class*="bg-oxford-blue"]');
      const whiteSection = footer?.querySelector('[class*="bg-white"]');
      const copyright = Array.from(document.querySelectorAll('p')).find(p => 
        p.textContent?.includes('Copyright')
      );
      return {
        backgroundColor: window.getComputedStyle(footer || {}).backgroundColor,
        hasRoundedBottom: !!whiteSection?.className.match(/rounded-b/),
        roundedRadius: window.getComputedStyle(whiteSection || {}).borderBottomLeftRadius,
        copyrightText: copyright?.textContent,
        copyrightColor: window.getComputedStyle(copyright || {}).color,
        hasLanguageSelector: !!footer?.querySelector('button:has-text("EN")')
      };
    });
    console.log('\n7. Footer:', footerCheck);
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/nextjs-full-homepage.png',
      fullPage: true
    });
    
    // Design issues to check
    console.log('\n=== Design Checklist ===');
    console.log('✓ Fixed navigation:', navCheck.position === 'fixed');
    console.log('✓ Yellow book button:', navCheck.bookButtonColor?.includes('241, 240, 108') || navCheck.bookButtonColor?.includes('f1f06c'));
    console.log('✓ Features white background:', featuresCheck.backgroundColor?.includes('255, 255, 255'));
    console.log('✓ Features rounded top:', parseFloat(featuresCheck.borderRadius) > 0);
    console.log('✓ Red partners title:', partnersCheck.titleColor?.includes('254, 101, 104') || partnersCheck.titleColor?.includes('fe6568'));
    console.log('✓ Footer rounded bottom:', footerCheck.hasRoundedBottom);
    console.log('✓ Copyright red text:', footerCheck.copyrightColor?.includes('254, 101, 104'));
  });
});