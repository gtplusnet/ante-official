<template>
  <div class="content-form">
    <!-- Header -->
    <div class="form-header">
      <div class="header-info">
        <div class="breadcrumb">
          <q-btn 
            v-if="!isSingleType"
            flat 
            size="sm" 
            icon="arrow_back" 
            @click="$emit('cancel')"
            class="q-mr-sm"
          />
          <span class="text-grey-6">{{ contentType.displayName || contentType.name }}</span>
          <q-icon v-if="!isSingleType" name="chevron_right" size="16px" class="q-mx-sm text-grey-4" />
          <span v-if="!isSingleType" class="text-weight-medium">
            {{ mode === 'create' ? 'Create Entry' : 'Edit Entry' }}
          </span>
        </div>
        
        <h5 class="q-ma-none q-mt-sm">
          {{ isSingleType 
            ? (contentType.displayName || contentType.name) 
            : (mode === 'create' ? 'Create New Entry' : getEntryTitle()) 
          }}
        </h5>
      </div>
      
      <div class="header-actions">
        <q-btn
          flat
          color="grey-7"
          icon="o_visibility"
          label="Preview"
          @click="$emit('preview', formData)"
          class="q-mr-sm"
        />
        
        <q-btn
          outline
          color="grey-7"
          icon="o_save"
          :label="isSingleType ? 'Save' : 'Save Draft'"
          @click="saveDraft"
          class="q-mr-sm"
          :loading="saving"
        />
        
        <q-btn
          color="primary"
          icon="o_public"
          :label="isSingleType 
            ? 'Save & Publish' 
            : (mode === 'create' ? 'Create & Publish' : 'Save & Publish')"
          @click="saveAndPublish"
          :loading="saving"
        />
      </div>
    </div>
    
    <!-- Form Content -->
    <div class="form-content">
      <q-form @submit="handleSubmit" class="content-form-container" 
              :class="{ 'empty-state-container': !contentType.fields || contentType.fields.length === 0 }">
        <!-- Form Fields Grid -->
        <div class="form-fields-grid">
          <div 
            v-for="field in processedFields" 
            :key="field.id"
            class="form-field"
            :class="field.gridClass"
          >
            <div class="field-wrapper">
              <!-- Field Label -->
              <div class="field-label">
                {{ field.displayName || field.name }}
                <span v-if="field.required" class="text-red">*</span>
                <q-icon 
                  v-if="field.tooltip" 
                  name="help_outline" 
                  size="16px" 
                  class="q-ml-xs text-grey-6"
                >
                  <q-tooltip>{{ field.tooltip }}</q-tooltip>
                </q-icon>
              </div>
              
              <!-- Field Description -->
              <div v-if="field.hint" class="field-hint text-caption text-grey-6 q-mb-sm">
                {{ field.hint }}
              </div>
              
              <!-- Dynamic Field Rendering -->
              <component
                :is="getFieldComponent(field.type)"
                v-model="formData.data[field.name]"
                :field="field"
                :error="fieldErrors[field.name]"
                :content-type="contentType"
                @update:model-value="updateField(field.name, $event)"
                @validate="validateField(field.name, $event)"
              />
              
              <!-- Field Error -->
              <div v-if="fieldErrors[field.name]" class="field-error text-negative text-caption q-mt-xs">
                {{ fieldErrors[field.name] }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- No Fields State -->
        <div v-if="!contentType.fields || contentType.fields.length === 0" class="empty-fields-state">
          <q-icon name="o_dashboard_customize" size="48px" color="grey-4" />
          <div class="text-h6 text-grey-6 q-mt-md">No fields defined</div>
          <div class="text-body2 text-grey-5 q-mt-xs">
            Add fields to the content type to enable content creation
          </div>
        </div>
      </q-form>
    </div>
    
    <!-- Bottom Publication Panel -->
    <div class="publication-panel">
      <!-- Publication Controls -->
      <div class="panel-controls">
        <q-select
          v-model="formData.status"
          :options="statusOptions"
          emit-value
          map-options
          outlined
          dense
          class="status-select"
          label="Status"
        />
        
        
        <q-select
          v-if="contentType.internationalization"
          v-model="formData.locale"
          :options="localeOptions"
          emit-value
          map-options
          outlined
          dense
          label="Locale"
          class="locale-select"
        />
      </div>
      
      <!-- Entry Information -->
      <div v-if="entry" class="panel-info">
        <span class="info-item">ID: {{ entry.id }}</span>
        <span class="info-item">Created: {{ formatDate(entry.createdAt) }}</span>
        <span class="info-item">Updated: {{ formatDate(entry.updatedAt) }}</span>
        <span v-if="entry.publishedAt" class="info-item">Published: {{ formatDate(entry.publishedAt) }}</span>
        <span v-if="entry.version" class="info-item">v{{ entry.version }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, PropType } from 'vue';
import { useQuasar } from 'quasar';
import type { ContentType } from '@components/shared/cms/types/content-type';
import type { ContentEntry } from 'src/services/cms-content.service';

// Import field components
import TextField from './fields/TextField.vue';
import RichTextField from './fields/RichTextField.vue';
import NumberField from './fields/NumberField.vue';
import BooleanField from './fields/BooleanField.vue';
import DateTimeField from './fields/DateTimeField.vue';
import EnumerationField from './fields/EnumerationField.vue';
import MediaField from './fields/MediaField.vue';
import RelationField from './fields/RelationField.vue';

export default defineComponent({
  name: 'ContentForm',
  components: {
    TextField,
    RichTextField,
    NumberField,
    BooleanField,
    DateTimeField,
    EnumerationField,
    MediaField,
    RelationField
  },
  props: {
    contentType: {
      type: Object as PropType<ContentType>,
      required: true
    },
    entry: {
      type: Object as PropType<ContentEntry | null>,
      default: null
    },
    mode: {
      type: String as PropType<'create' | 'edit'>,
      required: true
    }
  },
  emits: ['save', 'cancel', 'preview'],
  setup(props, { emit }) {
    const $q = useQuasar();
    
    // State
    const saving = ref(false);
    const fieldErrors = ref<Record<string, string>>({});
    
    // Form data
    const formData = ref<{
      data: Record<string, any>;
      status: 'draft' | 'published' | 'archived';
      locale: string;
      publishedAt?: Date;
      metadata?: any;
    }>({
      data: {},
      status: 'draft',
      locale: 'en'
    });
    
    // Options
    const statusOptions = [
      { label: 'Draft', value: 'draft' },
      { label: 'Published', value: 'published' }
    ];
    
    const localeOptions = [
      { label: 'English', value: 'en' },
      { label: 'Spanish', value: 'es' },
      { label: 'French', value: 'fr' }
    ];
    
    // Initialize form data
    const initializeFormData = () => {
      const data: Record<string, any> = {};
      
      // Initialize fields with default values
      props.contentType.fields.forEach(field => {
        if (props.entry && props.entry.data[field.name] !== undefined) {
          // Use existing entry data
          data[field.name] = props.entry.data[field.name];
        } else if (field.defaultValue !== undefined) {
          // Use field default value
          data[field.name] = field.defaultValue;
        } else {
          // Initialize with appropriate empty value
          switch (field.type) {
            case 'boolean':
              data[field.name] = false;
              break;
            case 'number':
              data[field.name] = null;
              break;
            case 'enumeration':
              data[field.name] = null;
              break;
            default:
              data[field.name] = '';
          }
        }
      });
      
      formData.value = {
        data,
        status: props.entry?.status || 'draft',
        locale: props.entry?.locale || 'en',
        publishedAt: props.entry?.publishedAt,
        metadata: (props.entry as any)?.metadata || {}
      };
      
    };
    
    // Watch for entry changes
    watch(() => props.entry, () => {
      initializeFormData();
    }, { immediate: true });
    
    // Methods
    const getFieldComponent = (fieldType: string): string => {
      const componentMap: Record<string, string> = {
        'text': 'TextField',
        'email': 'TextField',
        'uid': 'TextField',
        'password': 'TextField',
        'richtext': 'RichTextField',
        'number': 'NumberField',
        'datetime': 'DateTimeField',
        'boolean': 'BooleanField',
        'enumeration': 'EnumerationField',
        'media': 'MediaField',
        'relation': 'RelationField',
        'json': 'TextField', // TODO: Create JsonField
        'component': 'TextField', // TODO: Create ComponentField
        'dynamiczone': 'TextField' // TODO: Create DynamicZoneField
      };
      
      return componentMap[fieldType] || 'TextField';
    };
    
    const getFieldColumns = (size?: string): number => {
      switch (size) {
        case 'half': return 6;
        case 'third': return 4;
        case 'two-thirds': return 8;
        default: return 12;
      }
    };

    interface ProcessedField {
      id: string;
      name: string;
      displayName?: string;
      type: string;
      size?: string;
      required?: boolean;
      columns: number;
      gridClass: string;
      [key: string]: any;
    }

    const processFieldsForGrid = (fields: any[]): ProcessedField[] => {
      const processedFields: ProcessedField[] = [];
      let currentRowColumns = 0;
      let currentRow: ProcessedField[] = [];
      
      fields.forEach((field, index) => {
        const fieldColumns = getFieldColumns(field.size);
        
        // If this field would overflow the row, finalize current row
        if (currentRowColumns + fieldColumns > 12) {
          // Expand last field in row to fill remaining space
          if (currentRow.length > 0 && currentRowColumns < 12) {
            const lastField = currentRow[currentRow.length - 1];
            lastField.gridClass = `field-size-${lastField.columns + (12 - currentRowColumns)}`;
          }
          processedFields.push(...currentRow);
          currentRow = [];
          currentRowColumns = 0;
        }
        
        // Add field to current row
        const processedField: ProcessedField = {
          ...field,
          columns: fieldColumns,
          gridClass: `field-size-${fieldColumns}`
        };
        currentRow.push(processedField);
        currentRowColumns += fieldColumns;
        
        // Check if this is the last field
        if (index === fields.length - 1) {
          // Expand last field to fill row if needed
          if (currentRowColumns < 12 && currentRow.length === 1) {
            processedField.gridClass = 'field-size-12';
          } else if (currentRowColumns < 12) {
            const lastField = currentRow[currentRow.length - 1];
            lastField.gridClass = `field-size-${lastField.columns + (12 - currentRowColumns)}`;
          }
          processedFields.push(...currentRow);
        }
      });
      
      return processedFields;
    };
    
    // Computed property to check if this is a single type
    const isSingleType = computed(() => {
      return props.contentType.type === 'single';
    });

    // Computed property for processed fields with smart grid sizing
    const processedFields = computed(() => {
      return processFieldsForGrid(props.contentType.fields || []);
    });
    
    const updateField = (fieldName: string, value: any) => {
      formData.value.data[fieldName] = value;
      // Clear field error when value changes
      if (fieldErrors.value[fieldName]) {
        delete fieldErrors.value[fieldName];
      }
    };
    
    const validateField = (fieldName: string, isValid: boolean) => {
      if (!isValid) {
        fieldErrors.value[fieldName] = 'Invalid value';
      } else {
        delete fieldErrors.value[fieldName];
      }
    };
    
    
    const validateForm = (): boolean => {
      const errors: Record<string, string> = {};
      
      props.contentType.fields.forEach(field => {
        const value = formData.value.data[field.name];
        
        // Required field validation
        if (field.required && (value === null || value === undefined || value === '')) {
          errors[field.name] = 'This field is required';
        }
        
        // Type-specific validation
        if (value !== null && value !== undefined && value !== '') {
          switch (field.type) {
            case 'email':
              if (typeof value === 'string' && !isValidEmail(value)) {
                errors[field.name] = 'Invalid email format';
              }
              break;
            case 'number':
              if (typeof value !== 'number' && !isValidNumber(value)) {
                errors[field.name] = 'Invalid number';
              }
              break;
          }
        }
        
        // Length validation
        if (typeof value === 'string') {
          if (field.minLength && value.length < field.minLength) {
            errors[field.name] = `Minimum length is ${field.minLength}`;
          }
          if (field.maxLength && value.length > field.maxLength) {
            errors[field.name] = `Maximum length is ${field.maxLength}`;
          }
        }
      });
      
      fieldErrors.value = errors;
      return Object.keys(errors).length === 0;
    };
    
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };
    
    const isValidNumber = (value: any): boolean => {
      return !isNaN(Number(value));
    };
    
    const getEntryTitle = (): string => {
      if (!props.entry) {
        return props.mode === 'create' ? 'New Entry' : 'Edit Entry';
      }
      
      // Try to find a suitable title field from the entry data
      const titleFields = ['title', 'name', 'displayName', 'label', 'heading', 'subject'];
      
      if (props.entry.data) {
        for (const field of titleFields) {
          const value = props.entry.data[field];
          if (value && typeof value === 'string' && value.trim()) {
            return value.trim();
          }
        }
        
        // Try to get the first text field with content
        const firstTextField = Object.entries(props.entry.data).find(([key, value]) => 
          value && typeof value === 'string' && value.trim() && !['id', 'createdAt', 'updatedAt'].includes(key)
        );
        
        if (firstTextField && firstTextField[1]) {
          const text = String(firstTextField[1]).trim();
          return text.length > 50 ? text.substring(0, 50) + '...' : text;
        }
      }
      
      // Fallback to entry ID if available
      if (props.entry.id) {
        return `Entry ${props.entry.id}`;
      }
      
      // Final fallback
      return 'Edit Entry';
    };
    
    const formatDate = (date: string | Date): string => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    };
    
    const saveDraft = async () => {
      if (!validateForm()) {
        // Show validation error feedback to user
        $q.notify({
          type: 'negative',
          message: 'Please fix the validation errors before saving',
          position: 'top',
          timeout: 3000
        });
        return;
      }
      
      saving.value = true;
      try {
        const saveData = {
          ...formData.value,
          status: 'draft' as const
        };
        
        // Emit save event and wait for parent to handle it
        emit('save', saveData);
        
        // Don't set saving to false here - let parent component handle the loading state
        // The parent will call success/error callbacks which will reset the loading state
      } catch (error) {
        saving.value = false;
        console.error('Error preparing save data:', error);
      }
    };
    
    const saveAndPublish = async () => {
      if (!validateForm()) {
        // Show validation error feedback to user
        $q.notify({
          type: 'negative',
          message: 'Please fix the validation errors before publishing',
          position: 'top',
          timeout: 3000
        });
        return;
      }
      
      saving.value = true;
      try {
        const saveData = {
          ...formData.value,
          status: 'published' as const,
          publishedAt: formData.value.publishedAt || new Date()
        };
        
        // Emit save event and wait for parent to handle it
        emit('save', saveData);
        
        // Don't set saving to false here - let parent component handle the loading state
        // The parent will call success/error callbacks which will reset the loading state
      } catch (error) {
        saving.value = false;
        console.error('Error preparing save data:', error);
      }
    };
    
    const handleSubmit = () => {
      saveAndPublish();
    };
    
    // Methods to be called by parent component after save operation
    const onSaveSuccess = () => {
      saving.value = false;
      // Close form by emitting cancel (this will take user back to list)
      emit('cancel');
    };
    
    const onSaveError = (errorMessage?: string) => {
      saving.value = false;
      console.error('Save failed:', errorMessage);
      // Form stays open so user can retry or make changes
    };
    
    return {
      saving,
      fieldErrors,
      formData,
      statusOptions,
      localeOptions,
      isSingleType,
      getFieldComponent,
      processedFields,
      updateField,
      validateField,
      getEntryTitle,
      formatDate,
      saveDraft,
      saveAndPublish,
      handleSubmit,
      onSaveSuccess,
      onSaveError
    };
  }
});
</script>

