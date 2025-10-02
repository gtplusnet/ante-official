<template>
  <q-form @submit.prevent="onSubmit" class="md3-form">
    <div class="md3-form-content">
      <!-- Security Information -->
      <div class="md3-form-info">
        <q-icon name="info" size="20px" color="primary" />
        <p class="md3-body-medium">
          Choose a strong password that you haven't used before.
        </p>
      </div>

      <!-- Password Fields Section -->
      <div class="md3-form-section">
        <h3 class="md3-title-medium">{{ hasPassword ? 'Change Your Password' : 'Set Your Password' }}</h3>
        
        <!-- Current Password (only if password exists) -->
        <div v-if="hasPassword" class="md3-input-field">
          <q-icon name="lock" color="grey-7" size="20px" class="md3-input-icon" />
          <input
            :type="showCurrentPassword ? 'text' : 'password'"
            v-model="formData.currentPassword"
            id="currentPassword"
            class="md3-input"
            :disabled="loading"
            placeholder=" "
            required
          />
          <label for="currentPassword" class="md3-input-label">Current Password</label>
          <q-btn
            flat
            round
            dense
            :icon="showCurrentPassword ? 'visibility_off' : 'visibility'"
            size="sm"
            color="grey-7"
            class="md3-visibility-toggle"
            @click="togglePasswordVisibility('current')"
          />
          <div class="md3-input-error" v-if="errors.currentPassword">{{ errors.currentPassword }}</div>
        </div>

        <!-- New Password -->
        <div class="md3-input-field">
          <q-icon name="lock_outline" color="grey-7" size="20px" class="md3-input-icon" />
          <input
            :type="showNewPassword ? 'text' : 'password'"
            v-model="formData.newPassword"
            id="newPassword"
            class="md3-input"
            :disabled="loading"
            placeholder=" "
            required
            @input="validateNewPassword"
          />
          <label for="newPassword" class="md3-input-label">{{ hasPassword ? 'New Password' : 'Password' }}</label>
          <q-btn
            flat
            round
            dense
            :icon="showNewPassword ? 'visibility_off' : 'visibility'"
            size="sm"
            color="grey-7"
            class="md3-visibility-toggle"
            @click="togglePasswordVisibility('new')"
          />
          <div class="md3-input-error" v-if="errors.newPassword">{{ errors.newPassword }}</div>
          <div class="md3-password-strength" v-if="formData.newPassword">
            <div class="md3-password-strength-bar">
              <div 
                class="md3-password-strength-fill" 
                :class="passwordStrengthClass"
                :style="{ width: passwordStrengthWidth }"
              ></div>
            </div>
            <span class="md3-label-small" :class="passwordStrengthClass">
              {{ passwordStrengthText }}
            </span>
          </div>
        </div>

        <!-- Confirm Password -->
        <div class="md3-input-field">
          <q-icon name="lock_outline" color="grey-7" size="20px" class="md3-input-icon" />
          <input
            :type="showConfirmPassword ? 'text' : 'password'"
            v-model="formData.confirmPassword"
            id="confirmPassword"
            class="md3-input"
            :disabled="loading"
            placeholder=" "
            required
            @input="validateConfirmPassword"
          />
          <label for="confirmPassword" class="md3-input-label">{{ hasPassword ? 'Confirm New Password' : 'Confirm Password' }}</label>
          <q-btn
            flat
            round
            dense
            :icon="showConfirmPassword ? 'visibility_off' : 'visibility'"
            size="sm"
            color="grey-7"
            class="md3-visibility-toggle"
            @click="togglePasswordVisibility('confirm')"
          />
          <div class="md3-input-error" v-if="errors.confirmPassword">{{ errors.confirmPassword }}</div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="md3-form-actions">
        <q-btn
          flat
          label="Cancel"
          color="primary"
          class="md3-button md3-button--text"
          :disable="loading"
          @click="resetForm"
        />
        <q-btn
          type="submit"
          :label="hasPassword ? 'Update Password' : 'Set Password'"
          color="primary"
          class="md3-button md3-button--filled"
          :class="{ 'md3-button--disabled-bg': !isFormValid }"
          :loading="loading"
          :disable="!isFormValid || loading"
          unelevated
          no-caps
        />
      </div>
    </div>
  </q-form>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, computed } from 'vue';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default defineComponent({
  name: 'ChangePasswordForm',

  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    hasPassword: {
      type: Boolean,
      default: true,
    },
  },

  emits: ['submit'],

  setup(props, { emit }) {
    const formData = reactive<PasswordFormData>({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

    const errors = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    const showCurrentPassword = ref(false);
    const showNewPassword = ref(false);
    const showConfirmPassword = ref(false);

    const isFormValid = computed(() => {
      const baseValid = 
        formData.newPassword &&
        formData.confirmPassword &&
        formData.newPassword === formData.confirmPassword &&
        !errors.newPassword &&
        !errors.confirmPassword;
      
      // If user has a password, they must provide current password
      if (props.hasPassword) {
        return baseValid && 
          formData.currentPassword && 
          !errors.currentPassword;
      }
      
      // If no password set, don't require current password
      return baseValid;
    });

    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm'): void => {
      switch (field) {
        case 'current':
          showCurrentPassword.value = !showCurrentPassword.value;
          break;
        case 'new':
          showNewPassword.value = !showNewPassword.value;
          break;
        case 'confirm':
          showConfirmPassword.value = !showConfirmPassword.value;
          break;
      }
    };

    const validateNewPassword = () => {
      if (!formData.newPassword) {
        errors.newPassword = 'New password is required';
      } else {
        errors.newPassword = '';
      }
      // Also validate confirm password when new password changes
      if (formData.confirmPassword) {
        validateConfirmPassword();
      }
    };

    const validateConfirmPassword = () => {
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your new password';
      } else if (formData.confirmPassword !== formData.newPassword) {
        errors.confirmPassword = 'Passwords do not match';
      } else {
        errors.confirmPassword = '';
      }
    };

    const onSubmit = (): void => {
      // Validate all fields
      if (props.hasPassword) {
        errors.currentPassword = formData.currentPassword ? '' : 'Current password is required';
      }
      validateNewPassword();
      validateConfirmPassword();

      if (isFormValid.value) {
        emit('submit', { ...formData }, (success: boolean) => {
          if (success) {
            resetForm();
          }
        });
      }
    };

    const resetForm = (): void => {
      formData.currentPassword = '';
      formData.newPassword = '';
      formData.confirmPassword = '';
      showCurrentPassword.value = false;
      showNewPassword.value = false;
      showConfirmPassword.value = false;
      Object.keys(errors).forEach(key => errors[key as keyof typeof errors] = '');
    };

    // Password strength calculation
    const passwordStrength = computed(() => {
      const password = formData.newPassword;
      if (!password) return 0;
      
      let strength = 0;
      if (password.length >= 6) strength += 25;
      if (password.length >= 8) strength += 25;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
      if (/\d/.test(password)) strength += 12.5;
      if (/[^a-zA-Z\d]/.test(password)) strength += 12.5;
      
      return Math.min(strength, 100);
    });

    const passwordStrengthClass = computed(() => {
      const strength = passwordStrength.value;
      if (strength < 40) return 'strength-weak';
      if (strength < 70) return 'strength-fair';
      return 'strength-strong';
    });

    const passwordStrengthText = computed(() => {
      const strength = passwordStrength.value;
      if (strength < 40) return 'Weak';
      if (strength < 70) return 'Fair';
      return 'Strong';
    });

    const passwordStrengthWidth = computed(() => `${passwordStrength.value}%`);

    return {
      formData,
      errors,
      showCurrentPassword,
      showNewPassword,
      showConfirmPassword,
      isFormValid,
      togglePasswordVisibility,
      onSubmit,
      resetForm,
      validateNewPassword,
      validateConfirmPassword,
      passwordStrengthClass,
      passwordStrengthText,
      passwordStrengthWidth,
    };
  },
});
</script>

