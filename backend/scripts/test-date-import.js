const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const io = require('socket.io-client');

// API configuration
const API_URL = 'http://localhost:3000';
const SOCKET_URL = 'http://localhost:4000/student-import';
let authToken = null;

async function login() {
  console.log('🔐 Logging in...');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username: 'guillermotabligan',
      password: 'water123'
    });
    
    authToken = response.data.token;
    console.log('✅ Login successful\n');
    return authToken;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
}

async function importFile(fileName) {
  console.log('📤 Testing Date Format Import');
  console.log(`   File: ${fileName}`);
  
  // Generate session ID
  const sessionId = `test-date-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  console.log(`   Session ID: ${sessionId}\n`);
  
  // Create WebSocket connection for progress tracking
  const socket = io(SOCKET_URL, {
    query: { sessionId }
  });
  
  return new Promise(async (resolve, reject) => {
    let importResult = null;
    const successfulDates = [];
    const failedDates = [];
    
    socket.on('connect', () => {
      console.log('✓ WebSocket connected\n');
      console.log('Processing students:');
      console.log('─'.repeat(50));
    });
    
    socket.on('import-progress', (data) => {
      if (data.status === 'processing') {
        process.stdout.write(`⚡ [${data.current}/${data.total}] Processing: ${data.studentName || 'Unknown'}...`);
      } else if (data.status === 'success') {
        console.log(' ✅ Success');
        successfulDates.push(data.studentName);
      } else if (data.status === 'error') {
        console.log(` ❌ Error: ${data.error}`);
        failedDates.push({ name: data.studentName, error: data.error });
      }
    });
    
    socket.on('import-complete', (data) => {
      importResult = data;
      console.log('─'.repeat(50));
      console.log('\n📊 Import Results:');
      console.log(`   ✅ Success: ${data.successCount} students`);
      console.log(`   ❌ Errors: ${data.errorCount} students`);
      
      if (data.createdCount !== undefined && data.updatedCount !== undefined) {
        console.log(`   📝 Created: ${data.createdCount}`);
        console.log(`   📝 Updated: ${data.updatedCount}`);
      }
      
      if (failedDates.length > 0) {
        console.log('\n❌ Failed imports:');
        failedDates.forEach(item => {
          console.log(`   - ${item.name}: ${item.error}`);
        });
      }
      
      socket.disconnect();
      resolve(importResult);
    });
    
    // Prepare form data
    const form = new FormData();
    const filePath = path.join(__dirname, fileName);
    form.append('file', fs.createReadStream(filePath));
    
    try {
      const response = await axios.post(
        `${API_URL}/school/student/import?sessionId=${sessionId}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'token': authToken
          }
        }
      );
      
      // Wait for WebSocket completion
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
  console.log('═'.repeat(60));
  console.log('        DATE FORMAT HANDLING TEST');
  console.log('═'.repeat(60));
  console.log('\nThis test verifies that the import handles various date formats:');
  console.log('• JavaScript Date objects');
  console.log('• String dates (YYYY-MM-DD)');
  console.log('• Excel serial date numbers');
  console.log('• String dates (MM/DD/YYYY)');
  console.log('═'.repeat(60));
  console.log();
  
  try {
    await login();
    
    const result = await importFile('test-date-formats.xlsx');
    
    console.log('\n' + '═'.repeat(60));
    if (result.errorCount === 0) {
      console.log('✅ TEST PASSED: All date formats handled correctly!');
    } else {
      console.log('❌ TEST FAILED: Some date formats could not be parsed');
      console.log('\nErrors encountered:');
      result.errors.forEach(err => {
        console.log(`   Row ${err.row}: ${err.message}`);
      });
    }
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Clean up test data first
async function cleanupTestData() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    // Delete test students
    const result = await prisma.student.deleteMany({
      where: {
        firstName: 'TEST',
        companyId: 16
      }
    });
    
    if (result.count > 0) {
      console.log(`🧹 Cleaned up ${result.count} test students\n`);
    }
  } catch (error) {
    console.log('Note: Could not clean up test data\n');
  } finally {
    await prisma.$disconnect();
  }
}

// First clean up, then run test
cleanupTestData().then(() => {
  runTest().then(() => {
    console.log('\nTest completed');
    process.exit(0);
  }).catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });
});