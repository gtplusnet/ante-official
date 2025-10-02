<template>
  <div class="oauth-buttons-container">
    <!-- Google Sign-in Button -->
    <q-btn
      v-if="googleEnabled"
      @click="handleGoogleClick"
      :disable="disabled || loading || !googleReady || isAuthenticating"
      :loading="loading && activeProvider === 'google'"
      :class="buttonClasses"
      :size="buttonSize"
      unelevated
      no-caps
      :rounded="buttonStyle === 'full'"
    >
      <template v-if="!loading || activeProvider !== 'google'">
        <img 
          v-if="buttonStyle !== 'icon'"
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
          :style="iconStyle"
          alt="Google"
        />
        <q-icon 
          v-else
          name="img:https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          :size="iconSize"
        />
        <span v-if="buttonStyle !== 'icon'" :class="labelClass">
          {{ getButtonLabel('google') }}
        </span>
      </template>
    </q-btn>
    
    <!-- Facebook Sign-in Button -->
    <q-btn
      v-if="facebookEnabled"
      @click="handleFacebookClick"
      :disable="disabled || loading || !facebookReady || isAuthenticating"
      :loading="loading && activeProvider === 'facebook'"
      :class="buttonClasses"
      :size="buttonSize"
      unelevated
      no-caps
      :rounded="buttonStyle === 'full'"
    >
      <template v-if="!loading || activeProvider !== 'facebook'">
        <q-icon 
          :name="buttonStyle !== 'icon' ? 'fab fa-facebook' : 'fab fa-facebook-f'"
          :size="iconSize"
          :style="{ marginRight: buttonStyle !== 'icon' ? '12px' : '0', color: '#1877F2' }"
        />
        <span v-if="buttonStyle !== 'icon'" :class="labelClass">
          {{ getButtonLabel('facebook') }}
        </span>
      </template>
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useOAuthAuthentication, OAuthMode } from 'src/composables/useOAuthAuthentication';

export interface OAuthButtonsProps {
  context?: OAuthMode;
  googleEnabled?: boolean;
  facebookEnabled?: boolean;
  buttonStyle?: 'full' | 'compact' | 'icon';
  buttonSize?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  inviteToken?: string;
  additionalData?: Record<string, any>;
}

const props = withDefaults(defineProps<OAuthButtonsProps>(), {
  context: 'login',
  googleEnabled: true,
  facebookEnabled: true,
  buttonStyle: 'full',
  buttonSize: 'md',
  loading: false,
  disabled: false,
});

const emit = defineEmits<{
  'google-auth': [response: any];
  'facebook-auth': [response: any];
  'error': [error: any];
}>();

const {
  googleReady,
  facebookReady,
  initializeGoogleOAuth,
  initializeFacebookOAuth,
  triggerGooglePopup,
  triggerFacebookPopup,
} = useOAuthAuthentication();

const activeProvider = ref<'google' | 'facebook' | null>(null);
const isAuthenticating = ref(false);

// Computed styles
const buttonClasses = computed(() => {
  const classes = ['oauth-btn'];
  
  if (props.buttonStyle === 'full') {
    classes.push('full-width');
  } else if (props.buttonStyle === 'compact') {
    classes.push('q-mr-sm');
  } else if (props.buttonStyle === 'icon') {
    classes.push('oauth-icon-btn');
  }
  
  return classes.join(' ');
});

const iconStyle = computed(() => ({
  width: '20px',
  height: '20px',
  marginRight: '12px',
}));

const iconSize = computed(() => {
  switch (props.buttonSize) {
    case 'sm': return '16px';
    case 'lg': return '24px';
    default: return '20px';
  }
});

const labelClass = computed(() => {
  return props.buttonSize === 'sm' ? 'text-caption' : '';
});

// Get button label based on context
const getButtonLabel = (provider: 'google' | 'facebook') => {
  const providerName = provider === 'google' ? 'Google' : 'Facebook';
  
  switch (props.context) {
    case 'login':
    case 'add-account':
      return `Login with ${providerName}`;
    
    case 'invite':
      return `Continue with ${providerName}`;
    
    case 'link':
      return `Connect ${providerName}`;
    
    default:
      return `Sign in with ${providerName}`;
  }
};

// Handle Google click
const handleGoogleClick = () => {
  if (isAuthenticating.value) return;
  
  activeProvider.value = 'google';
  isAuthenticating.value = true;
  // Don't emit auth-start here - wait for actual authentication
  
  const context = {
    mode: props.context,
    inviteToken: props.inviteToken,
    additionalData: props.additionalData,
  };
  
  const callbacks = {
    onSuccess: (response: any) => {
      activeProvider.value = null;
      isAuthenticating.value = false;
      emit('google-auth', response);
    },
    onError: (error: any) => {
      activeProvider.value = null;
      isAuthenticating.value = false;
      emit('error', error);
    },
  };
  
  triggerGooglePopup(context, callbacks);
};

// Handle Facebook click
const handleFacebookClick = () => {
  if (isAuthenticating.value) return;
  
  activeProvider.value = 'facebook';
  isAuthenticating.value = true;
  // Don't emit auth-start here - wait for actual authentication
  
  const context = {
    mode: props.context,
    inviteToken: props.inviteToken,
    additionalData: props.additionalData,
  };
  
  const callbacks = {
    onSuccess: (response: any) => {
      activeProvider.value = null;
      isAuthenticating.value = false;
      emit('facebook-auth', response);
    },
    onError: (error: any) => {
      activeProvider.value = null;
      isAuthenticating.value = false;
      emit('error', error);
    },
  };
  
  triggerFacebookPopup(context, callbacks);
};

// Initialize OAuth SDKs on mount
onMounted(() => {
  if (props.googleEnabled) {
    initializeGoogleOAuth();
  }
  if (props.facebookEnabled) {
    initializeFacebookOAuth();
  }
});
</script>

<style scoped>
.oauth-buttons-container {
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.oauth-buttons-container[data-style="compact"] {
  flex-direction: row;
}

.oauth-btn {
  background-color: white !important;
  border: 1px solid #dadce0;
  color: #3c4043;
  font-weight: 500;
  transition: all 0.2s;
}

.oauth-btn:hover:not(:disabled) {
  background-color: #f8f9fa !important;
}

.oauth-icon-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  min-width: 40px;
  border-radius: 50%;
}

.oauth-icon-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

/* Responsive adjustments */
@media (max-width: 599px) {
  .oauth-btn.full-width {
    font-size: 14px;
  }
}
</style>