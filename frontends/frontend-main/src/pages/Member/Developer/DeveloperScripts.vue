<template>
  <!-- Developer Scripts -->
  <div class="page-head">
    <div class="title text-title-large">Developer Scripts</div>
  </div>
  <div class="page-content q-mt-md developer-scripts">
    <table>
      <thead class="text-title-small">
        <tr>
          <th>Script Name</th>
          <th>Script Description</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody class="text-body-small">
        <tr v-for="script in scriptList" :key="script.name" class="text-center">
          <td>{{ script.name }}</td>
          <td>{{ script.description }}</td>
          <td>
            <q-btn @click="runScript(script)" color="red" outline label="Run Script" class="text-label-medium "/>
          </td>
        </tr>
      </tbody>
    </table>

  </div>
  <q-dialog v-model="otpDialog" persistent>
    <q-card style="min-width: 350px;">
      <q-card-section>
        <div class="text-title-medium">Enter OTP</div>
        <div class="q-mt-md">
          <q-input
            v-model="otp"
            label="OTP"
            outlined
            dense
            autofocus
            type="text"
            maxlength="6"
            :disable="loadingOTP"
            class="text-body-medium"
          />
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="negative" @click="otpDialog = false" class="text-label-medium"/>
        <q-btn flat label="Verify" color="primary" :loading="loadingOTP" @click="verifyOTP" class="text-title-medium"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped src="./DeveloperScripts.scss"></style>

