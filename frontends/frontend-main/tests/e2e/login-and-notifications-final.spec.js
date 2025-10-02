import { test, expect } from '@playwright/test';

test.describe('Complete Login and Notifications Test', () => {
  test('Login flow and notifications work correctly', async ({ page }) => {
    console.log('=== STARTING COMPREHENSIVE TEST ===\n');
    
    // Step 1: Navigate to login
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:9000/#/login');
    await expect(page).toHaveURL(/.*#\/login/);
    console.log('✅ Login page loaded');
    
    // Step 2: Login
    console.log('\nStep 2: Performing login...');
    await page.click('button:has-text("Sign in manually")');
    await page.fill('input[type="text"]', 'guillermotabligan');
    await page.fill('input[type="password"]', 'water123');
    await page.click('button[type="submit"]');
    
    // Step 3: Wait for dashboard
    console.log('\nStep 3: Waiting for dashboard...');
    await page.waitForURL(/.*#\/member\/dashboard/, { timeout: 10000 });
    console.log('✅ Successfully navigated to dashboard');
    
    // Step 4: Verify account information is stored
    console.log('\nStep 4: Verifying account information...');
    const accountData = await page.evaluate(() => {
      const accountInfo = localStorage.getItem('accountInformation');
      const token = localStorage.getItem('token');
      const supabaseSession = localStorage.getItem('supabase-custom-session');
      
      let userId = null;
      let accountName = null;
      
      if (accountInfo) {
        try {
          let cleanedAccountInfo = accountInfo;
          if (accountInfo.startsWith('__q_objt|')) {
            cleanedAccountInfo = accountInfo.substring('__q_objt|'.length);
          }
          const parsed = JSON.parse(cleanedAccountInfo);
          userId = parsed.id;
          accountName = parsed.username;
        } catch (e) {
          // Ignore parsing errors
        }
      }
      
      return {
        hasToken: !!token,
        hasAccountInfo: !!accountInfo,
        hasSupabaseSession: !!supabaseSession,
        userId: userId,
        username: accountName
      };
    });
    
    console.log('Account data:', accountData);
    expect(accountData.hasToken).toBe(true);
    expect(accountData.hasAccountInfo).toBe(true);
    expect(accountData.userId).toBeTruthy();
    console.log('✅ Account information verified');
    
    // Step 5: Test Supabase notifications access
    console.log('\nStep 5: Testing Supabase notifications access...');
    const notificationResult = await page.evaluate(async () => {
      if (!window.supabaseService) {
        return { error: 'Supabase service not found' };
      }
      
      const client = window.supabaseService.getClient();
      if (!client) {
        return { error: 'Supabase client not initialized' };
      }
      
      // Get user ID
      const accountInfo = localStorage.getItem('accountInformation');
      let userId = null;
      
      if (accountInfo) {
        try {
          let cleanedAccountInfo = accountInfo;
          if (accountInfo.startsWith('__q_objt|')) {
            cleanedAccountInfo = accountInfo.substring('__q_objt|'.length);
          }
          const parsed = JSON.parse(cleanedAccountInfo);
          userId = parsed.id;
        } catch (e) {
          return { error: 'Failed to parse account info' };
        }
      }
      
      if (!userId) {
        return { error: 'No user ID found' };
      }
      
      // Fetch notifications
      try {
        const { data, error } = await client
          .from('AccountNotifications')
          .select(`
            id,
            hasRead,
            createdAt,
            notificationData:Notifications!notificationsId (
              id,
              content
            )
          `)
          .eq('receiverId', userId)
          .limit(10);
        
        if (error) {
          return { 
            success: false, 
            error: error.message,
            code: error.code 
          };
        }
        
        return { 
          success: true, 
          notificationCount: data ? data.length : 0,
          userId: userId,
          notifications: data ? data.map(n => ({
            id: n.id,
            hasRead: n.hasRead,
            content: n.notificationData?.content || ''
          })) : []
        };
      } catch (e) {
        return { 
          success: false, 
          error: e.message 
        };
      }
    });
    
    console.log('Notification result:', {
      success: notificationResult.success,
      userId: notificationResult.userId,
      notificationCount: notificationResult.notificationCount
    });
    
    expect(notificationResult.success).toBe(true);
    console.log(`✅ Notifications accessible (found ${notificationResult.notificationCount} notifications)`);
    
    // Step 6: Check that there are no session expired errors
    console.log('\nStep 6: Checking for session errors...');
    const hasSessionError = await page.locator('.q-notification__message:has-text("Session Expired")').isVisible().catch(() => false);
    expect(hasSessionError).toBe(false);
    console.log('✅ No session expired errors');
    
    // Final summary
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    console.log(`User: ${accountData.username} (${accountData.userId})`);
    console.log(`Notifications: ${notificationResult.notificationCount} found`);
    console.log('All systems working correctly! ✅');
  });
});