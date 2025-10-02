import { boot } from 'quasar/wrappers';
import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from "../stores/auth";
import { useConnectionStore } from "../stores/connectionStore";

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
const api = axios.create({ baseURL: process.env.API_URL });
const environment = process.env.ENVIRONMENT || 'development';
const whitelabel = process.env.WHITELABEL || 'ante';

export default boot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api
  
  // Setup auth token from store - must be done inside boot function
  const authStore = useAuthStore();
  const connectionStore = useConnectionStore();
  
  // Load additional connections from file if available
  connectionStore.loadAdditionalConnections().then(() => {
    // Load connection preference and update base URL if not in production
    if (environment !== 'production') {
      connectionStore.loadFromStorage();
      api.defaults.baseURL = connectionStore.apiUrl;
    }
  });
  
  if (authStore.token) {
    api.defaults.headers.common['token'] = `${authStore.token}`;
  }
  
  // Add X-Source header for RLS policies
  api.defaults.headers.common['X-Source'] = 'frontend-main';
  
  // Note: ngrok-skip-browser-warning header removed as we're using Cloudflare proxy
  // If using ngrok for local development, uncomment the line below:
  // api.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
  
  app.config.globalProperties.$axios = axios;
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api;
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
});

export { api, environment, whitelabel };
