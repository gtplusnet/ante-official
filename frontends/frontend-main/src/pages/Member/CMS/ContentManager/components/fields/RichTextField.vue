<template>
  <div class="rich-text-field">
    <q-editor
      :model-value="modelValue"
      @update:model-value="updateValue"
      :placeholder="field.placeholder || `Enter ${field.displayName || field.name}`"
      :readonly="field.readonly"
      :disable="field.disabled"
      :toolbar="toolbar"
      :min-height="getMinHeight()"
      class="rich-text-editor"
      @blur="validateField"
    />
    
    <!-- Error Message -->
    <div v-if="error" class="field-error text-negative text-caption q-mt-xs">
      {{ error }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import type { Field } from '@components/shared/cms/types/content-type';

export default defineComponent({
  name: 'RichTextField',
  props: {
    modelValue: {
      type: String,
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
    const getMinHeight = (): string => {
      // Determine minimum height based on field size or default
      switch (props.field.size) {
        case 'full':
          return '300px';
        case 'half':
          return '200px';
        default:
          return '200px';
      }
    };
    
    const toolbar = [
      ['bold', 'italic', 'underline', 'strike'],
      ['quote', 'unordered', 'ordered'],
      ['link'],
      ['undo', 'redo'],
      ['viewsource'],
      ['fullscreen']
    ];
    
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
    
    return {
      getMinHeight,
      toolbar,
      validationRules,
      updateValue,
      validateField
    };
  }
});
</script>

<style scoped lang="scss">
.rich-text-field {
  .rich-text-editor {
    border: 1px solid rgba(0, 0, 0, 0.24);
    border-radius: 4px;
    
    &.q-field--focused {
      border-color: var(--q-primary);
      border-width: 2px;
    }
    
    &.q-field--error {
      border-color: var(--q-negative);
    }
    
    :deep(.q-editor__content) {
      min-height: inherit;
    }
    
    :deep(.q-editor__toolbar) {
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }
  }
  
  .field-error {
    color: var(--q-negative);
    font-size: 12px;
    line-height: 1.2;
    margin-top: 4px;
  }
}
</style>