<template>
  <q-page class="q-pa-md">
    <div class="text-h4">Debug Supabase Session</div>

    <div class="q-mt-md">
      <q-btn @click="testSession" label="Test Supabase Session" color="primary" />
      <q-btn @click="testProjectQuery" label="Test Project Query" color="secondary" class="q-ml-sm" />
    </div>

    <div class="q-mt-md">
      <pre>{{ debugInfo }}</pre>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
// TODO: Migrate to backend API
// import supabaseService from 'src/services/supabase';

const debugInfo = ref('Click buttons to test...');

const testSession = async () => {
  debugInfo.value = 'Testing session...\n';

  // Check localStorage
  const customSession = localStorage.getItem('supabase-custom-session');
  debugInfo.value += 'Custom session in localStorage: ' + (customSession ? 'YES' : 'NO') + '\n';

  if (customSession) {
    const session = JSON.parse(customSession);
    debugInfo.value += 'Has access_token: ' + !!session.access_token + '\n';
    debugInfo.value += 'Has user: ' + !!session.user + '\n';
    if (session.user) {
      debugInfo.value += 'User ID: ' + session.user.id + '\n';
      debugInfo.value += 'Company ID: ' + session.user.user_metadata?.companyId + '\n';
    }
  }

  // Check supabaseService state
  debugInfo.value += '\nSupabase Service State:\n';
  debugInfo.value += 'isCustomSession: ' + supabaseService.isCustomSession + '\n';
  debugInfo.value += 'Has customAccessToken: ' + !!supabaseService.customAccessToken + '\n';

  // Try to get session
  const { data, error } = await supabaseService.getSession();
  debugInfo.value += '\nGet Session Result:\n';
  debugInfo.value += 'Has session: ' + !!data?.session + '\n';
  debugInfo.value += 'Error: ' + (error || 'none') + '\n';

  if (data?.session) {
    debugInfo.value += 'Session user ID: ' + data.session.user?.id + '\n';
  }
};

const testProjectQuery = async () => {
  debugInfo.value = 'Testing project query...\n';

  try {
    const client = supabaseService.getClient();
    debugInfo.value += 'Got Supabase client\n';

    // Test simple query first
    const { data: projects, error: projectsError } = await client
      .from('Project')
      .select('id, name')
      .limit(5);

    if (projectsError) {
      debugInfo.value += 'Projects query error: ' + projectsError.message + '\n';
      debugInfo.value += 'Error code: ' + projectsError.code + '\n';
      debugInfo.value += 'Error details: ' + projectsError.details + '\n';
    } else {
      debugInfo.value += 'Projects found: ' + (projects?.length || 0) + '\n';
      if (projects && projects.length > 0) {
        debugInfo.value += 'First project: ' + JSON.stringify(projects[0]) + '\n';
      }
    }

    // Test project 123 specifically
    debugInfo.value += '\nTesting project 123...\n';
    const { data: project123, error: error123 } = await client
      .from('Project')
      .select('*')
      .eq('id', 123)
      .single();

    if (error123) {
      debugInfo.value += 'Project 123 error: ' + error123.message + '\n';
      debugInfo.value += 'Error code: ' + error123.code + '\n';
    } else {
      debugInfo.value += 'Project 123 found: ' + !!project123 + '\n';
      if (project123) {
        debugInfo.value += 'Project name: ' + project123.name + '\n';
      }
    }

  } catch (error: any) {
    debugInfo.value += 'Exception: ' + error.message + '\n';
  }
};
</script>