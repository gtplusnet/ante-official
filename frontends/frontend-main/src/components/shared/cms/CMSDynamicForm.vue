<template>
  <div class="cms-dynamic-form" :class="`mode-${mode}`">
    <q-form ref="formRef" @submit="handleSubmit" @validation-error="handleValidationError">
      <!-- Form Header (optional) -->
      <div v-if="showHeader && formTitle" class="form-header q-mb-md">
        <h3 class="text-h6 q-mb-sm">{{ formTitle }}</h3>
        <q-separator />
      </div>

      <!-- Dynamic Fields Grid -->
      <div class="form-fields-grid">
        <component
          v-for="field in processedFields"
          :key="field.id"
          :is="getFieldComponentName(field.type)"
          :field="field"
          :value="localFormData[field.name]"
          :mode="mode"
          :readonly="readonly || field.readonly"
          :disabled="field.disabled"
          :content-types="contentTypes"
          :components="components"
          :class="getFieldClassName(field)"
          @update="handleFieldUpdate(field.name, $event)"
          @validate="handleFieldValidation(field.name, $event)"
        />
      </div>

      <!-- Form Actions (optional) -->
      <div v-if="showActions && mode !== 'preview'" class="form-actions q-mt-lg">
        <slot name="actions">
          <q-btn 
            flat 
            label="Cancel" 
            color="grey-7"
            @click="handleCancel" 
            class="q-mr-sm"
          />
          <q-btn 
            unelevated 
            color="primary" 
            :label="submitLabel" 
            type="submit"
            :loading="loading"
          />
        </slot>
      </div>
    </q-form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, PropType, onMounted } from 'vue';
import { ContentType, Field } from './types/content-type';
import { getFieldComponent, getFieldClass } from './utils/field-mapper';
import { generateFormData } from './utils/mock-data-generator';
import { useQuasar } from 'quasar';

// Import field components
import CMSTextField from './field-renderers/CMSTextField.vue';
import CMSRichTextField from './field-renderers/CMSRichTextField.vue';
import CMSNumberField from './field-renderers/CMSNumberField.vue';
import CMSDateTimeField from './field-renderers/CMSDateTimeField.vue';
import CMSBooleanField from './field-renderers/CMSBooleanField.vue';
import CMSMediaField from './field-renderers/CMSMediaField.vue';
import CMSRelationField from './field-renderers/CMSRelationField.vue';
import CMSJsonField from './field-renderers/CMSJsonField.vue';
import CMSUidField from './field-renderers/CMSUidField.vue';
import CMSEmailField from './field-renderers/CMSEmailField.vue';
import CMSPasswordField from './field-renderers/CMSPasswordField.vue';
import CMSEnumerationField from './field-renderers/CMSEnumerationField.vue';
import CMSComponentField from './field-renderers/CMSComponentField.vue';
import CMSDynamicZoneField from './field-renderers/CMSDynamicZoneField.vue';

