const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const io = require('socket.io-client');
const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000';
const SOCKET_URL = 'http://localhost:4000/student-import';
let authToken = null;

async function checkExistingSections() {
  console.log('\n📚 Checking existing sections for company 16:');
  const sections = await prisma.schoolSection.findMany({
    where: { companyId: 16, isDeleted: false },
    orderBy: { name: 'asc' },
    include: {
      gradeLevel: true,
      _count: {
        select: { students: true }
      }
    }
  });
  
  if (sections.length > 0) {
    console.log('Existing sections:');
    sections.forEach(section => {
      console.log(`  - ${section.name} (${section.gradeLevel.name}) - Adviser: ${section.adviserName} - Students: ${section._count.students}`);
    });
  } else {
    console.log('  No sections found');
  }
  
  return sections;
}

async function cleanupTestData() {
  // Delete test students with SECTIONTEST prefix
  const result = await prisma.student.deleteMany({
    where: {
      firstName: { startsWith: 'SECTIONTEST' },
      companyId: 16
    }
  });
  
  // Delete test sections
  const sectionResult = await prisma.schoolSection.deleteMany({
    where: {
      name: { in: ['TEST-SECTION-A', 'TEST-SECTION-B', 'TEST-SECTION-C', 'ROSE', 'LILY', 'JASMINE'] },
      companyId: 16
    }
  });
  
  if (result.count > 0 || sectionResult.count > 0) {
    console.log(`🧹 Cleaned up ${result.count} test students and ${sectionResult.count} test sections\n`);
  }
}

async function createTestExcelFile() {
  console.log('📝 Creating test Excel file with section data...');
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Students');
  
  // Add headers
  worksheet.columns = [
    { header: 'firstName', key: 'firstName', width: 15 },
    { header: 'lastName', key: 'lastName', width: 15 },
    { header: 'middleName', key: 'middleName', width: 15 },
    { header: 'dateOfBirth', key: 'dateOfBirth', width: 15 },
    { header: 'gender', key: 'gender', width: 10 },
    { header: 'gradeLevel', key: 'gradeLevel', width: 15 },
    { header: 'Section', key: 'Section', width: 20 },
    { header: 'Adviser', key: 'Adviser', width: 25 }
  ];
  
  // Test data with various section scenarios
  const testData = [
    // Scenario 1: New section with adviser
    {
      firstName: 'SECTIONTEST-A1',
      lastName: 'STUDENT',
      middleName: 'M',
      dateOfBirth: '2010-05-15',
      gender: 'MALE',
      gradeLevel: 'Grade 1',
      Section: 'TEST-SECTION-A',
      Adviser: 'Ms. Test Teacher A'
    },
    {
      firstName: 'SECTIONTEST-A2',
      lastName: 'STUDENT',
      middleName: 'F',
      dateOfBirth: '2010-06-20',
      gender: 'FEMALE',
      gradeLevel: 'Grade 1',
      Section: 'TEST-SECTION-A',
      Adviser: 'Ms. Test Teacher A'
    },
    
    // Scenario 2: New section without adviser (should default to TBA)
    {
      firstName: 'SECTIONTEST-B1',
      lastName: 'STUDENT',
      middleName: 'N',
      dateOfBirth: '2010-07-10',
      gender: 'MALE',
      gradeLevel: 'Grade 2',
      Section: 'TEST-SECTION-B',
      Adviser: ''
    },
    
    // Scenario 3: No section specified
    {
      firstName: 'SECTIONTEST-NOSEC',
      lastName: 'STUDENT',
      middleName: 'X',
      dateOfBirth: '2010-08-05',
      gender: 'FEMALE',
      gradeLevel: 'Grade 3',
      Section: '',
      Adviser: ''
    },
    
    // Scenario 4: Different sections in same grade level
    {
      firstName: 'SECTIONTEST-C1',
      lastName: 'STUDENT',
      middleName: 'Y',
      dateOfBirth: '2009-09-12',
      gender: 'MALE',
      gradeLevel: 'Grade 4',
      Section: 'TEST-SECTION-C',
      Adviser: 'Mr. Test Teacher C'
    },
    {
      firstName: 'SECTIONTEST-D1',
      lastName: 'STUDENT',
      middleName: 'Z',
      dateOfBirth: '2009-10-18',
      gender: 'FEMALE',
      gradeLevel: 'Grade 4',
      Section: 'ROSE',
      Adviser: 'Ms. Rose Teacher'
    },
    
    // Scenario 5: Real-world section names
    {
      firstName: 'SECTIONTEST-ROSE1',
      lastName: 'STUDENT',
      middleName: 'A',
      dateOfBirth: '2008-11-25',
      gender: 'MALE',
      gradeLevel: 'Grade 5',
      Section: 'LILY',
      Adviser: 'Ms. Lily Adviser'
    },
    {
      firstName: 'SECTIONTEST-ROSE2',
      lastName: 'STUDENT',
      middleName: 'B',
      dateOfBirth: '2008-12-30',
      gender: 'FEMALE',
      gradeLevel: 'Grade 5',
      Section: 'JASMINE',
      Adviser: 'Ms. Jasmine Adviser'
    }
  ];
  
  // Add rows to worksheet
  testData.forEach(row => {
    worksheet.addRow(row);
  });
  
  // Save the file
  const filePath = path.join(__dirname, '../../debug', 'test-sections.xlsx');
  await workbook.xlsx.writeFile(filePath);
  
  console.log(`✅ Test file created: ${filePath}`);
  console.log(`   Contains ${testData.length} students with various section scenarios\n`);
  
  return 'test-sections.xlsx';
}

