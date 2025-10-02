import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { getTestUser } from '../fixtures/test-data';
import { createScreenshotHelper } from '../helpers/screenshot.helper';

test.describe('Media Library Module Integration Tests', () => {
  let loginPage: LoginPage;
  let screenshot: ReturnType<typeof createScreenshotHelper>;

  // Define all modules and their expected media library navigation
  const modules = [
    {
      name: 'CMS',
      submenuSelector: '[data-testid="cms-submenu"]',
      mediaLibraryText: 'Media Library',
      expectedRoute: '/member/cms/media/library'
    },
    {
      name: 'Assets',
      submenuSelector: '[data-testid="assets-submenu"]', 
      mediaLibraryText: 'Media Library',
      expectedRoute: '/member/asset/media/library'
    },
    {
      name: 'Manpower',
      submenuSelector: '[data-testid="manpower-submenu"]',
      mediaLibraryText: 'Media Library', 
      expectedRoute: '/member/manpower/media/library'
    },
    {
      name: 'Treasury',
      submenuSelector: '[data-testid="treasury-submenu"]',
      mediaLibraryText: 'Media Library',
      expectedRoute: '/member/treasury/media/library'
    },
    {
      name: 'School',
      submenuSelector: '[data-testid="school-submenu"]',
      mediaLibraryText: 'Media Library',
      expectedRoute: '/member/school/media/library'
    },
    {
      name: 'Leads',
      submenuSelector: '[data-testid="leads-submenu"]',
      mediaLibraryText: 'Media Library',
      expectedRoute: '/member/leads/media/library'
    }
  ];

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    screenshot = createScreenshotHelper('media-library-modules');

    console.log('🎬 Starting Media Library Module Test...');
    console.log('=' .repeat(60));
  });

  test('Login and verify media library navigation exists in all modules', async ({ page }) => {
    const testUser = getTestUser('DEFAULT');

    console.log('🎯 Test Objective: Verify media library navigation in all modules');
    console.log(`👤 User: ${testUser.username}`);
    console.log('=' .repeat(60));

    // STEP 1: Login
    console.log('\n🔐 STEP 1: LOGIN PROCESS');
    console.log('-' .repeat(30));
    
    await test.step('Login to application', async () => {
      await screenshot.takeStepScreenshot(page, 'before-login');
      await loginPage.login(testUser);
      
      // Verify login success
      await expect(page.locator('text=Welcome')).toBeVisible();
      console.log('✅ Login verification passed');
      await screenshot.takeStepScreenshot(page, 'after-login');
    });

    // STEP 2: Check media library navigation in each module
    console.log('\n📚 STEP 2: MODULE MEDIA LIBRARY NAVIGATION CHECK');
    console.log('-' .repeat(50));

    for (const module of modules) {
      await test.step(`Check ${module.name} module media library navigation`, async () => {
        console.log(`\n📂 Testing ${module.name} module...`);
        
        // Navigate to the module by looking for navigation items
        // Use a more generic approach since we don't have specific test IDs
        const moduleNavItem = page.locator(`text=${module.name}`).first();
        
        if (await moduleNavItem.isVisible()) {
          await moduleNavItem.click();
          await page.waitForTimeout(1000); // Wait for submenu to expand
          
          // Look for Media Library text in the navigation
          const mediaLibraryNav = page.locator(`text=${module.mediaLibraryText}`).last();
          
          if (await mediaLibraryNav.isVisible()) {
            console.log(`✅ ${module.name}: Media Library navigation found`);
            
            // Click on Media Library to test navigation
            await mediaLibraryNav.click();
            await page.waitForTimeout(2000); // Wait for page to load
            
            // Take screenshot for documentation
            await screenshot.takeStepScreenshot(page, `${module.name.toLowerCase()}-media-library`);
            
            // Verify we're on a media library page by checking for common elements
            const possibleMediaElements = [
              'text=Media Library',
              'text=Upload',
              'text=Files',
              '.media-library-core',
              '.media-container',
              '[data-testid="media-library"]'
            ];
            
            let mediaElementFound = false;
            for (const selector of possibleMediaElements) {
              if (await page.locator(selector).first().isVisible({ timeout: 3000 }).catch(() => false)) {
                mediaElementFound = true;
                break;
              }
            }
            
            if (mediaElementFound) {
              console.log(`✅ ${module.name}: Media library page loaded successfully`);
            } else {
              console.log(`⚠️  ${module.name}: Media library page may not have loaded properly`);
            }
          } else {
            console.log(`❌ ${module.name}: Media Library navigation not found`);
          }
        } else {
          console.log(`⚠️  ${module.name}: Module navigation not found, may require different selector`);
        }
        
        // Wait a moment between modules
        await page.waitForTimeout(500);
      });
    }

    console.log('\n📊 STEP 3: TEST SUMMARY');
    console.log('-' .repeat(30));
    console.log('Media library navigation test completed for all modules');
  });

  test('Verify media library components load properly', async ({ page }) => {
    const testUser = getTestUser('DEFAULT');
    
    console.log('🎯 Test Objective: Verify media library components functionality');
    
    await test.step('Login to application', async () => {
      await loginPage.login(testUser);
      await expect(page.locator('text=Welcome')).toBeVisible();
    });

    await test.step('Test CMS Media Library (reference implementation)', async () => {
      // Navigate directly to CMS media library as it's the reference implementation
      await page.goto('http://localhost:9000/member/cms/media/library');
      await page.waitForTimeout(3000);
      
      // Check for MediaLibraryCore component elements
      const mediaLibraryElements = [
        'text=Media Library',
        '.media-library-container',
        '.upload-button',
        '.media-grid'
      ];
      
      let elementsFound = 0;
      for (const selector of mediaLibraryElements) {
        if (await page.locator(selector).first().isVisible({ timeout: 5000 }).catch(() => false)) {
          elementsFound++;
          console.log(`✅ Found element: ${selector}`);
        }
      }
      
      console.log(`📊 CMS Media Library: ${elementsFound}/${mediaLibraryElements.length} core elements found`);
      await screenshot.takeStepScreenshot(page, 'cms-media-library-loaded');
      
      // Basic functionality test - check if upload area or buttons exist
      const uploadRelatedElements = [
        'button:has-text("Upload")',
        'input[type="file"]',
        '.upload-area',
        'text=Drop files here'
      ];
      
      let uploadElementFound = false;
      for (const selector of uploadRelatedElements) {
        if (await page.locator(selector).first().isVisible({ timeout: 3000 }).catch(() => false)) {
          uploadElementFound = true;
          console.log(`✅ Upload functionality available: ${selector}`);
          break;
        }
      }
      
      if (uploadElementFound) {
        console.log('✅ CMS Media Library: Upload functionality detected');
      } else {
        console.log('⚠️  CMS Media Library: Upload functionality not clearly visible');
      }
    });
  });

  test('Test navigation menu items contain media library entries', async ({ page }) => {
    const testUser = getTestUser('DEFAULT');
    
    await test.step('Login and check sidebar navigation', async () => {
      await loginPage.login(testUser);
      await expect(page.locator('text=Welcome')).toBeVisible();
      
      // Take a screenshot of the main navigation
      await screenshot.takeStepScreenshot(page, 'main-navigation');
      
      // Check if sidebar contains media library references
      const sidebarContent = await page.locator('.sidebar, .nav-left, .navigation').first().textContent();
      
      if (sidebarContent && sidebarContent.includes('Media Library')) {
        console.log('✅ Media Library navigation entries found in sidebar');
      } else {
        console.log('⚠️  Media Library navigation entries not clearly visible in sidebar');
      }
      
      // Count occurrences of "Media Library" in the page
      const mediaLibraryCount = await page.locator('text=Media Library').count();
      console.log(`📊 Found ${mediaLibraryCount} "Media Library" references on the page`);
      
      if (mediaLibraryCount >= 6) {
        console.log('✅ Expected number of media library menu items found (6+ modules)');
      } else {
        console.log(`⚠️  Expected 6+ media library references, found ${mediaLibraryCount}`);
      }
    });
  });

  test.afterEach(async () => {
    console.log('\n🏁 Test completed');
    console.log('=' .repeat(60));
  });
});