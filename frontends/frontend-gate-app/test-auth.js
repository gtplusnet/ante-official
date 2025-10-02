// Test script to verify Supabase authentication for Gate App
// Run with: node test-auth.js

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://ramamglzyiejlznfnngc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbWFtZ2x6eWllamx6bmZubmdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTYzMTgsImV4cCI6MjA3MTk5MjMxOH0.gZNotZ1M8RFDMhffT-RbdMUHb3TjioUiL-j5TL3Me7k'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbWFtZ2x6eWllamx6bmZubmdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQxNjMxOCwiZXhwIjoyMDcxOTkyMzE4fQ.p7P0TVSLzHK8kWE-bsZ0IXf2_gCjmtbsrPummh8eaZA'

async function testDirectAccess() {
  console.log('\n=== Testing Direct Access with Service Key ===')
  
  try {
    // Create client with service role key (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          'X-Source': 'frontend-gate-app',
        },
      },
    })

    // Test fetching students
    console.log('\n1. Fetching students for company ID 16...')
    const { data: students, error: studentsError } = await supabase
      .from('Student')
      .select('id, firstName, lastName, studentNumber')
      .eq('companyId', 16)
      .eq('isActive', true)
      .limit(5)

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
    } else {
      console.log(`Found ${students?.length || 0} students`)
      if (students && students.length > 0) {
        console.log('Sample student:', students[0])
      }
    }

    // Test fetching guardians
    console.log('\n2. Fetching guardians for company ID 16...')
    const { data: guardians, error: guardiansError } = await supabase
      .from('Guardian')
      .select('id, firstName, lastName, email')
      .eq('companyId', 16)
      .eq('isActive', true)
      .limit(5)

    if (guardiansError) {
      console.error('Error fetching guardians:', guardiansError)
    } else {
      console.log(`Found ${guardians?.length || 0} guardians`)
      if (guardians && guardians.length > 0) {
        console.log('Sample guardian:', guardians[0])
      }
    }

    console.log('\n✅ Direct access with service key is working!')
    
  } catch (error) {
    console.error('Error in direct access test:', error)
  }
}

async function testAnonymousAuth() {
  console.log('\n=== Testing Anonymous Authentication ===')
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          'X-Source': 'frontend-gate-app',
        },
      },
    })

    // Try anonymous sign in
    console.log('\n1. Attempting anonymous sign in...')
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously({
      options: {
        data: {
          company_id: 16,
          app_source: 'frontend-gate-app',
        }
      }
    })

    if (authError) {
      console.error('Anonymous auth error:', authError)
      return
    }

    if (authData?.session) {
      console.log('Anonymous session created successfully!')
      console.log('Session user ID:', authData.session.user.id)
      
      // Try to fetch data with anonymous session
      console.log('\n2. Testing data access with anonymous session...')
      const { data: students, error: studentsError } = await supabase
        .from('Student')
        .select('id, firstName, lastName')
        .eq('companyId', 16)
        .limit(3)

      if (studentsError) {
        console.error('Error fetching with anonymous session:', studentsError)
      } else {
        console.log(`Successfully fetched ${students?.length || 0} students with anonymous session`)
      }
    }

  } catch (error) {
    console.error('Error in anonymous auth test:', error)
  }
}

async function testServiceAccountCreation() {
  console.log('\n=== Testing Service Account Creation ===')
  
  try {
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        persistSession: false,
      },
    })

    const licenseKey = 'GATE-TEST-001'
    const companyId = 16
    const serviceEmail = `gate-${licenseKey.toLowerCase()}@ante-system.local`
    const servicePassword = 'TestPassword123!Aa1'

    console.log('\n1. Creating service account for gate app...')
    console.log('Email:', serviceEmail)
    
    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email: serviceEmail,
      password: servicePassword,
      email_confirm: true,
      user_metadata: {
        company_id: companyId,
        license_key: licenseKey,
        gate_app: true,
        app_source: 'frontend-gate-app',
      }
    })

    if (createError) {
      if (createError.message?.includes('already been registered')) {
        console.log('Service account already exists, attempting sign in...')
      } else {
        console.error('Error creating service account:', createError)
        return
      }
    } else {
      console.log('Service account created successfully!')
      console.log('User ID:', createData?.user?.id)
    }

    // Try to sign in with the service account
    console.log('\n2. Signing in with service account...')
    const regularClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          'X-Source': 'frontend-gate-app',
        },
      },
    })

    const { data: signInData, error: signInError } = await regularClient.auth.signInWithPassword({
      email: serviceEmail,
      password: servicePassword,
    })

    if (signInError) {
      console.error('Sign in error:', signInError)
    } else if (signInData?.session) {
      console.log('Successfully signed in with service account!')
      console.log('Access token (first 20 chars):', signInData.session.access_token.substring(0, 20) + '...')
      
      // Test data access with authenticated session
      console.log('\n3. Testing data access with authenticated session...')
      const { data: students, error: studentsError } = await regularClient
        .from('Student')
        .select('id, firstName, lastName, studentNumber')
        .eq('companyId', companyId)
        .limit(3)

      if (studentsError) {
        console.error('Error fetching data:', studentsError)
      } else {
        console.log(`Successfully fetched ${students?.length || 0} students with authenticated session`)
        if (students && students.length > 0) {
          console.log('First student:', students[0])
        }
      }
    }

  } catch (error) {
    console.error('Error in service account test:', error)
  }
}

async function runAllTests() {
  console.log('========================================')
  console.log('Gate App Supabase Authentication Tests')
  console.log('========================================')
  
  // Test 1: Direct access with service key
  await testDirectAccess()
  
  // Test 2: Anonymous authentication
  await testAnonymousAuth()
  
  // Test 3: Service account creation and authentication
  await testServiceAccountCreation()
  
  console.log('\n========================================')
  console.log('All tests completed!')
  console.log('========================================\n')
}

// Run the tests
runAllTests().catch(console.error)