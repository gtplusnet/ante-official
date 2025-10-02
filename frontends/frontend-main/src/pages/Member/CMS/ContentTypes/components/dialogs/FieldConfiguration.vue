<template>
  <div class="field-config-md3">
    <div class="config-form-container">
      <!-- Basic Configuration Section -->
      <div class="config-section">
        <div class="section-header">
          <q-icon name="o_edit_attributes" size="20px" class="section-icon" />
          <span class="section-title">Basic Configuration</span>
        </div>
        
        <div class="field-grid">
          <!-- Display Name and Field Name -->
          <div class="field-group">
            <q-input
              v-model="field.displayName"
              label="Display Name"
              filled
              dense
              hint="Label shown to users"
              class="md3-input"
              :rules="[
                val => val && val.length > 0 || 'Display name is required'
              ]"
            >
              <template v-slot:prepend>
                <q-icon name="o_title" size="20px" />
              </template>
            </q-input>
          </div>
          
          <div class="field-group">
            <q-input
              v-model="field.name"
              label="Field Name"
              filled
              dense
              hint="Internal name (auto-generated)"
              class="md3-input"
              :readonly="!fieldNameUnlocked"
              :rules="[
                val => val && val.length > 0 || 'Field name is required',
                val => /^[a-z][a-zA-Z0-9]*$/.test(val) || 'Must start with lowercase letter, no spaces'
              ]"
            >
              <template v-slot:prepend>
                <q-icon name="o_label" size="20px" />
              </template>
              <template v-slot:append>
                <q-btn
                  :icon="fieldNameUnlocked ? 'o_lock_open' : 'o_lock'"
                  flat
                  round
                  dense
                  size="sm"
                  :color="fieldNameUnlocked ? 'orange' : 'grey'"
                  @click="toggleFieldNameLock"
                  class="field-lock-btn"
                >
                  <q-tooltip>
                    {{ fieldNameUnlocked ? 'Lock to enable auto-generation' : 'Unlock to edit manually' }}
                  </q-tooltip>
                </q-btn>
              </template>
            </q-input>
          </div>
          
          <!-- Field Width -->
          <div class="field-group full-width">
            <div class="field-label">Field Width</div>
            <q-btn-toggle
              v-model="field.size"
              :options="[
                { label: 'One Third', value: 'third', icon: 'o_view_column' },
                { label: 'Half Width', value: 'half', icon: 'o_view_stream' },
                { label: 'Full Width', value: 'full', icon: 'o_view_agenda' }
              ]"
              unelevated
              toggle-color="primary"
              color="grey-3"
              text-color="grey-8"
              class="md3-toggle-group"
              spread
            />
          </div>

          <!-- Default Value -->
          <div class="field-group full-width">
            <q-input
              v-model="field.defaultValue"
              label="Default Value"
              filled
              dense
              hint="Initial value for new entries"
              class="md3-input"
            >
              <template v-slot:prepend>
                <q-icon name="o_text_fields" size="20px" />
              </template>
            </q-input>
          </div>
        </div>
      </div>

      <!-- Type-Specific Configuration -->
      <q-slide-transition>
        <div v-if="showTypeSpecificConfig" class="config-section">
          <div class="section-header">
            <q-icon :name="getFieldIcon(field.type)" size="20px" class="section-icon" :style="{ color: getFieldColor(field.type) }" />
            <span class="section-title">{{ getFieldTypeLabel(field.type) }} Settings</span>
          </div>
          
          <div class="field-grid">
            <!-- Media specific -->
            <template v-if="field.type === 'media'">
              <div class="field-group full-width">
                <div class="field-label">Media Selection Type</div>
                <q-btn-toggle
                  v-model="field.mediaType"
                  :options="[
                    { label: 'Single Media', value: 'single', icon: 'o_image' },
                    { label: 'Multiple Media', value: 'multiple', icon: 'o_collections' }
                  ]"
                  unelevated
                  toggle-color="primary"
                  color="grey-3"
                  text-color="grey-8"
                  class="md3-toggle-group"
                  spread
                />
              </div>
              
              <div class="field-group full-width">
                <div class="field-label">Allowed Media Types</div>
                <div class="media-types-grid">
                  <q-checkbox
                    v-model="mediaTypesModel"
                    val="image"
                    label="Images"
                    color="primary"
                    class="media-type-checkbox"
                  />
                  <q-checkbox
                    v-model="mediaTypesModel"
                    val="video"
                    label="Videos"
                    color="primary"
                    class="media-type-checkbox"
                  />
                  <q-checkbox
                    v-model="mediaTypesModel"
                    val="audio"
                    label="Audio"
                    color="primary"
                    class="media-type-checkbox"
                  />
                  <q-checkbox
                    v-model="mediaTypesModel"
                    val="document"
                    label="Documents"
                    color="primary"
                    class="media-type-checkbox"
                  />
                  <q-checkbox
                    v-model="mediaTypesModel"
                    val="pdf"
                    label="PDFs"
                    color="primary"
                    class="media-type-checkbox"
                  />
                  <q-checkbox
                    v-model="selectAllMediaTypes"
                    label="All Types"
                    color="orange"
                    class="media-type-checkbox all-types"
                  />
                </div>
              </div>
            </template>

            <!-- Text/RichText specific -->
            <template v-if="field.type === 'text' || field.type === 'richtext'">
              <div class="field-group">
                <q-input
                  v-model.number="field.minLength"
                  label="Minimum Length"
                  type="number"
                  filled
                  dense
                  min="0"
                  class="md3-input"
                >
                  <template v-slot:prepend>
                    <q-icon name="o_short_text" size="20px" />
                  </template>
                </q-input>
              </div>
              <div class="field-group">
                <q-input
                  v-model.number="field.maxLength"
                  label="Maximum Length"
                  type="number"
                  filled
                  dense
                  min="0"
                  class="md3-input"
                >
                  <template v-slot:prepend>
                    <q-icon name="o_notes" size="20px" />
                  </template>
                </q-input>
              </div>
            </template>

            <!-- Number specific -->
            <template v-if="field.type === 'number'">
              <div class="field-group full-width">
                <q-select
                  v-model="field.numberType"
                  :options="[
                    { label: 'Integer', value: 'integer' },
                    { label: 'Big Integer', value: 'big integer' },
                    { label: 'Decimal', value: 'decimal' },
                    { label: 'Float', value: 'float' }
                  ]"
                  emit-value
                  map-options
                  label="Number Format"
                  filled
                  dense
                  class="md3-input"
                >
                  <template v-slot:prepend>
                    <q-icon name="o_pin" size="20px" />
                  </template>
                </q-select>
              </div>
              <div class="field-group">
                <q-input
                  v-model.number="field.min"
                  label="Minimum Value"
                  type="number"
                  filled
                  dense
                  class="md3-input"
                >
                  <template v-slot:prepend>
                    <q-icon name="o_arrow_downward" size="20px" />
                  </template>
                </q-input>
              </div>
              <div class="field-group">
                <q-input
                  v-model.number="field.max"
                  label="Maximum Value"
                  type="number"
                  filled
                  dense
                  class="md3-input"
                >
                  <template v-slot:prepend>
                    <q-icon name="o_arrow_upward" size="20px" />
                  </template>
                </q-input>
              </div>
            </template>

            <!-- Enumeration specific -->
            <template v-if="field.type === 'enumeration'">
              <div class="field-group full-width">
                <q-input
                  :model-value="typeof field.enumValues === 'string' ? field.enumValues : (field.enumValues || []).join('\n')"
                  @update:model-value="(val) => field.enumValues = String(val || '')"
                  label="Enum Values"
                  type="textarea"
                  filled
                  dense
                  rows="5"
                  hint="Enter each option on a new line"
                  class="md3-input"
                >
                  <template v-slot:prepend>
                    <q-icon name="o_list" size="20px" style="align-self: flex-start; margin-top: 12px" />
                  </template>
                </q-input>
              </div>
            </template>

            <!-- Relation specific -->
            <template v-if="field.type === 'relation'">
              <div class="field-group">
                <q-select
                  v-model="field.relationType"
                  :options="[
                    { label: 'One to One', value: 'oneToOne' },
                    { label: 'One to Many', value: 'oneToMany' },
                    { label: 'Many to One', value: 'manyToOne' },
                    { label: 'Many to Many', value: 'manyToMany' }
                  ]"
                  emit-value
                  map-options
                  label="Relation Type"
                  filled
                  dense
                  class="md3-input"
                >
                  <template v-slot:prepend>
                    <q-icon name="o_account_tree" size="20px" />
                  </template>
                </q-select>
              </div>
              <div class="field-group">
                <q-select
                  v-model="field.targetContentType"
                  :options="availableContentTypes"
                  label="Target Content Type"
                  filled
                  dense
                  class="md3-input"
                >
                  <template v-slot:prepend>
                    <q-icon name="o_link" size="20px" />
                  </template>
                </q-select>
              </div>
            </template>
          </div>
        </div>
      </q-slide-transition>

      <!-- Validation & Constraints Section -->
      <div class="config-section">
        <div class="section-header">
          <q-icon name="o_verified_user" size="20px" class="section-icon" />
          <span class="section-title">Validation & Constraints</span>
        </div>
        
        <div class="field-grid">
          <!-- Toggles Row -->
          <div class="field-group full-width">
            <div class="toggle-grid">
              <q-card flat class="toggle-card">
                <q-card-section class="q-pa-sm">
                  <q-toggle 
                    v-model="field.required" 
                    label="Required"
                    color="orange"
                    class="md3-toggle"
                  />
                  <div class="toggle-hint">Field must be filled</div>
                </q-card-section>
              </q-card>
              
              <q-card flat class="toggle-card">
                <q-card-section class="q-pa-sm">
                  <q-toggle 
                    v-model="field.unique" 
                    label="Unique"
                    color="purple"
                    class="md3-toggle"
                  />
                  <div class="toggle-hint">No duplicate values</div>
                </q-card-section>
              </q-card>
              
              <q-card flat class="toggle-card">
                <q-card-section class="q-pa-sm">
                  <q-toggle 
                    v-model="field.private" 
                    label="Private"
                    color="grey"
                    class="md3-toggle"
                  />
                  <div class="toggle-hint">Hidden from API</div>
                </q-card-section>
              </q-card>
            </div>
          </div>
          
          <!-- Regex Pattern -->
          <div class="field-group full-width">
            <q-input
              v-model="field.regex"
              label="Regex Pattern (Optional)"
              filled
              dense
              hint="Regular expression for custom validation"
              class="md3-input"
            >
              <template v-slot:prepend>
                <q-icon name="o_code" size="20px" />
              </template>
            </q-input>
          </div>
          
          <!-- Placeholder and Hint -->
          <div class="field-group">
            <q-input
              v-model="field.placeholder"
              label="Placeholder Text"
              filled
              dense
              hint="Shown when field is empty"
              class="md3-input"
            >
              <template v-slot:prepend>
                <q-icon name="o_edit_note" size="20px" />
              </template>
            </q-input>
          </div>
          
          <div class="field-group">
            <q-input
              v-model="field.hint"
              label="Help Text"
              filled
              dense
              hint="Additional guidance for users"
              class="md3-input"
            >
              <template v-slot:prepend>
                <q-icon name="o_help_outline" size="20px" />
              </template>
            </q-input>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, PropType } from 'vue';