<style lang="scss" scoped>
.md3-form {
  width: 100%;
}

.md3-form-content {
  padding: 32px;
}

.md3-form-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background-color: #e3f2fd;
  border-radius: 8px;
  margin-bottom: 32px;
  
  .q-icon {
    flex-shrink: 0;
    margin-top: 2px;
  }
}

.md3-body-medium {
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
  color: #1f1f1f;
  margin: 0;
}

.md3-form-section {
  margin-bottom: 40px;
}

.md3-title-medium {
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
  letter-spacing: 0.15px;
  margin: 0 0 24px 0;
}

.md3-input-field {
  position: relative;
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 599px) {
    margin-bottom: 8px;
  }
}

.md3-input-icon {
  position: absolute;
  left: 16px;
  top: 28px;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 1;
}

.md3-input {
  width: 100%;
  height: 60px;
  padding: 26px 48px 8px 48px;
  font-size: 14px;
  font-weight: 400;
  color: #1f1f1f;
  background-color: var(--q-extra-lighter);
  border: 1px solid transparent;
  border-radius: 12px;
  outline: none;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: #ebebed;
  }
  
  &:focus {
    background-color: #e8e8ea;
    border-color: var(--q-primary);
    border-bottom-width: 2px;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &:placeholder-shown + .md3-input-label {
    top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
  }
  
  &:not(:placeholder-shown) + .md3-input-label,
  &:focus + .md3-input-label {
    top: 12px;
    transform: translateY(0);
    font-size: 12px;
    color: #5f6368;
  }
  
  &:focus + .md3-input-label {
    color: var(--q-primary);
  }
}