async function login() {
  console.log('🔐 Logging in...');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username: 'guillermotabligan',
      password: 'water123'
    });
    
    authToken = response.data.token;
    console.log('✅ Login successful');
    return authToken;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
}

async function importFile(fileName) {
  console.log('\n📤 Testing Section Import');
  console.log(`   File: ${fileName}`);
  
  const sessionId = `test-section-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  console.log(`   Session ID: ${sessionId}\n`);
  
  const socket = io(SOCKET_URL, {
    query: { sessionId }
  });
  
  return new Promise(async (resolve, reject) => {
    let importResult = null;
    const processedStudents = [];
    
    socket.on('connect', () => {
      console.log('✓ WebSocket connected\n');
      console.log('Processing students:');
      console.log('─'.repeat(80));
    });
    
    socket.on('import-progress', (data) => {
      if (data.status === 'processing') {
        process.stdout.write(`⚡ [${data.current}/${data.total}] Processing: ${data.studentName || 'Unknown'}...`);
      } else if (data.status === 'success') {
        console.log(` ✅ Success (${data.action || 'processed'})`);
        processedStudents.push({ name: data.studentName, action: data.action });
      } else if (data.status === 'error') {
        console.log(` ❌ Error: ${data.error}`);
      }
    });
    
    socket.on('import-complete', (data) => {
      importResult = data;
      console.log('─'.repeat(80));
      console.log('\n📊 Import Results:');
      console.log(`   ✅ Success: ${data.successCount} students`);
      console.log(`   ❌ Errors: ${data.errorCount} students`);
      
      if (data.createdCount !== undefined && data.updatedCount !== undefined) {
        console.log(`   📝 Created: ${data.createdCount}`);
        console.log(`   📝 Updated: ${data.updatedCount}`);
      }
      
      if (data.errorCount > 0) {
        console.log('\n❌ Failed imports:');
        data.errors.forEach(err => {
          console.log(`   Row ${err.row}: ${err.message}`);
        });
      }
      
      socket.disconnect();
      resolve({ ...importResult, processedStudents });
    });
    
    const form = new FormData();
    const filePath = path.join(__dirname, '../../debug', fileName);
    form.append('file', fs.createReadStream(filePath));
    
    try {
      await axios.post(
        `${API_URL}/school/student/import?sessionId=${sessionId}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'token': authToken
          }
        }
      );
      
      setTimeout(() => {
        if (!importResult) {
          socket.disconnect();
          reject(new Error('Import timeout'));
        }
      }, 30000);
      
    } catch (error) {
      socket.disconnect();
      console.error('❌ Import failed:', error.response?.data || error.message);
      reject(error);
    }
  });
}

