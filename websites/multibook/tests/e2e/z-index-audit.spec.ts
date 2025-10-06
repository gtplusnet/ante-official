import { test, expect } from '@playwright/test';

test.describe('Z-index Audit', () => {
  test('should check all z-index values and potential conflicts', async ({ page }) => {
    await page.goto('http://localhost:3003');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Get all elements with z-index
    const elementsWithZIndex = await page.evaluate(() => {
      const elements = [];
      const allElements = document.querySelectorAll('*');
      
      allElements.forEach((el) => {
        const computedStyle = window.getComputedStyle(el);
        const zIndex = computedStyle.zIndex;
        const position = computedStyle.position;
        
        // Only consider elements with numeric z-index and positioned elements
        if (zIndex !== 'auto' && position !== 'static') {
          const rect = el.getBoundingClientRect();
          const classList = Array.from(el.classList);
          const tagName = el.tagName.toLowerCase();
          const id = el.id;
          
          elements.push({
            selector: id ? `#${id}` : classList.length > 0 ? `.${classList.join('.')}` : tagName,
            zIndex: parseInt(zIndex),
            position,
            location: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            },
            visible: rect.width > 0 && rect.height > 0,
            text: el.textContent?.substring(0, 50) || ''
          });
        }
      });
      
      // Sort by z-index descending
      return elements.sort((a, b) => b.zIndex - a.zIndex);
    });
    
    console.log('=== Z-INDEX AUDIT REPORT ===');
    console.log(`Found ${elementsWithZIndex.length} elements with z-index\n`);
    
    // Group by z-index values
    const zIndexGroups = {};
    elementsWithZIndex.forEach(el => {
      if (!zIndexGroups[el.zIndex]) {
        zIndexGroups[el.zIndex] = [];
      }
      zIndexGroups[el.zIndex].push(el);
    });
    
    // Report findings
    Object.keys(zIndexGroups)
      .sort((a, b) => parseInt(b) - parseInt(a))
      .forEach(zIndex => {
        console.log(`\nZ-INDEX: ${zIndex}`);
        zIndexGroups[zIndex].forEach(el => {
          console.log(`  - ${el.selector} (${el.position})`);
          if (el.text.trim()) {
            console.log(`    Content: "${el.text.trim()}..."`);
          }
        });
      });
    
    // Check for navigation z-index
    const navigation = await page.locator('nav').first();
    const navZIndex = await navigation.evaluate(el => window.getComputedStyle(el).zIndex);
    console.log(`\nNavigation z-index: ${navZIndex}`);
    
    // Look for potential conflicts
    console.log('\n=== POTENTIAL CONFLICTS ===');
    const highZIndexElements = elementsWithZIndex.filter(el => el.zIndex >= 500);
    if (highZIndexElements.length > 0) {
      console.log(`Found ${highZIndexElements.length} elements with z-index >= 500:`);
      highZIndexElements.forEach(el => {
        console.log(`  - ${el.selector}: z-index ${el.zIndex}`);
      });
    }
    
    // Test scrolling behavior
    console.log('\n=== SCROLL TEST ===');
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    
    const navAfterScroll = await navigation.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        zIndex: style.zIndex,
        position: style.position,
        background: style.backgroundColor
      };
    });
    
    console.log('Navigation after scroll:', navAfterScroll);
    
    // Take screenshot for visual reference
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/z-index-audit.png',
      fullPage: true 
    });
    
    // Assertions
    expect(parseInt(navZIndex)).toBeGreaterThanOrEqual(9999);
    
    // Check that no other element has z-index >= 9999
    const conflictingElements = elementsWithZIndex.filter(el => 
      el.zIndex >= 9999 && !el.selector.includes('nav')
    );
    
    expect(conflictingElements).toHaveLength(0);
  });
  
  test('should check section overlaps with navigation', async ({ page }) => {
    await page.goto('http://localhost:3003');
    await page.waitForLoadState('networkidle');
    
    // Test each section
    const sections = [
      { selector: '.relative.flex-1.flex.items-center.z-\\[500\\]', name: 'Hero Content' },
      { selector: '#newsletter', name: 'Newsletter' },
      { selector: 'section', name: 'All sections' }
    ];
    
    for (const section of sections) {
      const elements = await page.locator(section.selector).all();
      console.log(`\nChecking ${section.name}: found ${elements.length} elements`);
      
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const info = await el.evaluate(element => {
          const style = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return {
            zIndex: style.zIndex,
            position: style.position,
            visible: rect.width > 0 && rect.height > 0,
            top: rect.top
          };
        });
        
        if (info.visible && info.zIndex !== 'auto') {
          console.log(`  Element ${i}: z-index=${info.zIndex}, position=${info.position}`);
        }
      }
    }
  });
});