<template>
  <q-dialog v-model="dialogVisible" persistent @hide="onHide">
    <q-card style="min-width: 500px">
      <q-card-section class="row items-center q-pb-none q-pt-sm">
        <div class="text-h6">
          Edit {{ typeLabel }}
        </div>
        <q-space />
        <q-btn icon="o_close" flat round dense @click="close" />
      </q-card-section>

      <q-card-section>
        <!-- Content Type Info -->
        <div class="content-type-info q-mb-md">
          <div class="row items-center q-gutter-md">
            <div class="col-auto">
              <q-icon 
                :name="getTypeIcon()" 
                size="32px" 
                :color="getTypeColor()"
              />
            </div>
            <div class="col">
              <div class="text-subtitle1">{{ contentType?.type.toUpperCase() }} TYPE</div>
              <div class="text-caption text-grey-6">
                {{ contentType?.fields?.length || 0 }} fields • 
                Last modified {{ formatDate(contentType?.updatedAt) }}
              </div>
            </div>
          </div>
        </div>

        <q-separator class="q-mb-md" />

        <div class="q-gutter-md">
          <!-- Basic Information Section -->
          <div class="form-section">
            <div class="section-title">Basic Information</div>
            
            <q-input
              v-model="formData.displayName"
              label="Display Name"
              outlined
              dense
              class="q-mb-sm"
              hint="Name that will be displayed in the admin panel"
              :rules="[
                val => validateDisplayName(val)
              ]"
            />
            
            <div class="row q-gutter-sm">
              <div class="col">
                <q-input
                  v-model="formData.singularName"
                  label="API ID (Singular)"
                  outlined
                  dense
                  readonly
                  class="bg-grey-1"
                  hint="Cannot be changed after creation"
                >
                  <template v-slot:prepend>
                    <q-icon name="o_lock" color="grey-6" size="16px" />
                  </template>
                </q-input>
              </div>
              
              <div v-if="contentType?.type === 'collection'" class="col">
                <q-input
                  v-model="formData.pluralName"
                  label="API ID (Plural)"
                  outlined
                  dense
                  readonly
                  class="bg-grey-1"
                  hint="Cannot be changed after creation"
                >
                  <template v-slot:prepend>
                    <q-icon name="o_lock" color="grey-6" size="16px" />
                  </template>
                </q-input>
              </div>
            </div>
          </div>

          <!-- Display & Organization Section -->
          <div class="form-section">
            <div class="section-title">Display & Organization</div>
            
            <div class="row q-gutter-sm">
              <div class="col">
                <q-input
                  v-model="formData.category"
                  label="Category"
                  outlined
                  dense
                  hint="Category to organize this content type"
                />
              </div>
              
              <div class="col-3">
                <q-input
                  v-model="formData.icon"
                  label="Icon"
                  outlined
                  dense
                  hint="Material icon name"
                  placeholder="e.g., article"
                >
                  <template v-slot:prepend>
                    <q-icon 
                      :name="formData.icon ? `o_${formData.icon}` : 'o_help'" 
                      size="16px"
                    />
                  </template>
                </q-input>
              </div>
            </div>
            
            <q-input
              v-model="formData.description"
              label="Description"
              outlined
              dense
              type="textarea"
              rows="3"
              hint="Describe the purpose and content of this type"
            />
          </div>

          <!-- Settings Section -->
          <div class="form-section">
            <div class="section-title">Content Settings</div>
            
            <div class="settings-grid">
              <q-toggle
                v-model="formData.draftPublish"
                label="Draft & Publish"
                left-label
                color="primary"
              />
              <div class="setting-description">Enable draft/published workflow</div>
              
              <q-toggle
                v-model="formData.internationalization"
                label="Internationalization"
                left-label
                color="primary"
              />
              <div class="setting-description">Support multiple languages</div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancel" @click="close" />
        <q-btn 
          color="primary" 
          label="Update" 
          @click="handleUpdate" 
          :loading="isUpdating"
          unelevated
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, PropType } from 'vue';
import { useQuasar } from 'quasar';
import type { ContentType } from '@components/shared/cms/types/content-type';

const validateDisplayName = (displayName: string): string | boolean => {
  if (!displayName) return 'Display name is required';
  
  if (displayName.length < 2) {
    return 'Display name must be at least 2 characters';
  }
  
  if (displayName.length > 50) {
    return 'Display name cannot exceed 50 characters';
  }
  
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(displayName)) {
    return 'Display name must contain at least one letter';
  }
  
  // Cannot start or end with special characters
  if (/^[^a-zA-Z0-9]|[^a-zA-Z0-9]$/.test(displayName)) {
    return 'Display name cannot start or end with special characters';
  }
  
  return true;
};