.md3-input-label {
  position: absolute;
  left: 48px;
  top: 12px;
  transform: translateY(0);
  font-size: 12px;
  font-weight: 400;
  color: #5f6368;
  pointer-events: none;
  transition: all 0.2s ease;
  background-color: transparent;
}

.md3-visibility-toggle {
  position: absolute;
  right: 8px;
  top: 28px;
  transform: translateY(-50%);
  z-index: 1;
}

.md3-input-error {
  font-size: 12px;
  color: var(--q-negative);
  margin-top: 4px;
  padding-left: 16px;
}

// Password strength indicator
.md3-password-strength {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-left: 16px;
}

.md3-password-strength-bar {
  flex: 1;
  height: 4px;
  background-color: #e8eaed;
  border-radius: 2px;
  overflow: hidden;
}

.md3-password-strength-fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
  
  &.strength-weak {
    background-color: #ea4335;
  }
  
  &.strength-fair {
    background-color: #fbbc04;
  }
  
  &.strength-strong {
    background-color: #34a853;
  }
}

.md3-label-small {
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  
  &.strength-weak {
    color: #ea4335;
  }
  
  &.strength-fair {
    color: #fbbc04;
  }
  
  &.strength-strong {
    color: #34a853;
  }
}

.md3-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #e8eaed;
}

.md3-button {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.1px;
  padding: 0 24px;
  height: 40px;
  border-radius: 20px;
  transition: all 0.2s ease;
  
  &--text {
    &:hover {
      background-color: rgba(25, 118, 210, 0.08);
    }
  }

  &--disabled-bg {
    background-color: #E0E0E0 !important;
  }
  
  &--filled {
    box-shadow: none;
    
    &:hover:not(:disabled) {
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15);
    }
    
    &:active:not(:disabled) {
      box-shadow: none;
    }
  }
  
  :deep(.q-btn__content) {
    text-transform: none;
  }
}

@media (max-width: 768px) {
  .md3-form-actions {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    padding: 16px;
    z-index: 100;
  }
}

/* Responsive Design */
@media (max-width: 599px) {
  .md3-form-content {
    padding: 10px 16px;
  }
  
  .md3-form-info {
    display: none;
  }
  
  .md3-title-medium {
    margin-bottom: 10px;
  }
  
  .md3-form-actions {
    flex-direction: column-reverse;
    border-top: none;
    
    .md3-button {
      width: 100%;
    }
  }
}
</style>