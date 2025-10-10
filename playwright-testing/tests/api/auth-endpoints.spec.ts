import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3000';
const TEST_ACCOUNT_ID = '590a4b22-c4ec-4ccc-b9f1-b371cf908257'; // guillermotabligan's account ID

test.describe('Authentication Endpoints (Post-Supabase Removal)', () => {
  test('Should login successfully with valid credentials', async ({ request }) => {
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: 'guillermotabligan',
        password: 'water123',
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();

    // Verify response structure
    expect(loginData).toHaveProperty('token');
    expect(loginData).toHaveProperty('accountInformation');
    expect(loginData).toHaveProperty('serverName');

    // Verify token is a non-empty string
    expect(loginData.token).toBeTruthy();
    expect(typeof loginData.token).toBe('string');

    // Verify account information is present
    expect(loginData.accountInformation).toHaveProperty('id');
    expect(loginData.accountInformation).toHaveProperty('email');
    expect(loginData.accountInformation).toHaveProperty('firstName');
    expect(loginData.accountInformation).toHaveProperty('lastName');

    // IMPORTANT: Verify Supabase tokens are NOT present (we removed Supabase)
    expect(loginData).not.toHaveProperty('supabaseToken');
    expect(loginData).not.toHaveProperty('supabaseRefreshToken');
    expect(loginData).not.toHaveProperty('supabaseAccessToken');
  });

  test('Should reject login with invalid credentials', async ({ request }) => {
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: 'invaliduser',
        password: 'wrongpassword',
      },
    });

    expect(loginResponse.ok()).toBeFalsy();
    expect(loginResponse.status()).toBe(404);
  });

  test('Should reject login with missing credentials', async ({ request }) => {
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: 'guillermotabligan',
        // Missing password
      },
    });

    expect(loginResponse.ok()).toBeFalsy();
    expect(loginResponse.status()).toBe(400);
  });

  test('Should use token for authenticated requests', async ({ request }) => {
    // First login
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: 'guillermotabligan',
        password: 'water123',
      },
    });

    const loginData = await loginResponse.json();
    const authToken = loginData.token;

    // Test authenticated endpoint (GET request)
    const authenticatedResponse = await request.get(`${API_BASE_URL}/hris/employee/info-lite?accountId=${TEST_ACCOUNT_ID}`, {
      headers: {
        'token': authToken,
      },
    });

    expect(authenticatedResponse.ok()).toBeTruthy();
    const employeeData = await authenticatedResponse.json();
    expect(employeeData).toHaveProperty('employeeCode');
  });

  test('Should reject authenticated requests without token', async ({ request }) => {
    // Try to access authenticated endpoint without token
    const response = await request.get(`${API_BASE_URL}/hris/employee/info-lite?accountId=${TEST_ACCOUNT_ID}`);

    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(404);
  });

  test('Should reject authenticated requests with invalid token', async ({ request }) => {
    // Try to access authenticated endpoint with invalid token
    const response = await request.get(`${API_BASE_URL}/hris/employee/info-lite?accountId=${TEST_ACCOUNT_ID}`, {
      headers: {
        'token': 'invalid-token-string',
      },
    });

    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(404);
  });

  test('Should logout successfully', async ({ request }) => {
    // First login
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: 'guillermotabligan',
        password: 'water123',
      },
    });

    const loginData = await loginResponse.json();
    const authToken = loginData.token;

    // Logout
    const logoutResponse = await request.post(`${API_BASE_URL}/auth/logout`, {
      headers: {
        'token': authToken,
      },
    });

    expect(logoutResponse.ok()).toBeTruthy();
    const logoutData = await logoutResponse.json();
    expect(logoutData).toHaveProperty('message');
    expect(logoutData.message).toContain('Logged out successfully');

    // Verify token is invalidated - should fail authentication
    const authenticatedResponse = await request.get(`${API_BASE_URL}/hris/employee/info-lite?accountId=${TEST_ACCOUNT_ID}`, {
      headers: {
        'token': authToken,
      },
    });

    expect(authenticatedResponse.ok()).toBeFalsy();
  });

  test('Should verify Supabase refresh endpoint is removed', async ({ request }) => {
    // First login
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: 'guillermotabligan',
        password: 'water123',
      },
    });

    const loginData = await loginResponse.json();
    const authToken = loginData.token;

    // Try to access the old Supabase refresh endpoint (should be 404)
    const refreshResponse = await request.post(`${API_BASE_URL}/auth/refresh-supabase-token`, {
      headers: {
        'token': authToken,
      },
    });

    // Endpoint should not exist anymore
    expect(refreshResponse.status()).toBe(404);
  });

  test('Should verify login response does not contain Supabase fields in AccountToken', async ({ request }) => {
    // Login to create a new token
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: 'guillermotabligan',
        password: 'water123',
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();

    // Verify the entire response structure doesn't contain any Supabase references
    const responseString = JSON.stringify(loginData);
    expect(responseString).not.toContain('supabase');
    expect(responseString).not.toContain('Supabase');
  });

  test('Should maintain session with valid token across multiple requests', async ({ request }) => {
    // Login
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: 'guillermotabligan',
        password: 'water123',
      },
    });

    const loginData = await loginResponse.json();
    const authToken = loginData.token;

    // Make multiple authenticated requests
    for (let i = 0; i < 5; i++) {
      const response = await request.get(`${API_BASE_URL}/hris/employee/info-lite?accountId=${TEST_ACCOUNT_ID}`, {
        headers: {
          'token': authToken,
        },
      });

      expect(response.ok()).toBeTruthy();
    }
  });

  test('Should logout from all devices successfully', async ({ request }) => {
    // Login multiple times to create multiple tokens
    const login1 = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: 'guillermotabligan',
        password: 'water123',
      },
    });
    const token1 = (await login1.json()).token;

    const login2 = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: 'guillermotabligan',
        password: 'water123',
      },
    });
    const token2 = (await login2.json()).token;

    // Logout from all devices using token1
    const logoutAllResponse = await request.post(`${API_BASE_URL}/auth/logout-all`, {
      headers: {
        'token': token1,
      },
    });

    expect(logoutAllResponse.ok()).toBeTruthy();
    const logoutData = await logoutAllResponse.json();
    expect(logoutData.message).toContain('Logged out from all devices successfully');

    // Both tokens should now be invalid
    const test1 = await request.get(`${API_BASE_URL}/hris/employee/info-lite?accountId=${TEST_ACCOUNT_ID}`, {
      headers: {
        'token': token1,
      },
    });
    expect(test1.ok()).toBeFalsy();

    const test2 = await request.get(`${API_BASE_URL}/hris/employee/info-lite?accountId=${TEST_ACCOUNT_ID}`, {
      headers: {
        'token': token2,
      },
    });
    expect(test2.ok()).toBeFalsy();
  });
});