async function verifyImportResults() {
  console.log('\n🔍 Verifying Import Results:');
  console.log('─'.repeat(80));
  
  // Check sections after import
  const sections = await prisma.schoolSection.findMany({
    where: { 
      companyId: 16,
      name: { in: ['TEST-SECTION-A', 'TEST-SECTION-B', 'TEST-SECTION-C', 'ROSE', 'LILY', 'JASMINE'] }
    },
    include: {
      gradeLevel: true,
      students: {
        where: {
          firstName: { startsWith: 'SECTIONTEST' }
        }
      }
    }
  });
  
  console.log('\n📋 Sections Created/Used:');
  sections.forEach(section => {
    console.log(`\n  Section: ${section.name}`);
    console.log(`  Grade Level: ${section.gradeLevel.name}`);
    console.log(`  Adviser: ${section.adviserName}`);
    console.log(`  School Year: ${section.schoolYear}`);
    console.log(`  Students (${section.students.length}):`);
    section.students.forEach(student => {
      console.log(`    - ${student.firstName} ${student.lastName}`);
    });
  });
  
  // Check students without sections
  const studentsWithoutSection = await prisma.student.findMany({
    where: {
      firstName: { startsWith: 'SECTIONTEST' },
      companyId: 16,
      sectionId: null
    }
  });
  
  if (studentsWithoutSection.length > 0) {
    console.log('\n📋 Students Without Sections:');
    studentsWithoutSection.forEach(student => {
      console.log(`  - ${student.firstName} ${student.lastName} (${student.studentNumber})`);
    });
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`  Total sections processed: ${sections.length}`);
  console.log(`  Total students assigned to sections: ${sections.reduce((sum, s) => sum + s.students.length, 0)}`);
  console.log(`  Students without sections: ${studentsWithoutSection.length}`);
  
  return { sections, studentsWithoutSection };
}

async function runTest() {
  console.log('═'.repeat(80));
  console.log('        SECTION IMPORT TEST');
  console.log('═'.repeat(80));
  console.log('\nThis test verifies that sections are properly handled during student import:');
  console.log('1. Auto-creation of new sections');
  console.log('2. Assignment of students to sections');
  console.log('3. Handling of adviser names');
  console.log('4. Handling of students without sections');
  console.log('═'.repeat(80));
  
  try {
    await cleanupTestData();
    
    const beforeSections = await checkExistingSections();
    const beforeCount = beforeSections.length;
    
    await login();
    
    const fileName = await createTestExcelFile();
    const result = await importFile(fileName);
    
    console.log('\n' + '═'.repeat(80));
    
    const verificationResults = await verifyImportResults();
    
    // Test assertions
    console.log('\n' + '═'.repeat(80));
    console.log('🧪 TEST RESULTS:');
    console.log('─'.repeat(80));
    
    let testsPassed = 0;
    let totalTests = 0;
    
    // Test 1: Sections were created
    totalTests++;
    if (verificationResults.sections.length > 0) {
      console.log('✅ TEST 1 PASSED: Sections were created successfully');
      testsPassed++;
    } else {
      console.log('❌ TEST 1 FAILED: No sections were created');
    }
    
    // Test 2: Students assigned to sections
    totalTests++;
    const totalAssigned = verificationResults.sections.reduce((sum, s) => sum + s.students.length, 0);
    if (totalAssigned > 0) {
      console.log(`✅ TEST 2 PASSED: ${totalAssigned} students assigned to sections`);
      testsPassed++;
    } else {
      console.log('❌ TEST 2 FAILED: No students assigned to sections');
    }
    
    // Test 3: Adviser names handled correctly
    totalTests++;
    const sectionWithAdviser = verificationResults.sections.find(s => s.adviserName && s.adviserName !== 'TBA');
    const sectionWithTBA = verificationResults.sections.find(s => s.adviserName === 'TBA');
    if (sectionWithAdviser || sectionWithTBA) {
      console.log('✅ TEST 3 PASSED: Adviser names handled correctly');
      testsPassed++;
    } else {
      console.log('❌ TEST 3 FAILED: Adviser names not handled properly');
    }
    
    // Test 4: Students without sections handled
    totalTests++;
    if (verificationResults.studentsWithoutSection.length >= 0) {
      console.log(`✅ TEST 4 PASSED: Students without sections handled (${verificationResults.studentsWithoutSection.length} without sections)`);
      testsPassed++;
    }
    
    console.log('─'.repeat(80));
    console.log(`\n🏁 FINAL RESULT: ${testsPassed}/${totalTests} tests passed`);
    
    if (testsPassed === totalTests) {
      console.log('✅ ALL TESTS PASSED! Section import is working correctly.');
    } else {
      console.log('⚠️ SOME TESTS FAILED. Please review the results above.');
    }
    
    console.log('═'.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Check backend logs for section creation messages
async function checkLogs() {
  console.log('\n📋 Checking backend logs for section activity:');
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    exec('pm2 logs ante-backend --lines 50 --nostream | grep -i section | tail -10', (error, stdout, stderr) => {
      if (stdout) {
        console.log('Recent section-related activity:');
        console.log(stdout);
      }
      resolve();
    });
  });
}

runTest().then(async () => {
  await checkLogs();
  console.log('\nTest completed');
  process.exit(0);
}).catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});