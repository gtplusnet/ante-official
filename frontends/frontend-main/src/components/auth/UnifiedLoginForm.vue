<template>
  <div class="unified-login-form">
    <!-- Transition Overlay -->
    <div v-if="isTransitioning" class="auth-transition-overlay">
      <q-spinner-orbit size="60px" color="primary" />
      <div class="transition-message">{{ transitionMessage }}</div>
      <div class="transition-submessage">Please wait...</div>
    </div>
    <!-- Server Selection (Development Only) -->
    <div v-if="showServerSelector && connectionStore.isDevelopment" class="q-mb-md">
      <div class="label text-label-medium">
        <span>Choose Server</span>
      </div>
      <q-select
        v-model="selectedConnection"
        :options="connectionOptions"
        option-value="NAME"
        option-label="NAME"
        emit-value
        map-options
        filled
        dense
        @update:model-value="onConnectionChange"
        class="text-body-medium"
      >
        <template v-slot:option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section>
              <q-item-label>{{ scope.opt.NAME }}</q-item-label>
              <q-item-label caption>API: {{ scope.opt.API_URL }}</q-item-label>
              <q-item-label caption>Socket: {{ scope.opt.SOCKET_URL }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>

    <!-- Form Container -->
    <form @submit.prevent="handleManualLogin" class="login-form-container">
      <!-- Title based on mode -->
      <div
        v-if="showTitle"
        class="form-title text-title-medium text-center q-mb-md"
      >
        <span>{{ formTitle }}</span>
      </div>

      <!-- Existing Accounts (for add-account mode) -->
      <div
        v-if="mode === 'add-account' && existingAccounts?.length"
        class="existing-accounts-section q-mb-lg"
      >
        <div class="text-body2 text-weight-medium q-mb-sm">
          Currently signed in
        </div>
        <div class="existing-accounts-list">
          <div
            v-for="account in existingAccounts"
            :key="account.accountInformation.id"
            class="existing-account-chip"
          >
            <q-avatar size="28px">
              <img
                :src="
                  account.accountInformation.image ||
                  'https://cdn.quasar.dev/img/avatar.png'
                "
              />
            </q-avatar>
            <div class="account-info">
              <div class="text-caption text-weight-medium">
                {{ account.accountInformation.fullName }}
              </div>
              <div class="text-caption text-grey-6">
                {{ account.accountInformation.role?.name }} •
                {{
                  account.accountInformation.company?.companyName ||
                  "No Company"
                }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- OAuth Section -->
      <div v-if="showOAuth && !manualMode" class="oauth-section">
        <OAuthButtons
          :context="mode === 'signin' ? 'login' : mode"
          :invite-token="inviteToken"
          :additional-data="additionalOAuthData"
          :disabled="submitting"
          @google-auth="handleOAuthSuccess"
          @facebook-auth="handleOAuthSuccess"
          @error="handleOAuthError"
        />

        <!-- Divider -->
        <div v-if="showManual" class="divider-section">
          <div class="divider-text">Or</div>
        </div>

        <!-- Manual Login Toggle -->
        <q-btn
          v-if="showManual"
          @click="manualMode = true"
          color="primary"
          class="full-width submit-btn text-body-medium"
          no-caps
          unelevated
          rounded
          :label="manualButtonLabel"
          :disable="submitting"
          data-testid="manual-login-button"
        />
      </div>

      <!-- Manual Login Section -->
      <div v-else-if="showManual" class="manual-section">
        <!-- For invite mode with pre-filled email -->
        <div
          v-if="mode === 'invite' && inviteDetails?.email"
          class="form-field q-mb-md"
        >
          <label class="field-label">Email address</label>
          <q-input :model-value="inviteDetails.email" outlined disable dense>
            <template v-slot:prepend>
              <q-icon name="mail_outline" size="20px" />
            </template>
          </q-input>
          <div class="field-helper text-caption text-grey-6">
            This will be your login email
          </div>
        </div>

        <!-- Username/Email field (for non-invite modes) -->
        <div v-if="mode !== 'invite'" class="form-field">
          <label class="field-label">Username or Email</label>
          <q-input
            v-model="username"
            outlined
            class="input-field"
            dense
            placeholder="Enter your username or email"
            :disable="submitting"
            :rules="[(val) => !!val || 'Username or email is required']"
            data-testid="login-username-input"
          >
            <template v-slot:prepend>
              <q-icon name="person" size="20px" />
            </template>
          </q-input>
        </div>

        <!-- Password field -->
        <div class="form-field q-mb-md">
          <label class="field-label">
            {{ mode === "invite" ? "Set Password" : "Password" }}
          </label>
          <q-input
            v-model="password"
            class="input-field"
            type="password"
            outlined
            dense
            :placeholder="
              mode === 'invite'
                ? 'Create a strong password'
                : 'Enter your password'
            "
            :disable="submitting"
            :rules="passwordRules"
            data-testid="login-password-input"
          >
            <template v-slot:prepend>
              <q-icon name="lock" size="20px" />
            </template>
          </q-input>
          <!-- No password requirements displayed -->
        </div>

        <!-- Additional fields for invite mode -->
        <div v-if="mode === 'invite' && showOptionalFields">
          <q-expansion-item
            label="Additional Information (Optional)"
            header-class="text-body2 text-grey-7"
            expand-icon-class="text-grey-5"
            class="optional-fields q-mt-md"
          >
            <div class="q-pt-md">
              <slot name="additional-fields" />
            </div>
          </q-expansion-item>
        </div>

        <!-- Submit buttons -->
        <div class="button-group">
          <g-button
            type="submit"
            :label="submitButtonLabel"
            color="primary"
            :loading="submitting"
            :disable="!canSubmit"
            class="submit-btn text-body-medium"
            data-testid="login-submit-button"
          />

          <!-- Back to OAuth button (if OAuth is available) -->
          <g-button
            v-if="showOAuth && mode !== 'invite'"
            @click="manualMode = false"
            flat
            color="primary"
            label="Back to login options"
          />

          <q-btn
            v-if="showCancel"
            label="Cancel"
            outline
            rounded
            color="grey-7"
            @click="$emit('cancel')"
            :disable="submitting"
            class="cancel-btn"
          />
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useQuasar } from "quasar";
import { useConnectionStore } from "src/stores/connectionStore";
import GButton from "src/components/shared/buttons/GButton.vue";
import { useMultiAccountStore } from "src/stores/multiAccount";
import { APIRequests } from "src/utility/api.handler";
import { api } from "src/boot/axios";
import OAuthButtons from "./OAuthButtons.vue";

export interface UnifiedLoginFormProps {
  mode?: "signin" | "invite" | "add-account";
  showOAuth?: boolean;
  showManual?: boolean;
  showServerSelector?: boolean;
  showTitle?: boolean;
  showCancel?: boolean;
  showOptionalFields?: boolean;
  inviteToken?: string;
  inviteDetails?: any;
  existingAccounts?: any[];
  additionalOAuthData?: Record<string, any>;
}

const props = withDefaults(defineProps<UnifiedLoginFormProps>(), {
  mode: "signin",
  showOAuth: true,
  showManual: true,
  showServerSelector: false,
  showTitle: true,
  showCancel: false,
  showOptionalFields: false,
});

const emit = defineEmits<{
  "login-success": [response: any];
  cancel: [];
  error: [error: any];
}>();

const $q = useQuasar();
const connectionStore = useConnectionStore();
const multiAccountStore = useMultiAccountStore();

// Form state
const username = ref("");
const password = ref("");
const manualMode = ref(false);
const submitting = ref(false);
const selectedConnection = ref("Default");
const isTransitioning = ref(false);
const transitionMessage = ref("Authenticating...");

// Computed properties
const connectionOptions = computed(() => connectionStore.connections);

const formTitle = computed(() => {
  switch (props.mode) {
    case "signin":
      return "Account Login";
    case "invite":
      return "Complete Registration";
    case "add-account":
      return "Add Another Account";
    default:
      return "Sign In";
  }
});

const manualButtonLabel = computed(() => {
  switch (props.mode) {
    case "signin":
      return "Sign in manually";
    case "invite":
      return "Create account with email";
    case "add-account":
      return "Sign in with password";
    default:
      return "Continue with email";
  }
});

const submitButtonLabel = computed(() => {
  switch (props.mode) {
    case "signin":
      return submitting.value ? "Signing in..." : "Sign In";
    case "invite":
      return submitting.value ? "Creating account..." : "Create Account";
    case "add-account":
      return submitting.value ? "Adding account..." : "Add Account";
    default:
      return "Continue";
  }
});

const passwordRules = computed(() => {
  const rules: Array<(val: string) => boolean | string> = [
    (val: string) => !!val || "Password is required",
  ];

  // No password length or complexity requirements

  return rules;
});

const canSubmit = computed(() => {
  // No minimum password length requirement
  if (props.mode === "invite") {
    return password.value.length > 0;
  }
  return username.value && password.value;
});

// Methods
const onConnectionChange = (value: string) => {
  connectionStore.setConnection(value);
};

const handleManualLogin = async () => {
  if (!canSubmit.value) return;

  submitting.value = true;
  isTransitioning.value = true;
  transitionMessage.value = "Verifying credentials...";

  try {
    let response: any;

    if (props.mode === "invite") {
      // Handle invite acceptance with manual registration
      const payload: any = {
        token: props.inviteToken,
        password: password.value,
      };

      // Add any additional data from the form
      if (props.additionalOAuthData) {
        Object.assign(payload, props.additionalOAuthData);
      }

      response = await api.post("/auth/invite/accept", payload);
      emit("login-success", response.data);
    } else {
      // Handle regular login or add-account
      const loginRequest = {
        username: username.value,
        password: password.value,
      };

      response = await APIRequests.login($q, loginRequest);

      // For add-account mode, check if already logged in
      if (props.mode === "add-account") {
        const existingAccount = multiAccountStore.allAccounts.find(
          (acc: any) =>
            acc.accountInformation.id === response.accountInformation.id
        );

        if (existingAccount) {
          $q.notify({
            type: "info",
            message: "This account is already logged in. Switching to it...",
            position: "top",
          });
          multiAccountStore.switchAccount(response.accountInformation.id);
        } else {
          multiAccountStore.addAccount(
            response.token,
            response.accountInformation,
            false,
            response.supabaseToken,
            response.supabaseRefreshToken
          );
        }
      }

      // Start transition sequence
      transitionMessage.value = "Login successful!";
      setTimeout(() => {
        transitionMessage.value = "Setting up your workspace...";
      }, 400);

      emit("login-success", response);
    }
  } catch (error: any) {
    console.error("Login error:", error);
    emit("error", error);

    // Hide transition overlay on error
    isTransitioning.value = false;

    // Error notification is handled by APIRequests for manual login
    if (props.mode === "invite") {
      $q.notify({
        type: "negative",
        message:
          error.response?.data?.message || "Failed to complete registration",
        position: "top",
      });
    }
  } finally {
    submitting.value = false;
  }
};

const handleOAuthSuccess = async (response: any) => {
  // Show transition immediately when OAuth succeeds
  isTransitioning.value = true;
  transitionMessage.value = "Authentication successful!";

  setTimeout(() => {
    transitionMessage.value = "Setting up your workspace...";
  }, 400);
  // For add-account mode, handle multi-account logic
  if (props.mode === "add-account" && response.accountInformation) {
    const existingAccount = multiAccountStore.allAccounts.find(
      (acc) => acc.accountInformation.id === response.accountInformation.id
    );

    if (existingAccount) {
      $q.notify({
        type: "info",
        message: "This account is already logged in. Switching to it...",
        position: "top",
      });
      multiAccountStore.switchAccount(response.accountInformation.id);
    } else {
      multiAccountStore.addAccount(
        response.token,
        response.accountInformation,
        false,
        response.supabaseToken,
        response.supabaseRefreshToken
      );
      $q.notify({
        type: "positive",
        message: `Successfully added ${response.accountInformation.fullName}`,
        position: "top",
      });
    }
  }

  emit("login-success", response);
};

const handleOAuthError = (error: any) => {
  // Hide transition overlay on OAuth error
  isTransitioning.value = false;

  // Don't show notification here - the OAuth composable already handles it
  // This prevents duplicate error messages

  emit("error", error);
};

// Initialize on mount
onMounted(() => {
  // Load connection preference for development mode
  if (props.showServerSelector && connectionStore.isDevelopment) {
    selectedConnection.value =
      connectionStore.selectedConnectionName || "Default";
  }

  // For invite mode, start in manual mode if OAuth is not configured
  if (props.mode === "invite") {
    const hasGoogleConfig =
      import.meta.env.VITE_GOOGLE_CLIENT_ID &&
      import.meta.env.VITE_GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID_HERE";
    const hasFacebookConfig =
      import.meta.env.VITE_FACEBOOK_APP_ID &&
      import.meta.env.VITE_FACEBOOK_APP_ID !== "YOUR_FACEBOOK_APP_ID_HERE";

    if (!hasGoogleConfig && !hasFacebookConfig) {
      manualMode.value = true;
    }
  }
});
</script>

<style scoped>
.unified-login-form {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.manual-section {
  margin-top: 24px;
}

.form-title {
  margin-bottom: 24px;
  font-weight: 500;
}

.input-field {
  :deep(.q-field__control) {
    border-radius: 12px;
  }
}

.existing-accounts-section {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
}

.existing-accounts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.existing-account-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.account-info {
  flex: 1;
  min-width: 0;
}

.account-info .text-caption {
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.divider-section {
  position: relative;
}

.divider-text {
  text-align: center;
  margin-bottom: 24px;
  padding: 0 16px;
  color: var(--q-text-light-grey);
  font-size: 12px;
  font-weight: 500;
}

.form-field {
  padding-bottom: 4px;
}

.field-label {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 500;
  color: var(--q-dark);
}

.field-label.required::after {
  content: " *";
  color: #f44336;
}

.field-helper {
  margin-top: 4px;
  font-size: 12px;
  color: #757575;
}

.button-group {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (max-width: 599px) {
    gap: 16px;
  }
}

.submit-btn,
.cancel-btn {
  flex: 1;
  letter-spacing: .3px;
}

.optional-fields {
  margin-top: 16px;
}

/* Transition Overlay Styles */
.auth-transition-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-in;
}

.transition-message {
  margin-top: 24px;
  font-size: 18px;
  font-weight: 500;
  color: #424242;
  animation: fadeInUp 0.4s ease-out;
}

.transition-submessage {
  margin-top: 8px;
  font-size: 14px;
  color: #757575;
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive adjustments */
@media (max-width: 599px) {
  .unified-login-form {
    padding: 0 16px;
  }
  
  .form-title {
    font-size: 20px;
    margin-bottom: 0;
  }

  .transition-message {
    font-size: 16px;
  }

  .transition-submessage {
    font-size: 12px;
  }
}
</style>
