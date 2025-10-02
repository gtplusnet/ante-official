<template>
  <q-dialog v-model="show" persistent>
    <q-card style="width: 550px; max-width: 90vw">
      <q-bar class="bg-primary text-white">
        <q-icon name="email" />
        <div>{{ emailConfig ? 'Edit' : 'Add' }} Email Configuration</div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>
      
      <q-card-section class="q-pa-sm">
        <q-form @submit.prevent="saveConfiguration">
          <div class="row q-col-gutter-xs">
            <!-- Email Provider & Protocol Row -->
            <div class="col-6">
              <q-select
                v-model="form.emailProvider"
                :options="providerOptions"
                label="Email Provider"
                emit-value
                map-options
                @update:model-value="onProviderChange"
                outlined
                dense
                required
              />
            </div>
            
            <div class="col-6">
              <q-select
                v-model="form.emailProtocol"
                :options="[
                  { label: 'IMAP', value: 'IMAP' },
                  { label: 'POP3', value: 'POP3' }
                ]"
                label="Incoming Protocol"
                emit-value
                map-options
                outlined
                dense
              />
            </div>
            
            <!-- Email Credentials Row -->
            <div class="col-6">
              <q-input
                v-model="form.emailAddress"
                type="email"
                label="Email Address"
                outlined
                dense
                required
              />
            </div>
            
            <div class="col-6">
              <q-input
                v-model="form.emailPassword"
                :type="showPassword ? 'text' : 'password'"
                label="Email Password"
                outlined
                dense
                :required="!emailConfig"
              >
                <template v-slot:append>
                  <q-icon
                    :name="showPassword ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    size="16px"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </q-input>
            </div>
            
            <!-- Server Settings -->
            <div class="col-12 q-mt-sm">
              <div class="text-subtitle2 text-grey-8">Incoming Server ({{ form.emailProtocol }})</div>
            </div>
            
            <div class="col-5">
              <q-input
                v-model="form.incomingServer"
                label="Server"
                outlined
                dense
                required
              />
            </div>
            
            <div class="col-3">
              <q-input
                v-model.number="form.incomingPort"
                type="number"
                label="Port"
                outlined
                dense
                required
              />
            </div>
            
            <div class="col-4">
              <q-checkbox
                v-model="form.incomingSSL"
                label="SSL/TLS"
                dense
              />
            </div>
            
            <div class="col-12">
              <div class="text-subtitle2 text-grey-8">Outgoing Server (SMTP)</div>
            </div>
            
            <div class="col-5">
              <q-input
                v-model="form.outgoingServer"
                label="Server"
                outlined
                dense
                required
              />
            </div>
            
            <div class="col-3">
              <q-input
                v-model.number="form.outgoingPort"
                type="number"
                label="Port"
                outlined
                dense
                required
              />
            </div>
            
            <div class="col-4">
              <q-checkbox
                v-model="form.outgoingSSL"
                label="SSL/TLS"
                dense
              />
            </div>
            
            <!-- Active Status -->
            <div class="col-12 q-mt-xs">
              <q-checkbox
                v-model="form.isActive"
                label="Active configuration"
                dense
              />
            </div>
            
            <!-- Status Banner -->
            <div class="col-12 q-mt-sm" v-if="!connectionTestPassed">
              <q-banner 
                class="bg-orange-1 text-orange-9 q-pa-sm"
                rounded
                dense
              >
                <template v-slot:avatar>
                  <q-icon name="info" color="orange" size="20px" />
                </template>
                <span class="text-caption">
                  {{ !connectionTested ? 'Test connection before saving' : 'Connection test failed - fix settings and retry' }}
                </span>
              </q-banner>
            </div>
            
            <div class="col-12" v-else-if="connectionTestPassed">
              <q-banner 
                class="bg-green-1 text-green-9 q-pa-sm"
                rounded
                dense
              >
                <template v-slot:avatar>
                  <q-icon name="check_circle" color="green" size="20px" />
                </template>
                <span class="text-caption">Connection test successful!</span>
              </q-banner>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="q-mt-md q-gutter-sm text-right">
            <q-btn
              label="Test"
              size="sm"
              color="secondary"
              outline
              no-caps
              @click="testConnection"
              :loading="isTesting"
            />
            <q-btn
              label="Cancel"
              size="sm"
              outline
              no-caps
              v-close-popup
            />
            <q-btn
              :label="connectionTestPassed ? 'Save' : 'Test First'"
              size="sm"
              :color="connectionTestPassed ? 'primary' : 'grey'"
              unelevated
              no-caps
              type="submit"
              :loading="isSaving"
              :disable="!connectionTestPassed"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { APIRequests } from '../../utility/api.handler';

interface EmailConfiguration {
  id?: string;
  emailProvider: string;
  emailProtocol: string;
  incomingServer: string;
  incomingPort: number;
  incomingSSL: boolean;
  outgoingServer: string;
  outgoingPort: number;
  outgoingSSL: boolean;
  emailAddress: string;
  emailPassword?: string;
  isActive: boolean;
}

