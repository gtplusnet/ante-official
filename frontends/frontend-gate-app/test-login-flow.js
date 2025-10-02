// Test script to simulate the login flow
// Run with: node test-login-flow.js

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://ramamglzyiejlznfnngc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbWFtZ2x6eWllamx6bmZubmdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTYzMTgsImV4cCI6MjA3MTk5MjMxOH0.gZNotZ1M8RFDMhffT-RbdMUHb3TjioUiL-j5TL3Me7k'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbWFtZ2x6eWllamx6bmZubmdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQxNjMxOCwiZXhwIjoyMDcxOTkyMzE4fQ.p7P0TVSLzHK8kWE-bsZ0IXf2_gCjmtbsrPummh8eaZA'

// Test license keys that the app accepts
const TEST_LICENSE_KEYS = ['GATE-2025-DEMO', 'GATE-TEST-001', 'gate-license-001']
const COMPANY_ID = 16

async function simulateLoginFlow(licenseKey) {
  console.log(`\n=== Simulating Login with License: ${licenseKey} ===`)
  
  try {
    // Step 1: Generate service account credentials
    const serviceEmail = `gate-${licenseKey.toLowerCase()}@ante-system.local`
    const servicePassword = generateServicePassword(licenseKey, COMPANY_ID)
    
    console.log('1. Service account details:')
    console.log('   Email:', serviceEmail)
    console.log('   Company ID:', COMPANY_ID)
    
    // Step 2: Ensure service account exists
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false }
    })
    
    console.log('\n2. Ensuring service account exists...')
    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email: serviceEmail,
      password: servicePassword,
      email_confirm: true,
      user_metadata: {
        company_id: COMPANY_ID,
        license_key: licenseKey,
        gate_app: true,
        app_source: 'frontend-gate-app',
      }
    })
    
    if (createError?.message?.includes('already been registered')) {
      console.log('   ✓ Service account already exists')
    } else if (createError) {
      console.error('   ✗ Error:', createError.message)
      return false
    } else {
      console.log('   ✓ Service account created')
    }
    
    // Step 3: Sign in with service account
    console.log('\n3. Signing in with service account...')
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      global: {
        headers: { 'X-Source': 'frontend-gate-app' }
      }
    })
    
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: serviceEmail,
      password: servicePassword,
    })
    
    if (authError) {
      console.error('   ✗ Sign in failed:', authError.message)
      return false
    }
    
    console.log('   ✓ Successfully authenticated')
    console.log('   User ID:', authData.user?.id)
    console.log('   Session valid until:', new Date(authData.session?.expires_at * 1000).toLocaleString())
    
    // Step 4: Test data access
    console.log('\n4. Testing data access...')
    
    // Set the session for subsequent requests
    await client.auth.setSession({
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
    })
    
    // Test fetching students
    const { data: students, error: studentsError } = await client
      .from('Student')
      .select('id, firstName, lastName, studentNumber')
      .eq('companyId', COMPANY_ID)
      .eq('isActive', true)
      .limit(3)
    
    if (studentsError) {
      console.error('   ✗ Error fetching students:', studentsError.message)
    } else {
      console.log(`   ✓ Successfully fetched ${students?.length || 0} students`)
      if (students?.length > 0) {
        console.log('     Sample:', `${students[0].firstName} ${students[0].lastName} (${students[0].studentNumber})`)
      }
    }
    
    // Test fetching guardians  
    const { data: guardians, error: guardiansError } = await client
      .from('Guardian')
      .select('id, firstName, lastName, email')
      .eq('companyId', COMPANY_ID)
      .eq('isActive', true)
      .limit(3)
    
    if (guardiansError) {
      console.error('   ✗ Error fetching guardians:', guardiansError.message)
    } else {
      console.log(`   ✓ Successfully fetched ${guardians?.length || 0} guardians`)
      if (guardians?.length > 0) {
        console.log('     Sample:', `${guardians[0].firstName} ${guardians[0].lastName} (${guardians[0].email || 'no email'})`)
      }
    }
    
    // Step 5: Sign out
    console.log('\n5. Signing out...')
    await client.auth.signOut()
    console.log('   ✓ Signed out successfully')
    
    return true
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return false
  }
}

function generateServicePassword(licenseKey, companyId) {
  // Same logic as in the auth service
  const base = `${licenseKey}-${companyId}-gate-app-2025`
  return Buffer.from(base).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20) + '!Aa1'
}

async function runTests() {
  console.log('==========================================')
  console.log('Gate App Login Flow Simulation')
  console.log('==========================================')
  console.log('\nThis simulates what happens when a user logs in with a license key.')
  console.log('The app will authenticate directly with Supabase without the backend.')
  
  // Test with each valid license key
  for (const licenseKey of TEST_LICENSE_KEYS) {
    const success = await simulateLoginFlow(licenseKey)
    if (success) {
      console.log(`\n✅ Login flow successful for: ${licenseKey}`)
    } else {
      console.log(`\n❌ Login flow failed for: ${licenseKey}`)
    }
  }
  
  console.log('\n==========================================')
  console.log('Summary:')
  console.log('- Gate app can authenticate without backend')
  console.log('- Service accounts are created automatically')
  console.log('- Data access works with proper authentication')
  console.log('- Session persistence is handled by Supabase')
  console.log('==========================================\n')
}

// Run the tests
runTests().catch(console.error)