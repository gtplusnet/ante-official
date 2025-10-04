<template>
  <div class="auth-methods-container">
    <div class="md3-form-content">
      <div class="md3-title-medium">Login Methods</div>
      <div class="text-body2 text-grey q-mb-lg">
        Manage how you sign in to your account. You must have at least one login method active.
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex flex-center q-py-xl">
        <q-spinner-dots color="primary" size="40px" />
      </div>

      <!-- Auth Methods List -->
      <div v-else class="auth-methods-list">
        <!-- Email/Password Method -->
        <q-card flat bordered class="md3-card q-mb-md">
          <q-item>
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white">
                <q-icon name="mail" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label>Email & Password</q-item-label>
              <q-item-label caption>
                {{ userEmail }}
                <span v-if="authMethods.hasPassword"> • Password is set</span>
                <span v-else> • No password set</span>
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-btn
                v-if="!authMethods.hasPassword"
                class="md3-button"
                flat
                color="primary"
                label="Connect"
                @click="showSetPasswordDialog = true"
              />
              <q-btn
                v-else
                flat
                class="md3-button"
                color="negative"
                label="Disconnect"
                @click="disconnectPassword"
                :disable="authMethods.connectedMethods <= 1"
              />
            </q-item-section>
          </q-item>
        </q-card>

        <!-- Google Method -->
        <q-card flat bordered class="md3-card q-mb-md">
          <q-item>
            <q-item-section avatar>
              <q-avatar>
                <img src="https://www.google.com/favicon.ico" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label>Google</q-item-label>
              <q-item-label caption>
                {{ authMethods.hasGoogle ? authMethods.googleEmail : 'Not connected' }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-btn
                v-if="!authMethods.hasGoogle"
                flat
                class="md3-button"
                color="primary"
                label="Connect"
                @click="linkGoogleAccount"

              />
              <q-btn
                v-else
                flat
                class="md3-button"
                color="negative"
                label="Disconnect"
                @click="unlinkGoogleAccount"

                :disable="authMethods.connectedMethods <= 1"
              />
            </q-item-section>
          </q-item>
        </q-card>

        <!-- Facebook Method -->
        <q-card flat bordered class="md3-card q-mb-md">
          <q-item>
            <q-item-section avatar>
              <q-avatar color="blue-8" text-color="white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="white">
                  <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z"/>
                </svg>
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label>Facebook</q-item-label>
              <q-item-label caption>
                {{ authMethods.hasFacebook ? authMethods.facebookEmail : 'Not connected' }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-btn
                v-if="!authMethods.hasFacebook"
                flat
                class="md3-button"
                color="primary"
                label="Connect"
                @click="linkFacebookAccount"
                
              />
              <q-btn
                v-else
                flat
                class="md3-button"
                color="negative"
                label="Disconnect"
                @click="unlinkFacebookAccount"
                
                :disable="authMethods.connectedMethods <= 1"
              />
            </q-item-section>
          </q-item>
        </q-card>

        <!-- Primary Method Info -->
        <q-card flat class="bg-grey-2 q-pa-md q-mt-lg">
          <div class="text-body2">
            <q-icon name="info" color="grey-7" class="q-mr-sm" />
            Primary login method: <strong>{{ getPrimaryMethodLabel() }}</strong>
          </div>
          <div class="text-caption text-grey-7 q-mt-sm">
            You have {{ authMethods.connectedMethods }} login method{{ authMethods.connectedMethods !== 1 ? 's' : '' }} connected.
            You must keep at least one method active.
          </div>
        </q-card>
      </div>
    </div>

    <!-- Set Password Dialog -->
    <q-dialog v-model="showSetPasswordDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Set Password</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="handleSetPassword">
            <!-- Password -->
            <q-input
              v-model="passwordForm.newPassword"
              type="password"
              label="Password"
              outlined
              dense
              class="q-mb-md"
              :rules="[
                val => !!val || 'Password is required'
              ]"
            />

            <!-- Confirm Password -->
            <q-input
              v-model="passwordForm.confirmPassword"
              type="password"
              label="Confirm Password"
              outlined
              dense
              class="q-mb-md"
              :rules="[
                val => !!val || 'Please confirm your password',
                val => val === passwordForm.newPassword || 'Passwords do not match'
              ]"
            />

            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn
                type="submit"
                color="primary"
                label="Set Password"
                :loading="passwordLoading"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { useAuthStore } from 'src/stores/auth';
import { useOAuthAuthentication, OAuthContext, OAuthCallbacks } from 'src/composables/useOAuthAuthentication';

interface AuthMethods {
  hasPassword: boolean;
  hasGoogle: boolean;
  hasFacebook: boolean;
  googleEmail?: string;
  facebookEmail?: string;
  primaryMethod: 'LOCAL' | 'GOOGLE' | 'FACEBOOK';
  connectedMethods: number;
}

const $q = useQuasar();
const authStore = useAuthStore();

// Use the shared OAuth authentication composable
const {
  initializeGoogleOAuth,
  initializeFacebookOAuth,
  triggerGooglePopup,
  triggerFacebookPopup,
} = useOAuthAuthentication();

