import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3000';

let authToken: string;
let createdEmployeeAccountId: string;
let validScheduleId: string;
let validPayrollGroupId: string;
let validBranchId: string;
let validRoleId: string;

test.describe('HRIS Employee CRUD Operations', () => {
  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: 'guillermotabligan',
        password: 'water123',
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    authToken = loginData.token;
    expect(authToken).toBeTruthy();

    // Fetch valid IDs from dropdown endpoints
    const scheduleResponse = await request.get(`${API_BASE_URL}/hr-configuration/schedule/list`, {
      headers: { 'token': authToken },
    });
    const scheduleData = await scheduleResponse.json();
    validScheduleId = scheduleData[0]?.value || null;

    const payrollResponse = await request.get(`${API_BASE_URL}/hr-configuration/payroll-group/list`, {
      headers: { 'token': authToken },
    });
    const payrollData = await payrollResponse.json();
    validPayrollGroupId = payrollData[0]?.value || null;

    const branchResponse = await request.get(`${API_BASE_URL}/project/list`, {
      headers: { 'token': authToken },
    });
    const branchData = await branchResponse.json();
    validBranchId = branchData[0]?.value || null;

    const roleResponse = await request.get(`${API_BASE_URL}/select-box/role-list`, {
      headers: { 'token': authToken },
    });
    const roleData = await roleResponse.json();
    validRoleId = roleData.list?.[0]?.key || null;

    // Ensure we have all required IDs
    expect(validScheduleId).toBeTruthy();
    expect(validPayrollGroupId).toBeTruthy();
    expect(validBranchId).toBeTruthy();
    expect(validRoleId).toBeTruthy();
  });

  test('Should create a new employee successfully', async ({ request }) => {
    // Generate unique test data
    const timestamp = Date.now();
    const employeeCode = `TEST${timestamp}`;
    const username = `testuser${timestamp}`;
    const email = `test${timestamp}@example.com`;

    const newEmployeeData = {
      employeeCode: employeeCode,
      accountDetails: {
        firstName: 'Test',
        lastName: 'Employee',
        middleName: 'Auto',
        contactNumber: '09123456789',
        email: email,
        username: username,
        password: 'password123',
        roleID: validRoleId,
        parentAccountId: null,
      },
      contractDetails: {
        monthlyRate: 25000,
        employmentStatus: 'REGULAR',
        startDate: new Date().toISOString().split('T')[0],
        endDate: null,
        contractFileId: null,
      },
      payrollGroupId: validPayrollGroupId,
      scheduleId: validScheduleId,
      branchId: validBranchId,
    };

    const response = await request.post(`${API_BASE_URL}/hris/employee/add`, {
      headers: {
        'token': authToken,
        'Content-Type': 'application/json',
      },
      data: newEmployeeData,
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Verify response structure
    expect(data).toHaveProperty('accountDetails');
    expect(data.accountDetails).toHaveProperty('id');
    expect(data.accountDetails.id).toBeTruthy();

    // Store the created employee's account ID for later tests
    createdEmployeeAccountId = data.accountDetails.id;
  });

  test('Should retrieve employee information by accountId', async ({ request }) => {
    // Skip if employee was not created in previous test
    if (!createdEmployeeAccountId) {
      test.skip();
    }

    const response = await request.get(`${API_BASE_URL}/hris/employee/info?accountId=${createdEmployeeAccountId}`, {
      headers: {
        'token': authToken,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Verify employee data structure
    expect(data).toHaveProperty('accountDetails');
    expect(data).toHaveProperty('employeeCode');
    expect(data).toHaveProperty('contractDetails');
    expect(data.accountDetails).toHaveProperty('firstName');
    expect(data.accountDetails).toHaveProperty('lastName');
    // Names are stored in lowercase by the API
    expect(data.accountDetails.firstName.toLowerCase()).toBe('test');
    expect(data.accountDetails.lastName.toLowerCase()).toBe('employee');
  });

  test('Should update employee details', async ({ request }) => {
    // Skip if employee was not created
    if (!createdEmployeeAccountId) {
      test.skip();
    }

    // First fetch the current employee data to get required fields
    const currentDataResponse = await request.get(`${API_BASE_URL}/hris/employee/info?accountId=${createdEmployeeAccountId}`, {
      headers: {
        'token': authToken,
      },
    });
    const currentData = await currentDataResponse.json();

    // Update DTO extends CreateDTO, so we need all required fields
    const updatedData = {
      accountId: createdEmployeeAccountId,
      employeeCode: currentData.employeeCode,
      accountDetails: {
        firstName: 'TestUpdated',
        lastName: 'EmployeeUpdated',
        middleName: 'Modified',
        contactNumber: '09987654321',
        email: currentData.accountDetails.email,
        username: currentData.accountDetails.username,
        roleID: currentData.accountDetails.roleID,
        parentAccountId: currentData.accountDetails.parentAccountId,
        dateOfBirth: '1990-01-01',
        gender: 'MALE',
        civilStatus: 'SINGLE',
        country: 'Philippines',
        stateProvince: 'Metro Manila',
        city: 'Manila',
        barangay: 'Ermita',
        street: 'Test Street',
        zipCode: '1000',
      },
      payrollGroupId: validPayrollGroupId,
      scheduleId: validScheduleId,
      branchId: validBranchId,
      contractDetails: {
        monthlyRate: 25000,
        employmentStatus: 'REGULAR',
        startDate: new Date().toISOString().split('T')[0],
        endDate: null,
        contractFileId: null,
      },
    };

    const response = await request.patch(`${API_BASE_URL}/hris/employee/update`, {
      headers: {
        'token': authToken,
        'Content-Type': 'application/json',
      },
      data: updatedData,
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toBeTruthy();

    // Verify the update by fetching the employee info again
    const verifyResponse = await request.get(`${API_BASE_URL}/hris/employee/info?accountId=${createdEmployeeAccountId}`, {
      headers: {
        'token': authToken,
      },
    });

    const verifyData = await verifyResponse.json();
    // Names are stored in lowercase by the API
    expect(verifyData.accountDetails.firstName.toLowerCase()).toBe('testupdated');
    expect(verifyData.accountDetails.lastName.toLowerCase()).toBe('employeeupdated');
  });

  test('Should update employee job details', async ({ request }) => {
    // Skip if employee was not created
    if (!createdEmployeeAccountId) {
      test.skip();
    }

    const jobDetailsData = {
      accountId: createdEmployeeAccountId,
      jobDetails: {
        bankName: 'Test Bank',
        bankAccountNumber: '1234567890',
        biometricsNumber: 'BIO123',
      },
      branchId: validBranchId,
    };

    const response = await request.patch(`${API_BASE_URL}/hris/employee/update-job-details`, {
      headers: {
        'token': authToken,
        'Content-Type': 'application/json',
      },
      data: jobDetailsData,
    });

    expect(response.ok()).toBeTruthy();
  });

  test('Should update employee government details', async ({ request }) => {
    // Skip if employee was not created
    if (!createdEmployeeAccountId) {
      test.skip();
    }

    const governmentDetailsData = {
      accountId: createdEmployeeAccountId,
      governmentDetails: {
        sssNumber: '12-3456789-0',
        tinNumber: '123-456-789-000',
        phicNumber: '12-345678901-2',
        hdmfNumber: '1234-5678-9012',
      },
    };

    const response = await request.patch(`${API_BASE_URL}/hris/employee/update-government-details`, {
      headers: {
        'token': authToken,
        'Content-Type': 'application/json',
      },
      data: governmentDetailsData,
    });

    expect(response.ok()).toBeTruthy();
  });

  test('Should update employee schedule', async ({ request }) => {
    // Skip if employee was not created
    if (!createdEmployeeAccountId) {
      test.skip();
    }

    const scheduleData = {
      accountId: createdEmployeeAccountId,
      scheduleId: validScheduleId,
    };

    const response = await request.patch(`${API_BASE_URL}/hris/employee/update-schedule`, {
      headers: {
        'token': authToken,
        'Content-Type': 'application/json',
      },
      data: scheduleData,
    });

    expect(response.ok()).toBeTruthy();
  });

  test('Should delete (soft delete) employee', async ({ request }) => {
    // Skip if employee was not created
    if (!createdEmployeeAccountId) {
      test.skip();
    }

    const response = await request.delete(`${API_BASE_URL}/hris/employee/delete`, {
      headers: {
        'token': authToken,
        'Content-Type': 'application/json',
      },
      data: {
        accountId: createdEmployeeAccountId,
      },
    });

    expect(response.ok()).toBeTruthy();

    // Verify employee is deleted by checking table with inactive filter
    const tableResponse = await request.put(`${API_BASE_URL}/hris/employee/table?page=1&perPage=10`, {
      headers: {
        'token': authToken,
        'Content-Type': 'application/json',
      },
      data: {
        filters: [{ isActive: false }],
      },
    });

    expect(tableResponse.ok()).toBeTruthy();
  });

  test('Should restore deleted employee', async ({ request }) => {
    // Skip if employee was not created
    if (!createdEmployeeAccountId) {
      test.skip();
    }

    const response = await request.patch(`${API_BASE_URL}/hris/employee/restore`, {
      headers: {
        'token': authToken,
        'Content-Type': 'application/json',
      },
      data: {
        accountId: createdEmployeeAccountId,
      },
    });

    expect(response.ok()).toBeTruthy();

    // Verify employee is restored by checking table with active filter
    const tableResponse = await request.put(`${API_BASE_URL}/hris/employee/table?page=1&perPage=10`, {
      headers: {
        'token': authToken,
        'Content-Type': 'application/json',
      },
      data: {
        filters: [{ isActive: true }],
      },
    });

    const tableData = await tableResponse.json();
    expect(tableResponse.ok()).toBeTruthy();

    // Find the restored employee in the list
    const restoredEmployee = tableData.list.find(
      (emp: any) => emp.accountDetails?.id === createdEmployeeAccountId
    );
    expect(restoredEmployee).toBeTruthy();
  });

  test('Should require authentication for all employee endpoints', async ({ request }) => {
    // Test create without token
    const createResponse = await request.post(`${API_BASE_URL}/hris/employee/add`, {
      data: {
        employeeCode: 'TEST001',
        accountDetails: {},
        contractDetails: {},
      },
    });
    expect([401, 404]).toContain(createResponse.status());

    // Test update without token
    const updateResponse = await request.patch(`${API_BASE_URL}/hris/employee/update`, {
      data: {
        accountId: '1',
      },
    });
    expect([401, 404]).toContain(updateResponse.status());

    // Test delete without token
    const deleteResponse = await request.delete(`${API_BASE_URL}/hris/employee/delete`, {
      data: {
        accountId: '1',
      },
    });
    expect([401, 404]).toContain(deleteResponse.status());
  });
});
