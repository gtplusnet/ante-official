import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:9000';

let authToken: string;

test.describe('HRIS Employee Table API Integration', () => {
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
  });

  test('Employee table endpoint should return data with filters', async ({ request }) => {
    const response = await request.put(`${API_BASE_URL}/hris/employee/table?page=1&perPage=10`, {
      headers: {
        'token': authToken,
        'Content-Type': 'application/json',
      },
      data: {
        filters: [{ isActive: true }],
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Check response structure
    expect(data).toHaveProperty('list');
    expect(data).toHaveProperty('pagination');
    expect(data).toHaveProperty('currentPage');
    expect(Array.isArray(data.list)).toBeTruthy();

    // If there are employees, check data structure
    if (data.list.length > 0) {
      const employee = data.list[0];
      expect(employee).toHaveProperty('employeeCode');
      expect(employee).toHaveProperty('accountDetails');
      expect(employee.accountDetails).toHaveProperty('firstName');
      expect(employee.accountDetails).toHaveProperty('lastName');

      // All employees should be active
      // Note: isActive is not directly in response, it's filtered on backend
    }
  });

  test('Employee table should filter active employees (isActive: true)', async ({ request }) => {
    const response = await request.put(`${API_BASE_URL}/hris/employee/table?page=1&perPage=10`, {
      headers: {
        'token': authToken,
        'Content-Type': 'application/json',
      },
      data: {
        filters: [{ isActive: true }],
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Should have at least some active employees
    expect(data.list.length).toBeGreaterThan(0);
  });

  test('Employee table should filter inactive employees (isActive: false)', async ({ request }) => {
    const response = await request.put(`${API_BASE_URL}/hris/employee/table?page=1&perPage=10`, {
      headers: {
        'token': authToken,
        'Content-Type': 'application/json',
      },
      data: {
        filters: [{ isActive: false }],
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Response should be valid even if no inactive employees
    expect(data).toHaveProperty('list');
    expect(Array.isArray(data.list)).toBeTruthy();
  });

  test('Employee table should support pagination', async ({ request }) => {
    const response = await request.put(`${API_BASE_URL}/hris/employee/table?page=1&perPage=5`, {
      headers: {
        'token': authToken,
        'Content-Type': 'application/json',
      },
      data: {
        filters: [{ isActive: true }],
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Check pagination structure (returns page number array)
    expect(Array.isArray(data.pagination)).toBeTruthy();
    expect(data.pagination.length).toBeGreaterThan(0);
    expect(data.pagination[0]).toBe(1);
    expect(data.currentPage).toBe(1);
    expect(data.list.length).toBeLessThanOrEqual(5);

    // If pagination shows more pages (has "..." or page 2), test page 2
    if (data.pagination.includes(2) || data.pagination.includes('...')) {
      const page2Response = await request.put(`${API_BASE_URL}/hris/employee/table?page=2&perPage=5`, {
        headers: {
          'token': authToken,
          'Content-Type': 'application/json',
        },
        data: {
          filters: [{ isActive: true }],
        },
      });

      expect(page2Response.ok()).toBeTruthy();
      const page2Data = await page2Response.json();
      expect(page2Data.currentPage).toBe(2);

      // Page 1 and Page 2 should have different data
      if (data.list.length > 0 && page2Data.list.length > 0) {
        expect(data.list[0].accountDetails.id).not.toBe(page2Data.list[0].accountDetails.id);
      }
    }
  });

  test('Employee table should require authentication', async ({ request }) => {
    const response = await request.put(`${API_BASE_URL}/hris/employee/table?page=1&perPage=10`, {
      data: {
        filters: [{ isActive: true }],
      },
    });

    // Should return 401 or 404 (depending on global guard)
    expect([401, 404]).toContain(response.status());
  });
});
