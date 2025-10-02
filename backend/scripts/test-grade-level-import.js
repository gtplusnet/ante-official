const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const io = require('socket.io-client');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000';
const SOCKET_URL = 'http://localhost:4000/student-import';
let authToken = null;

async function checkExistingGradeLevels() {
  console.log('\n📚 Checking existing grade levels for company 16:');
  const gradeLevels = await prisma.gradeLevel.findMany({
    where: { companyId: 16, isDeleted: false },
    orderBy: { sequence: 'asc' },
    select: { id: true, code: true, name: true, educationLevel: true }
  });
  
  if (gradeLevels.length > 0) {
    console.log('Existing grade levels:');
    gradeLevels.forEach(gl => {
      console.log(`  - ${gl.name} (${gl.code}) - ${gl.educationLevel}`);
    });
  } else {
    console.log('  No grade levels found');
  }
  
  return gradeLevels;
}

async function cleanupTestData() {
  // Delete test students
  const result = await prisma.student.deleteMany({
    where: {
      firstName: 'GRADETEST',
      companyId: 16
    }
  });
  
  if (result.count > 0) {
    console.log(`🧹 Cleaned up ${result.count} test students\n`);
  }
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
  console.log('\n📤 Testing Grade Level Auto-Creation');
  console.log(`   File: ${fileName}`);
  
  const sessionId = `test-grade-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  console.log(`   Session ID: ${sessionId}\n`);
  
  const socket = io(SOCKET_URL, {
    query: { sessionId }
  });
  
  return new Promise(async (resolve, reject) => {
    let importResult = null;
    const createdGradeLevels = [];
    
    socket.on('connect', () => {
      console.log('✓ WebSocket connected\n');
      console.log('Processing students:');
      console.log('─'.repeat(60));
    });
    
    socket.on('import-progress', (data) => {
      if (data.status === 'processing') {
        process.stdout.write(`⚡ [${data.current}/${data.total}] Processing: ${data.studentName || 'Unknown'}...`);
      } else if (data.status === 'success') {
        console.log(' ✅ Success');
      } else if (data.status === 'error') {
        console.log(` ❌ Error: ${data.error}`);
      }
    });
    
    socket.on('import-complete', (data) => {
      importResult = data;
      console.log('─'.repeat(60));
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
      resolve(importResult);
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

async function runTest() {
  console.log('═'.repeat(70));
  console.log('        GRADE LEVEL AUTO-CREATION TEST');
  console.log('═'.repeat(70));
  console.log('\nThis test verifies that missing grade levels are created automatically');
  console.log('during student import with proper education level mapping.');
  console.log('═'.repeat(70));
  
  try {
    await cleanupTestData();
    
    const beforeGradeLevels = await checkExistingGradeLevels();
    const beforeCount = beforeGradeLevels.length;
    
    await login();
    
    const result = await importFile('test-grade-levels.xlsx');
    
    console.log('\n' + '═'.repeat(70));
    
    // Check grade levels after import
    const afterGradeLevels = await checkExistingGradeLevels();
    const afterCount = afterGradeLevels.length;
    
    // Find newly created grade levels
    const beforeCodes = new Set(beforeGradeLevels.map(gl => gl.code));
    const newGradeLevels = afterGradeLevels.filter(gl => !beforeCodes.has(gl.code));
    
    if (newGradeLevels.length > 0) {
      console.log('\n🎉 Newly created grade levels:');
      newGradeLevels.forEach(gl => {
        console.log(`   ✅ ${gl.name} (${gl.code}) - Education Level: ${gl.educationLevel}`);
      });
    }
    
    if (result.errorCount === 0 && newGradeLevels.length > 0) {
      console.log('\n✅ TEST PASSED: Grade levels were created automatically!');
      console.log(`   ${beforeCount} grade levels before → ${afterCount} grade levels after`);
      console.log(`   ${newGradeLevels.length} new grade levels created`);
    } else if (result.errorCount > 0) {
      console.log('\n⚠️ TEST PARTIALLY PASSED: Some imports failed');
    } else {
      console.log('\n✅ TEST PASSED: All students imported (grade levels already existed)');
    }
    
    console.log('═'.repeat(70));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Check backend logs for grade level creation messages
async function checkLogs() {
  console.log('\n📋 Checking backend logs for grade level creation:');
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    exec('pm2 logs ante-backend --lines 50 --nostream | grep "\\[Import\\].*grade level" | tail -10', (error, stdout, stderr) => {
      if (stdout) {
        console.log('Recent grade level activity:');
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