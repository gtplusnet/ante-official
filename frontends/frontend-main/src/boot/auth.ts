import { boot } from 'quasar/wrappers';
import { useAuthStore } from '../stores/auth';

export default boot(async ({ store }) => {
  const authStore = useAuthStore(store);

  // TODO: Migrate to backend API - Supabase session initialization removed
  // Authentication is now handled by backend JWT tokens
  // No additional initialization needed on boot
});