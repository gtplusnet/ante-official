import { useAuthStore } from "../stores/auth";
import { useSocketStore } from "../stores/socketStore";
import { api } from 'src/boot/axios';
import { capitalize } from 'vue';
import tableSettings from 'src/references/table.reference';
import { whitelabel } from 'src/boot/axios';
import { setCssVar, useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { ref, getCurrentInstance } from 'vue';

export function useGlobalMethods() {
  // Check if we're in a component context
  const instance = getCurrentInstance();
  
  // Only initialize composables if we're in a proper Vue context
  const $q = instance ? useQuasar() : null;
  const router = instance ? useRouter() : null;
  const authStore = instance ? useAuthStore() : null;
  const socketStore = instance ? useSocketStore() : null;
  
  // Reactive data
  const globalData = ref('This is a global data');
  const pageTitle = ref('');

  // Set theme method
  const setTheme = (): void => {
    // Set theme colors
    if (whitelabel === 'geer') {
      setCssVar('primary', '#195c93');
      setCssVar('accent', '#0c1b2a');
    }

    // Set favicon
    const favicon = document.getElementById('favicon') as HTMLLinkElement;
    const pageTitleElement = document.getElementById('page-title') as HTMLElement;

    switch (whitelabel) {
      case 'geer':
        favicon?.setAttribute('href', '/geer-erp-logo-s.ico');
        pageTitle.value = 'GEER';
        
        // Don't set document.title here - let route-loading.js handle it
        
        // Update the page-title element if it exists
        if (pageTitleElement) {
          pageTitleElement.innerHTML = 'GEER';
        }
        break;

      default:
        favicon?.setAttribute('href', '/ante-logo-s.ico');
        pageTitle.value = 'Ante';
        
        // Don't set document.title here - let route-loading.js handle it
        
        // Update the page-title element if it exists
        if (pageTitleElement) {
          pageTitleElement.innerHTML = 'Ante';
        }
        break;
    }
  };

  // Load table data method
  const loadTableData = async (
    apiURL: string,
    query: Record<string, string | number | boolean>,
    currentPage: number,
    perPage: number,
    params: Record<string, unknown> = {},
    key: string | null = null
  ): Promise<unknown> => {
    try {
      query['perPage'] = perPage;
      query['page'] = currentPage;
      if (key && key in tableSettings) {
        params.settings = tableSettings[key as keyof typeof tableSettings];
      }
      
      const queryParams = new URLSearchParams(Object.entries(query).map(([k, v]) => [k, String(v)])).toString();
      const response = await api.put(`${apiURL}?${queryParams}`, params);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  };

  // Format code method
  const formatCode = (value: string | null | undefined): string => {
    value = value ? value.toUpperCase() : '';
    value = value.replace(/\s+/g, '');
    return value;
  };

  // Number format method
  const numberFormat = (value: number | null | undefined, isCurrency = true): string => {
    if (value && isCurrency) {
      return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'PHP',
      });
    } else if (value) {
      return value.toLocaleString('en-US');
    } else {
      return '';
    }
  };

  // Handle axios error method
  const handleAxiosError = (error: unknown): void => {
    // Type guard to check if error has expected shape
    const isAxiosError = (err: unknown): err is { response?: { data?: { errorMessage?: string; message?: string | string[] } } } => {
      return typeof err === 'object' && err !== null && 'response' in err;
    };

    if (!isAxiosError(error)) return;
    
    if (error.response?.data) {
      if (error.response.data.errorMessage) {
        showErrorDialog(error.response.data.errorMessage);
      } else if (error.response.data.message) {
        if (Array.isArray(error.response.data.message)) {
          showErrorDialog(error.response.data.message[0]);
        } else {
          showErrorDialog(error.response.data.message);
        }
      }
    }
  };

  // Format date for submit method
  const formatDateForSubmit = (date: string | Date): string => {
    const originalDate = new Date(date);
    
    const formattedDate = originalDate.getFullYear() + 
      '-' + 
      String(originalDate.getMonth() + 1).padStart(2, '0') + 
      '-' + 
      String(originalDate.getDate()).padStart(2, '0');

    return formattedDate;
  };

  // Show error dialog method
  const showErrorDialog = (message: string): void => {
    if ($q) {
      $q.dialog({
        title: 'Error',
        message: message,
        persistent: true,
      });
    } else {
      console.error('Error:', message);
    }
  };

  // Capitalize first letter method
  const capitalizeFirstLetter = (string: string): string => {
    return capitalize(string);
  };

  // Currency format method
  const currencyFormat = (value: number): string => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'PHP',
    });
  };

  // Logout method
  const logout = (): void => {
    console.log('GLOBAL logout called - this should NOT be happening!');
    if (authStore && router) {
      authStore.clearLoginData();
      router.push({ name: 'front_login' });
    }
  };

  // Theme is now set globally in boot file - no need to call here

  return {
    // Reactive data
    authStore,
    socketStore,
    globalData,
    pageTitle,
    
    // Methods
    setTheme,
    loadTableData,
    formatCode,
    numberFormat,
    handleAxiosError,
    formatDateForSubmit,
    showErrorDialog,
    capitalizeFirstLetter,
    currencyFormat,
    logout,
  };
}