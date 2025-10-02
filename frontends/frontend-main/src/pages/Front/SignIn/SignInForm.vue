<template>
  <div class="signin-form-wrapper">
    <!-- Auth Check Transition Overlay -->
    <div v-if="isCheckingAuth" class="auth-transition-overlay">
      <q-spinner-orbit size="60px" color="primary" />
      <div class="transition-message">{{ authCheckMessage }}</div>
      <div class="transition-submessage">Please wait...</div>
    </div>

    <UnifiedLoginForm
      v-if="!isCheckingAuth"
      mode="signin"
      :show-oauth="true"
      :show-manual="true"
      :show-server-selector="true"
      :show-title="$q.screen.lt.sm"
      @login-success="handleLoginSuccess"
    />
    
    <!-- Additional buttons (Dashboard/Create Account) -->
    <!-- <q-btn v-if="multiAccountStore.accountCount > 0" no-caps @click="goBackToDashboard()" class="full-width q-mt-sm text-label-large" rounded flat unelevated label="Back to Dashboard" />
    <q-btn v-else no-caps @click="goToSignUpPage()" class="full-width q-mt-sm text-label-large" rounded flat unelevated label="Create Account" /> -->
  </div>
</template>

<style lang="scss" scoped src="./SignIn.scss"></style>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../../../stores/auth';
import { useMultiAccountStore } from '../../../stores/multiAccount';
import { AuthSuccess } from '../../../utility/auth.success';
import UnifiedLoginForm from 'src/components/auth/UnifiedLoginForm.vue';

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();
const multiAccountStore = useMultiAccountStore();
const isCheckingAuth = ref(true);
const authCheckMessage = ref('Initializing...');

onMounted(() => {
  // Start auth check immediately
  authCheckMessage.value = 'Checking authentication...';
  
  // Load multi-account data on component mount
  multiAccountStore.loadFromLocalStorage();
  
  // Check if user is already logged in
  if (authStore.isAuthenticated) {
    // User is already logged in, redirect to dashboard
    setTimeout(() => {
      authCheckMessage.value = 'You are already logged in!';
    }, 300);
    
    setTimeout(() => {
      authCheckMessage.value = 'Redirecting to dashboard...';
    }, 800);
    
    setTimeout(() => {
      router.replace({ name: 'member_dashboard' });
    }, 1500);
  } else {
    // User is not logged in, show login form with smooth transition
    // Add a minimum display time to prevent flickering
    setTimeout(() => {
      isCheckingAuth.value = false;
    }, 300);
  }
});

const handleLoginSuccess = async (response: any) => {
  const { accountInformation } = response;

  // Check if this account is already logged in
  const existingAccount = multiAccountStore.allAccounts.find(
    (acc) => acc.accountInformation.id === accountInformation.id
  );

  if (existingAccount) {
    $q.notify({
      type: 'info',
      message: 'You are already logged in with this account. Switching to it...',
      position: 'top',
    });
  }

  await AuthSuccess(router, response);
};

// Unused but kept for future use
// const goToSignUpPage = () => {
//   router.push('/signup');
// };

// const goBackToDashboard = () => {
//   router.push({ name: 'member_dashboard' });
// };
</script>

<style scoped>
.signin-form-wrapper {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  position: relative;
}

/* Auth Check Transition Overlay - matches login transition style */
.auth-transition-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-in;
}

.transition-message {
  margin-top: 24px;
  font-size: 18px;
  font-weight: 500;
  color: #424242;
  animation: fadeInUp 0.4s ease-out;
}

.transition-submessage {
  margin-top: 8px;
  font-size: 14px;
  color: #757575;
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 599px) {
  .signin-form-wrapper {
    padding: 16px 16px 24px 16px;
    background-color: #fff;
    border-radius: 16px;
  }
  
  .transition-message {
    font-size: 16px;
  }
  
  .transition-submessage {
    font-size: 12px;
  }
}
</style>