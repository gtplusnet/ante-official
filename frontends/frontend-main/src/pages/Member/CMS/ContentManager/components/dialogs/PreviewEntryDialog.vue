<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card style="width: 900px; max-width: 90vw; max-height: 90vh">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          <q-icon name="o_visibility" size="28px" class="q-mr-sm" style="vertical-align: middle" />
          Preview: {{ getEntryTitle() }}
        </div>
        <q-space />
        <q-btn icon="o_close" flat round dense @click="close" />
      </q-card-section>
      
      <q-card-section class="text-caption text-grey-7 q-pt-none">
        Content preview for {{ contentType?.displayName || contentType?.name || 'Unknown Type' }}
      </q-card-section>

      <q-separator />

      <q-card-section class="scroll" style="max-height: 65vh; overflow-y: auto">
        <!-- Entry Content -->
        <div v-if="entry && contentType" class="preview-content">
          <!-- Entry Metadata -->
          <div class="entry-metadata q-mb-lg">
            <div class="row q-gutter-md">
              <div class="col">
                <div class="metadata-item">
                  <div class="metadata-label">Status</div>
                  <q-badge 
                    :color="getStatusColor(entry.status)" 
                    :label="entry.status" 
                    rounded 
                  />
                </div>
              </div>
              
              <div class="col">
                <div class="metadata-item">
                  <div class="metadata-label">Created</div>
                  <div class="metadata-value">{{ formatDate(entry.createdAt) }}</div>
                </div>
              </div>
              
              <div class="col">
                <div class="metadata-item">
                  <div class="metadata-label">Updated</div>
                  <div class="metadata-value">{{ formatDate(entry.updatedAt) }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <q-separator class="q-mb-lg" />
          
          <!-- Field Values -->
          <div class="entry-fields">
            <div 
              v-for="field in contentType.fields" 
              :key="field.id"
              class="field-preview q-mb-md"
              :class="getFieldSizeClass(field.size)"
            >
              <div class="field-label text-weight-medium text-grey-8 q-mb-xs">
                {{ field.displayName || field.name }}
              </div>
              
              <div class="field-value">
                <!-- Text fields -->
                <div 
                  v-if="field.type === 'text' || field.type === 'email' || field.type === 'uid'"
                  class="text-value"
                >
                  {{ getFieldValue(field.name) || 'Not provided' }}
                </div>
                
                <!-- Rich text fields -->
                <div 
                  v-else-if="field.type === 'richtext'"
                  class="richtext-value"
                >
                  <div class="richtext-content">
                    {{ getFieldValue(field.name) || 'No content' }}
                  </div>
                </div>
                
                <!-- Number fields -->
                <div 
                  v-else-if="field.type === 'number'"
                  class="number-value"
                >
                  {{ formatNumber(getFieldValue(field.name)) }}
                </div>
                
                <!-- Boolean fields -->
                <div 
                  v-else-if="field.type === 'boolean'"
                  class="boolean-value"
                >
                  <q-icon 
                    :name="getFieldValue(field.name) ? 'check_circle' : 'radio_button_unchecked'"
                    :color="getFieldValue(field.name) ? 'positive' : 'grey'"
                    size="20px"
                  />
                  <span class="q-ml-xs">
                    {{ getFieldValue(field.name) ? 'Yes' : 'No' }}
                  </span>
                </div>
                
                <!-- DateTime fields -->
                <div 
                  v-else-if="field.type === 'datetime'"
                  class="datetime-value"
                >
                  {{ formatDateTime(getFieldValue(field.name)) }}
                </div>
                
                <!-- Enumeration fields -->
                <div 
                  v-else-if="field.type === 'enumeration'"
                  class="enum-value"
                >
                  <q-badge 
                    color="primary" 
                    :label="getFieldValue(field.name) || 'Not selected'" 
                    rounded 
                    outline
                  />
                </div>
                
                <!-- Default fallback -->
                <div v-else class="default-value">
                  {{ getFieldValue(field.name) || 'Not provided' }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- No Fields State -->
          <div v-if="!contentType.fields || contentType.fields.length === 0" class="empty-fields-state">
            <q-icon name="o_dashboard_customize" size="48px" color="grey-4" />
            <div class="text-body1 text-grey-7 q-mt-md">No fields defined</div>
            <div class="text-caption text-grey-5">Add fields to the content type to see content</div>
          </div>
        </div>
        
        <!-- Empty State -->
        <div v-else class="empty-state">
          <q-icon name="o_article" size="48px" color="grey-5" />
          <div class="text-body1 text-grey-7 q-mt-md">No content to preview</div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Close" color="grey-7" @click="close" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import type { ContentType } from '@components/shared/cms/types/content-type';
import type { ContentEntry } from 'src/services/cms-content.service';

export default defineComponent({
  name: 'PreviewEntryDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    contentType: {
      type: Object as PropType<ContentType | null>,
      default: null
    },
    entry: {
      type: Object as PropType<ContentEntry | null>,
      default: null
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
    
    const getEntryTitle = (): string => {
      if (!props.entry) return 'Unknown Entry';
      
      // Try common title fields
      const titleFields = ['title', 'name', 'displayName', 'label'];
      for (const field of titleFields) {
        if (props.entry.data[field]) {
          return props.entry.data[field];
        }
      }
      
      return `Entry ${props.entry.id}`;
    };
    
    const getFieldValue = (fieldName: string): any => {
      if (!props.entry || !props.entry.data) return null;
      return props.entry.data[fieldName];
    };
    
    const getStatusColor = (status: string): string => {
      switch (status) {
        case 'published': return 'positive';
        case 'draft': return 'warning';
        case 'archived': return 'grey';
        default: return 'grey';
      }
    };
    
    const formatDate = (date: string | Date): string => {
      if (!date) return 'Unknown';
      const d = new Date(date);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    };
    
    const formatDateTime = (date: any): string => {
      if (!date) return 'Not set';
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Invalid date';
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    };
    
    const formatNumber = (value: any): string => {
      if (value === null || value === undefined) return 'Not provided';
      if (typeof value === 'number') return value.toString();
      return value;
    };
    
    const getFieldSizeClass = (size?: string): string => {
      switch (size) {
        case 'half': return 'field-size-half';
        case 'third': return 'field-size-third';
        case 'two-thirds': return 'field-size-two-thirds';
        default: return 'field-size-full';
      }
    };

    return {
      dialogVisible,
      close,
      getEntryTitle,
      getFieldValue,
      getStatusColor,
      formatDate,
      formatDateTime,
      formatNumber,
      getFieldSizeClass
    };
  },
});
</script>

<style scoped lang="scss">
.preview-content {
  .entry-metadata {
    .metadata-item {
      .metadata-label {
        font-size: 12px;
        color: #666;
        text-transform: uppercase;
        font-weight: 500;
        margin-bottom: 4px;
      }
      
      .metadata-value {
        font-size: 14px;
        color: #333;
      }
    }
  }
  
  .entry-fields {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    
    .field-preview {
      .field-label {
        font-size: 14px;
        margin-bottom: 8px;
      }
      
      .field-value {
        .text-value,
        .default-value {
          padding: 8px 12px;
          background: #f5f5f5;
          border-radius: 4px;
          color: #333;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        .richtext-value {
          .richtext-content {
            padding: 12px;
            background: #f5f5f5;
            border-radius: 4px;
            color: #333;
            white-space: pre-wrap;
            word-break: break-word;
            min-height: 60px;
          }
        }
        
        .number-value,
        .datetime-value {
          padding: 8px 12px;
          background: #f5f5f5;
          border-radius: 4px;
          color: #333;
        }
        
        .boolean-value {
          display: flex;
          align-items: center;
          padding: 8px 0;
        }
        
        .enum-value {
          padding: 4px 0;
        }
      }
      
      // Field size classes
      &.field-size-full {
        width: 100%;
      }
      
      &.field-size-half {
        width: calc(50% - 8px);
      }
      
      &.field-size-third {
        width: calc(33.333% - 11px);
      }
      
      &.field-size-two-thirds {
        width: calc(66.666% - 5px);
      }
      
      @media (max-width: 768px) {
        width: 100% !important;
      }
    }
  }
  
  .empty-fields-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    text-align: center;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  text-align: center;
}
</style>