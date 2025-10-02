import { test, expect } from '@playwright/test';

test('Debug realtime setup issue', async ({ page }) => {
  // Navigate directly to scan page (assuming already logged in)
  await page.goto('http://100.80.38.96:9002/scan');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Inject debugging code to understand the issue
  const debugResult = await page.evaluate(() => {
    console.log('🔍 Starting debug investigation...');
    
    // Check if our setupRealtime logs are present
    const logs: string[] = [];
    const originalLog = console.log;
    
    // Check what's in the actual code
    const scriptTags = Array.from(document.querySelectorAll('script'));
    const hasSetupRealtimeCode = scriptTags.some(script => 
      script.textContent?.includes('setupRealtime') || 
      script.textContent?.includes('Starting realtime setup')
    );
    
    // Check localStorage
    const localStorage_info = {
      companyId: localStorage.getItem('companyId'),
      licenseKey: localStorage.getItem('licenseKey'),
      supabase_session: localStorage.getItem('supabase_session') ? 'exists' : null,
      supabase_company_id: localStorage.getItem('supabase_company_id'),
      supabase_auth_mode: localStorage.getItem('supabase_auth_mode')
    };
    
    // Try to access the attendance service directly
    let attendanceServiceExists = false;
    let supabaseClientExists = false;
    
    try {
      // Check if these are available in window
      attendanceServiceExists = !!(window as any).attendanceSupabaseService;
      supabaseClientExists = !!(window as any).__SUPABASE_CLIENT__;
    } catch (e) {
      console.error('Error checking services:', e);
    }
    
    return {
      hasSetupRealtimeCode,
      localStorage: localStorage_info,
      attendanceServiceExists,
      supabaseClientExists,
      pageTitle: document.title,
      bodyClasses: document.body.className
    };
  });
  
  console.log('Debug Result:', JSON.stringify(debugResult, null, 2));
  
  // Now let's try to manually trigger the realtime setup
  const manualSetup = await page.evaluate(async () => {
    console.log('🔧 Attempting manual realtime setup...');
    
    try {
      // Try to import and use the service directly
      const { getAttendanceSupabaseService } = await (window as any).import?.('/lib/services/attendance-supabase.service.ts');
      if (getAttendanceSupabaseService) {
        const service = getAttendanceSupabaseService();
        await service.init();
        
        const channel = service.subscribeToAttendance((payload: any) => {
          console.log('📺 Realtime update:', payload);
        });
        
        return { success: true, hasChannel: !!channel };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'Could not access service' };
  });
  
  console.log('Manual Setup Result:', manualSetup);
  
  // Check the console output
  await page.waitForTimeout(2000);
});