export default defineComponent({
  name: 'CMSDynamicForm',
  components: {
    CMSTextField,
    CMSRichTextField,
    CMSNumberField,
    CMSDateTimeField,
    CMSBooleanField,
    CMSMediaField,
    CMSRelationField,
    CMSJsonField,
    CMSUidField,
    CMSEmailField,
    CMSPasswordField,
    CMSEnumerationField,
    CMSComponentField,
    CMSDynamicZoneField,
  },
  props: {
    contentType: {
      type: Object as PropType<ContentType>,
      required: true
    },
    formData: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({})
    },
    mode: {
      type: String as PropType<'preview' | 'create' | 'edit' | 'view'>,
      default: 'create',
      validator: (val: string) => ['preview', 'create', 'edit', 'view'].includes(val)
    },
    readonly: {
      type: Boolean,
      default: false
    },
    showHeader: {
      type: Boolean,
      default: true
    },
    showActions: {
      type: Boolean,
      default: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    contentTypes: {
      type: Array as PropType<ContentType[]>,
      default: () => []
    },
    components: {
      type: Array as PropType<ContentType[]>,
      default: () => []
    }
  },
  emits: ['submit', 'cancel', 'field-change', 'validation-error'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const formRef = ref<any>(null);
    const localFormData = ref<Record<string, any>>({});
    const validationErrors = ref<Record<string, string>>({});

    // Computed properties
    const formTitle = computed(() => {
      if (!props.contentType) return '';
      
      const action = props.mode === 'create' ? 'Create' : 
                    props.mode === 'edit' ? 'Edit' : 
                    props.mode === 'view' ? 'View' : 'Preview';
      
      return `${action} ${props.contentType.displayName || props.contentType.name}`;
    });

    const submitLabel = computed(() => {
      return props.mode === 'create' ? 'Create' :
             props.mode === 'edit' ? 'Save' : 'Submit';
    });

    const processedFields = computed(() => {
      // Add default sizes if not specified
      return props.contentType?.fields?.map(field => ({
        ...field,
        size: field.size || 'full'
      })) || [];
    });

    // Initialize form data
    const initializeFormData = () => {
      if (props.mode === 'preview') {
        // Generate mock data for preview
        localFormData.value = generateFormData(props.contentType?.fields || []);
      } else if (props.mode === 'edit' || props.mode === 'view') {
        // Use provided data
        localFormData.value = { ...props.formData };
      } else {
        // Initialize with default values
        const data: Record<string, any> = {};
        props.contentType?.fields?.forEach(field => {
          data[field.name] = field.defaultValue || null;
        });
        localFormData.value = data;
      }
    };

    // Methods
    const getFieldComponentName = (type: string) => {
      return getFieldComponent(type as any);
    };

    const getFieldClassName = (field: Field) => {
      return getFieldClass(field);
    };

    const handleFieldUpdate = (fieldName: string, value: any) => {
      localFormData.value[fieldName] = value;
      emit('field-change', { field: fieldName, value });
    };

    const handleFieldValidation = (fieldName: string, isValid: boolean | string) => {
      if (isValid === true) {
        delete validationErrors.value[fieldName];
      } else {
        validationErrors.value[fieldName] = isValid as string;
      }
    };

    const handleSubmit = async () => {
      const isValid = await formRef.value?.validate();
      if (isValid) {
        emit('submit', localFormData.value);
      }
    };

    const handleValidationError = () => {
      emit('validation-error', validationErrors.value);
      $q.notify({
        type: 'warning',
        message: 'Please fix the validation errors',
        position: 'top'
      });
    };

    const handleCancel = () => {
      emit('cancel');
    };

    // Lifecycle
    onMounted(() => {
      initializeFormData();
    });

    // Watchers
    watch(() => props.formData, () => {
      if (props.mode !== 'preview') {
        localFormData.value = { ...props.formData };
      }
    }, { deep: true });

    watch(() => props.contentType, () => {
      initializeFormData();
    }, { deep: true });

    return {
      formRef,
      localFormData,
      formTitle,
      submitLabel,
      processedFields,
      getFieldComponentName,
      getFieldClassName,
      handleFieldUpdate,
      handleFieldValidation,
      handleSubmit,
      handleValidationError,
      handleCancel
    };
  }
});
</script>

<style lang="scss" scoped>
.cms-dynamic-form {
  .form-header {
    h3 {
      margin: 0;
      color: #1a1a1a;
    }
  }

  .form-fields-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 16px;
    padding: 16px 0;
    
    .field-size-full { 
      grid-column: span 12; 
    }
    
    .field-size-two-thirds { 
      grid-column: span 8; 
    }
    
    .field-size-half { 
      grid-column: span 6; 
    }
    
    .field-size-third { 
      grid-column: span 4; 
    }
    
    // Responsive behavior
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      
      .field-size-full,
      .field-size-two-thirds,
      .field-size-half,
      .field-size-third {
        grid-column: span 1;
      }
    }
    
    @media (min-width: 769px) and (max-width: 1024px) {
      grid-template-columns: repeat(6, 1fr);
      
      .field-size-full {
        grid-column: span 6;
      }
      
      .field-size-two-thirds {
        grid-column: span 4;
      }
      
      .field-size-half {
        grid-column: span 3;
      }
      
      .field-size-third {
        grid-column: span 2;
      }
    }
  }
  
  // Mode-specific styles
  &.mode-preview {
    .q-field {
      pointer-events: none;
      opacity: 0.9;
    }
    
    .q-btn:not(.close-btn) {
      pointer-events: none;
      opacity: 0.7;
    }
  }
  
  &.mode-view {
    .q-field {
      .q-field__control {
        background: #f5f5f5;
      }
    }
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    padding-top: 16px;
    border-top: 1px solid #e0e0e0;
  }
}
</style>