<template>
  <q-input
    :model-value="modelValue"
    @update:model-value="updateValue"
    type="number"
    :placeholder="field.placeholder || `Enter ${field.displayName || field.name}`"
    :error="!!error"
    :error-message="error"
    :required="field.required"
    :readonly="field.readonly"
    :disable="field.disabled"
    :min="field.min"
    :max="field.max"
    :step="getStep()"
    :rules="validationRules"
    outlined
    dense
    lazy-rules
    @blur="validateField"
  />
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import type { Field } from '@components/shared/cms/types/content-type';

export default defineComponent({
  name: 'NumberField',
  props: {
    modelValue: {
      type: [Number, String],
      default: null
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
    const getStep = (): string | number => {
      switch (props.field.numberType) {
        case 'integer':
        case 'big integer':
          return 1;
        case 'decimal':
        case 'float':
          return 0.01;
        default:
          return 'any';
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
      
      // Number validation
      rules.push((val: any) => {
        if (val !== null && val !== undefined && val !== '' && isNaN(Number(val))) {
          return 'Must be a valid number';
        }
        return true;
      });
      
      // Min/Max validation
      if (props.field.min !== undefined) {
        rules.push((val: any) => {
          if (val !== null && val !== undefined && val !== '' && Number(val) < props.field.min!) {
            return `Minimum value is ${props.field.min}`;
          }
          return true;
        });
      }
      
      if (props.field.max !== undefined) {
        rules.push((val: any) => {
          if (val !== null && val !== undefined && val !== '' && Number(val) > props.field.max!) {
            return `Maximum value is ${props.field.max}`;
          }
          return true;
        });
      }
      
      // Integer validation
      if (props.field.numberType === 'integer' || props.field.numberType === 'big integer') {
        rules.push((val: any) => {
          if (val !== null && val !== undefined && val !== '' && !Number.isInteger(Number(val))) {
            return 'Must be a whole number';
          }
          return true;
        });
      }
      
      return rules;
    });
    
    const updateValue = (value: string | number | null) => {
      // Convert to appropriate type
      let convertedValue: number | null = null;
      
      if (value !== null && value !== undefined && value !== '') {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          convertedValue = numValue;
        }
      }
      
      emit('update:modelValue', convertedValue);
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
    
    return {
      getStep,
      validationRules,
      updateValue,
      validateField
    };
  }
});
</script>