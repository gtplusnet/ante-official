import { boot } from 'quasar/wrappers';
import { useGlobalMethods } from '../composables/useGlobalMethods';

// This boot file initializes the theme once at app startup
export default boot(() => {
  
  // Call setTheme once during app initialization
  const { setTheme } = useGlobalMethods();
  setTheme();
  
});