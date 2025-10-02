import { boot } from 'quasar/wrappers';
import { useAuthStore } from '../stores/auth';

export default boot(async ({ store }) => {
  const authStore = useAuthStore(store);
  
  // Only initialize Supabase session if user is already authenticated
  if (authStore.isAuthenticated) {
    try {
      await authStore.initializeSupabaseSession();
      console.log('Supabase session initialized on app boot');
    } catch (error) {
      console.error('Failed to initialize Supabase session on boot:', error);
    }
  }
});