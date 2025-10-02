import { test, expect } from '@playwright/test'

test.describe('QR Code Sync Debugging', () => {
  test('should debug complete sync flow step by step', async ({ page }) => {
    console.log('=== QR SYNC DEBUG TEST START ===')
    
    // Set up authentication bypass
    await page.goto('http://100.80.38.96:9002/login')
    await page.waitForLoadState('networkidle')
    
    console.log('Setting up authentication bypass...')
    await page.evaluate(() => {
      localStorage.setItem('licenseKey', 'WS1ZZCACR44I13BKFDTLGCBVQ286SYTN')
      localStorage.setItem('companyId', '1') // Set companyId to 1 
      localStorage.setItem('licenseType', 'test-type')
      localStorage.setItem('isAuthenticated', 'true')
    })
    
    await page.context().addCookies([{
      name: 'licenseKey',
      value: 'WS1ZZCACR44I13BKFDTLGCBVQ286SYTN',
      domain: '100.80.38.96',
      path: '/'
    }])
    
    // Navigate to scan page to initialize the system
    await page.goto('http://100.80.38.96:9002/scan')
    await page.waitForLoadState('networkidle')
    
    // Wait for system initialization
    console.log('Waiting for system initialization...')
    let functions = await page.evaluate(() => {
      return {
        forceDataSync: typeof (window as any).forceDataSync === 'function',
        debugDatabase: typeof (window as any).debugDatabase === 'function'
      }
    })
    
    let attempts = 0
    while (!functions.forceDataSync && attempts < 10) {
      await page.waitForTimeout(1000)
      functions = await page.evaluate(() => {
        return {
          forceDataSync: typeof (window as any).forceDataSync === 'function',
          debugDatabase: typeof (window as any).debugDatabase === 'function'
        }
      })
      attempts++
    }
    
    expect(functions.forceDataSync).toBeTruthy()
    console.log('✅ Debug functions are available')
    
    // Step 1: Check initial database state
    console.log('=== STEP 1: Initial Database State ===')
    const initialState = await page.evaluate(async () => {
      const counts = await (window as any).debugDatabase()
      return {
        students: counts.students?.length || 0,
        guardians: counts.guardians?.length || 0,
        localStorage: {
          companyId: localStorage.getItem('companyId'),
          licenseKey: localStorage.getItem('licenseKey')
        }
      }
    })
    
    console.log('Initial database state:', initialState)
    
    // Step 2: Test Supabase connection by triggering sync
    console.log('=== STEP 2: Testing Supabase Sync ===')
    
    // Listen for console logs during sync
    const syncLogs = []
    page.on('console', msg => {
      if (msg.text().includes('SyncSupabaseService') || msg.text().includes('StorageManager')) {
        syncLogs.push(msg.text())
        console.log('SYNC LOG:', msg.text())
      }
    })
    
    // Trigger manual sync
    const syncResult = await page.evaluate(async () => {
      console.log('=== MANUAL SYNC TRIGGER ===')
      try {
        const result = await (window as any).forceDataSync()
        console.log('Manual sync result:', result)
        return { success: true, result }
      } catch (error) {
        console.error('Manual sync error:', error)
        return { success: false, error: error.message }
      }
    })
    
    console.log('Sync result:', syncResult)
    
    // Wait for sync to complete
    await page.waitForTimeout(3000)
    
    // Step 3: Check database state after sync
    console.log('=== STEP 3: Post-Sync Database State ===')
    const postSyncState = await page.evaluate(async () => {
      const counts = await (window as any).debugDatabase()
      return {
        students: counts.students?.length || 0,
        guardians: counts.guardians?.length || 0,
        sampleStudent: counts.students?.[0] || null,
        sampleGuardian: counts.guardians?.[0] || null
      }
    })
    
    console.log('Post-sync database state:', postSyncState)
    console.log('Captured sync logs:', syncLogs)
    
    // Step 4: Test QR code lookup if we have data
    if (postSyncState.students > 0) {
      console.log('=== STEP 4: QR Code Lookup Test ===')
      const sampleStudent = postSyncState.sampleStudent
      if (sampleStudent?.qrCode) {
        const lookupResult = await page.evaluate(async (qrCode) => {
          console.log('Testing QR lookup for:', qrCode)
          const result = await (window as any).testScan(qrCode)
          return result
        }, sampleStudent.qrCode)
        
        console.log('QR lookup result:', lookupResult)
        expect(lookupResult).not.toBeNull()
      }
    }
    
    // Step 5: Navigate to settings and test sync button
    console.log('=== STEP 5: Settings Page Sync Test ===')
    await page.goto('http://100.80.38.96:9002/settings')
    await page.waitForLoadState('networkidle')
    
    // Look for sync buttons
    const syncButtons = await page.locator('button').all()
    let foundSyncButton = false
    
    for (const button of syncButtons) {
      const text = await button.textContent()
      if (text && (text.toLowerCase().includes('sync') || text.toLowerCase().includes('force'))) {
        console.log('Found sync button:', text)
        foundSyncButton = true
        
        // Click the sync button
        await button.click()
        await page.waitForTimeout(2000)
        console.log('Clicked sync button')
        break
      }
    }
    
    console.log('Sync button found on settings:', foundSyncButton)
    
    console.log('=== QR SYNC DEBUG TEST COMPLETE ===')
    
    // Final assessment
    const finalReport = {
      authenticationWorking: true,
      functionsAvailable: functions.forceDataSync && functions.debugDatabase,
      initialData: initialState,
      syncTriggered: syncResult.success,
      finalData: postSyncState,
      dataIncreased: postSyncState.students > initialState.students || postSyncState.guardians > initialState.guardians,
      syncLogs: syncLogs.length,
      settingsSyncButton: foundSyncButton
    }
    
    console.log('=== FINAL SYNC DEBUG REPORT ===')
    console.log(JSON.stringify(finalReport, null, 2))
    
    // Test passes if sync infrastructure is working (even if no data)
    expect(finalReport.functionsAvailable).toBeTruthy()
    expect(finalReport.syncTriggered).toBeTruthy()
  })
})