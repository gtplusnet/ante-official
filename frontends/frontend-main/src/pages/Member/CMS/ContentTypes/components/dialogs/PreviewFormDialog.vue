<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card style="width: 900px; max-width: 90vw; max-height: 90vh">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          <q-icon name="o_visibility" size="28px" class="q-mr-sm" style="vertical-align: middle" />
          Preview: {{ contentType?.displayName || contentType?.name || 'Content Type' }}
        </div>
        <q-space />
        <q-btn icon="o_close" flat round dense @click="close" />
      </q-card-section>
      
      <q-card-section class="text-caption text-grey-7 q-pt-none">
        This preview shows how the content entry form will appear to users
      </q-card-section>

      <q-separator />

      <q-card-section class="scroll" style="max-height: 65vh; overflow-y: auto">
        <!-- Form Preview Fields -->
        <div v-if="contentType" class="preview-content q-pa-md">
          <div class="fields-container">
            <div 
              v-for="field in processedFields" 
              :key="field.id"
              class="preview-field"
              :class="field.gridClass"
            >
            <div class="field-label text-caption text-grey-7 q-mb-xs">
              {{ field.displayName || field.name }}
              <span v-if="field.required" class="text-red">*</span>
            </div>
            
            <!-- Text Fields -->
            <q-input
              v-if="field.type === 'text' || field.type === 'email' || field.type === 'uid'"
              :model-value="''"
              outlined
              dense
              readonly
              :placeholder="`Enter ${field.displayName || field.name}`"
              class="q-mb-sm"
            />
            
            <!-- Number Fields -->
            <q-input
              v-else-if="field.type === 'number'"
              :model-value="0"
              type="number"
              outlined
              dense
              readonly
              :placeholder="`Enter ${field.displayName || field.name}`"
              class="q-mb-sm"
            />
            
            <!-- Boolean Fields -->
            <q-toggle
              v-else-if="field.type === 'boolean'"
              :model-value="false"
              :label="field.displayName || field.name"
              disable
              class="q-mb-sm"
            />
            
            <!-- Enumeration Fields -->
            <q-select
              v-else-if="field.type === 'enumeration'"
              :model-value="null"
              outlined
              dense
              readonly
              :options="[]"
              :placeholder="`Select ${field.displayName || field.name}`"
              class="q-mb-sm"
            />
            
            <!-- Rich Text Fields -->
            <div
              v-else-if="field.type === 'richtext'"
              class="richtext-field-preview"
            >
              <q-editor
                :model-value="''"
                :placeholder="`Enter ${field.displayName || field.name}`"
                :toolbar="[]"
                :min-height="'200px'"
                readonly
                class="richtext-preview-editor q-mb-sm"
              />
            </div>
            
            <!-- DateTime Fields -->
            <q-input
              v-else-if="field.type === 'datetime'"
              :model-value="''"
              outlined
              dense
              readonly
              :placeholder="`Select ${field.type}`"
              class="q-mb-sm"
            >
              <template v-slot:append>
                <q-icon name="o_event" class="cursor-pointer" />
              </template>
            </q-input>
            
            <!-- Media Fields -->
            <div
              v-else-if="field.type === 'media'"
              class="media-field-preview"
            >
              <q-btn
                outline
                color="primary"
                :icon="getMediaFieldIcon(field)"
                :label="getMediaFieldLabel(field)"
                class="media-select-btn"
                disable
              >
                <q-tooltip>
                  {{ getMediaFieldDescription(field) }}
                </q-tooltip>
              </q-btn>
            </div>
            
            <!-- Default Field Type -->
            <q-input
              v-else
              :model-value="''"
              outlined
              dense
              readonly
              :placeholder="`${field.type} field`"
              class="q-mb-sm"
            />
            </div>
          </div>
          
          <!-- No Fields State -->
          <div v-if="!contentType.fields || contentType.fields.length === 0" class="text-center q-pa-xl text-grey-6">
            <q-icon name="o_dashboard_customize" size="48px" class="q-mb-md" />
            <div>No fields defined yet</div>
            <div class="text-caption">Add fields to see the form preview</div>
          </div>
        </div>
        
        <!-- Empty State -->
        <div v-else class="text-center q-pa-xl">
          <q-icon name="o_dashboard_customize" size="48px" color="grey-5" />
          <div class="text-body1 text-grey-7 q-mt-md">
            No content type selected
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <q-banner class="bg-blue-1 text-blue-10" style="border-radius: 8px">
          <template v-slot:avatar>
            <q-icon name="o_info" color="primary" />
          </template>
          <div class="text-caption">
            This preview demonstrates the form structure. Actual forms will have full functionality.
          </div>
        </q-banner>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import type { ContentType } from '@components/shared/cms/types/content-type';

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

