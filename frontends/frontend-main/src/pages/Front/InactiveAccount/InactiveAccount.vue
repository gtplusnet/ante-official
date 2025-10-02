<template>
  <div class="inactive-account-container">
    <div class="inactive-account-card">
      <q-icon name="warning" size="64px" color="warning" class="q-mb-md" />
      <h4 class="text-h4 q-mb-sm">Account Inactive</h4>
      <p class="text-body1 text-grey-7 q-mb-lg">
        Your account is not active. Please contact the administrator.
      </p>
      <q-btn 
        @click="logout" 
        label="Logout" 
        color="primary" 
        no-caps 
        unelevated 
        class="full-width"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../../stores/auth';
import { useMultiAccountStore } from '../../../stores/multiAccount';

const router = useRouter();
const authStore = useAuthStore();
const multiAccountStore = useMultiAccountStore();

const logout = async () => {
  await authStore.clearLoginData();
  multiAccountStore.removeAccount(authStore.accountInformation?.id || '');
  router.push({ name: 'front_login' });
};
</script>

<style scoped>
.inactive-account-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
  padding: 40px 20px;
}

.inactive-account-card {
  background: white;
  padding: 48px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
  width: 100%;
}
</style>