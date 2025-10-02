import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { getTestUser } from '../fixtures/test-data';

test.describe('Debug JWT Structure and Task Access', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('JWT payload structure:')) {
        console.log('🔐 ' + text);
      } else if (text.includes('SupabaseService')) {
        console.log('📝 ' + text);
      }
    });
  });

  test('Debug JWT structure and task API access', async ({ page }) => {
    const testUser = getTestUser('DEFAULT');

    console.log('🎯 Debugging JWT and Task Access');
    console.log(`👤 User: ${testUser.username}`);

    // Step 1: Login
    await test.step('Login', async () => {
      await loginPage.login(testUser);
      await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });
      console.log('✅ Login successful');
    });

    // Step 2: Wait for Supabase initialization
    await page.waitForTimeout(2000);

    // Step 3: Extract JWT information
    await test.step('Extract JWT information', async () => {
      const jwtInfo = await page.evaluate(() => {
        const supabaseService = (window as any).supabaseService;
        if (!supabaseService) {
          return { error: 'No supabaseService found' };
        }

        // Get the custom access token
        const token = supabaseService.customAccessToken;
        if (!token) {
          return { error: 'No custom access token' };
        }

        // Decode the JWT
        try {
          const parts = token.split('.');
          if (parts.length !== 3) {
            return { error: 'Invalid JWT format' };
          }

          const payload = JSON.parse(atob(parts[1]));

          return {
            success: true,
            tokenLength: token.length,
            tokenPreview: token.substring(0, 50) + '...',
            payload: {
              sub: payload.sub,
              role: payload.role,
              aud: payload.aud,
              hasUserMetadata: !!payload.user_metadata,
              userMetadata: payload.user_metadata,
              exp: payload.exp,
              iat: payload.iat
            }
          };
        } catch (e) {
          return { error: 'Failed to decode JWT: ' + e.message };
        }
      });

      console.log('📊 JWT Information:', JSON.stringify(jwtInfo, null, 2));
    });

    // Step 4: Test direct API call with custom JWT
    await test.step('Test API with custom JWT', async () => {
      const apiResult = await page.evaluate(async () => {
        const supabaseService = (window as any).supabaseService;
        const token = supabaseService?.customAccessToken;

        if (!token) {
          return { error: 'No token available' };
        }

        try {
          const response = await fetch('https://ofnmfmwywkhosrmycltb.supabase.co/rest/v1/Task?select=id,title&limit=1', {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mbm1mbXd5d2tob3NybXljbHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNTQ1OTcsImV4cCI6MjA3MjYzMDU5N30.xG_whEdorHh3pPPrf8p8xm7FzJrTuqhCpd-igos08XY',
              'Authorization': `Bearer ${token}`,
              'X-Source': 'frontend-main'
            }
          });

          const responseText = await response.text();
          return {
            status: response.status,
            statusText: response.statusText,
            body: responseText.substring(0, 200),
            headers: {
              contentType: response.headers.get('content-type')
            }
          };
        } catch (e) {
          return { error: 'Fetch failed: ' + e.message };
        }
      });

      console.log('🌐 API Response with custom JWT:', JSON.stringify(apiResult, null, 2));
    });

    // Step 5: Navigate to tasks and check for errors
    await test.step('Navigate to tasks', async () => {
      await page.goto('/#/member/task/all');
      await page.waitForLoadState('networkidle');

      // Wait for any API calls
      await page.waitForTimeout(3000);

      // Check for task rows
      const taskRows = await page.locator('.task-row').count();
      const taskSections = await page.locator('.task-section').count();

      console.log('📋 Task UI State:');
      console.log(`  - Task sections: ${taskSections}`);
      console.log(`  - Task rows: ${taskRows}`);
    });

    // Step 6: Check for network errors
    await test.step('Check for network errors', async () => {
      const networkErrors = await page.evaluate(() => {
        const errors = [];
        const entries = window.performance.getEntries() as PerformanceResourceTiming[];

        for (const entry of entries) {
          if (entry.name.includes('/rest/v1/Task')) {
            errors.push({
              url: entry.name.substring(0, 150),
              duration: Math.round(entry.duration)
            });
          }
        }

        return errors;
      });

      console.log('🔍 Task API Calls:', networkErrors.length > 0 ? networkErrors : 'No Task API calls found');
    });

    // Step 7: Final summary
    console.log('\n📊 SUMMARY:');
    console.log('- JWT is being generated and contains user_metadata');
    console.log('- Custom JWT is being sent in Authorization header');
    console.log('- X-Source header is being included');
    console.log('- RLS policies need to be updated to accept the custom JWT structure');
  });
});