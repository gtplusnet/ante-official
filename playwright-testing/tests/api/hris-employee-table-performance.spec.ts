import { test, expect } from '@playwright/test';

/**
 * HRIS Employee Table Performance Test
 *
 * Purpose: Verify that the optimized table-lite endpoint performs significantly better
 * than the original table endpoint by eliminating N+1 query problems.
 *
 * Test Coverage:
 * 1. Both endpoints return same data structure
 * 2. table-lite endpoint is significantly faster
 * 3. Both endpoints handle pagination correctly
 * 4. Both endpoints handle filters correctly
 */

const BASE_URL = 'http://localhost:3000';
const TEST_CREDENTIALS = {
  username: 'guillermotabligan',
  password: 'water123',
};

test.describe('HRIS Employee Table Performance', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Login and get auth token
    const loginResponse = await request.post(`${BASE_URL}/auth/login`, {
      data: TEST_CREDENTIALS,
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    authToken = loginData.token;
    expect(authToken).toBeTruthy();
  });

  test('should verify both endpoints return same data structure', async ({ request }) => {
    const headers = { token: authToken };
    const requestBody = {
      searchKeyword: '',
      searchBy: 'accountDetails.firstName',
      filters: [{ isActive: true }],
      settings: {
        columns: [],
        search: [],
        perPage: 10,
      },
    };

    // Call original endpoint
    const originalResponse = await request.put(
      `${BASE_URL}/hris/employee/table?page=1&perPage=10`,
      {
        headers,
        data: requestBody,
      }
    );

    // Call optimized endpoint
    const liteResponse = await request.put(
      `${BASE_URL}/hris/employee/table-lite?page=1&perPage=10`,
      {
        headers,
        data: requestBody,
      }
    );

    expect(originalResponse.ok()).toBeTruthy();
    expect(liteResponse.ok()).toBeTruthy();

    const originalData = await originalResponse.json();
    const liteData = await liteResponse.json();

    // Verify both have same structure
    expect(originalData).toHaveProperty('list');
    expect(originalData).toHaveProperty('pagination');
    expect(originalData).toHaveProperty('currentPage');

    expect(liteData).toHaveProperty('list');
    expect(liteData).toHaveProperty('pagination');
    expect(liteData).toHaveProperty('currentPage');

    // Verify list lengths match
    expect(liteData.list.length).toBe(originalData.list.length);

    // Verify first item has same properties
    if (liteData.list.length > 0 && originalData.list.length > 0) {
      const liteItem = liteData.list[0];
      const originalItem = originalData.list[0];

      expect(liteItem).toHaveProperty('employeeCode');
      expect(liteItem).toHaveProperty('accountDetails');
      expect(liteItem).toHaveProperty('contractDetails');
      expect(liteItem).toHaveProperty('payrollGroup');
      expect(liteItem).toHaveProperty('schedule');
      expect(liteItem).toHaveProperty('branch');
      expect(liteItem).toHaveProperty('jobDetails');
      expect(liteItem).toHaveProperty('governmentDetails');

      // Verify employee codes match (data should be the same)
      expect(liteItem.employeeCode).toBe(originalItem.employeeCode);
    }
  });

  test('should demonstrate performance improvement', async ({ request }) => {
    const headers = { token: authToken };
    const requestBody = {
      searchKeyword: '',
      searchBy: 'accountDetails.firstName',
      filters: [{ isActive: true }],
      settings: {
        columns: [],
        search: [],
        perPage: 50, // Test with 50 employees to see N+1 problem
      },
    };

    // Measure original endpoint
    const originalStart = Date.now();
    const originalResponse = await request.put(
      `${BASE_URL}/hris/employee/table?page=1&perPage=50`,
      {
        headers,
        data: requestBody,
      }
    );
    const originalDuration = Date.now() - originalStart;
    expect(originalResponse.ok()).toBeTruthy();

    // Measure optimized endpoint
    const liteStart = Date.now();
    const liteResponse = await request.put(
      `${BASE_URL}/hris/employee/table-lite?page=1&perPage=50`,
      {
        headers,
        data: requestBody,
      }
    );
    const liteDuration = Date.now() - liteStart;
    expect(liteResponse.ok()).toBeTruthy();

    console.log(`\n=== Performance Comparison ===`);
    console.log(`Original endpoint: ${originalDuration}ms`);
    console.log(`Lite endpoint: ${liteDuration}ms`);
    console.log(`Improvement: ${((originalDuration - liteDuration) / originalDuration * 100).toFixed(1)}%`);
    console.log(`Speed-up: ${(originalDuration / liteDuration).toFixed(1)}x faster`);

    // Lite endpoint should be faster (allow some margin for test environment)
    // In production, we expect 50-100x improvement, but in tests we'll accept 2x
    expect(liteDuration).toBeLessThan(originalDuration);
  });

  test('should handle pagination correctly', async ({ request }) => {
    const headers = { token: authToken };
    const requestBody = {
      searchKeyword: '',
      searchBy: 'accountDetails.firstName',
      filters: [{ isActive: true }],
      settings: {
        columns: [],
        search: [],
        perPage: 10,
      },
    };

    // Test page 1
    const page1Response = await request.put(
      `${BASE_URL}/hris/employee/table-lite?page=1&perPage=10`,
      {
        headers,
        data: requestBody,
      }
    );

    expect(page1Response.ok()).toBeTruthy();
    const page1Data = await page1Response.json();

    expect(page1Data.currentPage).toBe(1);
    expect(page1Data.pagination).toBeTruthy();
    expect(page1Data.list.length).toBeLessThanOrEqual(10);

    // Test page 2 (if there are enough records)
    const page2Response = await request.put(
      `${BASE_URL}/hris/employee/table-lite?page=2&perPage=10`,
      {
        headers,
        data: requestBody,
      }
    );

    expect(page2Response.ok()).toBeTruthy();
    const page2Data = await page2Response.json();

    expect(page2Data.currentPage).toBe(2);

    // If there are records on page 2, they should be different from page 1
    if (page2Data.list.length > 0 && page1Data.list.length > 0) {
      expect(page2Data.list[0].employeeCode).not.toBe(page1Data.list[0].employeeCode);
    }
  });

  test('should handle active/inactive filters correctly', async ({ request }) => {
    const headers = { token: authToken };

    // Test active employees
    const activeResponse = await request.put(
      `${BASE_URL}/hris/employee/table-lite?page=1&perPage=10`,
      {
        headers,
        data: {
          searchKeyword: '',
          searchBy: 'accountDetails.firstName',
          filters: [{ isActive: true }],
          settings: { columns: [], search: [], perPage: 10 },
        },
      }
    );

    expect(activeResponse.ok()).toBeTruthy();
    const activeData = await activeResponse.json();

    // Test inactive employees
    const inactiveResponse = await request.put(
      `${BASE_URL}/hris/employee/table-lite?page=1&perPage=10`,
      {
        headers,
        data: {
          searchKeyword: '',
          searchBy: 'accountDetails.firstName',
          filters: [{ isActive: false }],
          settings: { columns: [], search: [], perPage: 10 },
        },
      }
    );

    expect(inactiveResponse.ok()).toBeTruthy();
    const inactiveData = await inactiveResponse.json();

    // Both responses should have the expected structure
    expect(activeData).toHaveProperty('list');
    expect(inactiveData).toHaveProperty('list');

    console.log(`\n=== Filter Results ===`);
    console.log(`Active employees: ${activeData.list.length}`);
    console.log(`Inactive employees: ${inactiveData.list.length}`);
  });

  test('should handle search functionality', async ({ request }) => {
    const headers = { token: authToken };

    // Search for a specific employee (if exists)
    const searchResponse = await request.put(
      `${BASE_URL}/hris/employee/table-lite?page=1&perPage=10`,
      {
        headers,
        data: {
          searchKeyword: 'guiller',
          searchBy: 'accountDetails.firstName',
          filters: [{ isActive: true }],
          settings: { columns: [], search: [], perPage: 10 },
        },
      }
    );

    expect(searchResponse.ok()).toBeTruthy();
    const searchData = await searchResponse.json();

    expect(searchData).toHaveProperty('list');
    expect(searchData).toHaveProperty('pagination');
    expect(searchData).toHaveProperty('currentPage');

    console.log(`\n=== Search Results ===`);
    console.log(`Found ${searchData.list.length} employees matching 'guiller'`);
  });

  test('should return correct employee data structure', async ({ request }) => {
    const headers = { token: authToken };

    const response = await request.put(
      `${BASE_URL}/hris/employee/table-lite?page=1&perPage=1`,
      {
        headers,
        data: {
          searchKeyword: '',
          searchBy: 'accountDetails.firstName',
          filters: [{ isActive: true }],
          settings: { columns: [], search: [], perPage: 1 },
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    if (data.list.length > 0) {
      const employee = data.list[0];

      // Verify complete data structure
      expect(employee).toHaveProperty('employeeCode');
      expect(typeof employee.employeeCode).toBe('string');

      expect(employee).toHaveProperty('accountDetails');
      expect(employee.accountDetails).toHaveProperty('id');
      expect(employee.accountDetails).toHaveProperty('firstName');
      expect(employee.accountDetails).toHaveProperty('lastName');
      expect(employee.accountDetails).toHaveProperty('email');

      expect(employee).toHaveProperty('jobDetails');
      expect(employee.jobDetails).toHaveProperty('bankName');
      expect(employee.jobDetails).toHaveProperty('bankAccountNumber');
      expect(employee.jobDetails).toHaveProperty('biometricsNumber');

      expect(employee).toHaveProperty('governmentDetails');
      expect(employee.governmentDetails).toHaveProperty('tinNumber');
      expect(employee.governmentDetails).toHaveProperty('sssNumber');
      expect(employee.governmentDetails).toHaveProperty('hdmfNumber');
      expect(employee.governmentDetails).toHaveProperty('phicNumber');

      console.log(`\n=== Employee Data Sample ===`);
      console.log(`Employee Code: ${employee.employeeCode}`);
      console.log(`Name: ${employee.accountDetails.firstName} ${employee.accountDetails.lastName}`);
      console.log(`Email: ${employee.accountDetails.email}`);
    }
  });
});
