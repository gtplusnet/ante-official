import { LoginResponse } from "@shared/response";
import { useAuthStore } from "../stores/auth";
import { useMultiAccountStore } from "../stores/multiAccount";
import { Router } from 'vue-router';
import { api } from 'src/boot/axios';
import supabaseService from 'src/services/supabase';
import { initializeGlobalStores } from '../boot/global-stores';

export const AuthSuccess = async (router: Router, response: LoginResponse): Promise<void> => {
  const authStore = useAuthStore();
  const multiAccountStore = useMultiAccountStore();
  
  console.log('🔐 AuthSuccess - Processing login response:', {
    hasToken: !!response.token,
    hasSupabaseToken: !!response.supabaseToken,
    hasSupabaseRefreshToken: !!response.supabaseRefreshToken,
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
  
  // Initialize Supabase session if tokens are provided
  if (response.supabaseToken && response.supabaseRefreshToken) {
    console.log('🔐 AuthSuccess - Supabase tokens found, initializing session...');
    await authStore.storeSupabaseTokens(response.supabaseToken, response.supabaseRefreshToken);
    console.log('🔐 AuthSuccess - Supabase session initialization completed');
    
    // Verify session was established successfully
    try {
      const { data } = await supabaseService.getSession();
      if (data?.session) {
        console.log('🔐 AuthSuccess - Supabase session verified successfully:', {
          userId: data.session.user?.id,
          hasAccessToken: !!data.session.access_token
        });
      } else {
        console.warn('🔐 AuthSuccess - Warning: Session not established properly');
      }
    } catch (error) {
      console.error('🔐 AuthSuccess - Error verifying session:', error);
    }
  } else {
    console.log('🔐 AuthSuccess - No Supabase tokens found, using fallback initialization');
    // Mark as initialized even without tokens (for backward compatibility)
    await authStore.initializeSupabaseSession();
  }
  
  // Add to multi-account store with Supabase tokens
  multiAccountStore.addAccount(
    response.token,
    response.accountInformation,
    false,
    response.supabaseToken,
    response.supabaseRefreshToken
  );

  // Dynamically update axios headers
  api.defaults.headers.common['token'] = response.token;

  // Wait for session to fully establish before redirecting
  console.log('🔐 AuthSuccess - Waiting for session to fully establish...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Additional verification before redirect
  if (response.supabaseToken) {
    try {
      const { data } = await supabaseService.getSession();
      if (!data?.session) {
        console.warn('🔐 AuthSuccess - Warning: Proceeding to redirect without confirmed session');
      } else {
        console.log('🔐 AuthSuccess - Final session verification passed');
      }
    } catch (error) {
      console.error('🔐 AuthSuccess - Final session check failed:', error);
    }
  }

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
