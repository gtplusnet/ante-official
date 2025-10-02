// Note: This is a standalone script for generating test data
// To use the centralized Excel module, import from '@common/services/excel'
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

function generateMonthlyRate(): number {
  return Math.floor(Math.random() * 50000) + 25000; // 25k to 75k
}

function generateStartDate(): Date {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 365); // Up to 1 year ago
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
  } else if (status === 'Trainee') {
    endDate.setMonth(endDate.getMonth() + 3); // 3-month training period
  } else {
    endDate.setMonth(endDate.getMonth() + Math.floor(Math.random() * 12) + 3);
  }

  return endDate;
}

async function fetchReferenceData() {
  console.log('Fetching reference data from database...');

  // Get company ID (assuming company ID 16 based on the API response)
  const companyId = 16;

  // Fetch roles
  const roles = await prisma.role.findMany({
    where: {
      companyId: companyId,
      isDeleted: false,
    },
    select: {
      name: true,
    },
  });
  console.log(`Found ${roles.length} roles`);

  // Fetch branches (projects with status BRANCH)
  const branches = await prisma.project.findMany({
    where: {
      companyId: companyId,
      status: 'BRANCH',
      isDeleted: false,
    },
    select: {
      name: true,
    },
  });
  console.log(`Found ${branches.length} branches`);

  // Fetch schedules
  const schedules = await prisma.schedule.findMany({
    where: {
      companyId: companyId,
      isDeleted: false,
    },
    select: {
      scheduleCode: true,
    },
  });
  console.log(`Found ${schedules.length} schedules`);

  // Fetch payroll groups
  const payrollGroups = await prisma.payrollGroup.findMany({
    where: {
      company: {
        id: companyId,
      },
      isDeleted: false,
    },
    select: {
      payrollGroupCode: true,
    },
  });
  console.log(`Found ${payrollGroups.length} payroll groups`);

  return {
    roles: roles.map((r) => r.name),
    branches: branches.map((b) => b.name),
    scheduleCodes: schedules.map((s) => s.scheduleCode),
    payrollGroupCodes: payrollGroups.map((p) => p.payrollGroupCode),
  };
}