<script>
import { api } from 'src/boot/axios';
import { APIRequests } from "../../../utility/api.handler";
export default {
  name: 'SettingsDeveloperScripts',
  props: {
    variant: {
      type: String,
      default: 'create',
      validator: (value) => ['create', 'edit'].includes(value),
    },
  },
  computed: {},
  data() {
    // Base script list
    const baseScripts = [
      { name: 'Set All Defaults', description: 'This will initialize all default variables needed on the system.', scriptCall: 'initialize-defaults' },
      { name: 'System Reset', description: 'This will reset all data on the system', scriptCall: 'reset-all' },
      { name: 'Reset Project', description: 'This will reset all data related to Project', scriptCall: 'reset-project' },
      { name: 'Reset Warehouse', description: 'This will reset all data related to Warehouse', scriptCall: 'reset-warehouse' },
      { name: 'Update Account Search Keywords', description: 'Update all existing accounts to have proper search keywords.', scriptCall: 'update-account-search-keywords' },
    ];

    // Sentry debug scripts - only in staging and production
    const sentryScripts = ['staging', 'production'].includes(process.env.ENVIRONMENT) ? [
      { name: 'Test Sentry Error', description: 'Trigger a test error to verify Sentry error reporting.', scriptCall: 'debug-sentry', method: 'get', sentryTest: true },
      { name: 'Test Sentry Performance', description: 'Trigger a performance trace to verify Sentry performance monitoring.', scriptCall: 'debug-sentry-performance', method: 'get', sentryTest: true },
      { name: 'Sentry Info', description: 'Display Sentry configuration information.', scriptCall: 'debug-sentry-info', method: 'get', sentryTest: true, skipOTP: true },
    ] : [];

    return {
      scriptList: [...baseScripts, ...sentryScripts],
      otpRequested: false,
      otpVerified: false,
      otp: '',
      otpDialog: false,
      loadingOTP: false,
      pendingScript: null,
    };
  },
  methods: {
    async runScript(script) {
      // Skip OTP for certain scripts (like Sentry info)
      if (!script.skipOTP && !this.otpVerified) {
        this.pendingScript = script;
        this.$q.dialog({
          title: 'OTP Required',
          message: 'You must verify an OTP before running developer scripts.',
          ok: 'Request OTP',
          cancel: 'Cancel',
        }).onOk(() => {
          this.requestOTP();
        });
        return;
      }
      
      // Different confirmation message for Sentry tests
      const confirmTitle = script.sentryTest ? 'Sentry Test' : 'Warning';
      const confirmMessage = script.sentryTest ? 
        'This will test Sentry integration. Check the Sentry dashboard after running.' : 
        'Are you sure you want to run this script?';
      
      this.$q.dialog({
        title: confirmTitle,
        message: confirmMessage,
        cancel: 'Cancel',
        ok: script.name,
      }).onOk(() => {
        this.executeScript(script);
      });
    },
    async executeScript(script) {
      this.$q.loading.show();
      setTimeout(async () => {
        try {
          // Use appropriate HTTP method
          const method = script.method || 'post';
          const res = method === 'get' ? 
            await api.get(`/developer-scripts/${script.scriptCall}`) :
            await api.post(`/developer-scripts/${script.scriptCall}`, { script });
          
          if (res.status === 200) {
            // Enhanced dialog for Sentry tests
            if (script.sentryTest) {
              const data = res.data;
              let message = 'Sentry test completed successfully!';
              
              if (data.message) {
                message = data.message;
              }
              
              // For Sentry info, show additional details
              if (script.scriptCall === 'debug-sentry-info') {
                message += `\n\nEnvironment: ${data.environment}\nSentry Enabled: ${data.sentryEnabled}`;
                if (data.endpoints) {
                  message += '\n\nAvailable endpoints:';
                  Object.entries(data.endpoints).forEach(([key, value]) => {
                    message += `\n- ${key}: ${value}`;
                  });
                }
              }
              
              this.$q.dialog({
                title: 'Sentry Test Result',
                message,
                ok: 'OK',
                style: 'white-space: pre-line;'
              });
              
              // Trigger frontend Sentry test for error scripts
              if (script.scriptCall === 'debug-sentry') {
                this.triggerFrontendSentryError();
              } else if (script.scriptCall === 'debug-sentry-performance') {
                this.triggerFrontendSentryPerformance();
              }
            } else {
              this.$q.dialog({
                title: 'Success',
                message: 'Script executed successfully',
                ok: 'OK',
              });
            }
            
            // Reset OTP state after running a script (but not for skipOTP scripts)
            if (!script.skipOTP) {
              this.otpVerified = false;
              this.otp = '';
              this.otpRequested = false;
              this.pendingScript = null;
            }
          }
          this.$q.loading.hide();
        } catch (error) {
          this.handleAxiosError(error);
          this.$q.loading.hide();
        }
      }, 1000);
    },
    async requestOTP() {
      this.loadingOTP = true;
      try {
        await APIRequests.requestGenericOTP(this.$q, 'DEVELOPER_SCRIPT');
        this.otpRequested = true;
        this.otpDialog = true;
        this.$q.notify({
          color: 'positive',
          message: 'OTP has been sent to our Telegram channel',
          icon: 'check_circle',
        });
      } catch (error) {
        this.$q.notify({
          color: 'negative',
          message: 'Failed to request OTP',
          icon: 'error',
        });
      } finally {
        this.loadingOTP = false;
      }
    },
    async verifyOTP() {
      this.loadingOTP = true;
      try {
        await APIRequests.verifyGenericOTP(this.$q, 'DEVELOPER_SCRIPT', this.otp);
        this.otpVerified = true;
        this.otpDialog = false;
        this.$q.notify({
          color: 'positive',
          message: 'OTP verified! You can now run developer scripts.',
          icon: 'check_circle',
        });
        // If there is a pending script, run it now
        if (this.pendingScript) {
          this.runScript(this.pendingScript);
          this.pendingScript = null;
        }
      } catch (error) {
        this.$q.notify({
          color: 'negative',
          message: 'Invalid or expired OTP',
          icon: 'error',
        });
      } finally {
        this.loadingOTP = false;
      }
    },
    
    // Frontend Sentry testing methods - only available in staging/production
    triggerFrontendSentryError() {
      const isSentryEnabled = ['staging', 'production'].includes(process.env.ENVIRONMENT);
      
      if (!isSentryEnabled) {
        console.log('[SENTRY] Frontend error test skipped - Sentry not enabled in development');
        return;
      }
      
      setTimeout(() => {
        try {
          // Import Sentry dynamically to avoid issues in development
          import('@sentry/vue').then(Sentry => {
            // Trigger a frontend error
            const error = new Error('Frontend Sentry test error - This is intentional!');
            error.name = 'SentryTestError';
            
            // Add extra context
            Sentry.setContext('test_context', {
              test_type: 'frontend_error',
              triggered_by: 'developer_scripts',
              timestamp: new Date().toISOString(),
              user_agent: navigator.userAgent,
            });
            
            // Manually capture the error
            Sentry.captureException(error);
            console.log('[SENTRY] Frontend test error triggered');
          }).catch(err => {
            console.log('[SENTRY] Could not load Sentry module:', err);
          });
        } catch (err) {
          console.log('[SENTRY] Frontend error test failed:', err);
        }
      }, 1000);
    },
    
    triggerFrontendSentryPerformance() {
      const isSentryEnabled = ['staging', 'production'].includes(process.env.ENVIRONMENT);
      
      if (!isSentryEnabled) {
        console.log('[SENTRY] Frontend performance test skipped - Sentry not enabled in development');
        return;
      }
      
      setTimeout(() => {
        try {
          // Import Sentry dynamically
          import('@sentry/vue').then(Sentry => {
            // Start a performance trace
            Sentry.startSpan(
              {
                op: 'test',
                name: 'Frontend Sentry Performance Test',
              },
              async () => {
                // Simulate some work
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Create a child span
                return await Sentry.startSpan(
                  {
                    op: 'component_render',
                    name: 'Mock Component Render',
                  },
                  async () => {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    console.log('[SENTRY] Frontend performance test completed');
                  }
                );
              }
            );
          }).catch(err => {
            console.log('[SENTRY] Could not load Sentry module:', err);
          });
        } catch (err) {
          console.log('[SENTRY] Frontend performance test failed:', err);
        }
      }, 1000);
    },
  },
};
</script>