<style scoped lang="scss">
// Material Design 3 Color Tokens
$md-sys-color-surface: #fefbff;
$md-sys-color-surface-container-lowest: #ffffff;
$md-sys-color-surface-container-low: #f8f8ff;
$md-sys-color-surface-container: #f2f2f9;
$md-sys-color-surface-container-high: #ececf4;
$md-sys-color-surface-container-highest: #e6e6ee;

$md-sys-color-primary: #6750a4;
$md-sys-color-primary-container: #eaddff;
$md-sys-color-on-primary: #ffffff;
$md-sys-color-on-primary-container: #21005d;

$md-sys-color-secondary: #625b71;
$md-sys-color-secondary-container: #e8def8;
$md-sys-color-on-secondary: #ffffff;
$md-sys-color-on-secondary-container: #1d192b;

$md-sys-color-tertiary: #7d5260;
$md-sys-color-tertiary-container: #ffd8e4;
$md-sys-color-on-tertiary: #ffffff;
$md-sys-color-on-tertiary-container: #31111d;

$md-sys-color-error: #ba1a1a;
$md-sys-color-error-container: #ffdad6;
$md-sys-color-on-error: #ffffff;
$md-sys-color-on-error-container: #410002;

$md-sys-color-outline: #79747e;
$md-sys-color-outline-variant: #cac4d0;