async function generateValidCleanData() {
  try {
    const referenceData = await fetchReferenceData();

    // Check if we have enough reference data
    if (referenceData.roles.length === 0) {
      console.error('No roles found in the system!');
      console.log('Please create at least one role in Settings > Roles');
      return null;
    }
    if (referenceData.branches.length === 0) {
      console.error('No branches found in the system!');
      console.log('Please create at least one branch in Settings > Branches');
      return null;
    }
    if (referenceData.scheduleCodes.length === 0) {
      console.error('No schedules found in the system!');
      console.log(
        'Please create at least one schedule in Manpower > Configuration > Schedule Management',
      );
      return null;
    }
    if (referenceData.payrollGroupCodes.length === 0) {
      console.error('No payroll groups found in the system!');
      console.log(
        'Please create at least one payroll group in Manpower > Configuration > Payroll Group',
      );
      return null;
    }

    console.log('\nReference data found:');
    console.log('Roles:', referenceData.roles);
    console.log('Branches:', referenceData.branches);
    console.log('Schedule Codes:', referenceData.scheduleCodes);
    console.log('Payroll Group Codes:', referenceData.payrollGroupCodes);

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
    worksheet.getRow(1).alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };

    // Employment statuses (from employment-status.reference.ts)
    const employmentStatuses = [
      'Regular',
      'Contractual',
      'Probationary',
      'Trainee',
    ];

    // Generate data
    const employees = [];
    const managerCodes: string[] = [];

    // Generate some managers first (10% of total)
    const managerCount = 20;
    for (let i = 1; i <= managerCount; i++) {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const middleInitial = getRandomElement(middleInitials);
      const employeeCode = generateEmployeeCode(i);
      const startDate = generateStartDate();
      const status = 'Regular'; // Managers are usually regular employees

      managerCodes.push(employeeCode);

      // Managers should not be Super Admin (Level 0) since they don't report to anyone
      const managerRoles = referenceData.roles.filter(
        (r) => r !== 'Super Admin',
      );

      employees.push({
        employeeCode,
        lastName,
        firstName,
        middleName: middleInitial,
        username: generateUsername(firstName, lastName, i),
        email: generateEmail(firstName, lastName, i),
        contactNumber: generatePhoneNumber(),
        role: getRandomElement(
          managerRoles.length > 0 ? managerRoles : referenceData.roles,
        ),
        reportsTo: '', // Managers don't report to anyone
        monthlyRate: generateMonthlyRate() + 25000, // Higher salary for managers
        employeeStatus: status,
        startDate,
        endDate: null,
        branch: getRandomElement(referenceData.branches),
        scheduleCode: getRandomElement(referenceData.scheduleCodes),
        payrollGroupCode: getRandomElement(referenceData.payrollGroupCodes),
      });
    }

    // Add some employees with warnings for testing
    // Employee with high salary warning
    const highSalaryEmployee = {
      employeeCode: generateEmployeeCode(managerCount + 1),
      lastName: 'HIGHSALARY', // All uppercase warning
      firstName: 'TEST',
      middleName: '', // No middle name warning
      username: 'test.high', // Different from standard format
      email: 'test.highsalary@gmail.com', // Personal domain warning
      contactNumber: generatePhoneNumber(),
      role: getRandomElement(
        referenceData.roles.filter((r) => r !== 'Super Admin'),
      ),
      reportsTo: getRandomElement(managerCodes),
      monthlyRate: 600000, // High salary warning
      employeeStatus: 'Regular',
      startDate: generateStartDate(),
      endDate: null,
      branch: getRandomElement(referenceData.branches),
      scheduleCode: getRandomElement(referenceData.scheduleCodes),
      payrollGroupCode: getRandomElement(referenceData.payrollGroupCodes),
    };
    employees.push(highSalaryEmployee);

    // Employee with weekend start date
    const weekendStartDate = new Date();
    weekendStartDate.setDate(
      weekendStartDate.getDate() + ((7 - weekendStartDate.getDay()) % 7),
    ); // Next Sunday
    const weekendEmployee = {
      employeeCode: generateEmployeeCode(managerCount + 2),
      lastName: 'Weekend',
      firstName: 'J', // Single character warning
      middleName: 'X',
      username: 'j.weekend',
      email: 'j.weekend@company.com',
      contactNumber: '123-456-7890', // Invalid format warning
      role: getRandomElement(
        referenceData.roles.filter((r) => r !== 'Super Admin'),
      ),
      reportsTo: getRandomElement(managerCodes),
      monthlyRate: 15000, // Below minimum wage warning
      employeeStatus: 'Probationary',
      startDate: weekendStartDate,
      endDate: new Date(
        weekendStartDate.getFullYear(),
        weekendStartDate.getMonth() + 8,
        weekendStartDate.getDate(),
      ), // 8 months probation
      branch: getRandomElement(referenceData.branches),
      scheduleCode: getRandomElement(referenceData.scheduleCodes),
      payrollGroupCode: getRandomElement(referenceData.payrollGroupCodes),
    };
    employees.push(weekendEmployee);

    // Generate regular employees
    for (let i = managerCount + 3; i <= 200; i++) {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const middleInitial =
        Math.random() > 0.3 ? getRandomElement(middleInitials) : ''; // 30% chance of no middle name
      const employeeCode = generateEmployeeCode(i);
      const status = getRandomElement(employmentStatuses);
      const startDate = generateStartDate();
      const endDate = generateEndDate(startDate, status);

      const selectedRole = getRandomElement(referenceData.roles);
      // Super Admin (Level 0) cannot have a parent
      const canHaveReportsTo = selectedRole !== 'Super Admin';

      employees.push({
        employeeCode,
        lastName,
        firstName,
        middleName: middleInitial,
        username: generateUsername(firstName, lastName, i),
        email: generateEmail(firstName, lastName, i),
        contactNumber: generatePhoneNumber(),
        role: selectedRole,
        reportsTo:
          canHaveReportsTo && Math.random() > 0.3
            ? getRandomElement(managerCodes)
            : '', // 70% report to someone (unless Level 0)
        monthlyRate: generateMonthlyRate(),
        employeeStatus: status,
        startDate,
        endDate,
        branch: getRandomElement(referenceData.branches),
        scheduleCode: getRandomElement(referenceData.scheduleCodes),
        payrollGroupCode: getRandomElement(referenceData.payrollGroupCodes),
      });
    }

    // Add all rows to worksheet
    employees.forEach((emp) => worksheet.addRow(emp));

    // Add dropdowns for reference fields
    const roleValidation = {
      type: 'list' as const,
      allowBlank: false,
      formulae: [`"${referenceData.roles.join(',')}"`],
    };

    const branchValidation = {
      type: 'list' as const,
      allowBlank: false,
      formulae: [`"${referenceData.branches.join(',')}"`],
    };

    const scheduleValidation = {
      type: 'list' as const,
      allowBlank: false,
      formulae: [`"${referenceData.scheduleCodes.join(',')}"`],
    };

    const payrollValidation = {
      type: 'list' as const,
      allowBlank: false,
      formulae: [`"${referenceData.payrollGroupCodes.join(',')}"`],
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
  } catch (error) {
    console.error('Error generating file:', error);
    return null;
  }
}

// Generate the files
async function generateSampleFiles() {
  try {
    console.log('Connecting to database...');

    console.log('\nGenerating valid sample data with actual reference data...');
    const validBuffer = await generateValidCleanData();

    if (validBuffer) {
      fs.writeFileSync(
        path.join(process.cwd(), 'employee_import_valid_200.xlsx'),
        Buffer.from(validBuffer),
      );
      console.log('\n✅ Generated: employee_import_valid_200.xlsx');
      console.log('\nThis file contains:');
      console.log('- 200 employee records');
      console.log(
        '- All reference data (roles, branches, schedules, payroll groups) from YOUR system',
      );
      console.log('- Valid email formats and required fields');
      console.log('- Proper employment status with appropriate end dates');
      console.log('- No validation errors expected!');
    } else {
      console.log(
        '\n❌ Could not generate valid sample file. Please ensure reference data exists in the system.',
      );
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the generator
generateSampleFiles();