export default defineComponent({
  name: 'EmailConfigDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    emailConfig: {
      type: Object as () => EmailConfiguration | undefined,
      default: undefined,
    },
  },
  emits: ['update:modelValue', 'saved'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const showPassword = ref(false);
    const isSaving = ref(false);
    const isTesting = ref(false);
    const connectionTested = ref(false);
    const connectionTestPassed = ref(false);
    
    const show = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value),
    });
    
    const form = ref<EmailConfiguration>({
      emailProvider: 'CUSTOM',
      emailProtocol: 'IMAP',
      incomingServer: '',
      incomingPort: 993,
      incomingSSL: true,
      outgoingServer: '',
      outgoingPort: 587,
      outgoingSSL: true,
      emailAddress: '',
      emailPassword: '',
      isActive: true,
    });
    
    const providerOptions = [
      { label: 'Gmail', value: 'GMAIL' },
      { label: 'Outlook/Office 365', value: 'OUTLOOK' },
      { label: 'Yahoo Mail', value: 'YAHOO' },
      { label: 'Custom', value: 'CUSTOM' },
    ];
    
    const onProviderChange = async (provider: string) => {
      // Reset connection test flags when provider changes
      connectionTested.value = false;
      connectionTestPassed.value = false;
      
      if (provider !== 'CUSTOM') {
        try {
          const presets = await APIRequests.getEmailProviderPresets($q, provider);
          if (presets) {
            form.value = {
              ...form.value,
              ...presets,
            };
          }
        } catch (error) {
          console.error('Failed to get provider presets:', error);
        }
      }
    };
    
    const testConnection = async () => {
      if (!form.value.emailAddress || !form.value.emailPassword) {
        $q.notify({
          color: 'warning',
          message: 'Please enter email address and password to test connection',
          icon: 'warning',
        });
        return;
      }
      
      try {
        isTesting.value = true;
        const response = await APIRequests.testEmailConnection($q, {
          emailProvider: form.value.emailProvider,
          emailProtocol: form.value.emailProtocol,
          incomingServer: form.value.incomingServer,
          incomingPort: form.value.incomingPort,
          incomingSSL: form.value.incomingSSL,
          outgoingServer: form.value.outgoingServer,
          outgoingPort: form.value.outgoingPort,
          outgoingSSL: form.value.outgoingSSL,
          emailAddress: form.value.emailAddress,
          emailPassword: form.value.emailPassword,
        });
        
        connectionTested.value = true;
        
        if (response.success) {
          connectionTestPassed.value = true;
          $q.notify({
            color: 'positive',
            message: response.message,
            icon: 'check',
          });
        } else if (response.details) {
          connectionTestPassed.value = false;
          // Show detailed results
          let message = 'Connection test results:\n';
          if (response.details.incoming.success) {
            message += `✓ Incoming (${form.value.emailProtocol}): Success\n`;
          } else {
            message += `✗ Incoming (${form.value.emailProtocol}): ${response.details.incoming.message}\n`;
          }
          if (response.details.outgoing.success) {
            message += '✓ Outgoing (SMTP): Success';
          } else {
            message += `✗ Outgoing (SMTP): ${response.details.outgoing.message}`;
          }
          
          $q.notify({
            color: response.success ? 'positive' : 'warning',
            message: message,
            icon: response.success ? 'check' : 'warning',
            timeout: 5000,
            multiLine: true,
          });
        } else {
          connectionTestPassed.value = false;
          $q.notify({
            color: 'negative',
            message: response.message,
            icon: 'error',
          });
        }
      } catch (error) {
        $q.notify({
          color: 'negative',
          message: 'Failed to test connection',
          icon: 'error',
        });
      } finally {
        isTesting.value = false;
      }
    };
    
    const saveConfiguration = async () => {
      // Check if connection test was performed and passed
      if (!connectionTested.value || !connectionTestPassed.value) {
        $q.notify({
          color: 'warning',
          message: 'Please test the connection successfully before saving',
          icon: 'warning',
        });
        return;
      }
      
      try {
        isSaving.value = true;
        
        if (props.emailConfig) {
          // Update existing configuration
          await APIRequests.updateEmailConfig($q, form.value);
          $q.notify({
            color: 'positive',
            message: 'Email configuration updated successfully',
            icon: 'check',
          });
        } else {
          // Create new configuration
          await APIRequests.createEmailConfig($q, form.value);
          $q.notify({
            color: 'positive',
            message: 'Email configuration created successfully',
            icon: 'check',
          });
        }
        
        emit('saved');
        show.value = false;
      } catch (error) {
        $q.notify({
          color: 'negative',
          message: 'Failed to save email configuration',
          icon: 'error',
        });
      } finally {
        isSaving.value = false;
      }
    };
    
    // Initialize form when dialog opens
    watch(
      () => props.modelValue,
      (newVal) => {
        if (newVal) {
          // Reset connection test flags when dialog opens
          connectionTested.value = false;
          connectionTestPassed.value = false;
          
          if (props.emailConfig) {
            form.value = {
              ...props.emailConfig,
              emailPassword: '', // Don't pre-fill password
            } as EmailConfiguration;
          } else {
            // Reset to defaults
            form.value = {
              emailProvider: 'CUSTOM',
              emailProtocol: 'IMAP',
              incomingServer: '',
              incomingPort: 993,
              incomingSSL: true,
              outgoingServer: '',
              outgoingPort: 587,
              outgoingSSL: true,
              emailAddress: '',
              emailPassword: '',
              isActive: true,
            };
          }
        }
      }
    );
    
    // Reset connection test flags when form changes
    watch(
      form,
      () => {
        connectionTested.value = false;
        connectionTestPassed.value = false;
      },
      { deep: true }
    );
    
    return {
      show,
      form,
      showPassword,
      isSaving,
      isTesting,
      connectionTested,
      connectionTestPassed,
      providerOptions,
      onProviderChange,
      testConnection,
      saveConfiguration,
    };
  },
});
</script>