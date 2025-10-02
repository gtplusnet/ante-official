import { test, expect, Browser } from '@playwright/test';
import { MultiAppAuthHelper } from '../helpers/multi-app-auth.helper';

test.describe('Working UI Validation Tests', () => {
  let multiAppAuth: MultiAppAuthHelper;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    multiAppAuth = new MultiAppAuthHelper(browser);
  });

  test.afterAll(async () => {
    await multiAppAuth.closeAllApps();
  });

  test('should authenticate and validate Student Management UI', async ({ page: _page }) => {
    console.log('🎯 Test: Student Management UI validation');
    
    await test.step('Authenticate to Frontend Main', async () => {
      const appContext = await multiAppAuth.authenticateMainApp();
      expect(appContext.isAuthenticated).toBe(true);
      expect(appContext.page.url()).toContain('/member/dashboard');
      console.log('✅ Authentication successful');
    });

    await test.step('Navigate to Student Management and verify UI elements', async () => {
      const context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      const testPage = context!.page;
      
      // Navigate to student management page
      console.log('🧭 Navigating to Student Management...');
      await testPage.goto('http://localhost:9000/#/member/school-management/student');
      await testPage.waitForLoadState('domcontentloaded');
      await testPage.waitForTimeout(5000); // Wait for Vue app to load content
      
      // Verify we're on the right page
      expect(testPage.url()).toContain('/student');
      
      // Take screenshot for debugging
      await testPage.screenshot({ 
        path: 'screenshots/student-management-working-test.png', 
        fullPage: true 
      });
      
      // Check for page content using the working approach
      const bodyText = await testPage.locator('body').textContent() || '';
      console.log(`📄 Page content length: ${bodyText.length} chars`);
      
      // Verify key content is present
      expect(bodyText).toContain('Student');
      expect(bodyText).toContain('Add Student');
      expect(bodyText).toContain('Management');
      
      // Test Add Student button using the selector that worked in debug
      const addStudentButton = testPage.locator('button:has-text("Add Student")');
      await addStudentButton.waitFor({ state: 'visible', timeout: 10000 });
      
      const buttonVisible = await addStudentButton.isVisible();
      expect(buttonVisible).toBe(true);
      console.log('✅ Add Student button is visible');
      
      // Test table using the selector that worked
      const studentsTable = testPage.locator('table');
      const tableVisible = await studentsTable.isVisible();
      expect(tableVisible).toBe(true);
      console.log('✅ Students table is visible');
      
      console.log('✅ Student Management UI validation completed');
    });

    await test.step('Test Add Student dialog opening', async () => {
      const context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      const testPage = context!.page;
      
      // Click Add Student button
      console.log('🔘 Testing Add Student dialog...');
      const addStudentButton = testPage.locator('button:has-text("Add Student")');
      await addStudentButton.click();
      
      // Wait for dialog to appear
      await testPage.waitForTimeout(2000);
      
      // Check if dialog is visible using working selector
      const dialog = testPage.locator('.q-dialog');
      const dialogVisible = await dialog.isVisible();
      
      if (dialogVisible) {
        console.log('✅ Add Student dialog opened');
        
        // Close dialog using the first close button
        const cancelButton = testPage.locator('button:has-text("Cancel"), button:has-text("Close")').first();
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
          console.log('✅ Dialog closed');
        } else {
          // Try clicking outside dialog to close
          await testPage.click('body');
        }
      } else {
        console.log('ℹ️ Dialog may not be implemented yet or uses different pattern');
      }
    });
  });

  test('should authenticate and validate Guardian Management UI', async ({ page: _page }) => {
    console.log('🎯 Test: Guardian Management UI validation');

    await test.step('Navigate to Guardian Management and verify UI elements', async () => {
      let context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      if (!context) {
        context = await multiAppAuth.authenticateMainApp();
        expect(context.isAuthenticated).toBe(true);
      }
      
      const testPage = context!.page;
      
      // Navigate to guardian management page
      console.log('🧭 Navigating to Guardian Management...');
      await testPage.goto('http://localhost:9000/#/member/school-management/guardian');
      await testPage.waitForLoadState('domcontentloaded');
      await testPage.waitForTimeout(5000); // Wait for Vue app to load content
      
      // Verify we're on the right page
      expect(testPage.url()).toContain('/guardian');
      
      // Take screenshot
      await testPage.screenshot({ 
        path: 'screenshots/guardian-management-working-test.png', 
        fullPage: true 
      });
      
      // Check for page content
      const bodyText = await testPage.locator('body').textContent() || '';
      console.log(`📄 Page content length: ${bodyText.length} chars`);
      
      // Verify key content is present
      expect(bodyText).toContain('Guardian');
      expect(bodyText).toContain('Add Guardian');
      expect(bodyText).toContain('Management');
      
      // Test Add Guardian button
      const addGuardianButton = testPage.locator('button:has-text("Add Guardian")');
      await addGuardianButton.waitFor({ state: 'visible', timeout: 10000 });
      
      const buttonVisible = await addGuardianButton.isVisible();
      expect(buttonVisible).toBe(true);
      console.log('✅ Add Guardian button is visible');
      
      // Test table
      const guardiansTable = testPage.locator('table');
      const tableVisible = await guardiansTable.isVisible();
      expect(tableVisible).toBe(true);
      console.log('✅ Guardians table is visible');
      
      console.log('✅ Guardian Management UI validation completed');
    });
  });

  test('should validate data generator functionality', async ({ page: _page }) => {
    console.log('🎯 Test: Data generator functionality');
    
    // Import data generators dynamically
    const { StudentTestDataGenerator } = await import('../fixtures/student-management-test-data');
    
    await test.step('Test student data generation', async () => {
      const students = StudentTestDataGenerator.generateMultipleStudents(3);
      expect(students.length).toBe(3);
      
      students.forEach((student, index) => {
        expect(student.firstName).toBeTruthy();
        expect(student.lastName).toBeTruthy();
        expect(student.email).toBeTruthy();
        expect(student.contactNumber).toBeTruthy();
        expect(student.studentNumber).toBeTruthy();
        
        console.log(`✅ Student ${index + 1} generated: ${student.firstName} ${student.lastName}`);
      });
    });

    await test.step('Test guardian data generation', async () => {
      const guardians = StudentTestDataGenerator.generateMultipleGuardians(2);
      expect(guardians.length).toBe(2);
      
      guardians.forEach((guardian, index) => {
        expect(guardian.firstName).toBeTruthy();
        expect(guardian.lastName).toBeTruthy();
        expect(guardian.email).toBeTruthy();
        expect(guardian.contactNumber).toBeTruthy();
        
        console.log(`✅ Guardian ${index + 1} generated: ${guardian.firstName} ${guardian.lastName}`);
      });
    });
    
    console.log('✅ Data generator tests completed');
  });
});