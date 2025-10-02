<template>
  <q-input
    :model-value="displayValue"
    @update:model-value="updateValue"
    type="datetime-local"
    :placeholder="field.placeholder || `Select ${field.displayName || field.name}`"
    :error="!!error"
    :error-message="error"
    :required="field.required"
    :readonly="field.readonly"
    :disable="field.disabled"
    :rules="validationRules"
    outlined
    dense
    lazy-rules
    @blur="validateField"
  >
    <template v-slot:append>
      <q-icon name="o_event" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date
            :model-value="dateValue"
            @update:model-value="updateDate"
            mask="YYYY-MM-DD"
          >
            <div class="row items-center justify-end">
              <q-btn v-close-popup label="Close" color="primary" flat />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import type { Field } from '@components/shared/cms/types/content-type';

export default defineComponent({
  name: 'DateTimeField',
  props: {
    modelValue: {
      type: [String, Date],
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
    const displayValue = computed(() => {
      if (!props.modelValue) return '';
      
      const date = new Date(props.modelValue);
      if (isNaN(date.getTime())) return '';
      
      // Format for datetime-local input (YYYY-MM-DDTHH:MM)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    });
    
    const dateValue = computed(() => {
      if (!props.modelValue) return '';
      
      const date = new Date(props.modelValue);
      if (isNaN(date.getTime())) return '';
      
      // Format for q-date (YYYY/MM/DD)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}/${month}/${day}`;
    });
    
    const validationRules = computed(() => {
      const rules: ((val: any) => boolean | string)[] = [];
      
      // Required validation
      if (props.field.required) {
        rules.push((val: any) => {
          if (!val || val === '') {
            return 'This field is required';
          }
          return true;
        });
      }
      
      // Valid date validation
      rules.push((val: string) => {
        if (val && val !== '') {
          const date = new Date(val);
          if (isNaN(date.getTime())) {
            return 'Invalid date format';
          }
        }
        return true;
      });
      
      return rules;
    });
    
    const updateValue = (value: string | number | null) => {
      const stringValue = value?.toString() || '';
      
      if (!stringValue || stringValue === '') {
        emit('update:modelValue', null);
        return;
      }
      
      const date = new Date(stringValue);
      if (!isNaN(date.getTime())) {
        emit('update:modelValue', date.toISOString());
      }
    };
    
    const updateDate = (dateStr: string) => {
      if (!dateStr) {
        emit('update:modelValue', null);
        return;
      }
      
      // Convert from YYYY/MM/DD format to Date
      const [year, month, day] = dateStr.split('/').map(Number);
      
      // Preserve existing time if available, otherwise use current time
      let hours = 0;
      let minutes = 0;
      let seconds = 0;
      
      if (props.modelValue) {
        const existingDate = new Date(props.modelValue);
        if (!isNaN(existingDate.getTime())) {
          hours = existingDate.getHours();
          minutes = existingDate.getMinutes();
          seconds = existingDate.getSeconds();
        }
      }
      
      const newDate = new Date(year, month - 1, day, hours, minutes, seconds);
      emit('update:modelValue', newDate.toISOString());
    };
    
    const validateField = () => {
      const value = displayValue.value;
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
      displayValue,
      dateValue,
      validationRules,
      updateValue,
      updateDate,
      validateField
    };
  }
});
</script>