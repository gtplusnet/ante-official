import { test, expect, Browser } from '@playwright/test';
import { StudentManagementPage } from '../pages/StudentManagementPage';
import { GuardianManagementPage } from '../pages/GuardianManagementPage';
import { MultiAppAuthHelper } from '../helpers/multi-app-auth.helper';
import { SupabaseTestHelper } from '../helpers/supabase-test.helper';
import { 
  StudentTestDataGenerator, 
  getTestStudent, 
  getTestGuardian
} from '../fixtures/student-management-test-data';

test.describe('Student & Guardian Management E2E Tests', () => {
  let multiAppAuth: MultiAppAuthHelper;
  let supabaseHelper: SupabaseTestHelper;
  let createdStudentIds: string[] = [];
  let createdGuardianIds: string[] = [];

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    // Initialize helpers
    multiAppAuth = new MultiAppAuthHelper(browser);
    supabaseHelper = new SupabaseTestHelper();
    await supabaseHelper.initialize();
  });

  test.beforeEach(async ({ page }) => {
    console.log('🧹 Setting up fresh test environment...');
    
    // Clear any previous test data
    createdStudentIds = [];
    createdGuardianIds = [];
    
    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/test-start.png', fullPage: true });
  });

  test.afterEach(async () => {
    console.log('🧹 Cleaning up test data...');
    
    // Clean up specific created entities
    if (createdStudentIds.length > 0 || createdGuardianIds.length > 0) {
      await supabaseHelper.cleanupSpecificData(createdStudentIds, createdGuardianIds);
    }
    
    // Take final screenshot
    const context = multiAppAuth.getAppContext('FRONTEND_MAIN');
    if (context?.page) {
      await context.page.screenshot({ path: 'screenshots/test-end.png', fullPage: true });
    }
  });

  test.afterAll(async () => {
    console.log('🧹 Final cleanup...');
    
    // Clean up any remaining test data
    await supabaseHelper.cleanupTestData();
    
    // Close all app contexts
    await multiAppAuth.closeAllApps();
  });

  test('should create student with complete information', async ({ page: _page }) => {
    console.log('🎯 Test: Create student with complete information');

    await test.step('Authenticate to Frontend Main', async () => {
      const appContext = await multiAppAuth.authenticateMainApp();
      expect(appContext.isAuthenticated).toBe(true);
    });

    await test.step('Navigate to Student Management', async () => {
      const context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      const studentPage = new StudentManagementPage(context!.page);
      await studentPage.navigateToStudentManagement();
      await studentPage.waitForTableToLoad();
    });

    await test.step('Create new student', async () => {
      const context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      const studentPage = new StudentManagementPage(context!.page);
      
      // Generate test student data
      const testStudent = getTestStudent();
      
      // Open add student dialog
      await studentPage.openAddStudentDialog();
      
      // Fill student form
      await studentPage.fillStudentForm(testStudent);
      
      // Submit form
      await studentPage.submitStudentForm();
      
      // Verify student appears in table
      const isVisible = await studentPage.verifyStudentInTable(testStudent);
      expect(isVisible).toBe(true);
      
      // Verify in database
      const studentData = await supabaseHelper.getStudentByStudentNumber(testStudent.studentNumber);
      expect(studentData).toBeTruthy();
      expect(studentData.account.firstName).toBe(testStudent.firstName);
      expect(studentData.account.lastName).toBe(testStudent.lastName);
      
      // Track for cleanup
      if (studentData) {
        createdStudentIds.push(studentData.id);
      }
    });
  });

  test('should create guardian with complete information', async ({ page: _page }) => {
    console.log('🎯 Test: Create guardian with complete information');

    await test.step('Authenticate to Frontend Main', async () => {
      const appContext = await multiAppAuth.authenticateMainApp();
      expect(appContext.isAuthenticated).toBe(true);
    });

    await test.step('Navigate to Guardian Management', async () => {
      const context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      const guardianPage = new GuardianManagementPage(context!.page);
      await guardianPage.navigateToGuardianManagement();
      await guardianPage.waitForTableToLoad();
    });

    await test.step('Create new guardian', async () => {
      const context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      const guardianPage = new GuardianManagementPage(context!.page);
      
      // Generate test guardian data
      const testGuardian = getTestGuardian();
      
      // Open add guardian dialog
      await guardianPage.openAddGuardianDialog();
      
      // Fill guardian form
      await guardianPage.fillGuardianForm(testGuardian);
      
      // Submit form
      await guardianPage.submitGuardianForm();
      
      // Verify guardian appears in table
      const isVisible = await guardianPage.verifyGuardianInTable(testGuardian);
      expect(isVisible).toBe(true);
      
      // Verify in database
      const guardianData = await supabaseHelper.getGuardianByEmail(testGuardian.email);
      expect(guardianData).toBeTruthy();
      expect(guardianData.firstName).toBe(testGuardian.firstName);
      expect(guardianData.lastName).toBe(testGuardian.lastName);
      
      // Track for cleanup
      if (guardianData) {
        createdGuardianIds.push(guardianData.id);
      }
    });
  });

  test('should create student-guardian relationship', async ({ page: _page }) => {
    console.log('🎯 Test: Create student-guardian relationship');

    let studentId: string;
    let guardianId: string;

    await test.step('Authenticate to Frontend Main', async () => {
      const appContext = await multiAppAuth.authenticateMainApp();
      expect(appContext.isAuthenticated).toBe(true);
    });

    await test.step('Create test student', async () => {
      const context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      const studentPage = new StudentManagementPage(context!.page);
      
      await studentPage.navigateToStudentManagement();
      
      const testStudent = getTestStudent();
      await studentPage.openAddStudentDialog();
      await studentPage.fillStudentForm(testStudent);
      await studentPage.submitStudentForm();
      
      // Get student ID from database
      const studentData = await supabaseHelper.getStudentByStudentNumber(testStudent.studentNumber);
      expect(studentData).toBeTruthy();
      studentId = studentData.id;
      createdStudentIds.push(studentId);
    });

    await test.step('Create test guardian', async () => {
      const context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      const guardianPage = new GuardianManagementPage(context!.page);
      
      await guardianPage.navigateToGuardianManagement();
      
      const testGuardian = getTestGuardian();
      await guardianPage.openAddGuardianDialog();
      await guardianPage.fillGuardianForm(testGuardian);
      await guardianPage.submitGuardianForm();
      
      // Get guardian ID from database
      const guardianData = await supabaseHelper.getGuardianByEmail(testGuardian.email);
      expect(guardianData).toBeTruthy();
      guardianId = guardianData.id;
      createdGuardianIds.push(guardianId);
    });

    await test.step('Assign student to guardian', async () => {
      // Use Supabase helper to create relationship (since the UI might not have this feature yet)
      const relationship = 'Mother';
      const isPrimary = true;
      
      const assigned = await supabaseHelper.assignGuardianToStudent(studentId, guardianId, relationship, isPrimary);
      expect(assigned).toBe(true);
      
      // Verify relationship exists
      const relationshipExists = await supabaseHelper.verifyStudentGuardianRelationship(studentId, guardianId);
      expect(relationshipExists).toBe(true);
    });

    await test.step('Verify relationship in database', async () => {
      // Get student with guardian information
      const studentData = await supabaseHelper.getStudentByStudentNumber('');
      
      // Get guardian with student information
      const guardianData = await supabaseHelper.getGuardianByEmail('');
      
      // Both should show the relationship
      expect(studentData.guardians).toBeDefined();
      expect(studentData.guardians.length).toBeGreaterThan(0);
      
      expect(guardianData.students).toBeDefined();
      expect(guardianData.students.length).toBeGreaterThan(0);
    });
  });

  test('should create multiple students and guardians with relationships', async ({ page: _page }) => {
    console.log('🎯 Test: Create multiple students and guardians with relationships');

    await test.step('Authenticate to Frontend Main', async () => {
      const appContext = await multiAppAuth.authenticateMainApp();
      expect(appContext.isAuthenticated).toBe(true);
    });

    await test.step('Create multiple student-guardian relationships', async () => {
      const relationshipCount = 3;
      const createdRelationships: Array<{ studentId: string, guardianId: string, relationship: string }> = [];

      for (let i = 0; i < relationshipCount; i++) {
        console.log(`Creating relationship ${i + 1}/${relationshipCount}`);

        // Create student
        const context = multiAppAuth.getAppContext('FRONTEND_MAIN');
        const studentPage = new StudentManagementPage(context!.page);
        
        await studentPage.navigateToStudentManagement();
        
        const testStudent = StudentTestDataGenerator.generateStudent({
          studentNumber: `E2E_STU_${Date.now()}_${i}`,
          email: `e2e.student.${Date.now()}.${i}@example.com`
        });
        
        await studentPage.openAddStudentDialog();
        await studentPage.fillStudentForm(testStudent);
        await studentPage.submitStudentForm();
        
        const studentData = await supabaseHelper.getStudentByStudentNumber(testStudent.studentNumber);
        expect(studentData).toBeTruthy();
        const studentId = studentData.id;
        createdStudentIds.push(studentId);

        // Create guardian
        const guardianPage = new GuardianManagementPage(context!.page);
        
        await guardianPage.navigateToGuardianManagement();
        
        const testGuardian = StudentTestDataGenerator.generateGuardian({
          email: `e2e.guardian.${Date.now()}.${i}@example.com`,
          lastName: testStudent.lastName, // Same family
          relationship: i % 2 === 0 ? 'Mother' : 'Father'
        });
        
        await guardianPage.openAddGuardianDialog();
        await guardianPage.fillGuardianForm(testGuardian);
        await guardianPage.submitGuardianForm();
        
        const guardianData = await supabaseHelper.getGuardianByEmail(testGuardian.email);
        expect(guardianData).toBeTruthy();
        const guardianId = guardianData.id;
        createdGuardianIds.push(guardianId);

        // Create relationship
        const relationship = testGuardian.relationship || 'Guardian';
        const assigned = await supabaseHelper.assignGuardianToStudent(studentId, guardianId, relationship, i === 0);
        expect(assigned).toBe(true);

        createdRelationships.push({ studentId, guardianId, relationship });
      }

      // Verify all relationships were created
      for (const rel of createdRelationships) {
        const exists = await supabaseHelper.verifyStudentGuardianRelationship(rel.studentId, rel.guardianId);
        expect(exists).toBe(true);
      }

      console.log(`✅ Successfully created ${createdRelationships.length} student-guardian relationships`);
    });
  });

  test('should handle validation errors gracefully', async ({ page: _page }) => {
    console.log('🎯 Test: Handle validation errors gracefully');

    await test.step('Authenticate to Frontend Main', async () => {
      const appContext = await multiAppAuth.authenticateMainApp();
      expect(appContext.isAuthenticated).toBe(true);
    });

    await test.step('Test student validation errors', async () => {
      const context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      const studentPage = new StudentManagementPage(context!.page);
      
      await studentPage.navigateToStudentManagement();
      await studentPage.openAddStudentDialog();
      
      // Try to submit empty form
      await studentPage.submitStudentForm();
      
      // Should still be on dialog (form validation should prevent submission)
      const dialogVisible = await studentPage.isElementVisible(studentPage['addEditDialog'], 3000);
      expect(dialogVisible).toBe(true);
      
      // Fill invalid data
      const invalidStudent = {
        studentNumber: '', // Empty required field
        firstName: '',     // Empty required field
        lastName: '',      // Empty required field
        email: 'invalid-email',  // Invalid format
        contactNumber: 'abc',    // Invalid format
        dateOfBirth: '2030-01-01' // Future date
      };
      
      // The form should show validation errors
      await studentPage.fillInput(studentPage['emailInput'], invalidStudent.email);
      await studentPage.fillInput(studentPage['contactNumberInput'], invalidStudent.contactNumber);
      
      await studentPage.submitStudentForm();
      
      // Should still be on dialog
      const stillOnDialog = await studentPage.isElementVisible(studentPage['addEditDialog'], 3000);
      expect(stillOnDialog).toBe(true);
    });

    await test.step('Test guardian validation errors', async () => {
      const context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      const guardianPage = new GuardianManagementPage(context!.page);
      
      await guardianPage.navigateToGuardianManagement();
      await guardianPage.openAddGuardianDialog();
      
      // Try to submit empty form
      await guardianPage.submitGuardianForm();
      
      // Should still be on dialog
      const dialogVisible = await guardianPage.isElementVisible(guardianPage['addEditDialog'], 3000);
      expect(dialogVisible).toBe(true);
      
      // Close dialog
      await guardianPage.closeDialog();
    });
  });

  test('should search and filter students and guardians', async ({ page: _page }) => {
    console.log('🎯 Test: Search and filter students and guardians');

    let testStudentNumber: string;
    let testGuardianEmail: string;

    await test.step('Authenticate to Frontend Main', async () => {
      const appContext = await multiAppAuth.authenticateMainApp();
      expect(appContext.isAuthenticated).toBe(true);
    });

    await test.step('Create test data for searching', async () => {
      const context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      
      // Create searchable student
      const studentPage = new StudentManagementPage(context!.page);
      const testStudent = StudentTestDataGenerator.generateStudent({
        firstName: 'SearchableStudent',
        lastName: 'TestUser',
        studentNumber: `SEARCH_${Date.now()}`
      });
      
      await studentPage.navigateToStudentManagement();
      await studentPage.openAddStudentDialog();
      await studentPage.fillStudentForm(testStudent);
      await studentPage.submitStudentForm();
      
      testStudentNumber = testStudent.studentNumber;
      
      const studentData = await supabaseHelper.getStudentByStudentNumber(testStudentNumber);
      if (studentData) {
        createdStudentIds.push(studentData.id);
      }

      // Create searchable guardian
      const guardianPage = new GuardianManagementPage(context!.page);
      const testGuardian = StudentTestDataGenerator.generateGuardian({
        firstName: 'SearchableGuardian',
        lastName: 'TestUser',
        email: `searchable.${Date.now()}@example.com`
      });
      
      await guardianPage.navigateToGuardianManagement();
      await guardianPage.openAddGuardianDialog();
      await guardianPage.fillGuardianForm(testGuardian);
      await guardianPage.submitGuardianForm();
      
      testGuardianEmail = testGuardian.email;
      
      const guardianData = await supabaseHelper.getGuardianByEmail(testGuardianEmail);
      if (guardianData) {
        createdGuardianIds.push(guardianData.id);
      }
    });

    await test.step('Search for student', async () => {
      const context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      const studentPage = new StudentManagementPage(context!.page);
      
      await studentPage.navigateToStudentManagement();
      await studentPage.searchStudent('SearchableStudent');
      
      // Should find the student
      const isFound = await studentPage.verifyStudentInTable({
        studentNumber: testStudentNumber
      } as any);
      expect(isFound).toBe(true);
    });

    await test.step('Search for guardian', async () => {
      const context = multiAppAuth.getAppContext('FRONTEND_MAIN');
      const guardianPage = new GuardianManagementPage(context!.page);
      
      await guardianPage.navigateToGuardianManagement();
      await guardianPage.searchGuardian('SearchableGuardian');
      
      // Should find the guardian
      const isFound = await guardianPage.verifyGuardianInTable({
        email: testGuardianEmail
      } as any);
      expect(isFound).toBe(true);
    });
  });
});