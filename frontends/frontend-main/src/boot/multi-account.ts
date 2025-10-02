import { boot } from 'quasar/wrappers';
import { useMultiAccountStore } from '../stores/multiAccount';

// This boot file ensures that multi-account data is loaded and synced
// with the auth store before any route guards run
export default boot(({ store }) => {
  const multiAccountStore = useMultiAccountStore(store);
  
  // Load multi-account data from local storage
  multiAccountStore.loadFromLocalStorage();
});