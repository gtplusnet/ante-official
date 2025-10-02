// Note: This is a standalone script for generating test data
// To use the centralized Excel module, import from '@common/services/excel'
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

// Sample data generators
const firstNames = [
  'John',
  'Jane',
  'Michael',
  'Sarah',
  'David',
  'Emma',
  'Robert',
  'Lisa',
  'James',
  'Mary',
  'William',
  'Patricia',
  'Richard',
  'Jennifer',
  'Charles',
  'Linda',
  'Joseph',
  'Barbara',
  'Thomas',
  'Elizabeth',
];
const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
];
const middleInitials = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
];

// Assuming these exist in your system - adjust as needed
const roles = [
  'Software Engineer',
  'Senior Software Engineer',
  'Team Lead',
  'Project Manager',
  'HR Manager',
  'Accountant',
  'Senior Accountant',
  'Sales Executive',
  'Marketing Manager',
  'Operations Manager',
];
const branches = [
  'Main Office',
  'Branch 1',
  'Branch 2',
  'North Branch',
  'South Branch',
];
const scheduleCodes = [
  'REG-8AM5PM',
  'FLEX-9AM6PM',
  'NIGHT-10PM7AM',
  'MID-2PM11PM',
];
const payrollGroupCodes = ['MONTHLY-15-30', 'SEMI-MONTHLY', 'WEEKLY-FRI'];
const employmentStatuses = [
  'Regular',
  'Probationary',
  'Contractual',
  'Project-Based',
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateEmployeeCode(index: number): string {
  return `EMP${String(index).padStart(5, '0')}`;
}

function generateUsername(
  firstName: string,
  lastName: string,
  index: number,
): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}`;
}

function generateEmail(
  firstName: string,
  lastName: string,
  index: number,
): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@company.com`;
}

function generatePhoneNumber(): string {
  const prefix = ['0917', '0918', '0919', '0920', '0921', '0922'][
    Math.floor(Math.random() * 6)
  ];
  const number = Math.floor(Math.random() * 10000000)
    .toString()
    .padStart(7, '0');
  return prefix + number;
}

function generateMonthlyRate(role: string): number {
  const baseRates: { [key: string]: number } = {
    'Software Engineer': 40000,
    'Senior Software Engineer': 60000,
    'Team Lead': 80000,
    'Project Manager': 90000,
    'HR Manager': 70000,
    Accountant: 35000,
    'Senior Accountant': 50000,
    'Sales Executive': 30000,
    'Marketing Manager': 65000,
    'Operations Manager': 75000,
  };

  const base = baseRates[role] || 30000;
  const variation = Math.floor(Math.random() * 10000) - 5000;
  return base + variation;
}

function generateStartDate(): Date {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 1095); // Up to 3 years ago
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - daysAgo);
  return startDate;
}

function generateEndDate(startDate: Date, status: string): Date | null {
  if (status === 'Regular') return null;

  const endDate = new Date(startDate);
  if (status === 'Probationary') {
    endDate.setMonth(endDate.getMonth() + 6);
  } else if (status === 'Contractual') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + Math.floor(Math.random() * 12) + 3);
  }

  return endDate;
}

