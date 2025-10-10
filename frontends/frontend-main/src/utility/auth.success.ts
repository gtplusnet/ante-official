import { LoginResponse } from "@shared/response";
import { useAuthStore } from "../stores/auth";
import { useMultiAccountStore } from "../stores/multiAccount";
import { Router } from 'vue-router';
import { api } from 'src/boot/axios';
import { initializeGlobalStores } from '../boot/global-stores';

export const AuthSuccess = async (router: Router, response: LoginResponse): Promise<void> => {
  const authStore = useAuthStore();
  const multiAccountStore = useMultiAccountStore();

  console.log('🔐 AuthSuccess - Processing login response:', {
    hasToken: !!response.token,
    accountId: response.accountInformation?.id,
    companyId: response.accountInformation?.company?.id
  });

  // Store in auth store for immediate use
  authStore.storeToken(response.token);
  authStore.storeAccountInformation(response.accountInformation);

  // Store server name if provided
  if (response.serverName) {
    authStore.storeServerName(response.serverName);
  }

  // Add to multi-account store
  multiAccountStore.addAccount(
    response.token,
    response.accountInformation,
    false
  );

  // Dynamically update axios headers
  api.defaults.headers.common['token'] = response.token;

  // Initialize global stores (Project and Assignee) after successful login
  // Shows loading splash screen during initialization
  console.log('🔐 AuthSuccess - Loading application data...');
  try {
    await initializeGlobalStores();
    console.log('🔐 AuthSuccess - Application data loaded successfully');
  } catch (error) {
    console.error('🔐 AuthSuccess - Failed to load application data:', error);
    // Don't block login - stores have error states
  }

  // Check if account is inactive
  if (response.accountInformation.isDeleted === true) {
    await router.push({ name: 'front_inactive_account' });
  } else {
    await router.push({ name: 'member_dashboard' });
  }
}
