<template>
  <q-page class="flex flex-center">
    <q-card class="verification-card q-pa-lg">
      <q-card-section class="text-center">
        <q-icon 
          v-if="verificationStatus === 'loading'"
          name="hourglass_empty" 
          size="80px" 
          color="primary"
          class="rotating"
        />
        <q-icon 
          v-else-if="verificationStatus === 'success'"
          name="check_circle" 
          size="80px" 
          color="positive"
        />
        <q-icon 
          v-else
          name="error" 
          size="80px" 
          color="negative"
        />
        
        <h4 class="q-mt-md q-mb-sm">
          {{ statusTitle }}
        </h4>
        
        <p class="text-body1 q-mb-lg">
          {{ statusMessage }}
        </p>
        
        <div v-if="verificationStatus !== 'loading'">
          <q-btn
            color="primary"
            label="Go to Dashboard"
            @click="redirectToDashboard"
            :loading="isRedirecting"
          />
        </div>
        
        <div v-if="verificationStatus === 'success'" class="text-caption text-grey q-mt-md">
          Redirecting to dashboard in {{ countdown }} seconds...
        </div>
        
        <div v-if="verificationStatus === 'error'" class="text-caption text-negative q-mt-md">
          Please check the browser console for detailed error information.
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../../../stores/auth';
import bus from '../../../bus';

const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const authStore = useAuthStore();
const instance = getCurrentInstance();
const $api = instance?.appContext.config.globalProperties.$api;

const verificationStatus = ref<'loading' | 'success' | 'error'>('loading');
const statusTitle = ref('Verifying Email...');
const statusMessage = ref('Please wait while we verify your email address.');
const isRedirecting = ref(false);
const countdown = ref(15); // Increased from 5 to 15 seconds for debugging
let countdownInterval: ReturnType<typeof setInterval> | null = null;

const verifyEmail = async () => {
  const token = route.params.token as string;
  
  if (!token) {
    verificationStatus.value = 'error';
    statusTitle.value = 'Invalid Link';
    statusMessage.value = 'The verification link is invalid. Please check your email for the correct link.';
    return;
  }
  
  if (!$api) {
    console.error('API not available');
    verificationStatus.value = 'error';
    statusTitle.value = 'Error';
    statusMessage.value = 'Unable to verify email. Please try again later.';
    return;
  }
  
  try {
    console.log('Verifying email with token:', token);
    console.log('API URL:', `/auth/verify-email/${token}`);
    
    const response = await $api.get(`/auth/verify-email/${token}`);
    console.log('Verification response:', response);
    
    verificationStatus.value = 'success';
    statusTitle.value = 'Email Verified!';
    statusMessage.value = 'Your email has been successfully verified. You can now enjoy all features of GEER-ANTE ERP.';
    
    // Update the auth store with the new account information
    if (response.data?.accountInformation) {
      authStore.storeAccountInformation(response.data.accountInformation);
    } else {
    }
    
    // Also refresh account information to ensure we have the latest data
    if (authStore.isAuthenticated) {
      try {
        await authStore.refreshAccountInformation();
        
        // Emit event to notify other components
        bus.emit('email-verified');
        
        // Add a small delay to ensure state updates propagate
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Double-check the email verification status
      } catch (refreshError) {
        console.error('Error refreshing account after verification:', refreshError);
      }
    } else {
      console.log('User is not authenticated, skipping refresh');
    }
    
    // Start countdown only after everything is done
    startCountdown();
    
    $q.notify({
      color: 'positive',
      message: 'Email verified successfully!',
      icon: 'check_circle',
      position: 'top',
    });
    
  } catch (error: any) {
    console.error('Email verification error:', error);
    console.error('Error response:', error?.response);
    console.error('Error status:', error?.response?.status);
    console.error('Error data:', error?.response?.data);
    
    verificationStatus.value = 'error';
    statusTitle.value = 'Verification Failed';
    
    // Don't auto-redirect on error
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    
    if (error?.response?.status === 400) {
      statusMessage.value = error.response.data?.message || 'The verification link has expired or is invalid.';
    } else if (error?.response?.status === 404) {
      statusMessage.value = 'The verification link is invalid or has already been used.';
    } else {
      statusMessage.value = `An error occurred while verifying your email. Status: ${error?.response?.status || 'Unknown'}. Please try again later.`;
    }
    
    $q.notify({
      color: 'negative',
      message: `Email verification failed: ${error?.response?.status || 'Unknown error'}`,
      caption: error?.response?.data?.message || error?.message || '',
      icon: 'error',
      position: 'top',
      timeout: 10000, // Show for 10 seconds
    });
  }
};

const startCountdown = () => {
  countdownInterval = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      redirectToDashboard();
    }
  }, 1000);
};

const redirectToDashboard = () => {
  isRedirecting.value = true;
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  
  // Check if user is logged in
  if (authStore.isAuthenticated) {
    router.push('/member/dashboard');
  } else {
    router.push('/login');
  }
};

onMounted(() => {
  verifyEmail();
});

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});
</script>

<style scoped>
.verification-card {
  min-width: 400px;
  max-width: 500px;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.rotating {
  animation: rotate 2s linear infinite;
}
</style>