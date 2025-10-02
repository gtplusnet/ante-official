<template>
  <q-form @submit="onSubmit" class="md3-form">
    <div class="md3-form-content">
      <!-- Personal Information Section -->
      <div class="md3-form-section">
        <h3 class="md3-title-medium">Personal Information</h3>
        <div class="input-group">
          <div class="col-12 col-sm-6">
            <div class="md3-input-field">
              <q-icon name="badge" color="grey-7" size="20px" class="md3-input-icon" />
              <input
                type="text"
                v-model="formData.firstName"
                id="firstName"
                class="md3-input"
                :disabled="loading"
                placeholder=" "
                required
              />
              <label for="firstName" class="md3-input-label">First Name</label>
              <div class="md3-input-error" v-if="errors.firstName">{{ errors.firstName }}</div>
            </div>
          </div>
          <div class="col-12 col-sm-6">
            <div class="md3-input-field">
              <q-icon name="badge" color="grey-7" size="20px" class="md3-input-icon" />
              <input
                type="text"
                v-model="formData.lastName"
                id="lastName"
                class="md3-input"
                :disabled="loading"
                placeholder=" "
                required
              />
              <label for="lastName" class="md3-input-label">Last Name</label>
              <div class="md3-input-error" v-if="errors.lastName">{{ errors.lastName }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Information Section -->
      <div class="md3-form-section">
        <h3 class="md3-title-medium">Contact Information</h3>
        <div class="input-group">
          <div class="col-12 col-sm-6">
            <div class="md3-input-field">
              <q-icon name="email" color="grey-7" size="20px" class="md3-input-icon" />
              <input
                type="email"
                v-model="formData.email"
                id="email"
                class="md3-input"
                :disabled="loading"
                placeholder=" "
                required
                @blur="validateEmail"
              />
              <label for="email" class="md3-input-label">Email Address</label>
              <div class="md3-input-error" v-if="errors.email">{{ errors.email }}</div>
            </div>
          </div>
          <div class="col-12 col-sm-6">
            <div class="md3-input-field">
              <q-icon name="phone" color="grey-7" size="20px" class="md3-input-icon" />
              <input
                type="tel"
                v-model="formData.phone"
                id="phone"
                class="md3-input"
                :disabled="loading"
                placeholder=" "
                required
              />
              <label for="phone" class="md3-input-label">Phone Number</label>
              <div class="md3-input-error" v-if="errors.phone">{{ errors.phone }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="md3-form-actions">
        <q-btn
          flat
          label="Cancel"
          color="primary"
          class="md3-button md3-button--text"
          :disable="loading || !isFormChanged"
          @click="resetForm"
        />
        <q-btn
          type="submit"
          label="Save Changes"
          color="primary"
          class="md3-button md3-button--filled"
          :class="{ 'md3-button--disabled-bg': !isFormChanged }"
          :loading="loading"
          :disable="!isFormChanged || !isFormValid"
          unelevated
          no-caps
        />
      </div>
    </div>
  </q-form>
</template>

<script lang="ts">
import { defineComponent, reactive, watch, computed } from 'vue';

interface UserProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export default defineComponent({
  name: 'AccountInfoForm',
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    initialData: {
      type: Object as () => UserProfileFormData,
      default: (): UserProfileFormData => ({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      })
    }
  },
  emits: ['submit'],
  setup(props, { emit }) {
    const formData = reactive<UserProfileFormData>({
      firstName: props.initialData?.firstName || '',
      lastName: props.initialData?.lastName || '',
      email: props.initialData?.email || '',
      phone: props.initialData?.phone || ''
    });

    const errors = reactive({
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    });

    // Watch for changes in initialData prop
    watch(() => props.initialData, (newVal) => {
      if (newVal) {
        formData.firstName = newVal.firstName || '';
        formData.lastName = newVal.lastName || '';
        formData.email = newVal.email || '';
        formData.phone = newVal.phone || '';
      }
    }, { immediate: true });

    const initialFormData = reactive<UserProfileFormData>({
      firstName: props.initialData?.firstName || '',
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone
    });

    const isFormChanged = computed(() => {
      return (Object.keys(formData) as Array<keyof UserProfileFormData>).some(
        key => formData[key] !== initialFormData[key]
      );
    });

    const isFormValid = computed(() => {
      return formData.firstName && 
             formData.lastName && 
             formData.email && 
             formData.phone &&
             !errors.email;
    });

    const validateEmail = () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email) {
        errors.email = 'Email is required';
      } else if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email';
      } else {
        errors.email = '';
      }
    };

    const onSubmit = () => {
      // Validate all fields
      errors.firstName = formData.firstName ? '' : 'First name is required';
      errors.lastName = formData.lastName ? '' : 'Last name is required';
      errors.phone = formData.phone ? '' : 'Phone number is required';
      validateEmail();

      if (isFormValid.value) {
        emit('submit', {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          contactNumber: formData.phone
        });
      }
    };

    const resetForm = () => {
      Object.assign(formData, initialFormData);
      Object.keys(errors).forEach(key => errors[key as keyof typeof errors] = '');
    };

    // Update form data when initialData prop changes
    watch(
      () => props.initialData,
      (newVal) => {
        if (newVal) {
          formData.firstName = newVal.firstName || '';
          formData.lastName = newVal.lastName || '';
          formData.email = newVal.email || '';
          formData.phone = newVal.phone || '';
          Object.assign(initialFormData, { ...formData });
        }
      },
      { deep: true, immediate: true }
    );

    return {
      formData,
      errors,
      isFormChanged,
      isFormValid,
      onSubmit,
      resetForm,
      validateEmail
    };
  }
});
</script>

<style lang="scss" scoped>
.md3-form {
  width: 100%;
}

.md3-form-content {
  padding: 32px;
}

.md3-form-section {
  margin-bottom: 32px;
  
  &:last-of-type {
    margin-bottom: 40px;
  }
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
  margin-bottom: 4px;
}

.md3-input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 1;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 768px) {
    gap: 4px;
  }
}

.md3-input {
  width: 100%;
  height: 60px;
  padding: 26px 16px 8px 46px;
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

.md3-input-error {
  font-size: 12px;
  color: var(--q-negative);
  margin-top: 4px;
  padding-left: 16px;
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
  
  &--filled {
    box-shadow: none;
    
    // &:hover:not(:disabled) {
    //   // box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15);
    // }
    
    &:active:not(:disabled) {
      box-shadow: none;
    }
  }
  
  &--disabled-bg {
    background-color: #E0E0E0 !important;
  }
  
  :deep(.q-btn__content) {
    text-transform: none;
  }
}

/* Responsive Design - Tablet and Mobile */
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

@media (max-width: 599px) {
  .md3-form-content {
    padding: 10px 16px;
  }
  
  .md3-form-section {
    margin-bottom: 6px;
    
    &:last-of-type {
      margin-bottom: 32px;
    }
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