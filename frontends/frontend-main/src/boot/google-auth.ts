import { boot } from 'quasar/wrappers';
import vue3GoogleLogin from 'vue3-google-login';

export default boot(({ app }) => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  if (!googleClientId || googleClientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
    console.warn('Google Client ID not configured. Google OAuth will not be available.');
    return;
  }

  app.use(vue3GoogleLogin, {
    clientId: googleClientId,
  });
});