import { Notify } from 'quasar';
import { debounce } from 'quasar';
import type { Field } from '@components/shared/cms/types/content-type';
import { CMSContentTypesService } from 'src/services/cms-content-types.service';
import { useFieldManagement } from '../../composables/useFieldManagement';

export default defineComponent({
  name: 'FieldConfiguration',
  props: {
    modelValue: {
      type: Object as PropType<Field>,
      required: true
    },
    availableContentTypes: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    contentTypeId: {
      type: String,
      required: true
    },
    autoSave: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { getFieldIcon, getFieldColor, getFieldTypeLabel } = useFieldManagement();
    
    const fieldNameUnlocked = ref(false);
    
    const field = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    });

    // Media types handling
    const mediaTypesModel = computed({
      get: () => field.value.allowedMediaTypes || [],
      set: (value) => {
        field.value.allowedMediaTypes = value;
      }
    });

    const selectAllMediaTypes = computed({
      get: () => {
        const allowedTypes = field.value.allowedMediaTypes || [];
        return allowedTypes.includes('all') || allowedTypes.length === 0;
      },
      set: (value) => {
        if (value) {
          field.value.allowedMediaTypes = ['all'];
        } else {
          field.value.allowedMediaTypes = ['image'];
        }
      }
    });

    // Initialize media field defaults
    watch(() => field.value.type, (newType) => {
      if (newType === 'media') {
        if (!field.value.mediaType) {
          field.value.mediaType = 'single';
        }
        if (!field.value.allowedMediaTypes || field.value.allowedMediaTypes.length === 0) {
          field.value.allowedMediaTypes = ['image'];
        }
      }
    }, { immediate: true });

    const showTypeSpecificConfig = computed(() => {
      const typeSpecificTypes = ['text', 'richtext', 'number', 'enumeration', 'relation', 'media'];
      return typeSpecificTypes.includes(field.value.type);
    });

    // Auto-generate field name from display name
    watch(() => field.value.displayName, (newDisplayName) => {
      if (newDisplayName && !fieldNameUnlocked.value) {
        // Convert display name to camelCase field name
        const fieldName = newDisplayName
          .toLowerCase()
          // Remove special characters except spaces
          .replace(/[^a-zA-Z0-9\s]/g, '')
          // Split by spaces and capitalize each word after the first
          .split(/\s+/)
          .map((word, index) => {
            if (index === 0) {
              return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
          })
          .join('')
          // Ensure it starts with lowercase letter
          .replace(/^[^a-zA-Z]/, '')
          .replace(/^[A-Z]/, char => char.toLowerCase());
        
        if (fieldName && fieldName !== field.value.name) {
          field.value.name = fieldName;
        }
      }
    });

    const toggleFieldNameLock = () => {
      fieldNameUnlocked.value = !fieldNameUnlocked.value;
      
      // If locking, regenerate field name from display name
      if (!fieldNameUnlocked.value && field.value.displayName) {
        const fieldName = field.value.displayName
          .toLowerCase()
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .split(/\s+/)
          .map((word, index) => {
            if (index === 0) {
              return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
          })
          .join('')
          .replace(/^[^a-zA-Z]/, '')
          .replace(/^[A-Z]/, char => char.toLowerCase());
        
        if (fieldName) {
          field.value.name = fieldName;
        }
      }
    };

    // Auto-save functionality
    const saveFieldChanges = async (updates: Partial<Field>) => {
      if (!props.autoSave || !props.contentTypeId || !field.value.id) {
        console.warn('Auto-save skipped:', {
          autoSave: props.autoSave,
          contentTypeId: props.contentTypeId,
          fieldId: field.value.id
        });
        return;
      }
      
      try {
        // Always include the type field as it's required by the backend
        const completeUpdates = {
          ...updates,
          type: field.value.type
        };
        
        await CMSContentTypesService.updateField(props.contentTypeId, field.value.id.toString(), completeUpdates);
        
        Notify.create({
          type: 'positive',
          message: 'Field updated successfully',
          timeout: 2000,
          position: 'top-right'
        });
      } catch (error) {
        console.error('Failed to save field changes:', error);
        Notify.create({
          type: 'negative',
          message: 'Failed to save field changes',
          timeout: 3000,
          position: 'top-right'
        });
      }
    };

    // Debounced save for text inputs (500ms delay)
    const debouncedSave = debounce(saveFieldChanges, 500);

    // Watchers for auto-save
    if (props.autoSave) {
      // Debounced save for text fields
      watch(() => field.value.displayName, (newVal) => {
        if (newVal !== undefined) {
          debouncedSave({ displayName: newVal });
        }
      });

      watch(() => field.value.name, (newVal) => {
        if (newVal !== undefined) {
          debouncedSave({ name: newVal });
        }
      });

      watch(() => field.value.defaultValue, (newVal) => {
        debouncedSave({ defaultValue: newVal });
      });

      watch(() => field.value.placeholder, (newVal) => {
        debouncedSave({ placeholder: newVal });
      });

      watch(() => field.value.hint, (newVal) => {
        debouncedSave({ hint: newVal });
      });

      watch(() => field.value.regex, (newVal) => {
        debouncedSave({ regex: newVal });
      });

      // Immediate save for toggles and selections
      watch(() => field.value.required, (newVal) => {
        saveFieldChanges({ required: newVal });
      });

      watch(() => field.value.unique, (newVal) => {
        saveFieldChanges({ unique: newVal });
      });

      watch(() => field.value.private, (newVal) => {
        saveFieldChanges({ private: newVal });
      });

      watch(() => field.value.size, (newVal) => {
        saveFieldChanges({ size: newVal });
      });

      // Type-specific fields
      watch(() => field.value.minLength, (newVal) => {
        debouncedSave({ minLength: newVal });
      });

      watch(() => field.value.maxLength, (newVal) => {
        debouncedSave({ maxLength: newVal });
      });

      watch(() => field.value.min, (newVal) => {
        debouncedSave({ min: newVal });
      });

      watch(() => field.value.max, (newVal) => {
        debouncedSave({ max: newVal });
      });

      watch(() => field.value.numberType, (newVal) => {
        saveFieldChanges({ numberType: newVal });
      });

      watch(() => field.value.enumValues, (newVal) => {
        debouncedSave({ enumValues: newVal });
      });

      watch(() => field.value.relationType, (newVal) => {
        saveFieldChanges({ relationType: newVal });
      });

      watch(() => field.value.targetContentType, (newVal) => {
        saveFieldChanges({ targetContentType: newVal });
      });

      // Media-specific fields
      watch(() => field.value.mediaType, (newVal) => {
        saveFieldChanges({ mediaType: newVal });
      });

      watch(() => field.value.allowedMediaTypes, (newVal) => {
        saveFieldChanges({ allowedMediaTypes: newVal });
      });
    }

    return {
      field,
      fieldNameUnlocked,
      showTypeSpecificConfig,
      getFieldIcon,
      getFieldColor,
      getFieldTypeLabel,
      toggleFieldNameLock,
      mediaTypesModel,
      selectAllMediaTypes
    };
  },
});
</script>

