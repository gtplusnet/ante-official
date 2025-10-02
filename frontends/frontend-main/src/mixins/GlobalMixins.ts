/**
 * @deprecated This mixin is deprecated. Use the useGlobalMethods composable instead.
 * 
 * Migration guide:
 * Instead of: mixins: [GlobalMixins]
 * Use: const { logout, currencyFormat, ... } = useGlobalMethods()
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useAuthStore } from '../stores/auth';
import { useSocketStore } from '../stores/socketStore';
import { useGlobalMethods } from '../composables/useGlobalMethods';

// Use a factory function to create the mixin with proper method binding
const createGlobalMixin = () => {
  const methods = useGlobalMethods();
  
  return {
    data() {
      return {
        globalData: 'This is a global data',
      };
    },
    computed: {
      authStore() {
        return useAuthStore();
      },
      socketStore() {
        return useSocketStore();
      }
    },
    created() {
      // Theme is now set globally in boot file - no need to call here
    },
    methods: {
      // Directly expose methods from composable
      setTheme: methods.setTheme,
      loadTableData: methods.loadTableData,
      formatCode: methods.formatCode,
      numberFormat: methods.numberFormat,
      handleAxiosError: methods.handleAxiosError,
      formatDateForSubmit: methods.formatDateForSubmit,
      showErrorDialog: methods.showErrorDialog,
      capitalizeFirstLetter: methods.capitalizeFirstLetter,
      currencyFormat: methods.currencyFormat,
      logout: methods.logout,
    },
  };
};

export default createGlobalMixin();