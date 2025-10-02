<template>
  <q-select
    :model-value="modelValue"
    @update:model-value="updateValue"
    :options="enumOptions"
    :placeholder="field.placeholder || `Select ${field.displayName || field.name}`"
    :error="!!error"
    :error-message="error"
    :required="field.required"
    :readonly="field.readonly"
    :disable="field.disabled"
    :rules="validationRules"
    :clearable="!field.required"
    emit-value
    map-options
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
  name: 'EnumerationField',
  props: {
    modelValue: {
      type: [String, Number],
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
    const enumOptions = computed(() => {
      if (!props.field.enumValues) return [];
      
      // Handle both string array and comma-separated string
      let values: string[] = [];
      
      if (Array.isArray(props.field.enumValues)) {
        values = props.field.enumValues;
      } else if (typeof props.field.enumValues === 'string') {
        values = props.field.enumValues.split(',').map(v => v.trim());
      }
      
      // Convert to options format
      return values.map(value => ({
        label: value,
        value: value
      }));
    });
    
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
      
      // Valid option validation
      rules.push((val: any) => {
        if (val !== null && val !== undefined && val !== '') {
          const validValues = enumOptions.value.map(option => option.value);
          if (!validValues.includes(val)) {
            return 'Please select a valid option';
          }
        }
        return true;
      });
      
      return rules;
    });
    
    const updateValue = (value: string | null) => {
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
    
    return {
      enumOptions,
      validationRules,
      updateValue,
      validateField
    };
  }
});
</script>