$md-sys-color-on-surface: #1c1b1f;
$md-sys-color-on-surface-variant: #49454f;

// Flat Material Design - Minimal Elevation
@mixin flat-elevation {
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);
}

@mixin flat-elevation-hover {
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.12);
}

// Flat Material Design Typography - Readable weights, smaller sizes
@mixin flat-title-large {
  font-family: 'Inter', 'Roboto', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 22px;
  letter-spacing: 0;
}

@mixin flat-title-medium {
  font-family: 'Inter', 'Roboto', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.1px;
}

@mixin flat-label-large {
  font-family: 'Inter', 'Roboto', system-ui, sans-serif;
  font-size: 11px;
  font-weight: 500;
  line-height: 14px;
  letter-spacing: 0.05px;
}

@mixin flat-body-large {
  font-family: 'Inter', 'Roboto', system-ui, sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: 0.15px;
}

@mixin flat-body-medium {
  font-family: 'Inter', 'Roboto', system-ui, sans-serif;
  font-size: 11px;
  font-weight: 400;
  line-height: 15px;
  letter-spacing: 0.1px;
}

@mixin flat-body-small {
  font-family: 'Inter', 'Roboto', system-ui, sans-serif;
  font-size: 10px;
  font-weight: 400;
  line-height: 12px;
  letter-spacing: 0.15px;
}