async function generateCleanData() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Employees');

  // Add headers
  worksheet.columns = [
    { header: 'Employee Code', key: 'employeeCode', width: 15 },
    { header: 'Last Name', key: 'lastName', width: 15 },
    { header: 'First Name', key: 'firstName', width: 15 },
    { header: 'Middle Name (Optional)', key: 'middleName', width: 20 },
    { header: 'Username', key: 'username', width: 20 },
    { header: 'Email Address', key: 'email', width: 30 },
    { header: 'Contact Number', key: 'contactNumber', width: 15 },
    { header: 'Role/Position', key: 'role', width: 20 },
    { header: 'Reports To (Employee Code)', key: 'reportsTo', width: 25 },
    { header: 'Monthly Rate', key: 'monthlyRate', width: 15 },
    { header: 'Employee Status', key: 'employeeStatus', width: 15 },
    { header: 'Start Date', key: 'startDate', width: 15 },
    { header: 'End Date', key: 'endDate', width: 15 },
    { header: 'Branch', key: 'branch', width: 15 },
    { header: 'Schedule Code', key: 'scheduleCode', width: 15 },
    { header: 'Payroll Group Code', key: 'payrollGroupCode', width: 20 },
  ];

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Generate managers first (they won't report to anyone)
  const managerCodes: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const middleInitial = getRandomElement(middleInitials);
    const role = getRandomElement([
      'Team Lead',
      'Project Manager',
      'HR Manager',
      'Operations Manager',
    ]);
    const status = 'Regular';
    const employeeCode = generateEmployeeCode(i);
    const startDate = generateStartDate();

    managerCodes.push(employeeCode);

    worksheet.addRow({
      employeeCode,
      lastName,
      firstName,
      middleName: middleInitial,
      username: generateUsername(firstName, lastName, i),
      email: generateEmail(firstName, lastName, i),
      contactNumber: generatePhoneNumber(),
      role,
      reportsTo: '', // Managers don't report to anyone
      monthlyRate: generateMonthlyRate(role),
      employeeStatus: status,
      startDate,
      endDate: null,
      branch: getRandomElement(branches),
      scheduleCode: getRandomElement(scheduleCodes),
      payrollGroupCode: getRandomElement(payrollGroupCodes),
    });
  }

  // Generate regular employees (they report to managers)
  for (let i = 21; i <= 200; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const middleInitial =
      Math.random() > 0.3 ? getRandomElement(middleInitials) : ''; // 30% chance of no middle name
    const role = getRandomElement(roles);
    const status = getRandomElement(employmentStatuses);
    const employeeCode = generateEmployeeCode(i);
    const startDate = generateStartDate();
    const endDate = generateEndDate(startDate, status);

    worksheet.addRow({
      employeeCode,
      lastName,
      firstName,
      middleName: middleInitial,
      username: generateUsername(firstName, lastName, i),
      email: generateEmail(firstName, lastName, i),
      contactNumber: generatePhoneNumber(),
      role,
      reportsTo: Math.random() > 0.3 ? getRandomElement(managerCodes) : '', // 70% report to someone
      monthlyRate: generateMonthlyRate(role),
      employeeStatus: status,
      startDate,
      endDate,
      branch: getRandomElement(branches),
      scheduleCode: getRandomElement(scheduleCodes),
      payrollGroupCode: getRandomElement(payrollGroupCodes),
    });
  }

  // Add dropdowns for reference fields
  const roleValidation = {
    type: 'list' as const,
    allowBlank: false,
    formulae: [`"${roles.join(',')}"`],
  };

  const branchValidation = {
    type: 'list' as const,
    allowBlank: false,
    formulae: [`"${branches.join(',')}"`],
  };

  const scheduleValidation = {
    type: 'list' as const,
    allowBlank: false,
    formulae: [`"${scheduleCodes.join(',')}"`],
  };

  const payrollValidation = {
    type: 'list' as const,
    allowBlank: false,
    formulae: [`"${payrollGroupCodes.join(',')}"`],
  };

  const statusValidation = {
    type: 'list' as const,
    allowBlank: false,
    formulae: [`"${employmentStatuses.join(',')}"`],
  };

  // Apply validations
  for (let row = 2; row <= 201; row++) {
    worksheet.getCell(`H${row}`).dataValidation = roleValidation;
    worksheet.getCell(`K${row}`).dataValidation = statusValidation;
    worksheet.getCell(`N${row}`).dataValidation = branchValidation;
    worksheet.getCell(`O${row}`).dataValidation = scheduleValidation;
    worksheet.getCell(`P${row}`).dataValidation = payrollValidation;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

async function generateDataWithErrors() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Employees');

  // Add headers
  worksheet.columns = [
    { header: 'Employee Code', key: 'employeeCode', width: 15 },
    { header: 'Last Name', key: 'lastName', width: 15 },
    { header: 'First Name', key: 'firstName', width: 15 },
    { header: 'Middle Name (Optional)', key: 'middleName', width: 20 },
    { header: 'Username', key: 'username', width: 20 },
    { header: 'Email Address', key: 'email', width: 30 },
    { header: 'Contact Number', key: 'contactNumber', width: 15 },
    { header: 'Role/Position', key: 'role', width: 20 },
    { header: 'Reports To (Employee Code)', key: 'reportsTo', width: 25 },
    { header: 'Monthly Rate', key: 'monthlyRate', width: 15 },
    { header: 'Employee Status', key: 'employeeStatus', width: 15 },
    { header: 'Start Date', key: 'startDate', width: 15 },
    { header: 'End Date', key: 'endDate', width: 15 },
    { header: 'Branch', key: 'branch', width: 15 },
    { header: 'Schedule Code', key: 'scheduleCode', width: 15 },
    { header: 'Payroll Group Code', key: 'payrollGroupCode', width: 20 },
  ];

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Generate data with various errors and warnings
  const employees = [];

  // 1-10: Missing required fields
  for (let i = 1; i <= 10; i++) {
    const firstName = i % 2 === 0 ? '' : getRandomElement(firstNames); // Missing first name
    const lastName = i % 3 === 0 ? '' : getRandomElement(lastNames); // Missing last name
    const email =
      i % 4 === 0
        ? ''
        : generateEmail(firstName || 'john', lastName || 'doe', i); // Missing email

    employees.push({
      employeeCode: i % 5 === 0 ? '' : generateEmployeeCode(i), // Missing employee code
      lastName,
      firstName,
      middleName: getRandomElement(middleInitials),
      username: generateUsername(firstName || 'user', lastName || 'name', i),
      email,
      contactNumber: generatePhoneNumber(),
      role: getRandomElement(roles),
      reportsTo: '',
      monthlyRate: i % 6 === 0 ? 0 : generateMonthlyRate('Software Engineer'), // Invalid monthly rate
      employeeStatus: getRandomElement(employmentStatuses),
      startDate: generateStartDate(),
      endDate: null,
      branch: getRandomElement(branches),
      scheduleCode: getRandomElement(scheduleCodes),
      payrollGroupCode: getRandomElement(payrollGroupCodes),
    });
  }

  // 11-20: Invalid email formats
  for (let i = 11; i <= 20; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);

    employees.push({
      employeeCode: generateEmployeeCode(i),
      lastName,
      firstName,
      middleName: getRandomElement(middleInitials),
      username: generateUsername(firstName, lastName, i),
      email: `invalid-email-${i}`, // Invalid email format
      contactNumber: generatePhoneNumber(),
      role: getRandomElement(roles),
      reportsTo: '',
      monthlyRate: generateMonthlyRate('Software Engineer'),
      employeeStatus: getRandomElement(employmentStatuses),
      startDate: generateStartDate(),
      endDate: null,
      branch: getRandomElement(branches),
      scheduleCode: getRandomElement(scheduleCodes),
      payrollGroupCode: getRandomElement(payrollGroupCodes),
    });
  }

  // 21-30: Duplicate employee codes
  for (let i = 21; i <= 30; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);

    employees.push({
      employeeCode: 'EMP00001', // All have same employee code
      lastName,
      firstName,
      middleName: getRandomElement(middleInitials),
      username: generateUsername(firstName, lastName, i),
      email: generateEmail(firstName, lastName, i),
      contactNumber: generatePhoneNumber(),
      role: getRandomElement(roles),
      reportsTo: '',
      monthlyRate: generateMonthlyRate('Software Engineer'),
      employeeStatus: getRandomElement(employmentStatuses),
      startDate: generateStartDate(),
      endDate: null,
      branch: getRandomElement(branches),
      scheduleCode: getRandomElement(scheduleCodes),
      payrollGroupCode: getRandomElement(payrollGroupCodes),
    });
  }

  // 31-40: Invalid references
  for (let i = 31; i <= 40; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);

    employees.push({
      employeeCode: generateEmployeeCode(i),
      lastName,
      firstName,
      middleName: getRandomElement(middleInitials),
      username: generateUsername(firstName, lastName, i),
      email: generateEmail(firstName, lastName, i),
      contactNumber: generatePhoneNumber(),
      role: 'Invalid Role', // Invalid role
      reportsTo: '',
      monthlyRate: generateMonthlyRate('Software Engineer'),
      employeeStatus: getRandomElement(employmentStatuses),
      startDate: generateStartDate(),
      endDate: null,
      branch: 'Invalid Branch', // Invalid branch
      scheduleCode: 'INVALID-SCHEDULE', // Invalid schedule
      payrollGroupCode: 'INVALID-PAYROLL', // Invalid payroll group
    });
  }

  // 41-50: Circular references
  for (let i = 41; i <= 50; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const employeeCode = generateEmployeeCode(i);

    employees.push({
      employeeCode,
      lastName,
      firstName,
      middleName: getRandomElement(middleInitials),
      username: generateUsername(firstName, lastName, i),
      email: generateEmail(firstName, lastName, i),
      contactNumber: generatePhoneNumber(),
      role: getRandomElement(roles),
      reportsTo: employeeCode, // Reports to self
      monthlyRate: generateMonthlyRate('Software Engineer'),
      employeeStatus: getRandomElement(employmentStatuses),
      startDate: generateStartDate(),
      endDate: null,
      branch: getRandomElement(branches),
      scheduleCode: getRandomElement(scheduleCodes),
      payrollGroupCode: getRandomElement(payrollGroupCodes),
    });
  }

  // 51-60: Date validation errors
  for (let i = 51; i <= 60; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 10); // End date before start date

    employees.push({
      employeeCode: generateEmployeeCode(i),
      lastName,
      firstName,
      middleName: getRandomElement(middleInitials),
      username: generateUsername(firstName, lastName, i),
      email: generateEmail(firstName, lastName, i),
      contactNumber: generatePhoneNumber(),
      role: getRandomElement(roles),
      reportsTo: '',
      monthlyRate: generateMonthlyRate('Software Engineer'),
      employeeStatus: 'Contractual',
      startDate,
      endDate, // Invalid: end date before start date
      branch: getRandomElement(branches),
      scheduleCode: getRandomElement(scheduleCodes),
      payrollGroupCode: getRandomElement(payrollGroupCodes),
    });
  }

  // 61-80: Warnings (uppercase names)
  for (let i = 61; i <= 80; i++) {
    const firstName = getRandomElement(firstNames).toUpperCase(); // All uppercase
    const lastName = getRandomElement(lastNames).toUpperCase(); // All uppercase

    employees.push({
      employeeCode: generateEmployeeCode(i),
      lastName,
      firstName,
      middleName: getRandomElement(middleInitials),
      username: generateUsername(firstName, lastName, i),
      email: generateEmail(firstName, lastName, i),
      contactNumber: generatePhoneNumber(),
      role: getRandomElement(roles),
      reportsTo: '',
      monthlyRate: generateMonthlyRate('Software Engineer'),
      employeeStatus: getRandomElement(employmentStatuses),
      startDate: generateStartDate(),
      endDate: null,
      branch: getRandomElement(branches),
      scheduleCode: getRandomElement(scheduleCodes),
      payrollGroupCode: getRandomElement(payrollGroupCodes),
    });
  }

  // 81-100: Warnings (Regular with end date, non-regular without end date)
  for (let i = 81; i <= 100; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const status = i % 2 === 0 ? 'Regular' : 'Contractual';
    const startDate = generateStartDate();
    const endDate = status === 'Regular' ? new Date() : null; // Opposite of what's expected

    employees.push({
      employeeCode: generateEmployeeCode(i),
      lastName,
      firstName,
      middleName: getRandomElement(middleInitials),
      username: generateUsername(firstName, lastName, i),
      email: generateEmail(firstName, lastName, i),
      contactNumber: generatePhoneNumber(),
      role: getRandomElement(roles),
      reportsTo: '',
      monthlyRate: generateMonthlyRate('Software Engineer'),
      employeeStatus: status,
      startDate,
      endDate,
      branch: getRandomElement(branches),
      scheduleCode: getRandomElement(scheduleCodes),
      payrollGroupCode: getRandomElement(payrollGroupCodes),
    });
  }

  // 101-150: Mix of valid and various errors
  for (let i = 101; i <= 150; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const hasError = i % 3 === 0;

    employees.push({
      employeeCode: generateEmployeeCode(i),
      lastName: hasError && i % 5 === 0 ? '' : lastName,
      firstName,
      middleName: getRandomElement(middleInitials),
      username:
        hasError && i % 7 === 0
          ? 'ab'
          : generateUsername(firstName, lastName, i), // Too short
      email:
        hasError && i % 9 === 0
          ? 'not-an-email'
          : generateEmail(firstName, lastName, i),
      contactNumber: generatePhoneNumber(),
      role: hasError && i % 11 === 0 ? 'Unknown Role' : getRandomElement(roles),
      reportsTo: '',
      monthlyRate: generateMonthlyRate('Software Engineer'),
      employeeStatus: getRandomElement(employmentStatuses),
      startDate: generateStartDate(),
      endDate: null,
      branch: getRandomElement(branches),
      scheduleCode: getRandomElement(scheduleCodes),
      payrollGroupCode: getRandomElement(payrollGroupCodes),
    });
  }

  // 151-200: Valid data (to show partial success)
  for (let i = 151; i <= 200; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const status = getRandomElement(employmentStatuses);
    const startDate = generateStartDate();

    employees.push({
      employeeCode: generateEmployeeCode(i),
      lastName,
      firstName,
      middleName: getRandomElement(middleInitials),
      username: generateUsername(firstName, lastName, i),
      email: generateEmail(firstName, lastName, i),
      contactNumber: generatePhoneNumber(),
      role: getRandomElement(roles),
      reportsTo: '',
      monthlyRate: generateMonthlyRate('Software Engineer'),
      employeeStatus: status,
      startDate,
      endDate: generateEndDate(startDate, status),
      branch: getRandomElement(branches),
      scheduleCode: getRandomElement(scheduleCodes),
      payrollGroupCode: getRandomElement(payrollGroupCodes),
    });
  }

  // Add all rows to worksheet
  employees.forEach((emp) => worksheet.addRow(emp));

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