const loading = ref(true);

const passwordLoading = ref(false);
const showSetPasswordDialog = ref(false);

const authMethods = ref<AuthMethods>({
  hasPassword: false,
  hasGoogle: false,
  hasFacebook: false,
  primaryMethod: 'LOCAL',
  connectedMethods: 0,
});

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// Computed properties
const userEmail = computed(() => {
  return authStore.accountInformation?.email || 'No email set';
});

// Load auth methods on mount
onMounted(() => {
  loadAuthMethods();
  // Initialize OAuth SDKs
  initializeGoogleOAuth();
  initializeFacebookOAuth();
});

async function loadAuthMethods() {
  try {
    loading.value = true;
    const response = await api.get('/account/auth-methods');
    authMethods.value = response.data;
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to load authentication methods',
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
}

function getPrimaryMethodLabel() {
  switch (authMethods.value.primaryMethod) {
    case 'GOOGLE':
      return 'Google';
    case 'FACEBOOK':
      return 'Facebook';
    case 'LOCAL':
    default:
      return 'Email & Password';
  }
}

// Google OAuth functions
function linkGoogleAccount() {
  
  const context: OAuthContext = {
    mode: 'link',
  };
  
  const callbacks: OAuthCallbacks = {
    onSuccess: (response: any) => {
      authMethods.value = response;
      $q.notify({
        type: 'positive',
        message: 'Google account linked successfully',
        position: 'top',
      });
    },
    onError: () => {
      // Error is already handled by the composable
    },
  };
  
  triggerGooglePopup(context, callbacks);
}

async function unlinkGoogleAccount() {
  $q.dialog({
    title: 'Disconnect Google',
    message: 'Are you sure you want to disconnect your Google account?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const response = await api.delete('/account/unlink-google');
      authMethods.value = response.data;
      $q.notify({
        type: 'positive',
        message: 'Google account disconnected',
        position: 'top',
      });
    } catch (error: any) {
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'Failed to disconnect Google account',
        position: 'top',
      });
    } finally {
    }
  });
}

// Facebook OAuth functions
function linkFacebookAccount() {
  
  const context: OAuthContext = {
    mode: 'link',
  };
  
  const callbacks: OAuthCallbacks = {
    onSuccess: (response: any) => {
      authMethods.value = response;
      $q.notify({
        type: 'positive',
        message: 'Facebook account linked successfully',
        position: 'top',
      });
    },
    onError: () => {
      // Error is already handled by the composable
    },
  };
  
  triggerFacebookPopup(context, callbacks);
}

async function unlinkFacebookAccount() {
  $q.dialog({
    title: 'Disconnect Facebook',
    message: 'Are you sure you want to disconnect your Facebook account?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const response = await api.delete('/account/unlink-facebook');
      authMethods.value = response.data;
      $q.notify({
        type: 'positive',
        message: 'Facebook account disconnected',
        position: 'top',
      });
    } catch (error: any) {
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'Failed to disconnect Facebook account',
        position: 'top',
      });
    } finally {
    }
  });
}

// Password management
async function handleSetPassword() {
  try {
    passwordLoading.value = true;
    const payload = {
      password: passwordForm.value.newPassword,
    };
    
    const response = await api.post('/account/set-password', payload);
    authMethods.value = response.data;
    
    showSetPasswordDialog.value = false;
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
    
    $q.notify({
      type: 'positive',
      message: 'Password set successfully',
      position: 'top',
    });
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to set password',
      position: 'top',
    });
  } finally {
    passwordLoading.value = false;
  }
}

async function disconnectPassword() {
  $q.dialog({
    title: 'Disconnect Password',
    message: 'Are you sure you want to remove password authentication? You will need to use Google or Facebook to sign in.',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const response = await api.delete('/account/disconnect-password');
      authMethods.value = response.data;
      $q.notify({
        type: 'positive',
        message: 'Password authentication removed',
        position: 'top',
      });
    } catch (error: any) {
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'Failed to disconnect password',
        position: 'top',
      });
    }
  });
}
</script>

<style scoped>
.auth-methods-container {
  max-width: 600px;
  margin: 0 auto;
}

.md3-form-content {
  padding: 32px;

  @media (max-width: 599px) {
    padding: 10px 16px;
  }
}

.md3-title-medium {
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
  letter-spacing: 0.15px;

  @media (max-width: 599px) {
    margin-bottom: 10px;
  }
}

.md3-card {
  border-radius: 12px;

  @media (max-width: 599px) {
    background-color: var(--q-extra-lighter);
    margin-bottom: 8px;
  }
}

.q-card {
  @media (max-width: 599px) {
    box-shadow: none !important;
  }
}

.q-card--bordered {
  border: 1px solid rgba(0, 0, 0, 0.12);

  @media (max-width: 599px) {
    border: none !important;
  }
}

.md3-button {
  border-radius: 50px;
  padding: 0 24px;
  background-color: #2F40C41F;
}

@media (max-width: 599px) {
  .q-item {
    padding: 12px 16px;
  }
}

.auth-methods-list {
  /* Add any specific styling for the auth methods list */
}
</style>