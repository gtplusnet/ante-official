const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/public/manpower';
const API_KEY = 'ante_device_9368559a18251bb110c8828f890b65b69ea384328049cec96f56de8de5b1e4d2';

// Test employee IDs from the database
const TEST_EMPLOYEE_1 = '01ee163a-5029-4b4c-8217-373de916e53e'; // David Paman
const TEST_EMPLOYEE_2 = '0414718b-f41c-476d-8a6e-d74013da5d21'; // johanna feil

let globalTimeRecordId = null;

async function testManpowerAPI() {
  console.log('=' .repeat(60));
  console.log('MANPOWER API COMPREHENSIVE TEST');
  console.log('=' .repeat(60));
  console.log(`API Key: ${API_KEY.substring(0, 20)}...`);
  console.log(`Base URL: ${BASE_URL}\n`);

  // Test 1: Health Check
  console.log('1️⃣ Testing Health Check Endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/health`, {
      headers: { 'x-api-key': API_KEY }
    });
    console.log('✅ Health Check Success:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Health Check Failed:', error.response?.data || error.message);
  }

  // Test 2: Get All Employees
  console.log('\n2️⃣ Testing Get All Employees Endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/employees?page=1&limit=10`, {
      headers: { 'x-api-key': API_KEY }
    });
    console.log('✅ Employees List Success:');
    console.log(`   Total Employees: ${response.data.total}`);
    console.log(`   Page: ${response.data.page}/${response.data.totalPages}`);
    if (response.data.employees.length > 0) {
      console.log('   First 3 employees:');
      response.data.employees.slice(0, 3).forEach(emp => {
        console.log(`     - ID: ${emp.id}, Name: ${emp.fullName}, Dept: ${emp.department}`);
      });
    }
  } catch (error) {
    console.log('❌ Get Employees Failed:', error.response?.data || error.message);
  }

  // Test 3: Time In with Employee ID
  console.log('\n3️⃣ Testing Time-In with Employee ID...');
  try {
    const response = await axios.post(`${BASE_URL}/time-in`,
      {
        employeeId: TEST_EMPLOYEE_1,
        timestamp: new Date().toISOString()
      },
      { headers: { 'x-api-key': API_KEY }}
    );
    console.log('✅ Time-In Success:', JSON.stringify(response.data, null, 2));
    globalTimeRecordId = response.data.timeRecordId;
  } catch (error) {
    console.log('❌ Time-In Failed:', error.response?.data || error.message);
    // If already clocked in, try to get the existing record
    if (error.response?.data?.message?.includes('already recorded')) {
      console.log('   ⚠️  Employee already has time-in for today');
      // Try to get employee status to find existing record
      try {
        const statusResponse = await axios.get(
          `${BASE_URL}/employee-status?employeeId=${TEST_EMPLOYEE_1}`,
          { headers: { 'x-api-key': API_KEY }}
        );
        if (statusResponse.data.timeRecordId) {
          globalTimeRecordId = statusResponse.data.timeRecordId;
          console.log(`   📝 Using existing time record ID: ${globalTimeRecordId}`);
        }
      } catch (statusError) {
        console.log('   ❌ Could not get employee status');
      }
    }
  }

  // Test 4: Employee Status with ID
  console.log('\n4️⃣ Testing Employee Status with ID...');
  try {
    const response = await axios.get(`${BASE_URL}/employee-status?employeeId=${TEST_EMPLOYEE_1}`, {
      headers: { 'x-api-key': API_KEY }
    });
    console.log('✅ Employee Status Success:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Employee Status Failed:', error.response?.data || error.message);
  }

  // Test 5: Time Out (if we have a time record ID)
  if (globalTimeRecordId) {
    console.log('\n5️⃣ Testing Time-Out with Enhanced Computation...');

    // Wait 2 seconds to have some time span
    console.log('   ⏳ Waiting 2 seconds before time-out...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const response = await axios.post(`${BASE_URL}/time-out`,
        {
          timeRecordId: globalTimeRecordId,
          timestamp: new Date().toISOString()
        },
        { headers: { 'x-api-key': API_KEY }}
      );
      console.log('✅ Time-Out Success with Computations:');
      console.log(JSON.stringify(response.data, null, 2));
      console.log('\n   📊 Time Breakdown:');
      console.log(`      Regular Hours: ${response.data.regularHours || 'N/A'}`);
      console.log(`      Overtime Hours: ${response.data.overtimeHours || 'N/A'}`);
      console.log(`      Night Differential: ${response.data.nightDifferentialMinutes || 0} minutes`);
      console.log(`      Total Minutes: ${response.data.totalMinutes || 'N/A'}`);
    } catch (error) {
      console.log('❌ Time-Out Failed:', error.response?.data || error.message);
    }
  } else {
    console.log('\n5️⃣ Skipping Time-Out test (no time record ID available)');
  }

  // Test 6: Daily Logs
  console.log('\n6️⃣ Testing Daily Logs...');
  const today = new Date().toISOString().split('T')[0];
  try {
    const response = await axios.get(`${BASE_URL}/daily-logs?date=${today}`, {
      headers: { 'x-api-key': API_KEY }
    });
    console.log('✅ Daily Logs Success:');
    console.log(`   Date: ${response.data.date}`);
    console.log(`   Total Records: ${response.data.totalRecords}`);
    if (response.data.records && response.data.records.length > 0) {
      console.log('   Records:');
      response.data.records.forEach(record => {
        console.log(`     - ${record.employeeName}: ${record.hoursWorked} hours`);
      });
    }
  } catch (error) {
    console.log('❌ Daily Logs Failed:', error.response?.data || error.message);
  }

  // Test 7: Invalid API Key Test
  console.log('\n7️⃣ Testing Invalid API Key (Security Check)...');
  try {
    await axios.get(`${BASE_URL}/health`, {
      headers: { 'x-api-key': 'invalid_key_123' }
    });
    console.log('⚠️  Security Issue: Invalid API key was accepted!');
  } catch (error) {
    console.log('✅ Security Check Passed: Invalid API key rejected');
    console.log(`   Error: ${error.response?.data?.message || error.message}`);
  }

  // Test 8: Missing API Key Test
  console.log('\n8️⃣ Testing Missing API Key (Security Check)...');
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log('⚠️  Security Issue: Request without API key was accepted!');
  } catch (error) {
    console.log('✅ Security Check Passed: Missing API key rejected');
    console.log(`   Error: ${error.response?.data?.message || error.message}`);
  }
}

// Run the tests
console.log('Starting Manpower API Tests...\n');
testManpowerAPI()
  .then(() => {
    console.log('\n' + '=' .repeat(60));
    console.log('TEST SUITE COMPLETED');
    console.log('=' .repeat(60));
  })
  .catch(error => {
    console.error('\n❌ Test suite failed:', error);
  });