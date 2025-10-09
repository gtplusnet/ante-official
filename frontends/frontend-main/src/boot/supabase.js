import { boot } from 'quasar/wrappers';
import supabaseService from 'src/services/supabase';

export default boot(async ({ app }) => {
  // Initialize the Supabase service
  await supabaseService.initialize();

  // Make it globally available for debugging and components
  window.supabaseService = supabaseService;

  // Also make it available via Vue global properties
  app.config.globalProperties.$supabase = supabaseService;

  // Check if we have a stored session and restore it
  const storedSession = localStorage.getItem('supabase-custom-session');
  if (storedSession) {
    try {
      const session = JSON.parse(storedSession);
      if (session.access_token && session.refresh_token) {
        await supabaseService.setSession(session.access_token, session.refresh_token);
      }
    } catch (error) {
      console.error('🔐 Boot: Failed to restore Supabase session:', error);
    }
  }
});