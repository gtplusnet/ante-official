<template>
  <div class="invite-page-container">
    <div class="invite-card-wrapper">
      <q-card class="invite-card" flat bordered>
        <!-- Company Header -->
        <div class="company-header">
          <q-avatar size="48px" color="primary" text-color="white">
            {{ inviteDetails?.company?.companyName?.charAt(0) || 'C' }}
          </q-avatar>
          <div class="company-info">
            <div class="text-h6 text-weight-medium">
              {{ inviteDetails?.company?.companyName || 'Company' }}
            </div>
            <div class="text-caption text-grey-6">Enterprise Resource Planning</div>
          </div>
        </div>

        <q-card-section class="q-pt-none">
          <div v-if="loading" class="loading-state">
            <q-circular-progress
              indeterminate
              size="48px"
              :thickness="0.2"
              color="primary"
              track-color="grey-3"
            />
            <div class="text-body2 text-grey-7 q-mt-md">Verifying your invitation...</div>
          </div>

          <div v-else-if="error" class="error-state">
            <div class="error-icon-wrapper">
              <q-icon name="cancel" size="64px" color="negative" />
            </div>
            <div class="text-h6 text-center q-mt-md">{{ error }}</div>
            <div class="text-body2 text-grey-6 text-center q-mt-sm">
              The invitation link may have expired or already been used.
            </div>
            <q-btn 
              class="q-mt-lg full-width" 
              color="primary" 
              label="Go to Login" 
              @click="goToLogin()"
              unelevated
              size="md"
              no-caps
            />
          </div>

          <div v-else-if="inviteDetails" class="invite-form-content">
            <!-- Welcome Section -->
            <div class="welcome-section">
              <div class="user-greeting">
                <div class="text-subtitle2 text-weight-medium q-mb-xs">
                  Hello, {{ inviteDetails.firstName }} {{ inviteDetails.lastName }}
                </div>
                <div class="text-caption text-grey-7">
                  You've been invited to join as
                  <span class="text-weight-medium text-primary">{{ inviteDetails.role.name }}</span>
                </div>
              </div>
            </div>

            <!-- Unified Login Form for invite acceptance -->
            <div class="auth-section q-mt-md">
              <UnifiedLoginForm
                mode="invite"
                :show-oauth="true"
                :show-manual="true"
                :show-title="false"
                :invite-token="inviteToken"
                :invite-details="inviteDetails"
                :additional-oauth-data="additionalData"
                @login-success="handleLoginSuccess"
              >
                <!-- Additional fields slot for invite-specific data -->
                <template #additional-fields>
                  <div class="additional-fields-section">
                    <!-- Contact Number -->
                    <div class="form-field">
                      <label class="field-label">Contact Number</label>
                      <q-input
                        v-model="form.contactNumber"
                        outlined
                        dense
                        placeholder="9XX XXX XXXX"
                        mask="### ### ####"
                        class="custom-input"
                      >
                        <template v-slot:prepend>
                          <div class="phone-prefix">+63</div>
                        </template>
                      </q-input>
                    </div>

                    <!-- Date of Birth -->
                    <div class="form-field">
                      <label class="field-label">Date of Birth</label>
                      <q-input
                        v-model="form.dateOfBirth"
                        outlined
                        dense
                        placeholder="MM/DD/YYYY"
                        mask="##/##/####"
                        class="custom-input"
                      >
                        <template v-slot:prepend>
                          <q-icon name="calendar_today" size="20px" />
                        </template>
                        <template v-slot:append>
                          <q-icon name="event" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                              <q-date v-model="form.dateOfBirth" mask="MM/DD/YYYY">
                                <div class="row items-center justify-end">
                                  <q-btn v-close-popup label="Close" color="primary" flat />
                                </div>
                              </q-date>
                            </q-popup-proxy>
                          </q-icon>
                        </template>
                      </q-input>
                    </div>
                  </div>
                </template>
              </UnifiedLoginForm>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import UnifiedLoginForm from 'src/components/auth/UnifiedLoginForm.vue';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref('');
const inviteDetails = ref<any>(null);

const form = ref({
  contactNumber: '',
  dateOfBirth: '',
});

// Computed properties
const inviteToken = computed(() => route.params.token as string);

const additionalData = computed(() => ({
  contactNumber: form.value.contactNumber ? `+63${form.value.contactNumber}` : undefined,
  dateOfBirth: form.value.dateOfBirth || undefined,
}));

// Methods
const verifyInviteToken = async () => {
  try {
    const token = route.params.token;
    const response = await api.get(`/auth/invite/verify/${token}`);
    inviteDetails.value = response.data.invite || response.data;
    loading.value = false;
  } catch (err: any) {
    loading.value = false;
    if (err.response?.status === 404) {
      error.value = 'Invalid or expired invitation link';
    } else if (err.response?.status === 400) {
      error.value = err.response.data.message || 'This invitation has expired';
    } else {
      error.value = 'Failed to verify invitation. Please try again later.';
    }
  }
};

const handleLoginSuccess = (response: any) => {
  // Store the auth token
  if (response.token) {
    localStorage.setItem('token', response.token);
    localStorage.setItem('accountInformation', JSON.stringify(response.accountInformation));
  }
  
  $q.notify({
    type: 'positive',
    message: 'Registration completed successfully!',
    timeout: 3000,
  });
  
  // Redirect to dashboard
  setTimeout(() => {
    router.push({ name: 'member_dashboard' });
  }, 1000);
};

const goToLogin = () => {
  router.push({ name: 'front_login' });
};

// Initialize on mount
onMounted(() => {
  verifyInviteToken();
});
</script>

<style scoped>
.invite-page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.invite-card-wrapper {
  width: 100%;
  max-width: 480px;
}

.invite-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.company-header {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.company-info {
  flex: 1;
}

.loading-state,
.error-state {
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.error-icon-wrapper {
  padding: 16px;
  background-color: rgba(255, 0, 0, 0.05);
  border-radius: 50%;
  margin-bottom: 16px;
}

.welcome-section {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 20px;
}

.user-greeting {
  text-align: center;
}

.invite-form-content {
  padding: 20px;
}

.auth-section {
  margin-top: 24px;
}

.additional-fields-section {
  padding: 0 16px;
}

.form-field {
  margin-bottom: 16px;
}

.field-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #424242;
}

.field-label.required::after {
  content: ' *';
  color: #f44336;
}

.custom-input {
  width: 100%;
}

.phone-prefix {
  padding: 0 8px;
  color: #757575;
  font-weight: 500;
  border-right: 1px solid #e0e0e0;
  margin-right: 8px;
}

/* Responsive adjustments */
@media (max-width: 599px) {
  .invite-page-container {
    padding: 0;
    background: white;
  }
  
  .invite-card-wrapper {
    max-width: 100%;
  }
  
  .invite-card {
    border-radius: 0;
    border: none;
    box-shadow: none;
  }
  
  .company-header {
    border-radius: 0;
  }
}
</style>