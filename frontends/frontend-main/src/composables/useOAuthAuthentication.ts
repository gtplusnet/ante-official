import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { googleSdkLoaded, decodeCredential } from 'vue3-google-login';
import { api } from 'src/boot/axios';

export type OAuthMode = 'login' | 'invite' | 'add-account' | 'link';

export interface OAuthContext {
  mode: OAuthMode;
  inviteToken?: string;
  additionalData?: Record<string, any>;
}

export interface OAuthCallbacks {
  onSuccess: (response: any) => void;
  onError: (error: any) => void;
}

export function useOAuthAuthentication() {
  const $q = useQuasar();
  const googleReady = ref(false);
  const facebookReady = ref(false);
  const isProcessing = ref(false);

  // Initialize Google OAuth
  const initializeGoogleOAuth = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      console.warn('Google Client ID not configured');
      return false;
    }
    
    // Check if already initialized
    googleSdkLoaded(() => {
      googleReady.value = true;
    });
    
    return true;
  };

  // Initialize Facebook OAuth
  const initializeFacebookOAuth = () => {
    const fbAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
    if (!fbAppId || fbAppId === 'YOUR_FACEBOOK_APP_ID_HERE') {
      console.warn('Facebook App ID not configured');
      return false;
    }

    // Check if already initialized
    if ((window as any).FB) {
      facebookReady.value = true;
      return true;
    }

    // Load Facebook SDK
    (window as any).fbAsyncInit = function() {
      (window as any).FB.init({
        appId: fbAppId,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
      
      facebookReady.value = true;
    };

    // Load the SDK asynchronously if not already loaded
    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      }
    }

    return true;
  };

  // Get API endpoint based on context
  const getApiEndpoint = (provider: 'google' | 'facebook', context: OAuthContext): string => {
    const { mode } = context;
    
    switch (mode) {
      case 'login':
      case 'add-account':
        return `/auth/login/${provider}`;
      
      case 'invite':
        return `/auth/invite/accept-${provider}`;
      
      case 'link':
        return `/account/link-${provider}`;
      
      default:
        throw new Error(`Unknown OAuth mode: ${mode}`);
    }
  };

  // Handle Google OAuth response
  const handleGoogleResponse = async (
    credential: string,
    context: OAuthContext,
    callbacks: OAuthCallbacks
  ) => {
    if (isProcessing.value) return;
    isProcessing.value = true;

    try {
      // Decode credential for logging
      const googleUser: any = decodeCredential(credential);
      console.log('Google auth for:', googleUser.email);

      const endpoint = getApiEndpoint('google', context);
      const payload: any = {
        googleIdToken: credential,
      };

      // Add context-specific data
      if (context.mode === 'invite' && context.inviteToken) {
        payload.token = context.inviteToken;
      }
      if (context.additionalData) {
        Object.assign(payload, context.additionalData);
      }

      const response = await api.post(endpoint, payload);
      
      // Small delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 200));
      
      callbacks.onSuccess(response.data);
    } catch (error: any) {
      console.error('Google auth error:', error);
      callbacks.onError(error);
      
      // Show appropriate error message - prefer errorMessage over message
      const errorMessage = error.response?.data?.errorMessage || 
                          error.response?.data?.message || 
                          'Google authentication failed';
      $q.notify({
        type: 'negative',
        message: errorMessage,
        position: 'top',
        timeout: 5000,
      });
    } finally {
      isProcessing.value = false;
    }
  };

  // Handle Facebook OAuth response  
  const handleFacebookResponse = async (
    accessToken: string,
    context: OAuthContext,
    callbacks: OAuthCallbacks
  ) => {
    if (isProcessing.value) return;
    isProcessing.value = true;

    try {
      const endpoint = getApiEndpoint('facebook', context);
      const payload: any = {
        facebookAccessToken: accessToken,
      };

      // Add context-specific data
      if (context.mode === 'invite' && context.inviteToken) {
        payload.token = context.inviteToken;
      }
      if (context.additionalData) {
        Object.assign(payload, context.additionalData);
      }

      const response = await api.post(endpoint, payload);
      
      // Small delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 200));
      
      callbacks.onSuccess(response.data);
    } catch (error: any) {
      console.error('Facebook auth error:', error);
      callbacks.onError(error);
      
      // Show appropriate error message - prefer errorMessage over message
      const errorMessage = error.response?.data?.errorMessage || 
                          error.response?.data?.message || 
                          'Facebook authentication failed';
      $q.notify({
        type: 'negative',
        message: errorMessage,
        position: 'top',
        timeout: 5000,
      });

      // Special handling for 404 (account not found)
      if (error.response?.status === 404 && context.mode === 'login') {
        $q.notify({
          type: 'info',
          message: 'No account found. Please sign up first or contact your administrator for an invitation.',
          position: 'top',
          timeout: 5000,
        });
      }
    } finally {
      isProcessing.value = false;
    }
  };

  // Trigger Google Sign-In popup
  const triggerGooglePopup = (context: OAuthContext, callbacks: OAuthCallbacks) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      $q.notify({
        type: 'negative',
        message: 'Google Sign-In not configured',
        position: 'top',
      });
      callbacks.onError({ message: 'Google Sign-In not configured' });
      return;
    }
    
    googleSdkLoaded((google) => {
      // Track if callback was triggered
      let callbackTriggered = false;
      
      // Create a hidden div for the Google button
      const buttonDiv = document.createElement('div');
      buttonDiv.style.display = 'none';
      buttonDiv.id = `hiddenGoogleButton_${Date.now()}`;
      document.body.appendChild(buttonDiv);
      
      // Set up a timeout to detect if authentication wasn't completed
      const authTimeout = setTimeout(() => {
        if (!callbackTriggered) {
          callbackTriggered = true;
          callbacks.onError({ message: 'Authentication timeout or cancelled' });
        }
      }, 30000); // 30 second timeout
      
      // Initialize and render the button
      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          callbackTriggered = true;
          clearTimeout(authTimeout);
          handleGoogleResponse(response.credential, context, callbacks);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        // Disable FedCM for localhost development due to CORS issues
        // FedCM requires proper domain configuration which localhost doesn't have
        use_fedcm_for_prompt: false,
      });
      
      // Use traditional button click method for localhost
      // This works better with development environments
      google.accounts.id.renderButton(
        buttonDiv,
        {
          type: 'standard',
          size: 'large',
          theme: 'outline',
          text: 'signin_with',
          shape: 'rectangular',
        }
      );
      
      // Click the hidden button programmatically to trigger the popup
      setTimeout(() => {
        const googleButton = buttonDiv.querySelector('[role="button"]');
        if (googleButton && googleButton instanceof HTMLElement) {
          googleButton.click();
        }
      }, 100);
      
      // Clean up button div after a delay
      setTimeout(() => {
        if (document.body.contains(buttonDiv)) {
          document.body.removeChild(buttonDiv);
        }
      }, 2000);
    });
  };

  // Trigger Facebook Sign-In popup
  const triggerFacebookPopup = (context: OAuthContext, callbacks: OAuthCallbacks) => {
    const fbAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
    
    if (!fbAppId || fbAppId === 'YOUR_FACEBOOK_APP_ID_HERE') {
      const error = { message: 'Facebook Sign-In not configured' };
      $q.notify({ type: 'negative', message: error.message, position: 'top' });
      callbacks.onError(error);
      return;
    }
    
    if (typeof (window as any).FB === 'undefined') {
      const error = { message: 'Facebook SDK not loaded. Please try again.' };
      $q.notify({ type: 'warning', message: error.message, position: 'top' });
      callbacks.onError(error);
      return;
    }
    
    const FB = (window as any).FB;
    let callbackTriggered = false;
    
    // Set a timeout to detect if popup was closed without action
    const timeoutId = setTimeout(() => {
      if (!callbackTriggered) {
        callbackTriggered = true;
        const error = { message: 'Authentication timeout or cancelled' };
        callbacks.onError(error);
      }
    }, 30000); // 30 second timeout
    
    FB.login((response: any) => {
      callbackTriggered = true;
      clearTimeout(timeoutId);
      
      if (response.status === 'connected') {
        handleFacebookResponse(response.authResponse.accessToken, context, callbacks);
      } else if (response.status === 'not_authorized') {
        const error = { message: 'Facebook login not authorized.' };
        $q.notify({ type: 'info', message: error.message, position: 'top' });
        callbacks.onError(error);
      } else {
        // User cancelled login or closed popup
        const error = { message: 'Authentication cancelled' };
        callbacks.onError(error);
      }
    }, { scope: 'public_profile,email' });
  };

  return {
    googleReady,
    facebookReady,
    isProcessing,
    initializeGoogleOAuth,
    initializeFacebookOAuth,
    triggerGooglePopup,
    triggerFacebookPopup,
    handleGoogleResponse,
    handleFacebookResponse,
  };
}