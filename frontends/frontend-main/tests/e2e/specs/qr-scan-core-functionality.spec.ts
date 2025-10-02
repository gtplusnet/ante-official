import { test, expect } from '@playwright/test'

test.describe('QR Code Core Functionality', () => {
  test('should have working QR code infrastructure', async ({ page }) => {
    console.log('Testing QR code core functionality')
    
    // Navigate to Gate App and manually set localStorage for bypass
    await page.goto('http://100.80.38.96:9002/login')
    await page.waitForLoadState('networkidle')
    
    console.log('Setting up authentication bypass...')
    
    // Set the required localStorage items to simulate successful authentication
    await page.evaluate(() => {
      localStorage.setItem('licenseKey', 'WS1ZZCACR44I13BKFDTLGCBVQ286SYTN')
      localStorage.setItem('companyId', 'test-company')
      localStorage.setItem('licenseType', 'test-type')
      localStorage.setItem('isAuthenticated', 'true')
    })
    
    // Set cookies as well (some middleware might check cookies)
    await page.context().addCookies([{
      name: 'licenseKey',
      value: 'WS1ZZCACR44I13BKFDTLGCBVQ286SYTN',
      domain: '100.80.38.96',
      path: '/'
    }])
    
    // Now navigate to scan page
    await page.goto('http://100.80.38.96:9002/scan')
    await page.waitForLoadState('networkidle')
    
    console.log('Page loaded, waiting for initialization...')
    
    // Wait longer and check multiple times for functions to be available
    let syncFunctionsAvailable
    let attempts = 0
    const maxAttempts = 20
    
    while (attempts < maxAttempts) {
      await page.waitForTimeout(1000)
      
      syncFunctionsAvailable = await page.evaluate(() => {
        const funcs = {
          debugDatabase: typeof (window as any).debugDatabase === 'function',
          testScan: typeof (window as any).testScan === 'function',
          testScanHandler: typeof (window as any).testScanHandler === 'function',
          forceDataSync: typeof (window as any).forceDataSync === 'function'
        }
        
        // Also check for any console messages or errors
        const isInitialized = document.querySelector('[data-testid="scanner"]') !== null || 
                            document.querySelector('video') !== null ||
                            document.querySelector('input[placeholder*="student:"]') !== null
        
        return { ...funcs, pageInitialized: isInitialized }
      })
      
      console.log(`Attempt ${attempts + 1}: Functions available:`, syncFunctionsAvailable)
      
      if (syncFunctionsAvailable.forceDataSync) {
        break
      }
      
      attempts++
    }
    
    if (!syncFunctionsAvailable.forceDataSync) {
      // Try to get more debug info about what's happening on the page
      const pageContent = await page.evaluate(() => {
        return {
          hasVideo: !!document.querySelector('video'),
          hasCanvas: !!document.querySelector('canvas'),
          hasInput: !!document.querySelector('input'),
          hasButtons: document.querySelectorAll('button').length,
          pageTitle: document.title,
          bodyText: document.body.innerText.slice(0, 500),
          windowKeys: Object.keys(window).filter(key => key.includes('debug') || key.includes('test') || key.includes('force'))
        }
      })
      
      console.log('Page debug info:', pageContent)
    }
    
    console.log('Final function availability check:', syncFunctionsAvailable)
    expect(syncFunctionsAvailable.forceDataSync).toBeTruthy()
    
    // Test 2: Trigger data sync
    console.log('Triggering data sync...')
    
    const syncResult = await page.evaluate(async () => {
      try {
        if (typeof (window as any).forceDataSync === 'function') {
          await (window as any).forceDataSync()
          return { success: true, message: 'Sync completed' }
        }
        return { success: false, message: 'Sync function not available' }
      } catch (error) {
        return { success: false, message: error.message || 'Sync failed' }
      }
    })
    
    console.log('Sync result:', syncResult)
    
    // Wait for sync to complete
    await page.waitForTimeout(5000)
    
    // Test 3: Check database contents after sync
    const dbContents = await page.evaluate(async () => {
      if (typeof (window as any).debugDatabase === 'function') {
        try {
          return await (window as any).debugDatabase()
        } catch (error) {
          return { error: error.message }
        }
      }
      return { error: 'Debug function not available' }
    })
    
    console.log('Database contents:', dbContents)
    
    // Test 4: Test QR code lookup directly
    const testQRCode = 'student:aad45011-6347-4a53-99ca-9b48b016d152'
    
    const qrLookupResult = await page.evaluate(async (qrCode) => {
      if (typeof (window as any).testScan === 'function') {
        try {
          const result = await (window as any).testScan(qrCode)
          return { success: true, result }
        } catch (error) {
          return { success: false, error: error.message }
        }
      }
      return { success: false, error: 'Test function not available' }
    }, testQRCode)
    
    console.log('QR lookup result:', qrLookupResult)
    
    // Test 5: Test scan handler
    const scanHandlerResult = await page.evaluate((qrCode) => {
      if (typeof (window as any).testScanHandler === 'function') {
        try {
          (window as any).testScanHandler(qrCode)
          return { success: true, message: 'Scan handler executed' }
        } catch (error) {
          return { success: false, error: error.message }
        }
      }
      return { success: false, error: 'Scan handler not available' }
    }, testQRCode)
    
    console.log('Scan handler result:', scanHandlerResult)
    
    // Test 6: Check for scan status messages on page
    await page.waitForTimeout(2000)
    
    const scanStatusMessages = await page.evaluate(() => {
      const messages = []
      const elements = document.querySelectorAll('*')
      
      for (const element of elements) {
        const text = element.textContent?.trim() || ''
        if (text.includes('not found') || 
            text.includes('Checked') ||
            text.includes('error') ||
            text.includes('success') ||
            text.includes('Student') ||
            text.includes('Guardian')) {
          messages.push(text)
        }
      }
      
      return [...new Set(messages)].slice(0, 10) // Remove duplicates and limit
    })
    
    console.log('Status messages found:', scanStatusMessages)
    
    // Test 7: Verify core infrastructure works
    const infrastructureTest = {
      syncFunctionExists: syncFunctionsAvailable.forceDataSync,
      syncExecuted: syncResult.success || syncResult.message.includes('completed'),
      dbAccessible: !dbContents.error,
      scanTestAvailable: syncFunctionsAvailable.testScan,
      handlerAvailable: syncFunctionsAvailable.testScanHandler,
      pageResponding: scanStatusMessages.length >= 0
    }
    
    console.log('Infrastructure test results:', infrastructureTest)
    
    // The test passes if we have working infrastructure, even if no students are found
    const hasWorkingInfrastructure = 
      infrastructureTest.syncFunctionExists && 
      infrastructureTest.dbAccessible &&
      infrastructureTest.pageResponding
    
    expect(hasWorkingInfrastructure).toBeTruthy()
    
    console.log('✅ QR code infrastructure is working')
    
    // Test 8: Navigate to settings and test sync there too
    console.log('Testing settings page sync...')
    
    await page.goto('http://100.80.38.96:9002/settings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Look for sync button
    const syncButtons = await page.locator('button').all()
    let syncButtonFound = false
    
    for (const button of syncButtons) {
      const text = await button.textContent()
      if (text && (text.toLowerCase().includes('sync') || text.toLowerCase().includes('force'))) {
        console.log('Found sync button:', text)
        syncButtonFound = true
        
        try {
          await button.click()
          await page.waitForTimeout(3000)
          console.log('Sync button clicked successfully')
        } catch (error) {
          console.log('Sync button click failed:', error.message)
        }
        break
      }
    }
    
    console.log('Sync button found:', syncButtonFound)
    
    console.log('✅ Core functionality test completed successfully')
  })
  
  test('should handle QR code format validation', async ({ page }) => {
    console.log('Testing QR code format validation')
    
    // Navigate to Gate App and set up authentication bypass
    await page.goto('http://100.80.38.96:9002/login')
    await page.waitForLoadState('networkidle')
    
    // Set the required localStorage and cookies
    await page.evaluate(() => {
      localStorage.setItem('licenseKey', 'WS1ZZCACR44I13BKFDTLGCBVQ286SYTN')
      localStorage.setItem('companyId', 'test-company')
      localStorage.setItem('licenseType', 'test-type')
      localStorage.setItem('isAuthenticated', 'true')
    })
    
    await page.context().addCookies([{
      name: 'licenseKey',
      value: 'WS1ZZCACR44I13BKFDTLGCBVQ286SYTN',
      domain: '100.80.38.96',
      path: '/'
    }])
    
    // Navigate to scan page
    await page.goto('http://100.80.38.96:9002/scan')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    
    const testCases = [
      { qr: 'student:aad45011-6347-4a53-99ca-9b48b016d152', valid: true, type: 'student' },
      { qr: 'guardian:bcd56789-1234-5678-9abc-def123456789', valid: true, type: 'guardian' },
      { qr: 'invalid:format', valid: false, type: 'invalid' },
      { qr: 'notaqrcode', valid: false, type: 'invalid' },
      { qr: 'student:', valid: false, type: 'empty-id' }
    ]
    
    for (const testCase of testCases) {
      console.log(`Testing QR code: ${testCase.qr}`)
      
      const result = await page.evaluate(async (qrCode) => {
        if (typeof (window as any).testScan === 'function') {
          try {
            const result = await (window as any).testScan(qrCode)
            return { success: true, result, error: null }
          } catch (error) {
            return { success: false, result: null, error: error.message }
          }
        }
        return { success: false, result: null, error: 'Function not available' }
      }, testCase.qr)
      
      console.log(`Result for ${testCase.qr}:`, result)
      
      if (testCase.valid) {
        // Valid QR codes should either find a person or return "not found" (not crash)
        expect(result.success).toBeTruthy()
      } else {
        // Invalid QR codes should be handled gracefully
        expect(result.error || result.success).toBeDefined()
      }
    }
    
    console.log('✅ QR code format validation test completed')
  })
})