.content-form {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: $md-sys-color-surface;
  
  .form-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 16px 20px;
    background: $md-sys-color-surface-container-lowest;
    border-bottom: 1px solid $md-sys-color-outline-variant;
    @include flat-elevation;
    
    .header-info {
      flex: 1;
      
      .breadcrumb {
        display: flex;
        align-items: center;
        @include flat-body-medium;
        margin-bottom: 6px;
        
        .q-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          color: $md-sys-color-on-surface-variant;
          transition: all 0.15s ease;
          
          &:hover {
            background: rgba($md-sys-color-on-surface, 0.04);
            @include flat-elevation-hover;
            transform: translateY(-1px);
          }
        }
        
        span {
          color: $md-sys-color-on-surface-variant;
        }
        
        .text-weight-medium {
          @include flat-body-large;
          color: $md-sys-color-on-surface;
          font-weight: 400;
        }
      }
      
      h5 {
        @include flat-title-large;
        color: $md-sys-color-on-surface;
        margin: 0;
      }
    }
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .q-btn {
        height: 36px;
        border-radius: 6px;
        @include flat-label-large;
        transition: all 0.15s ease;
        
        &.q-btn--flat {
          color: $md-sys-color-on-surface-variant;
          
          &:hover {
            background: rgba($md-sys-color-on-surface, 0.04);
            transform: translateY(-1px);
          }
        }
        
        &.q-btn--outline {
          border: 1px solid $md-sys-color-outline;
          color: $md-sys-color-on-surface;
          
          &:hover {
            background: rgba($md-sys-color-on-surface, 0.04);
            @include flat-elevation-hover;
            transform: translateY(-1px);
          }
        }
        
        &.q-btn--standard {
          background: $md-sys-color-primary;
          color: $md-sys-color-on-primary;
          
          &:hover {
            @include flat-elevation-hover;
            transform: translateY(-1px);
          }
        }
      }
    }
  }
  
  .form-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: $md-sys-color-surface;
    
    .content-form-container {
      flex: 1;
      width: 100%;
      padding: 16px 20px;
      overflow-y: auto;
      
      &.empty-state-container {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .form-fields-grid {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: 12px;
        width: 100%;
        background: $md-sys-color-surface-container-lowest;
        border-radius: 8px;
        padding: 16px;
        @include flat-elevation;
        transition: all 0.15s ease;
        
        &:hover {
          @include flat-elevation-hover;
        }
        
        .form-field {
          
          .field-wrapper {
            .field-label {
              @include flat-body-large;
              font-weight: 400;
              margin-bottom: 4px;
              color: $md-sys-color-on-surface;
              display: flex;
              align-items: center;
              
              .text-red {
                color: $md-sys-color-error;
                margin-left: 2px;
              }
              
              .q-icon {
                color: $md-sys-color-on-surface-variant;
              }
            }
            
            .field-hint {
              @include flat-body-small;
              color: $md-sys-color-on-surface-variant;
              margin-bottom: 6px;
              line-height: 1.3;
            }
            
            .field-error {
              @include flat-body-small;
              color: $md-sys-color-error;
              margin-top: 3px;
            }
            
            // Global field styling
            :deep(.q-field) {
              .q-field__control {
                border-radius: 8px;
                border-color: $md-sys-color-outline-variant;
                transition: all 0.15s ease;
                
                &:hover {
                  border-color: $md-sys-color-outline;
                }
              }
              
              .q-field__native {
                @include flat-body-large;
                color: $md-sys-color-on-surface;
              }
              
              .q-field__label {
                @include flat-body-medium;
                color: $md-sys-color-on-surface-variant;
              }
              
              &.q-field--focused {
                .q-field__control {
                  border-color: $md-sys-color-primary;
                  border-width: 2px;
                }
                
                .q-field__label {
                  color: $md-sys-color-primary;
                }
              }
              
              &.q-field--error {
                .q-field__control {
                  border-color: $md-sys-color-error;
                }
                
                .q-field__label {
                  color: $md-sys-color-error;
                }
              }
            }
          }
          
          // Grid field size classes (all possible spans for auto-fill)
          &.field-size-12 {
            grid-column: span 12;
          }
          
          &.field-size-11 {
            grid-column: span 11;
          }
          
          &.field-size-10 {
            grid-column: span 10;
          }
          
          &.field-size-9 {
            grid-column: span 9;
          }
          
          &.field-size-8 {
            grid-column: span 8;
          }
          
          &.field-size-7 {
            grid-column: span 7;
          }
          
          &.field-size-6 {
            grid-column: span 6;
          }
          
          &.field-size-5 {
            grid-column: span 5;
          }
          
          &.field-size-4 {
            grid-column: span 4;
          }
          
          &.field-size-3 {
            grid-column: span 3;
          }
          
          &.field-size-2 {
            grid-column: span 2;
          }
          
          &.field-size-1 {
            grid-column: span 1;
          }
          
          @media (max-width: 768px) {
            grid-column: span 12 !important;
          }
        }
      }
      
      .empty-fields-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        width: 100%;
        max-width: 500px;
        margin: 0 auto;
        padding: 48px 32px;
        text-align: center;
        background: $md-sys-color-surface-container-lowest;
        border-radius: 12px;
        @include flat-elevation;
        
        .q-icon {
          color: $md-sys-color-on-surface-variant;
        }
        
        .text-h6 {
          @include flat-title-medium;
          color: $md-sys-color-on-surface;
          margin: 12px 0 6px;
        }
        
        .text-body2 {
          @include flat-body-medium;
          color: $md-sys-color-on-surface-variant;
        }
      }
    }
  }
  
  // Bottom Publication Panel (contained within form)
  .publication-panel {
    height: 56px;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 0 20px;
    background: $md-sys-color-surface-container-lowest;
    border-top: 1px solid $md-sys-color-outline-variant;
    @include flat-elevation;
    flex-shrink: 0;
    width: 100%;
    
    .panel-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .status-select,
      .locale-select {
        min-width: 120px;
        
        :deep(.q-field__control) {
          height: 32px;
          border-radius: 6px;
        }
        
        :deep(.q-field__native) {
          @include flat-body-small;
        }
        
        :deep(.q-field__label) {
          @include flat-body-small;
          font-size: 10px;
        }
      }
      
    }
    
    .panel-info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      @include flat-body-small;
      color: $md-sys-color-on-surface-variant;
      margin-left: 16px;
      justify-content: flex-end;
      
      .info-item {
        white-space: nowrap;
        
        &:not(:last-child)::after {
          content: '|';
          margin-left: 12px;
          opacity: 0.3;
        }
      }
    }
    
    .panel-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .q-btn {
        height: 32px;
        @include flat-label-large;
        font-size: 10px;
        
        &.q-btn--flat {
          color: $md-sys-color-on-surface-variant;
          
          &:hover {
            background: rgba($md-sys-color-on-surface, 0.04);
          }
        }
        
        &.q-btn--outline {
          border: 1px solid $md-sys-color-outline;
          color: $md-sys-color-on-surface;
          
          &:hover {
            background: rgba($md-sys-color-on-surface, 0.04);
          }
        }
        
        &.q-btn--standard {
          background: $md-sys-color-primary;
          color: $md-sys-color-on-primary;
        }
      }
    }
    
    @media (max-width: 768px) {
      flex-wrap: wrap;
      height: auto;
      min-height: 56px;
      padding: 8px 16px;
      
      .panel-controls {
        order: 1;
        width: 100%;
        justify-content: space-between;
      }
      
      .panel-info {
        order: 2;
        width: 100%;
        margin-left: 0;
        justify-content: center;
        margin-top: 8px;
      }
    }
  }
}
</style>