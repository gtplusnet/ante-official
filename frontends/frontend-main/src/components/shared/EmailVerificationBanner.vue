<template>
  <q-banner
    v-if="!isEmailVerified"
    class="email-verification-banner bg-warning text-dark"
    inline-actions
    rounded
  >
    <template v-slot:avatar>
      <q-icon name="warning" color="dark" />
    </template>

    <div class="text-weight-medium">
      Your email address is not verified. Please check your inbox for the verification email.
    </div>

    <template v-slot:action>
      <q-btn
        flat
        label="Resend Email"
        color="dark"
        :loading="isResending"
        :disable="isResending || resendDisabled"
        @click="resendVerificationEmail"
      />
      <q-btn
        flat
        dense
        round
        icon="close"
        color="dark"
        @click="dismissBanner"
      />
    </template>
  </q-banner>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, getCurrentInstance, watch, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../../stores/auth';
import bus from '../../bus';

const $q = useQuasar();
const authStore = useAuthStore();
const instance = getCurrentInstance();
const $api = instance?.appContext.config.globalProperties.$api;

const isResending = ref(false);
const resendDisabled = ref(false);
const dismissed = ref(false);

const isEmailVerified = computed(() => {
  const verified = dismissed.value || authStore.accountInformation?.isEmailVerified !== false;
  return verified;
});

const resendVerificationEmail = async () => {
  isResending.value = true;

  if (!$api) {
    console.error('API not available');
    return;
  }

  try {
    await $api.post('/auth/resend-verification');

    $q.notify({
      color: 'positive',
      message: 'Verification email sent successfully',
      icon: 'check_circle',
      position: 'top',
    });

    // Disable resend button for 5 minutes
    resendDisabled.value = true;
    setTimeout(() => {
      resendDisabled.value = false;
    }, 5 * 60 * 1000);

  } catch (error: any) {
    console.error('Error resending verification email:', error);

    let errorMessage = 'Failed to send verification email';

    // Check for specific error message in the response
    if (error?.response?.data?.errorMessage) {
      errorMessage = error.response.data.errorMessage;
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    $q.notify({
      color: 'negative',
      message: errorMessage,
      icon: 'error',
      position: 'top',
    });
  } finally {
    isResending.value = false;
  }
};

const dismissBanner = () => {
  dismissed.value = true;
};

// Reset dismissed state when component remounts
onMounted(async () => {
  dismissed.value = false;

  // Always refresh account information on mount to get latest status
  if (authStore.isAuthenticated) {
    try {
      await authStore.refreshAccountInformation();
    } catch (error) {
      console.error('EmailVerificationBanner: Error refreshing account information:', error);
    }
  }

  // Listen for email verified event
  bus.on('email-verified', async () => {
    // Force re-evaluation of computed property
    dismissed.value = false;
    // Also refresh account info when event is received
    if (authStore.isAuthenticated) {
      try {
        await authStore.refreshAccountInformation();
      } catch (error) {
        console.error('EmailVerificationBanner: Error refreshing after event:', error);
      }
    }
  });
});

// Clean up event listener on unmount
onUnmounted(() => {
  bus.off('email-verified');
});

// Watch for changes in email verification status
watch(() => authStore.accountInformation?.isEmailVerified, (newValue) => {
  if (newValue === true) {
    // Reset dismissed state when email gets verified
    dismissed.value = false;
  }
});
</script>

<style scoped>
.email-verification-banner {
  margin: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
</style>
