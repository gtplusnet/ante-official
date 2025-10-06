const { test } = require('@playwright/test');

test('compare About Us pages in detail', async ({ page }) => {
  // First capture Quasar version
  console.log('Loading Quasar About Us page...');
  await page.goto('http://localhost:9000/#/About-us', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Get Quasar styles
  const quasarStyles = await page.evaluate(() => {
    const results = {};
    
    // Hero section
    const heroSection = document.querySelector('.bg-img');
    if (heroSection) {
      const heroStyle = window.getComputedStyle(heroSection);
      results.hero = {
        height: heroStyle.height,
        backgroundImage: heroStyle.backgroundImage,
        backgroundSize: heroStyle.backgroundSize,
        backgroundPosition: heroStyle.backgroundPosition
      };
      
      // Hero text
      const heroTitle = heroSection.querySelector('h1');
      if (heroTitle) {
        const titleStyle = window.getComputedStyle(heroTitle);
        results.heroTitle = {
          fontSize: titleStyle.fontSize,
          fontWeight: titleStyle.fontWeight,
          color: titleStyle.color,
          textAlign: titleStyle.textAlign
        };
      }
    }
    
    // Company definition section
    const companySection = Array.from(document.querySelectorAll('section')).find(s => 
      s.textContent.includes('innovative company')
    );
    if (companySection) {
      const sectionStyle = window.getComputedStyle(companySection);
      results.companyDefinition = {
        backgroundColor: sectionStyle.backgroundColor,
        padding: sectionStyle.padding,
        minHeight: sectionStyle.minHeight
      };
      
      // Check for parallax
      const hasParallax = !!companySection.querySelector('.q-parallax');
      results.companyDefinition.hasParallax = hasParallax;
    }
    
    // Mission/Vision section
    const missionSection = Array.from(document.querySelectorAll('section')).find(s => 
      s.textContent.includes('Mission') && s.textContent.includes('Vision')
    );
    if (missionSection) {
      const sectionStyle = window.getComputedStyle(missionSection);
      results.missionVision = {
        backgroundColor: sectionStyle.backgroundColor,
        layout: missionSection.querySelector('.row') ? 'row' : 'other'
      };
      
      // Check mission box
      const missionBox = missionSection.querySelector('.col-md-6');
      if (missionBox) {
        const boxStyle = window.getComputedStyle(missionBox);
        results.missionBox = {
          backgroundColor: boxStyle.backgroundColor,
          padding: boxStyle.padding
        };
      }
    }
    
    // Core Values section
    const coreValuesSection = Array.from(document.querySelectorAll('section')).find(s => 
      s.textContent.includes('Core Values')
    );
    if (coreValuesSection) {
      const sectionStyle = window.getComputedStyle(coreValuesSection);
      results.coreValues = {
        backgroundColor: sectionStyle.backgroundColor,
        hasCarousel: !!coreValuesSection.querySelector('.q-carousel')
      };
      
      // Check title
      const title = coreValuesSection.querySelector('h2');
      if (title) {
        const titleStyle = window.getComputedStyle(title);
        results.coreValuesTitle = {
          fontSize: titleStyle.fontSize,
          fontWeight: titleStyle.fontWeight,
          textAlign: titleStyle.textAlign,
          marginBottom: titleStyle.marginBottom
        };
      }
    }
    
    // CEO Message section
    const ceoSection = Array.from(document.querySelectorAll('section')).find(s => 
      s.textContent.includes('CEO') || s.textContent.includes('Chief Executive')
    );
    if (ceoSection) {
      const sectionStyle = window.getComputedStyle(ceoSection);
      results.ceoMessage = {
        background: sectionStyle.background,
        hasGradient: sectionStyle.background.includes('gradient')
      };
      
      // Check CEO card
      const ceoCard = ceoSection.querySelector('.q-card, .bg-white');
      if (ceoCard) {
        const cardStyle = window.getComputedStyle(ceoCard);
        results.ceoCard = {
          backgroundColor: cardStyle.backgroundColor,
          borderRadius: cardStyle.borderRadius,
          boxShadow: cardStyle.boxShadow
        };
      }
    }
    
    return results;
  });
  
  console.log('Quasar styles:', JSON.stringify(quasarStyles, null, 2));
  
  // Take screenshots of each section
  await page.screenshot({ path: 'tests/e2e/screenshots/quasar-about-full.png', fullPage: true });
  
  // Now check Next.js version
  console.log('\nLoading Next.js About Us page...');
  await page.goto('https://multibook.geertest.com/about-us', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Get Next.js styles
  const nextStyles = await page.evaluate(() => {
    const results = {};
    
    // Hero section
    const heroSection = document.querySelector('section.relative.h-\\[300px\\]');
    if (heroSection) {
      const heroStyle = window.getComputedStyle(heroSection);
      results.hero = {
        height: heroStyle.height,
        backgroundImage: heroStyle.backgroundImage,
        backgroundSize: heroStyle.backgroundSize,
        backgroundPosition: heroStyle.backgroundPosition
      };
      
      // Hero text
      const heroTitle = heroSection.querySelector('h1');
      if (heroTitle) {
        const titleStyle = window.getComputedStyle(heroTitle);
        results.heroTitle = {
          fontSize: titleStyle.fontSize,
          fontWeight: titleStyle.fontWeight,
          color: titleStyle.color,
          textAlign: titleStyle.textAlign
        };
      }
    }
    
    // Company definition section
    const companySection = Array.from(document.querySelectorAll('section')).find(s => 
      s.textContent.includes('innovative company')
    );
    if (companySection) {
      const sectionStyle = window.getComputedStyle(companySection);
      results.companyDefinition = {
        backgroundColor: sectionStyle.backgroundColor,
        padding: sectionStyle.padding,
        minHeight: sectionStyle.minHeight
      };
      
      // Check for parallax
      const hasParallax = companySection.getAttribute('data-parallax') === 'true';
      results.companyDefinition.hasParallax = hasParallax;
    }
    
    // Mission/Vision section
    const missionSection = Array.from(document.querySelectorAll('section')).find(s => 
      s.textContent.includes('Mission') && s.textContent.includes('Vision')
    );
    if (missionSection) {
      const sectionStyle = window.getComputedStyle(missionSection);
      results.missionVision = {
        backgroundColor: sectionStyle.backgroundColor,
        layout: missionSection.querySelector('.grid') ? 'grid' : 'other'
      };
      
      // Check mission box
      const missionBox = missionSection.querySelector('div.bg-oxford-blue');
      if (missionBox) {
        const boxStyle = window.getComputedStyle(missionBox);
        results.missionBox = {
          backgroundColor: boxStyle.backgroundColor,
          padding: boxStyle.padding
        };
      }
    }
    
    // Core Values section
    const coreValuesSection = Array.from(document.querySelectorAll('section')).find(s => 
      s.textContent.includes('Core Values')
    );
    if (coreValuesSection) {
      const sectionStyle = window.getComputedStyle(coreValuesSection);
      results.coreValues = {
        backgroundColor: sectionStyle.backgroundColor,
        hasCarousel: !!coreValuesSection.querySelector('[class*="embla"]')
      };
      
      // Check title
      const title = coreValuesSection.querySelector('h2');
      if (title) {
        const titleStyle = window.getComputedStyle(title);
        results.coreValuesTitle = {
          fontSize: titleStyle.fontSize,
          fontWeight: titleStyle.fontWeight,
          textAlign: titleStyle.textAlign,
          marginBottom: titleStyle.marginBottom
        };
      }
    }
    
    // CEO Message section
    const ceoSection = Array.from(document.querySelectorAll('section')).find(s => 
      s.textContent.includes('CEO') || s.textContent.includes('Chief Executive')
    );
    if (ceoSection) {
      const sectionStyle = window.getComputedStyle(ceoSection);
      results.ceoMessage = {
        background: sectionStyle.background,
        hasGradient: sectionStyle.background.includes('gradient') || 
                     !!ceoSection.querySelector('[class*="gradient"]')
      };
      
      // Check CEO card
      const ceoCard = ceoSection.querySelector('.bg-white');
      if (ceoCard) {
        const cardStyle = window.getComputedStyle(ceoCard);
        results.ceoCard = {
          backgroundColor: cardStyle.backgroundColor,
          borderRadius: cardStyle.borderRadius,
          boxShadow: cardStyle.boxShadow
        };
      }
    }
    
    return results;
  });
  
  console.log('\nNext.js styles:', JSON.stringify(nextStyles, null, 2));
  
  // Take screenshots
  await page.screenshot({ path: 'tests/e2e/screenshots/nextjs-about-full.png', fullPage: true });
  
  // Compare differences
  console.log('\n=== DIFFERENCES ===');
  
  const differences = [];
  
  // Hero section
  if (quasarStyles.hero && nextStyles.hero) {
    if (quasarStyles.hero.height !== nextStyles.hero.height) {
      differences.push(`Hero height: Quasar=${quasarStyles.hero.height}, Next.js=${nextStyles.hero.height}`);
    }
  }
  
  // Company definition
  if (quasarStyles.companyDefinition && nextStyles.companyDefinition) {
    if (quasarStyles.companyDefinition.hasParallax !== nextStyles.companyDefinition.hasParallax) {
      differences.push(`Company section parallax: Quasar=${quasarStyles.companyDefinition.hasParallax}, Next.js=${nextStyles.companyDefinition.hasParallax}`);
    }
  }
  
  // Core Values
  if (quasarStyles.coreValuesTitle && nextStyles.coreValuesTitle) {
    if (quasarStyles.coreValuesTitle.fontSize !== nextStyles.coreValuesTitle.fontSize) {
      differences.push(`Core Values title size: Quasar=${quasarStyles.coreValuesTitle.fontSize}, Next.js=${nextStyles.coreValuesTitle.fontSize}`);
    }
  }
  
  // CEO Message
  if (quasarStyles.ceoMessage && nextStyles.ceoMessage) {
    if (quasarStyles.ceoMessage.hasGradient !== nextStyles.ceoMessage.hasGradient) {
      differences.push(`CEO section gradient: Quasar=${quasarStyles.ceoMessage.hasGradient}, Next.js=${nextStyles.ceoMessage.hasGradient}`);
    }
  }
  
  differences.forEach(diff => console.log(diff));
  
  if (differences.length === 0) {
    console.log('No major differences found in computed styles');
  }
});