export default defineComponent({
  name: 'PreviewFormDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    contentType: {
      type: Object as PropType<ContentType | null>,
      default: null
    },
    allContentTypes: {
      type: Array as PropType<ContentType[]>,
      default: () => []
    },
    components: {
      type: Array as PropType<ContentType[]>,
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const dialogVisible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    });

    const close = () => {
      dialogVisible.value = false;
    };

    const getFieldColumns = (size?: string): number => {
      switch (size) {
        case 'half': return 6;
        case 'third': return 4;
        case 'two-thirds': return 8;
        default: return 12;
      }
    };

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

    // Computed property for processed fields with smart grid sizing
    const processedFields = computed(() => {
      return processFieldsForGrid(props.contentType?.fields || []);
    });

    // Media field preview helpers
    const getMediaFieldIcon = (field: any): string => {
      if (field.mediaType === 'multiple') {
        return 'o_collections';
      }
      return 'o_perm_media';
    };

    const getMediaFieldLabel = (field: any): string => {
      const mediaType = field.mediaType === 'multiple' ? 'Select Media Files' : 'Select Media File';
      return mediaType;
    };

    const getMediaFieldDescription = (field: any): string => {
      const allowedTypes = field.allowedMediaTypes || ['image'];
      const isMultiple = field.mediaType === 'multiple';
      
      if (allowedTypes.includes('all') || allowedTypes.length === 0) {
        return `${isMultiple ? 'Multiple' : 'Single'} media selection - All types allowed`;
      }
      
      const typeLabels: Record<string, string> = {
        image: 'Images',
        video: 'Videos',
        audio: 'Audio',
        document: 'Documents',
        pdf: 'PDFs'
      };
      
      const typeNames = allowedTypes.map((type: string) => typeLabels[type] || type).join(', ');
      return `${isMultiple ? 'Multiple' : 'Single'} media selection - ${typeNames}`;
    };

    return {
      dialogVisible,
      close,
      processedFields,
      getMediaFieldIcon,
      getMediaFieldLabel,
      getMediaFieldDescription
    };
  },
});
</script>

<style scoped lang="scss">
.preview-content {
  background: white;
  border-radius: 8px;
  
  .fields-container {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 12px;
    
    .preview-field {
      .field-label {
        font-weight: 500;
        margin-bottom: 4px;
      }
      
      .q-field--readonly {
        .q-field__control {
          background: #f8f9fa;
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
  
  .media-field-preview {
    margin-bottom: 8px;
    
    .media-select-btn {
      width: 100%;
      justify-content: flex-start;
      padding: 12px 16px;
      font-weight: normal;
      border-style: dashed;
      border-width: 2px;
      border-radius: 8px;
      
      &.q-btn--outline.q-btn--disabled {
        opacity: 0.7;
        border-color: #1976d2;
        color: #1976d2;
      }
    }
  }
  
  .richtext-field-preview {
    margin-bottom: 8px;
    
    .richtext-preview-editor {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: #f8f9fa;
      
      :deep(.q-editor__content) {
        background: #f8f9fa;
        min-height: 200px;
      }
      
      :deep(.q-editor__toolbar) {
        display: none;
      }
    }
  }
}
</style>
