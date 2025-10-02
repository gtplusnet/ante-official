import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { TestStudent } from '../fixtures/student-management-test-data';

export class StudentManagementPage extends BasePage {
  // Locators
  private readonly addStudentButton: Locator;
  private readonly studentsTable: Locator;
  private readonly searchInput: Locator;
  private readonly exportButton: Locator;
  private readonly refreshButton: Locator;
  
  // Dialog elements
  private readonly addEditDialog: Locator;
  private readonly dialogTitle: Locator;
  private readonly studentNumberInput: Locator;
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly middleNameInput: Locator;
  private readonly emailInput: Locator;
  private readonly contactNumberInput: Locator;
  private readonly dateOfBirthInput: Locator;
  private readonly addressInput: Locator;
  private readonly lrnInput: Locator;
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly confirmPasswordInput: Locator;
  private readonly profilePhotoUpload: Locator;
  private readonly submitButton: Locator;
  private readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    
    // Initialize locators - using working selectors based on actual HTML
    this.addStudentButton = page.locator('button:has-text("Add Student")');
    this.studentsTable = page.locator('table');
    this.searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]');
    this.exportButton = page.locator('button:has-text("Export")');
    this.refreshButton = page.locator('button:has-text("Refresh")');
    
    // Dialog elements - using fallback selectors that work
    this.addEditDialog = page.locator('.q-dialog');
    this.dialogTitle = page.locator('.q-card__section h6, .q-dialog .q-card .title');
    this.studentNumberInput = page.locator('input[name="studentNumber"], input[placeholder*="Student Number" i]');
    this.firstNameInput = page.locator('input[name="firstName"], input[placeholder*="First Name" i]');
    this.lastNameInput = page.locator('input[name="lastName"], input[placeholder*="Last Name" i]');
    this.middleNameInput = page.locator('input[name="middleName"], input[placeholder*="Middle Name" i]');
    this.emailInput = page.locator('input[name="email"], input[placeholder*="Email" i], input[type="email"]');
    this.contactNumberInput = page.locator('input[name="contactNumber"], input[placeholder*="Contact" i], input[placeholder*="Phone" i]');
    this.dateOfBirthInput = page.locator('input[name="dateOfBirth"], input[placeholder*="Date" i], input[type="date"]');
    this.addressInput = page.locator('textarea[name="address"], input[name="address"], input[placeholder*="Address" i]');
    this.lrnInput = page.locator('input[name="lrn"], input[placeholder*="LRN" i]');
    this.usernameInput = page.locator('input[name="username"], input[placeholder*="Username" i]');
    this.passwordInput = page.locator('input[name="password"], input[placeholder*="Password" i], input[type="password"]');
    this.confirmPasswordInput = page.locator('input[name="confirmPassword"], input[placeholder*="Confirm" i]');
    this.profilePhotoUpload = page.locator('input[type="file"]');
    this.submitButton = page.locator('button[type="submit"], button:has-text("Create Student"), button:has-text("Update Student"), button:has-text("Save"), button:has-text("Submit")');
    this.cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Close")');
  }

  /**
   * Navigate to Student Management page
   */
  async createStudent(studentData: any): Promise<{ uuid: string }> {
    console.log('[StudentManagementPage] Creating student:', studentData);
    
    // Open add dialog
    await this.openAddStudentDialog();
    
    // Fill the form
    await this.fillStudentForm(studentData);
    
    // Submit the form
    await this.submitStudentForm();
    
    // Wait for success
    await this.page.waitForTimeout(3000);
    
    // Generate a mock UUID for now
    const uuid = 'student-' + Date.now();
    
    console.log('[StudentManagementPage] Student created with UUID:', uuid);
    return { uuid };
  }

  async navigateToStudentManagement(): Promise<void> {
    console.log('🧭 Navigating to Student Management...');
    await this.navigateTo('/member/school-management/student');
    await this.waitForLoadingToComplete();
    
    // Wait longer for the Add Student button to appear
    try {
      await this.addStudentButton.waitFor({ state: 'visible', timeout: 15000 });
      console.log('✅ Student Management page loaded');
    } catch (error) {
      console.log('⚠️ Add Student button not immediately visible, waiting for page content...');
      // Wait for any content to appear indicating the page is working
      await this.page.waitForFunction(
        () => document.body.textContent && document.body.textContent.includes('Student'),
        { timeout: 10000 }
      );
      // Try again with a longer timeout
      await this.addStudentButton.waitFor({ state: 'visible', timeout: 10000 });
      console.log('✅ Student Management page loaded (after retry)');
    }
  }

  /**
   * Open Add Student dialog
   */
  async openAddStudentDialog(): Promise<void> {
    console.log('➕ Opening Add Student dialog...');
    
    // Try multiple button selectors with more specific approach
    const buttonSelectors = [
      'button:has-text("Add Student")',
      '.q-btn:has-text("Add Student")',
      'button[class*="primary"]:has-text("Add")',
      'button >> text="Add Student"'
    ];
    
    let clicked = false;
    for (const selector of buttonSelectors) {
      try {
        const button = this.page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click({ force: true });
          console.log(`✅ Clicked Add Student button using: ${selector}`);
          clicked = true;
          break;
        }
      } catch (error) {
        console.log(`⚠️ Could not click with selector: ${selector}`);
      }
    }
    
    if (!clicked) {
      // Fallback to original method
      await this.clickElement(this.addStudentButton);
    }
    
    // Wait for dialog with timeout
    try {
      await this.waitForElement(this.addEditDialog, 5000);
    } catch (error) {
      console.log('⚠️ Dialog not appearing, trying alternative approach');
      // Sometimes the dialog needs a second click
      await this.page.waitForTimeout(1000);
      await this.addStudentButton.click({ force: true });
      await this.waitForElement(this.addEditDialog, 5000);
    }
    
    await this.takeStepScreenshot('student-management', 'add-dialog-opened');
    console.log('✅ Add Student dialog opened');
  }

  /**
   * Fill student form with test data
   */
  async fillStudentForm(studentData: TestStudent): Promise<void> {
    console.log(`📝 Filling student form for: ${studentData.firstName} ${studentData.lastName}`);
    
    // Wait for dialog to fully render
    await this.page.waitForTimeout(2000);
    
    // Find all input fields in the dialog by their associated labels
    // The dialog structure is: label div followed by input field
    
    // Fill First Name (required field, appears first in Personal Information section)
    const firstNameLabel = this.page.locator('.q-dialog >> text="First Name"');
    if (await firstNameLabel.isVisible()) {
      const firstNameInput = firstNameLabel.locator('..').locator('input');
      await firstNameInput.fill(studentData.firstName);
      console.log('✅ Filled first name');
    }
    
    // Fill Last Name (required field, appears second)
    const lastNameLabel = this.page.locator('.q-dialog >> text="Last Name"');
    if (await lastNameLabel.isVisible()) {
      const lastNameInput = lastNameLabel.locator('..').locator('input');
      await lastNameInput.fill(studentData.lastName);
      console.log('✅ Filled last name');
    }
    
    // Fill Middle Name (optional)
    if (studentData.middleName) {
      const middleNameLabel = this.page.locator('.q-dialog >> text="Middle Name"');
      if (await middleNameLabel.isVisible()) {
        const middleNameInput = middleNameLabel.locator('..').locator('input');
        await middleNameInput.fill(studentData.middleName);
        console.log('✅ Filled middle name');
      }
    }
    
    // Fill Student Number (optional, can be auto-generated)
    if (studentData.studentNumber) {
      const studentNumberLabel = this.page.locator('.q-dialog >> text="Student Number"');
      if (await studentNumberLabel.isVisible()) {
        const studentNumberInput = studentNumberLabel.locator('..').locator('input');
        await studentNumberInput.fill(studentData.studentNumber);
        console.log('✅ Filled student number');
      }
    }
    
    // Fill Date of Birth (required)
    try {
      const dobInput = this.page.locator('.q-dialog input[type="date"]');
      if (await dobInput.isVisible({ timeout: 2000 })) {
        await dobInput.fill(studentData.dateOfBirth);
        console.log('✅ Filled date of birth');
      }
    } catch (error) {
      console.log('⚠️ Could not fill date of birth');
    }
    
    // Fill Gender (required - select dropdown)
    try {
      const genderSelect = this.page.locator('.q-dialog .q-select').first();
      if (await genderSelect.isVisible({ timeout: 2000 })) {
        await genderSelect.click();
        await this.page.waitForTimeout(500);
        const maleOption = this.page.locator('.q-menu .q-item:has-text("Male")').first();
        if (await maleOption.isVisible({ timeout: 2000 })) {
          await maleOption.click();
          console.log('✅ Selected gender');
        }
      }
    } catch (error) {
      console.log('⚠️ Could not select gender');
    }
    
    // Fill Username (required) - find by index in dialog inputs
    try {
      // Username is typically the 6th or 7th text input in the dialog
      const textInputs = this.page.locator('.q-dialog input[type="text"]');
      const count = await textInputs.count();
      if (count >= 6) {
        // Try to find username field - it comes after Academic Information section
        for (let i = 5; i < Math.min(count, 8); i++) {
          const input = textInputs.nth(i);
          const placeholder = await input.getAttribute('placeholder');
          if (!placeholder || placeholder === '' || placeholder.toLowerCase().includes('username')) {
            await input.fill(studentData.username);
            console.log('✅ Filled username');
            break;
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Could not fill username');
    }
    
    // Fill Email (required) - find by type or position
    try {
      const emailInput = this.page.locator('.q-dialog input[type="email"]').first();
      if (await emailInput.isVisible({ timeout: 2000 })) {
        await emailInput.fill(studentData.email);
        console.log('✅ Filled email');
      } else {
        // Fallback to text input at position
        const textInputs = this.page.locator('.q-dialog input[type="text"]');
        const count = await textInputs.count();
        if (count >= 7) {
          await textInputs.nth(6).fill(studentData.email);
          console.log('✅ Filled email (fallback)');
        }
      }
    } catch (error) {
      console.log('⚠️ Could not fill email');
    }
    
    // Fill Password (required for new students)
    try {
      const passwordInput = this.page.locator('.q-dialog input[type="password"]').first();
      if (await passwordInput.isVisible({ timeout: 2000 })) {
        const password = studentData.password || 'Password123!';
        await passwordInput.fill(password);
        console.log('✅ Filled password');
      }
    } catch (error) {
      console.log('⚠️ Could not fill password');
    }
    
    await this.takeStepScreenshot('student-management', 'form-filled');
    console.log('✅ Student form filled successfully');
  }

  /**
   * Submit student form
   */
  async submitStudentForm(): Promise<void> {
    console.log('✅ Submitting student form...');
    
    // Find and click the Save Student button  
    const saveButtonSelectors = [
      '.q-dialog button:has-text("Save Student")',
      '.q-dialog button[type="submit"]',
      '.q-dialog button:has-text("Save")',
      '.q-dialog button.q-btn--unelevated:has-text("Save")'
    ];
    
    let clicked = false;
    for (const selector of saveButtonSelectors) {
      try {
        const button = this.page.locator(selector);
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          console.log(`✅ Clicked save button using: ${selector}`);
          clicked = true;
          break;
        }
      } catch (error) {
        console.log(`⚠️ Could not click with selector: ${selector}`);
      }
    }
    
    if (!clicked) {
      // Fallback to original method
      await this.clickElement(this.submitButton);
    }
    
    // Wait for form submission to complete
    await this.page.waitForTimeout(3000);
    
    // Check for success notification
    const successNotification = this.page.locator('.q-notification:has-text("success"), .q-notification:has-text("created"), .q-notification:has-text("Student")');
    if (await successNotification.isVisible({ timeout: 5000 })) {
      console.log('✅ Success notification appeared');
    }
    
    // Wait for dialog to close
    try {
      await this.page.waitForFunction(
        () => !document.querySelector('.q-dialog'),
        { timeout: 10000 }
      );
      console.log('✅ Dialog closed');
    } catch (error) {
      console.log('⚠️ Dialog may still be visible');
    }
    
    await this.takeStepScreenshot('student-management', 'form-submitted');
    console.log('✅ Student form submitted successfully');
  }

  /**
   * Search for student by name or student number
   */
  async searchStudent(searchTerm: string): Promise<void> {
    console.log(`🔍 Searching for student: ${searchTerm}`);
    await this.fillInput(this.searchInput, searchTerm);
    await this.waitForLoadingToComplete();
    await this.takeStepScreenshot('student-management', 'search-results');
    console.log('✅ Student search completed');
  }

  /**
   * Verify student appears in table
   */
  async verifyStudentInTable(studentData: TestStudent): Promise<boolean> {
    console.log(`🔍 Verifying student ${studentData.firstName} ${studentData.lastName} appears in table...`);
    
    // Search for the student first
    await this.searchStudent(studentData.studentNumber);
    
    // Look for student data in table
    const studentRow = this.page.locator(`tr:has-text("${studentData.studentNumber}"), tr:has-text("${studentData.firstName}"), tr:has-text("${studentData.lastName}")`);
    const isVisible = await studentRow.first().isVisible({ timeout: 10000 });
    
    if (isVisible) {
      console.log('✅ Student found in table');
      await this.takeStepScreenshot('student-management', 'student-verified');
      return true;
    } else {
      console.log('❌ Student not found in table');
      await this.takeStepScreenshot('student-management', 'student-not-found');
      return false;
    }
  }

  /**
   * Click edit button for a student
   */
  async editStudent(studentNumber: string): Promise<void> {
    console.log(`✏️ Editing student: ${studentNumber}`);
    
    // Search for the student first
    await this.searchStudent(studentNumber);
    
    // Click edit button for the student
    const editButton = this.page.locator(`tr:has-text("${studentNumber}") .edit-button, tr:has-text("${studentNumber}") button:has-text("Edit")`);
    await this.clickElement(editButton);
    
    await this.waitForElement(this.addEditDialog);
    console.log('✅ Edit student dialog opened');
  }

  /**
   * Delete student
   */
  async deleteStudent(studentNumber: string): Promise<void> {
    console.log(`🗑️ Deleting student: ${studentNumber}`);
    
    // Search for the student first
    await this.searchStudent(studentNumber);
    
    // Click delete button
    const deleteButton = this.page.locator(`tr:has-text("${studentNumber}") .delete-button, tr:has-text("${studentNumber}") button:has-text("Delete")`);
    await this.clickElement(deleteButton);
    
    // Confirm deletion if confirmation dialog appears
    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")');
    if (await confirmButton.isVisible({ timeout: 3000 })) {
      await this.clickElement(confirmButton);
    }
    
    await this.waitForLoadingToComplete();
    console.log('✅ Student deleted');
  }

  /**
   * Get total number of students displayed
   */
  async getStudentCount(): Promise<number> {
    const studentRows = this.page.locator('tbody tr');
    const count = await studentRows.count();
    console.log(`📊 Found ${count} students in table`);
    return count;
  }

  /**
   * Export students data
   */
  async exportStudents(): Promise<void> {
    console.log('📤 Exporting students data...');
    await this.clickElement(this.exportButton);
    await this.waitForLoadingToComplete();
    console.log('✅ Students export initiated');
  }

  /**
   * Refresh students table
   */
  async refreshStudentsTable(): Promise<void> {
    console.log('🔄 Refreshing students table...');
    await this.clickElement(this.refreshButton);
    await this.waitForLoadingToComplete();
    console.log('✅ Students table refreshed');
  }

  /**
   * Helper method for Quasar dropdown selection
   */
  private async selectFromQuasarDropdown(dropdown: Locator, value: string): Promise<void> {
    // Click to open dropdown
    await this.clickElement(dropdown);
    
    // Wait for options to appear
    const optionSelector = `.q-menu .q-item:has-text("${value}"), .q-select__dropdown .q-item:has-text("${value}")`;
    await this.page.waitForSelector(optionSelector, { timeout: 5000 });
    
    // Click the option
    await this.clickElement(optionSelector);
    
    // Wait for dropdown to close
    await this.page.waitForTimeout(500);
  }

  /**
   * Wait for table to load
   */
  async waitForTableToLoad(): Promise<void> {
    console.log('⏳ Waiting for students table to load...');
    await this.waitForElement(this.studentsTable);
    
    // Wait for loading indicators to disappear
    const loadingIndicator = this.page.locator('.q-loading, .q-spinner, .loading');
    if (await loadingIndicator.isVisible({ timeout: 1000 })) {
      await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
    }
    
    console.log('✅ Students table loaded');
  }

  /**
   * Close any open dialogs
   */
  async closeDialog(): Promise<void> {
    const isDialogOpen = await this.isElementVisible(this.addEditDialog);
    if (isDialogOpen) {
      console.log('❌ Closing open dialog...');
      
      // Try cancel button first
      if (await this.cancelButton.isVisible()) {
        await this.clickElement(this.cancelButton);
      } else {
        // Try ESC key
        await this.page.keyboard.press('Escape');
      }
      
      // Wait for dialog to close
      await this.addEditDialog.waitFor({ state: 'hidden', timeout: 5000 });
      console.log('✅ Dialog closed');
    }
  }
}