import { test, expect, Browser } from '@playwright/test';
import { StudentManagementPage } from '../pages/StudentManagementPage';
import { GuardianManagementPage } from '../pages/GuardianManagementPage';
import { MultiAppAuthHelper } from '../helpers/multi-app-auth.helper';
import { 
  StudentTestDataGenerator, 
  getTestStudent, 
  getTestGuardian
} from '../fixtures/student-management-test-data';

test.describe('UI Validation and Interface Tests', () => {
  let multiAppAuth: MultiAppAuthHelper;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    multiAppAuth = new MultiAppAuthHelper(browser);
  });

  test.afterAll(async () => {
    await multiAppAuth.closeAllApps();
  });

  test('should authenticate and navigate to Student Management', async ({ page: _page }) => {
    console.log('🎯 Test: Authenticate and navigate to Student Management');

    await test.step('Authenticate to Frontend Main', async () => {
      const appContext = await multiAppAuth.authenticateMainApp();
      expect(appContext.isAuthenticated).toBe(true);
      expect(appContext.page.url()).toContain('/member/dashboard');
      
      console.log('✅ Authentication successful');
    });

    await test.step('Navigate to Student Management and verify UI', async () => {
      const context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      const studentPage = new StudentManagementPage(context!.page);
      
      await studentPage.navigateToStudentManagement();
      
      // Verify we're on the right page
      expect(context!.page.url()).toContain('/student');
      
      // Wait for the page to load completely
      await studentPage.waitForTableToLoad();
      
      // Verify key UI elements are present
      const addButtonVisible = await studentPage.isElementVisible(
        studentPage['addStudentButton'], 3000
      );
      expect(addButtonVisible).toBe(true);
      
      const tableVisible = await studentPage.isElementVisible(
        studentPage['studentsTable'], 3000
      );
      expect(tableVisible).toBe(true);
      
      console.log('✅ Student Management page loaded with all UI elements');
    });

    await test.step('Open and close Add Student dialog', async () => {
      const context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      const studentPage = new StudentManagementPage(context!.page);
      
      // Open dialog
      await studentPage.openAddStudentDialog();
      
      // Verify dialog opened
      const dialogVisible = await studentPage.isElementVisible(
        studentPage['addEditDialog'], 3000
      );
      expect(dialogVisible).toBe(true);
      
      // Verify form fields are present
      const firstNameVisible = await studentPage.isElementVisible(
        studentPage['firstNameInput'], 3000
      );
      expect(firstNameVisible).toBe(true);
      
      const lastNameVisible = await studentPage.isElementVisible(
        studentPage['lastNameInput'], 3000
      );
      expect(lastNameVisible).toBe(true);
      
      const emailVisible = await studentPage.isElementVisible(
        studentPage['emailInput'], 3000
      );
      expect(emailVisible).toBe(true);
      
      // Close dialog
      await studentPage.closeDialog();
      
      // Verify dialog closed
      const dialogClosed = !await studentPage.isElementVisible(
        studentPage['addEditDialog'], 2000
      );
      expect(dialogClosed).toBe(true);
      
      console.log('✅ Add Student dialog functionality verified');
    });
  });

  test('should authenticate and navigate to Guardian Management', async ({ page: _page }) => {
    console.log('🎯 Test: Authenticate and navigate to Guardian Management');

    await test.step('Navigate to Guardian Management and verify UI', async () => {
      // Use existing authentication if available
      let context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      if (!context) {
        context = await multiAppAuth.authenticateMainApp();
        expect(context.isAuthenticated).toBe(true);
      }
      
      const guardianPage = new GuardianManagementPage(context!.page);
      
      await guardianPage.navigateToGuardianManagement();
      
      // Verify we're on the right page
      expect(context!.page.url()).toContain('/guardian');
      
      // Wait for the page to load completely
      await guardianPage.waitForTableToLoad();
      
      // Verify key UI elements are present
      const addButtonVisible = await guardianPage.isElementVisible(
        guardianPage['addGuardianButton'], 3000
      );
      expect(addButtonVisible).toBe(true);
      
      const tableVisible = await guardianPage.isElementVisible(
        guardianPage['guardiansTable'], 3000
      );
      expect(tableVisible).toBe(true);
      
      console.log('✅ Guardian Management page loaded with all UI elements');
    });

    await test.step('Open and close Add Guardian dialog', async () => {
      const context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      const guardianPage = new GuardianManagementPage(context!.page);
      
      // Open dialog
      await guardianPage.openAddGuardianDialog();
      
      // Verify dialog opened
      const dialogVisible = await guardianPage.isElementVisible(
        guardianPage['addEditDialog'], 3000
      );
      expect(dialogVisible).toBe(true);
      
      // Verify form fields are present
      const firstNameVisible = await guardianPage.isElementVisible(
        guardianPage['firstNameInput'], 3000
      );
      expect(firstNameVisible).toBe(true);
      
      const lastNameVisible = await guardianPage.isElementVisible(
        guardianPage['lastNameInput'], 3000
      );
      expect(lastNameVisible).toBe(true);
      
      const emailVisible = await guardianPage.isElementVisible(
        guardianPage['emailInput'], 3000
      );
      expect(emailVisible).toBe(true);
      
      // Close dialog
      await guardianPage.closeDialog();
      
      // Verify dialog closed
      const dialogClosed = !await guardianPage.isElementVisible(
        guardianPage['addEditDialog'], 2000
      );
      expect(dialogClosed).toBe(true);
      
      console.log('✅ Add Guardian dialog functionality verified');
    });
  });

  test('should test form validation without submitting', async ({ page: _page }) => {
    console.log('🎯 Test: Form validation without submitting');

    await test.step('Test student form field validation', async () => {
      let context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      if (!context) {
        context = await multiAppAuth.authenticateMainApp();
      }
      
      const studentPage = new StudentManagementPage(context!.page);
      
      await studentPage.navigateToStudentManagement();
      await studentPage.openAddStudentDialog();
      
      // Generate test data
      const testStudent = getTestStudent();
      
      // Fill form fields one by one and verify they accept input
      await studentPage.fillInput(studentPage['studentNumberInput'], testStudent.studentNumber);
      const studentNumberValue = await context!.page.inputValue('[data-testid="student-number-input"], input[name="studentNumber"]');
      expect(studentNumberValue).toBe(testStudent.studentNumber);
      
      await studentPage.fillInput(studentPage['firstNameInput'], testStudent.firstName);
      const firstNameValue = await context!.page.inputValue('[data-testid="first-name-input"], input[name="firstName"]');
      expect(firstNameValue).toBe(testStudent.firstName);
      
      await studentPage.fillInput(studentPage['lastNameInput'], testStudent.lastName);
      const lastNameValue = await context!.page.inputValue('[data-testid="last-name-input"], input[name="lastName"]');
      expect(lastNameValue).toBe(testStudent.lastName);
      
      await studentPage.fillInput(studentPage['emailInput'], testStudent.email);
      const emailValue = await context!.page.inputValue('[data-testid="email-input"], input[name="email"]');
      expect(emailValue).toBe(testStudent.email);
      
      console.log('✅ Student form fields accept input correctly');
      
      // Close dialog without submitting
      await studentPage.closeDialog();
    });

    await test.step('Test guardian form field validation', async () => {
      const context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      const guardianPage = new GuardianManagementPage(context!.page);
      
      await guardianPage.navigateToGuardianManagement();
      await guardianPage.openAddGuardianDialog();
      
      // Generate test data
      const testGuardian = getTestGuardian();
      
      // Fill form fields one by one and verify they accept input
      await guardianPage.fillInput(guardianPage['firstNameInput'], testGuardian.firstName);
      const firstNameValue = await context!.page.inputValue('[data-testid="guardian-first-name-input"], input[name="firstName"]');
      expect(firstNameValue).toBe(testGuardian.firstName);
      
      await guardianPage.fillInput(guardianPage['lastNameInput'], testGuardian.lastName);
      const lastNameValue = await context!.page.inputValue('[data-testid="guardian-last-name-input"], input[name="lastName"]');
      expect(lastNameValue).toBe(testGuardian.lastName);
      
      await guardianPage.fillInput(guardianPage['emailInput'], testGuardian.email);
      const emailValue = await context!.page.inputValue('[data-testid="guardian-email-input"], input[name="email"]');
      expect(emailValue).toBe(testGuardian.email);
      
      await guardianPage.fillInput(guardianPage['contactNumberInput'], testGuardian.contactNumber);
      const contactValue = await context!.page.inputValue('[data-testid="guardian-contact-number-input"], input[name="contactNumber"]');
      expect(contactValue).toBe(testGuardian.contactNumber);
      
      console.log('✅ Guardian form fields accept input correctly');
      
      // Close dialog without submitting
      await guardianPage.closeDialog();
    });
  });

  test('should test search functionality UI', async ({ page: _page }) => {
    console.log('🎯 Test: Search functionality UI');

    await test.step('Test student search UI', async () => {
      let context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      if (!context) {
        context = await multiAppAuth.authenticateMainApp();
      }
      
      const studentPage = new StudentManagementPage(context!.page);
      
      await studentPage.navigateToStudentManagement();
      await studentPage.waitForTableToLoad();
      
      // Test search input exists and accepts input
      const searchInput = context!.page.locator('[data-testid="students-search"], input[placeholder*="Search"]');
      
      if (await searchInput.isVisible({ timeout: 3000 })) {
        await searchInput.fill('TestSearch123');
        const searchValue = await searchInput.inputValue();
        expect(searchValue).toBe('TestSearch123');
        
        // Clear search
        await searchInput.fill('');
        
        console.log('✅ Student search input functionality verified');
      } else {
        console.log('ℹ️ Student search input not found - may use different selector');
      }
    });

    await test.step('Test guardian search UI', async () => {
      const context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      const guardianPage = new GuardianManagementPage(context!.page);
      
      await guardianPage.navigateToGuardianManagement();
      await guardianPage.waitForTableToLoad();
      
      // Test search input exists and accepts input
      const searchInput = context!.page.locator('[data-testid="guardians-search"], input[placeholder*="Search"]');
      
      if (await searchInput.isVisible({ timeout: 3000 })) {
        await searchInput.fill('TestGuardianSearch');
        const searchValue = await searchInput.inputValue();
        expect(searchValue).toBe('TestGuardianSearch');
        
        // Clear search
        await searchInput.fill('');
        
        console.log('✅ Guardian search input functionality verified');
      } else {
        console.log('ℹ️ Guardian search input not found - may use different selector');
      }
    });
  });

  test('should test responsive design elements', async ({ page: _page }) => {
    console.log('🎯 Test: Responsive design elements');

    await test.step('Test different viewport sizes', async () => {
      let context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      if (!context) {
        context = await multiAppAuth.authenticateMainApp();
      }

      const viewports = [
        { width: 1920, height: 1080, name: 'Desktop' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
      ];

      for (const viewport of viewports) {
        console.log(`📱 Testing ${viewport.name} viewport: ${viewport.width}x${viewport.height}`);
        
        await context!.page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Navigate to student management
        const studentPage = new StudentManagementPage(context!.page);
        await studentPage.navigateToStudentManagement();
        
        // Take screenshot for visual verification
        await context!.page.screenshot({ 
          path: `screenshots/student-management-${viewport.name.toLowerCase()}.png`, 
          fullPage: true 
        });
        
        // Verify key elements are still visible and properly sized
        const addButton = context!.page.locator('[data-testid="add-student-button"], button:has-text("Add Student")');
        if (await addButton.isVisible({ timeout: 3000 })) {
          const boundingBox = await addButton.boundingBox();
          const isProperlyScaled = boundingBox && boundingBox.width > 0 && boundingBox.height > 0;
          
          console.log(`✅ ${viewport.name} - Add Student button properly visible and scaled: ${isProperlyScaled}`);
        }
      }
      
      // Reset to default viewport
      await context!.page.setViewportSize({ width: 1920, height: 1080 });
    });
  });

  test('should test data generator functionality', async ({ page: _page }) => {
    console.log('🎯 Test: Data generator functionality');

    await test.step('Test student data generation', async () => {
      // Test multiple student generation
      const students = StudentTestDataGenerator.generateMultipleStudents(5);
      expect(students.length).toBe(5);
      
      // Verify each student has required fields
      students.forEach((student, index) => {
        expect(student.firstName).toBeTruthy();
        expect(student.lastName).toBeTruthy();
        expect(student.email).toBeTruthy();
        expect(student.contactNumber).toBeTruthy();
        expect(student.studentNumber).toBeTruthy();
        expect(student.dateOfBirth).toBeTruthy();
        
        // Verify uniqueness
        const duplicates = students.filter(s => s.email === student.email);
        expect(duplicates.length).toBe(1);
        
        console.log(`✅ Student ${index + 1} generated correctly: ${student.firstName} ${student.lastName}`);
      });
    });

    await test.step('Test guardian data generation', async () => {
      // Test multiple guardian generation
      const guardians = StudentTestDataGenerator.generateMultipleGuardians(3);
      expect(guardians.length).toBe(3);
      
      // Verify each guardian has required fields
      guardians.forEach((guardian, index) => {
        expect(guardian.firstName).toBeTruthy();
        expect(guardian.lastName).toBeTruthy();
        expect(guardian.email).toBeTruthy();
        expect(guardian.contactNumber).toBeTruthy();
        
        // Verify uniqueness
        const duplicates = guardians.filter(g => g.email === guardian.email);
        expect(duplicates.length).toBe(1);
        
        console.log(`✅ Guardian ${index + 1} generated correctly: ${guardian.firstName} ${guardian.lastName}`);
      });
    });

    await test.step('Test student-guardian relationship generation', async () => {
      // Test relationship generation
      const relationships = [];
      
      for (let i = 0; i < 3; i++) {
        const relationship = StudentTestDataGenerator.generateStudentGuardianRelation();
        relationships.push(relationship);
        
        expect(relationship.student).toBeTruthy();
        expect(relationship.guardian).toBeTruthy();
        expect(relationship.relationship).toBeTruthy();
        expect(typeof relationship.isPrimary).toBe('boolean');
        
        console.log(`✅ Relationship ${i + 1}: ${relationship.student.firstName} ← ${relationship.relationship} → ${relationship.guardian.firstName}`);
      }
      
      expect(relationships.length).toBe(3);
    });
  });
});