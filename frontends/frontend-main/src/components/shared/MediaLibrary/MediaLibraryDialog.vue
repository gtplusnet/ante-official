<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="media-library-dialog">
      <q-card-section class="dialog-header">
        <div class="header-content">
          <div class="header-title">
            <q-icon name="o_perm_media" size="24px" class="q-mr-sm" />
            <span class="text-h6">{{ computedTitle }}</span>
          </div>
          <div class="header-actions">
            <div v-if="selectedCount > 0" class="selection-info">
              <q-chip color="primary" text-color="white">
                {{ selectedCount }} {{ selectedCount === 1 ? 'item' : 'items' }} selected
              </q-chip>
            </div>
            <q-btn flat round dense icon="close" @click="handleClose" />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="dialog-body q-pa-0">
        <MediaLibraryCore
          ref="mediaLibraryCore"
          mode="dialog"
          :module="module"
          :selection-mode="selectionMode"
          :allow-upload="computedAllowUpload"
          :allow-folders="computedAllowFolders"
          :file-types="computedFileTypes"
          :max-selections="maxSelections"
          :default-folder="defaultFolder"
          :show-header="false"
          :show-breadcrumbs="true"
          :library-title="computedLibraryTitle"
          :custom-config="customConfig"
          @items-selected="handleItemsSelected"
          @upload-complete="handleUploadComplete"
        />
      </q-card-section>

      <q-separator />

      <q-card-actions class="dialog-footer">
        <q-space />
        <q-btn 
          flat 
          label="Cancel" 
          @click="handleClose"
        />
        <q-btn
          color="primary"
          :label="confirmLabel"
          :disable="!canConfirm"
          @click="handleConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from 'vue';
import MediaLibraryCore from './MediaLibraryCore.vue';
import type { MediaItem } from './MediaLibraryCore.vue';
import { ModuleType, MediaModuleConfig } from 'src/types/media.types';
import { getModuleConfig } from 'src/config/media-module.config';

export default defineComponent({
  name: 'MediaLibraryDialog',
  components: {
    MediaLibraryCore,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    module: {
      type: String as PropType<ModuleType>,
      default: ModuleType.CMS,
      validator: (value: string) => Object.values(ModuleType).includes(value as ModuleType)
    },
    title: {
      type: String,
      default: '',
    },
    selectionMode: {
      type: String as PropType<'single' | 'multiple' | 'none'>,
      default: 'single',
    },
    allowUpload: {
      type: Boolean as PropType<boolean | null>,
      default: null,
    },
    allowFolders: {
      type: Boolean as PropType<boolean | null>,
      default: null,
    },
    fileTypes: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    maxSelections: {
      type: Number,
      default: 0,
    },
    defaultFolder: {
      type: String,
      default: null,
    },
    confirmLabel: {
      type: String,
      default: 'Select',
    },
    libraryTitle: {
      type: String,
      default: '',
    },
    customConfig: {
      type: Object as PropType<Partial<MediaModuleConfig>>,
      default: null,
    },
  },
  emits: ['update:modelValue', 'select', 'cancel'],
  setup(props, { emit }) {
    const mediaLibraryCore = ref<InstanceType<typeof MediaLibraryCore> | null>(null);
    const selectedItems = ref<MediaItem[]>([]);

    // Module configuration with optional custom overrides
    const moduleConfig = computed(() => {
      const baseConfig = getModuleConfig(props.module);
      return props.customConfig 
        ? { ...baseConfig, ...props.customConfig }
        : baseConfig;
    });

    // Computed properties that use module config as defaults
    const computedTitle = computed(() => {
      return props.title || moduleConfig.value.ui.title;
    });

    const computedLibraryTitle = computed(() => {
      return props.libraryTitle || moduleConfig.value.ui.title;
    });

    const computedAllowUpload = computed(() => {
      return props.allowUpload !== null ? props.allowUpload : true;
    });

    const computedAllowFolders = computed(() => {
      return props.allowFolders !== null ? props.allowFolders : moduleConfig.value.features.allowFolders;
    });

    const computedFileTypes = computed(() => {
      return props.fileTypes.length > 0 ? props.fileTypes : moduleConfig.value.allowedFileTypes;
    });

    const selectedCount = computed(() => selectedItems.value.length);
    
    const canConfirm = computed(() => {
      if (props.selectionMode === 'none') return false;
      if (props.selectionMode === 'single') return selectedItems.value.length === 1;
      return selectedItems.value.length > 0;
    });

    const handleItemsSelected = (items: MediaItem[]) => {
      selectedItems.value = items;
    };

    const handleUploadComplete = () => {
      // Optionally handle upload completion
      // Could emit an event or refresh the media list
    };

    const handleClose = () => {
      emit('update:modelValue', false);
      emit('cancel');
      // Reset selection
      selectedItems.value = [];
      if (mediaLibraryCore.value) {
        mediaLibraryCore.value.clearSelection();
      }
    };

    const handleConfirm = () => {
      if (!canConfirm.value) return;
      
      const result = props.selectionMode === 'single' 
        ? selectedItems.value[0] 
        : selectedItems.value;
      
      emit('select', result);
      emit('update:modelValue', false);
      
      // Reset selection after confirmation
      selectedItems.value = [];
      if (mediaLibraryCore.value) {
        mediaLibraryCore.value.clearSelection();
      }
    };

    return {
      mediaLibraryCore,
      selectedItems,
      selectedCount,
      canConfirm,
      moduleConfig,
      computedTitle,
      computedLibraryTitle,
      computedAllowUpload,
      computedAllowFolders,
      computedFileTypes,
      handleItemsSelected,
      handleUploadComplete,
      handleClose,
      handleConfirm,
    };
  },
});
</script>

<style scoped lang="scss">
.media-library-dialog {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;

  .dialog-header {
    padding: 16px 20px;
    background: white;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-title {
        display: flex;
        align-items: center;
        font-size: 18px;
        font-weight: 500;
        color: #202124;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 16px;

        .selection-info {
          display: flex;
          align-items: center;
        }
      }
    }
  }

  .dialog-body {
    flex: 1;
    overflow: hidden;
    
    :deep(.media-library-core) {
      height: 100%;
    }
  }

  .dialog-footer {
    padding: 12px 20px;
    background: white;
    border-top: 1px solid #e8eaed;
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .q-dialog__inner--maximized {
    padding: 0;
  }
  
  .media-library-dialog {
    .dialog-header {
      padding: 12px 16px;
      
      .header-title {
        font-size: 16px;
      }
    }
    
    .dialog-footer {
      padding: 8px 16px;
    }
  }
}

// Desktop adjustments for non-maximized dialog
@media (min-width: 769px) {
  .q-dialog__inner:not(.q-dialog__inner--maximized) {
    .media-library-dialog {
      width: 90vw;
      max-width: 1400px;
      height: 85vh;
      max-height: 900px;
    }
  }
}
</style>