export default defineComponent({
  name: 'EditContentTypeDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    contentType: {
      type: Object as PropType<ContentType>,
      default: null
    }
  },
  emits: ['update:modelValue', 'update'],
  setup(props, { emit }) {
    const $q = useQuasar();
    
    const dialogVisible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    });

    const isUpdating = ref(false);

    const formData = ref({
      displayName: '',
      singularName: '',
      pluralName: '',
      category: '',
      icon: '',
      description: '',
      draftPublish: false,
      internationalization: false,
    });

    const typeLabel = computed(() => {
      if (!props.contentType) return '';
      
      switch (props.contentType.type) {
        case 'collection':
          return 'Collection Type';
        case 'single':
          return 'Single Type';
        case 'component':
          return 'Component';
        default:
          return '';
      }
    });

    // Populate form when dialog opens with content type data
    watch(() => props.modelValue, (newValue) => {
      if (newValue && props.contentType) {
        formData.value = {
          displayName: props.contentType.displayName || props.contentType.name || '',
          singularName: props.contentType.singularName || props.contentType.name || '',
          pluralName: props.contentType.pluralName || '',
          category: props.contentType.category || '',
          icon: props.contentType.icon || '',
          description: props.contentType.description || '',
          draftPublish: props.contentType.draftPublish || false,
          internationalization: props.contentType.internationalization || false,
        };
      }
    });

    const close = () => {
      dialogVisible.value = false;
    };

    const onHide = () => {
      // Reset form data
      formData.value = {
        displayName: '',
        singularName: '',
        pluralName: '',
        category: '',
        icon: '',
        description: '',
        draftPublish: false,
        internationalization: false,
      };
    };

    const handleUpdate = async () => {
      // Validate display name
      const displayNameValidation = validateDisplayName(formData.value.displayName);
      if (displayNameValidation !== true) {
        $q.notify({
          type: 'negative',
          message: displayNameValidation as string,
        });
        return;
      }
      
      if (!props.contentType) {
        $q.notify({
          type: 'negative',
          message: 'No content type selected for editing',
        });
        return;
      }
      
      isUpdating.value = true;
      
      try {
        // Emit update event with form data and content type ID
        const updateData = {
          id: props.contentType.id,
          displayName: formData.value.displayName,
          category: formData.value.category,
          icon: formData.value.icon,
          description: formData.value.description,
          draftPublish: formData.value.draftPublish,
          internationalization: formData.value.internationalization,
        };
        
        emit('update', updateData);
        
        // Success notification is handled by parent component to avoid duplication
        
        close();
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: `Failed to update ${typeLabel.value}`,
        });
      } finally {
        isUpdating.value = false;
      }
    };

    const getTypeIcon = () => {
      if (!props.contentType) return 'o_help';
      
      switch (props.contentType.type) {
        case 'collection':
          return 'o_folder';
        case 'single':
          return 'o_description';
        case 'component':
          return 'o_widgets';
        default:
          return 'o_help';
      }
    };

    const getTypeColor = () => {
      if (!props.contentType) return 'grey';
      
      switch (props.contentType.type) {
        case 'collection':
          return 'primary';
        case 'single':
          return 'secondary';
        case 'component':
          return 'accent';
        default:
          return 'grey';
      }
    };

    const formatDate = (date: Date | string | undefined) => {
      if (!date) return 'Unknown';
      
      try {
        const d = new Date(date);
        return d.toLocaleDateString() + ' at ' + d.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } catch {
        return 'Unknown';
      }
    };

    return {
      dialogVisible,
      isUpdating,
      formData,
      typeLabel,
      close,
      onHide,
      handleUpdate,
      validateDisplayName,
      getTypeIcon,
      getTypeColor,
      formatDate
    };
  },
});
</script>

<style scoped lang="scss">
.bg-grey-1 {
  background-color: #f5f5f5;
}

.content-type-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #1976d2;
}

.form-section {
  margin-bottom: 24px;

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 12px;
    padding-bottom: 4px;
    border-bottom: 2px solid #e0e0e0;
  }
}

.settings-grid {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 8px 16px;
  align-items: center;

  .setting-description {
    font-size: 12px;
    color: #666;
    font-style: italic;
  }
}

:deep(.q-toggle__label) {
  font-size: 13px;
  font-weight: 500;
}

:deep(.q-field--dense .q-field__control) {
  min-height: 40px;
}

:deep(.q-card) {
  min-width: 600px;
  max-width: 800px;
}
</style>