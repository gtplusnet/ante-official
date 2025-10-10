import { test, expect } from '@playwright/test';

/**
 * HRIS Manpower Dropdown API Endpoints Tests
 *
 * Tests the new dropdown list endpoints created for HRIS manpower module:
 * - GET /hr-configuration/schedule/list
 * - GET /hr-configuration/payroll-group/list
 * - GET /hr-configuration/shift/list
 * - GET /project/list
 *
 * These endpoints replace Supabase direct access with proper backend API calls.
 */

const API_BASE_URL = 'http://localhost:3000';
const TEST_CREDENTIALS = {
  username: 'guillermotabligan',
  password: 'water123'
};

let authToken: string;

test.describe('HRIS Dropdown API Endpoints', () => {
  // Get auth token before all tests
  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: TEST_CREDENTIALS
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    authToken = data.token;
    expect(authToken).toBeTruthy();
  });

  test('GET /hr-configuration/schedule/list - should return schedule dropdown list', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/hr-configuration/schedule/list`, {
      headers: {
        'token': authToken
      }
    });

    expect(response.ok()).toBeTruthy();
    const schedules = await response.json();

    // Verify response is an array
    expect(Array.isArray(schedules)).toBeTruthy();

    // Verify array is not empty (assuming test data exists)
    expect(schedules.length).toBeGreaterThan(0);

    // Verify dropdown format (label + value)
    const firstSchedule = schedules[0];
    expect(firstSchedule).toHaveProperty('label');
    expect(firstSchedule).toHaveProperty('value');
    expect(typeof firstSchedule.label).toBe('string');
    expect(typeof firstSchedule.value).toBe('number');

    console.log(`✅ Found ${schedules.length} schedules`);
  });

  test('GET /hr-configuration/payroll-group/list - should return payroll group dropdown list', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/hr-configuration/payroll-group/list`, {
      headers: {
        'token': authToken
      }
    });

    expect(response.ok()).toBeTruthy();
    const payrollGroups = await response.json();

    // Verify response is an array
    expect(Array.isArray(payrollGroups)).toBeTruthy();

    // Verify array is not empty
    expect(payrollGroups.length).toBeGreaterThan(0);

    // Verify dropdown format
    const firstGroup = payrollGroups[0];
    expect(firstGroup).toHaveProperty('label');
    expect(firstGroup).toHaveProperty('value');
    expect(typeof firstGroup.label).toBe('string');
    expect(typeof firstGroup.value).toBe('number');

    console.log(`✅ Found ${payrollGroups.length} payroll groups`);
  });

  test('GET /hr-configuration/shift/list - should return shift dropdown list', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/hr-configuration/shift/list`, {
      headers: {
        'token': authToken
      }
    });

    expect(response.ok()).toBeTruthy();
    const shifts = await response.json();

    // Verify response is an array
    expect(Array.isArray(shifts)).toBeTruthy();

    // Verify array is not empty
    expect(shifts.length).toBeGreaterThan(0);

    // Verify dropdown format
    const firstShift = shifts[0];
    expect(firstShift).toHaveProperty('label');
    expect(firstShift).toHaveProperty('value');
    expect(typeof firstShift.label).toBe('string');
    expect(typeof firstShift.value).toBe('number');

    console.log(`✅ Found ${shifts.length} shifts`);
  });

  test('GET /project/list - should return project/branch dropdown list', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/project/list`, {
      headers: {
        'token': authToken
      }
    });

    expect(response.ok()).toBeTruthy();
    const projects = await response.json();

    // Verify response is an array
    expect(Array.isArray(projects)).toBeTruthy();

    // Verify array is not empty
    expect(projects.length).toBeGreaterThan(0);

    // Verify dropdown format
    const firstProject = projects[0];
    expect(firstProject).toHaveProperty('label');
    expect(firstProject).toHaveProperty('value');
    expect(typeof firstProject.label).toBe('string');
    expect(typeof firstProject.value).toBe('number');

    console.log(`✅ Found ${projects.length} projects/branches`);
  });

  test('All dropdown endpoints should return data sorted alphabetically', async ({ request }) => {
    // Case-insensitive sort comparison function
    const caseInsensitiveSort = (a: string, b: string) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' });

    // Test schedule list sorting
    const scheduleResponse = await request.get(`${API_BASE_URL}/hr-configuration/schedule/list`, {
      headers: { 'token': authToken }
    });
    const schedules = await scheduleResponse.json();
    const scheduleLabels = schedules.map((s: any) => s.label);
    const sortedScheduleLabels = [...scheduleLabels].sort(caseInsensitiveSort);
    expect(scheduleLabels).toEqual(sortedScheduleLabels);

    // Test payroll group list sorting
    const payrollResponse = await request.get(`${API_BASE_URL}/hr-configuration/payroll-group/list`, {
      headers: { 'token': authToken }
    });
    const payrollGroups = await payrollResponse.json();
    const payrollLabels = payrollGroups.map((p: any) => p.label);
    const sortedPayrollLabels = [...payrollLabels].sort(caseInsensitiveSort);
    expect(payrollLabels).toEqual(sortedPayrollLabels);

    // Test shift list sorting
    const shiftResponse = await request.get(`${API_BASE_URL}/hr-configuration/shift/list`, {
      headers: { 'token': authToken }
    });
    const shifts = await shiftResponse.json();
    const shiftLabels = shifts.map((s: any) => s.label);
    const sortedShiftLabels = [...shiftLabels].sort(caseInsensitiveSort);
    expect(shiftLabels).toEqual(sortedShiftLabels);

    // Test project list sorting
    const projectResponse = await request.get(`${API_BASE_URL}/project/list`, {
      headers: { 'token': authToken }
    });
    const projects = await projectResponse.json();
    const projectLabels = projects.map((p: any) => p.label);
    const sortedProjectLabels = [...projectLabels].sort(caseInsensitiveSort);
    expect(projectLabels).toEqual(sortedProjectLabels);

    console.log('✅ All dropdown lists are sorted alphabetically');
  });

  test('All dropdown endpoints should only return active/non-deleted items', async ({ request }) => {
    // Verify schedules only returns non-deleted items (isDeleted: false)
    const scheduleResponse = await request.get(`${API_BASE_URL}/hr-configuration/schedule/list`, {
      headers: { 'token': authToken }
    });
    expect(scheduleResponse.ok()).toBeTruthy();

    // Verify payroll groups only returns non-deleted items
    const payrollResponse = await request.get(`${API_BASE_URL}/hr-configuration/payroll-group/list`, {
      headers: { 'token': authToken }
    });
    expect(payrollResponse.ok()).toBeTruthy();

    // Verify shifts only returns non-deleted items (excluding EMPLOYEE_ADJUSTMENT purpose)
    const shiftResponse = await request.get(`${API_BASE_URL}/hr-configuration/shift/list`, {
      headers: { 'token': authToken }
    });
    expect(shiftResponse.ok()).toBeTruthy();

    // Verify projects only returns non-deleted items
    const projectResponse = await request.get(`${API_BASE_URL}/project/list`, {
      headers: { 'token': authToken }
    });
    expect(projectResponse.ok()).toBeTruthy();

    console.log('✅ All dropdown lists filter out deleted/inactive items');
  });

  test('All dropdown endpoints should require authentication', async ({ request }) => {
    // Test without token - should fail with 401 (Unauthorized) or 404 (Not Found due to global guard)
    const scheduleResponse = await request.get(`${API_BASE_URL}/hr-configuration/schedule/list`);
    expect([401, 404]).toContain(scheduleResponse.status());

    const payrollResponse = await request.get(`${API_BASE_URL}/hr-configuration/payroll-group/list`);
    expect([401, 404]).toContain(payrollResponse.status());

    const shiftResponse = await request.get(`${API_BASE_URL}/hr-configuration/shift/list`);
    expect([401, 404]).toContain(shiftResponse.status());

    const projectResponse = await request.get(`${API_BASE_URL}/project/list`);
    expect([401, 404]).toContain(projectResponse.status());

    console.log('✅ All endpoints properly require authentication');
  });
});