// Generate the files
async function generateSampleFiles() {
  try {
    console.log('Generating clean sample data...');
    const cleanBuffer = await generateCleanData();
    fs.writeFileSync(
      path.join(process.cwd(), 'employee_import_clean_200.xlsx'),
      Buffer.from(cleanBuffer),
    );
    console.log('✅ Generated: employee_import_clean_200.xlsx');

    console.log('Generating sample data with errors...');
    const errorBuffer = await generateDataWithErrors();
    fs.writeFileSync(
      path.join(process.cwd(), 'employee_import_with_errors_200.xlsx'),
      Buffer.from(errorBuffer),
    );
    console.log('✅ Generated: employee_import_with_errors_200.xlsx');

    console.log('\nFiles generated successfully!');
    console.log('\nClean file summary:');
    console.log('- 200 valid employee records');
    console.log('- 20 managers (no reporting relationship)');
    console.log('- 180 employees (70% report to managers)');
    console.log('- Mix of employment statuses with appropriate end dates');

    console.log('\nError file summary:');
    console.log('- Rows 1-10: Missing required fields');
    console.log('- Rows 11-20: Invalid email formats');
    console.log('- Rows 21-30: Duplicate employee codes');
    console.log(
      '- Rows 31-40: Invalid references (role, branch, schedule, payroll)',
    );
    console.log('- Rows 41-50: Circular references (self-reporting)');
    console.log('- Rows 51-60: Date validation errors');
    console.log('- Rows 61-80: Uppercase names (warnings)');
    console.log('- Rows 81-100: Employment status warnings');
    console.log('- Rows 101-150: Mix of various errors');
    console.log('- Rows 151-200: Valid data');
  } catch (error) {
    console.error('Error generating files:', error);
  }
}

// Run the generator
generateSampleFiles();