<style scoped lang="scss">
.field-lock-btn {
  opacity: 0.7;
  transition: all 0.2s;
  
  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
}
.field-config-md3 {
  .config-form-container {
    .config-section {
      margin-bottom: 24px;
      
      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e0e0e0;
        
        .section-icon {
          color: #757575;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: 500;
          color: #424242;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
      }
      
      .field-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        
        .field-group {
          &.full-width {
            grid-column: 1 / -1;
          }
          
          .field-label {
            font-size: 12px;
            color: #757575;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.02em;
          }
        }
        
        .toggle-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          
          .toggle-card {
            background: #f5f5f5;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            transition: all 0.2s;
            
            &:hover {
              background: #eeeeee;
              border-color: #bdbdbd;
            }
            
            .toggle-hint {
              font-size: 11px;
              color: #757575;
              margin-top: 4px;
            }
          }
        }
      }
    }
  }
  
  .md3-input {
    :deep(.q-field__control) {
      border-radius: 8px;
    }
  }
  
  .md3-toggle-group {
    width: 100%;
    
    :deep(.q-btn) {
      border-radius: 8px;
      height: 36px;
    }
  }
  
  .md3-toggle {
    :deep(.q-toggle__inner) {
      font-size: 13px;
      font-weight: 500;
    }
  }
  
  .media-types-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 8px;
    
    .media-type-checkbox {
      padding: 8px 12px;
      background: #f5f5f5;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      transition: all 0.2s;
      
      &:hover {
        background: #eeeeee;
        border-color: #bdbdbd;
      }
      
      &.all-types {
        grid-column: 1 / -1;
        
        :deep(.q-checkbox__label) {
          font-weight: 500;
          color: #f57c00;
        }
      }
      
      :deep(.q-checkbox__inner) {
        font-size: 12px;
      }
    }
  }
}</style>
