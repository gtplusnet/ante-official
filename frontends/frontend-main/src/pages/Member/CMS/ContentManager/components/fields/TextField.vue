<template>
  <q-input
    :model-value="modelValue"
    @update:model-value="updateValue"
    :type="getInputType()"
    :placeholder="field.placeholder || `Enter ${field.displayName || field.name}`"
    :error="!!error"
    :error-message="error"
    :required="field.required"
    :readonly="field.readonly"
    :disable="field.disabled"
    :maxlength="field.maxLength"
    :rules="validationRules"
    outlined
    dense
    lazy-rules
    @blur="validateField"
    class="md3-text-field"
  >
    <template v-slot:append>
      <q-icon
        v-if="field.type === 'password'"
        :name="showPassword ? 'visibility_off' : 'visibility'"
        class="cursor-pointer"
        @click="showPassword = !showPassword"
      />
      
      <q-btn
        v-else-if="field.type === 'uid'"
        flat
        round
        dense
        size="sm"
        icon="refresh"
        @click="generateUID"
      >
        <q-tooltip>Generate UID</q-tooltip>
      </q-btn>
    </template>
  </q-input>
</template>

<script lang="ts">
import { defineComponent, computed, ref, PropType } from 'vue';
import type { Field } from '@components/shared/cms/types/content-type';

export default defineComponent({
  name: 'TextField',
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    field: {
      type: Object as PropType<Field>,
      required: true
    },
    error: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue', 'validate'],
  setup(props, { emit }) {
    const showPassword = ref(false);
    
    const getInputType = (): 'text' | 'email' | 'password' => {
      switch (props.field.type) {
        case 'email':
          return 'email';
        case 'password':
          return showPassword.value ? 'text' : 'password';
        case 'uid':
        case 'text':
        default:
          return 'text';
      }
    };
    
    const validationRules = computed(() => {
      const rules: ((val: any) => boolean | string)[] = [];
      
      // Required validation
      if (props.field.required) {
        rules.push((val: any) => {
          if (val === null || val === undefined || val === '') {
            return 'This field is required';
          }
          return true;
        });
      }
      
      // Length validation
      if (props.field.minLength) {
        rules.push((val: string) => {
          if (val && val.length < props.field.minLength!) {
            return `Minimum length is ${props.field.minLength}`;
          }
          return true;
        });
      }
      
      if (props.field.maxLength) {
        rules.push((val: string) => {
          if (val && val.length > props.field.maxLength!) {
            return `Maximum length is ${props.field.maxLength}`;
          }
          return true;
        });
      }
      
      // Email validation
      if (props.field.type === 'email') {
        rules.push((val: string) => {
          if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
            return 'Invalid email format';
          }
          return true;
        });
      }
      
      // Regex validation
      if (props.field.regex) {
        rules.push((val: string) => {
          if (val && !new RegExp(props.field.regex!).test(val)) {
            return 'Invalid format';
          }
          return true;
        });
      }
      
      return rules;
    });
    
    const updateValue = (value: string | number | null) => {
      emit('update:modelValue', value);
    };
    
    const validateField = () => {
      const value = props.modelValue;
      let isValid = true;
      
      // Run validation rules
      for (const rule of validationRules.value) {
        const result = rule(value);
        if (result !== true) {
          isValid = false;
          break;
        }
      }
      
      emit('validate', isValid);
    };
    
    const generateUID = () => {
      // Generate a simple UID based on timestamp and random string
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 8);
      const uid = `${timestamp}_${randomStr}`;
      emit('update:modelValue', uid);
    };
    
    return {
      showPassword,
      getInputType,
      validationRules,
      updateValue,
      validateField,
      generateUID
    };
  }
});
</script>

<style scoped lang="scss">
// Material Design 3 Color Tokens
$md-sys-color-primary: #6750a4;
$md-sys-color-on-surface: #1c1b1f;
$md-sys-color-on-surface-variant: #49454f;
$md-sys-color-outline: #79747e;
$md-sys-color-outline-variant: #cac4d0;
$md-sys-color-error: #ba1a1a;
$md-sys-color-surface-container-highest: #e6e6ee;

.md3-text-field {
  :deep(.q-field__control) {
    border-radius: 8px;
    border-color: $md-sys-color-outline-variant;
    transition: all 0.15s ease;
    
    &:hover {
      border-color: $md-sys-color-outline;
    }
  }
  
  :deep(.q-field__native) {
    font-family: 'Inter', 'Roboto', system-ui, sans-serif;
    font-size: 12px;
    font-weight: 300;
    line-height: 16px;
    letter-spacing: 0.15px;
    color: $md-sys-color-on-surface;
  }
  
  :deep(.q-field__label) {
    font-family: 'Inter', 'Roboto', system-ui, sans-serif;
    font-size: 11px;
    font-weight: 300;
    letter-spacing: 0.1px;
    color: $md-sys-color-on-surface-variant;
  }
  
  :deep(.q-field__bottom) {
    font-family: 'Inter', 'Roboto', system-ui, sans-serif;
    font-size: 10px;
    font-weight: 300;
    line-height: 12px;
    letter-spacing: 0.15px;
  }
  
  :deep(.q-field--focused) {
    .q-field__control {
      border-color: $md-sys-color-primary;
      border-width: 2px;
    }
    
    .q-field__label {
      color: $md-sys-color-primary;
    }
  }
  
  :deep(.q-field--error) {
    .q-field__control {
      border-color: $md-sys-color-error;
    }
    
    .q-field__label {
      color: $md-sys-color-error;
    }
  }
  
  :deep(.q-btn) {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    
    .q-icon {
      font-size: 16px;
    }
  }
}
</style>