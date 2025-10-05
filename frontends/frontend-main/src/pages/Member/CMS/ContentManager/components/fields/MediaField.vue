<template>
  <div class="media-field">
    <!-- Media Selection Area -->
    <div 
      v-if="!hasMedia"
      class="media-selection-area"
      @click="openMediaLibrary"
    >
      <q-icon name="o_perm_media" size="32px" color="primary" />
      <div class="selection-text">
        <div class="text-body1">Select Media</div>
        <div class="text-caption text-grey-6 q-mt-xs">
          {{ getSelectionDescription() }}
        </div>
      </div>
    </div>

    <!-- Single Media Preview -->
    <div v-else-if="!isMultiple" class="media-preview">
      <div v-if="selectedMedia && isImage(selectedMedia)" class="image-preview">
        <div class="image-container">
          <img 
            :src="getMediaUrl(selectedMedia)" 
            :alt="selectedMedia.name"
            class="preview-image"
          />
        </div>
      </div>
      
      <div v-else-if="selectedMedia" class="file-preview">
        <q-icon :name="getFileIcon(selectedMedia)" size="32px" />
        <div class="file-info">
          <div class="file-name">{{ selectedMedia.name }}</div>
          <div class="file-size text-caption text-grey-6">
            {{ formatFileSize(selectedMedia.size) }}
          </div>
        </div>
      </div>
      
      <div class="media-actions">
        <q-btn
          flat
          round
          size="sm"
          icon="o_visibility"
          @click="selectedMedia && previewMedia(selectedMedia)"
        >
          <q-tooltip>Preview</q-tooltip>
        </q-btn>
        
        <q-btn
          flat
          round
          size="sm"
          icon="o_edit"
          @click="openMediaLibrary"
        >
          <q-tooltip>Replace</q-tooltip>
        </q-btn>
        
        <q-btn
          flat
          round
          size="sm"
          icon="o_delete"
          color="negative"
          @click="removeMedia"
        >
          <q-tooltip>Remove</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Multiple Media Preview -->
    <div v-else class="multiple-media-preview">
      <div class="media-grid">
        <div 
          v-for="(media, index) in mediaArray" 
          :key="media.id || index"
          class="media-item"
        >
          <div v-if="isImage(media)" class="image-thumbnail">
            <img 
              :src="getMediaUrl(media)" 
              :alt="media.name"
              class="thumbnail-image"
            />
          </div>
          
          <div v-else class="file-thumbnail">
            <q-icon :name="getFileIcon(media)" size="24px" />
          </div>
          
          <div class="media-item-actions">
            <q-btn
              flat
              round
              size="xs"
              icon="o_visibility"
              @click="previewMedia(media)"
            >
              <q-tooltip>Preview</q-tooltip>
            </q-btn>
            
            <q-btn
              flat
              round
              size="xs"
              icon="o_delete"
              color="negative"
              @click="removeMediaItem(index)"
            >
              <q-tooltip>Remove</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>
      
      <div class="multiple-actions">
        <q-btn
          outline
          size="sm"
          icon="o_add"
          label="Add Media"
          @click="openMediaLibrary"
        />
        
        <q-btn
          flat
          size="sm"
          icon="o_clear"
          label="Clear All"
          color="negative"
          @click="clearAllMedia"
          v-if="mediaArray.length > 0"
        />
      </div>
    </div>

    <!-- Media Library Dialog -->
    <MediaLibraryDialog
      v-model="showMediaDialog"
      :title="isMultiple ? 'Select Media Files' : 'Select Media File'"
      :selection-mode="isMultiple ? 'multiple' : 'single'"
      :file-types="getFileTypesForDialog()"
      :max-selections="isMultiple ? 0 : 1"
      @select="handleMediaSelection"
      @cancel="showMediaDialog = false"
    />

    <!-- Error Message -->
    <div v-if="error" class="text-negative text-caption q-mt-sm">
      {{ error }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from 'vue';
import { defineAsyncComponent } from 'vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const MediaLibraryDialog = defineAsyncComponent(() =>
  import('src/components/shared/MediaLibrary/MediaLibraryDialog.vue')
);
import type { Field } from '@components/shared/cms/types/content-type';

interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number | string; // Can be either number (bytes) or string (formatted)
  width?: number;
  height?: number;
  mimetype?: string; // Some media objects use mimetype instead of type
  [key: string]: any;
}

export default defineComponent({
  name: 'MediaField',
  components: {
    MediaLibraryDialog
  },
  props: {
    modelValue: {
      type: [Object, Array, String, null] as PropType<MediaFile | MediaFile[] | string | null>,
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
    const showMediaDialog = ref(false);
    
    const isMultiple = computed(() => {
      return props.field.mediaType === 'multiple';
    });
    
    const selectedMedia = computed(() => {
      if (isMultiple.value) {
        return Array.isArray(props.modelValue) && props.modelValue.length > 0 ? props.modelValue[0] : null;
      }
      return props.modelValue as MediaFile | null;
    });
    
    const mediaArray = computed(() => {
      if (!isMultiple.value) return [];
      return Array.isArray(props.modelValue) ? props.modelValue : [];
    });
    
    const hasMedia = computed(() => {
      if (isMultiple.value) {
        return Array.isArray(props.modelValue) && props.modelValue.length > 0;
      }
      return !!props.modelValue;
    });
    
    const getSelectionDescription = (): string => {
      const mediaType = isMultiple.value ? 'multiple files' : 'a file';
      const allowedTypes = props.field.allowedMediaTypes || ['image'];
      
      if (allowedTypes.includes('all') || allowedTypes.length === 0) {
        return `Select ${mediaType} from media library`;
      }
      
      const typeLabels: Record<string, string> = {
        image: 'Images',
        video: 'Videos', 
        audio: 'Audio',
        document: 'Documents',
        pdf: 'PDFs'
      };
      
      const typeNames = allowedTypes.map(type => typeLabels[type] || type).join(', ');
      return `Select ${mediaType} (${typeNames})`;
    };
    
    const getFileTypesForDialog = (): string[] => {
      const allowedTypes = props.field.allowedMediaTypes || ['image'];
      
      if (allowedTypes.includes('all') || allowedTypes.length === 0) {
        return [];
      }
      
      const typeMapping: Record<string, string> = {
        image: 'image/*',
        video: 'video/*',
        audio: 'audio/*',
        document: '.doc,.docx,.txt,.rtf',
        pdf: '.pdf'
      };
      
      return allowedTypes.map(type => typeMapping[type] || type).filter(Boolean);
    };
    
    const isImage = (media: MediaFile | null): boolean => {
      if (!media) return false;
      const type = media.type || media.mimetype || '';
      return type.toLowerCase().includes('image') || type.startsWith('image/');
    };
    
    const getMediaUrl = (media: MediaFile | null): string => {
      if (!media) return '';
      return media.url || '';
    };
    
    const getFileIcon = (media: MediaFile | null): string => {
      if (!media) return 'o_insert_drive_file';
      const type = (media.type || media.mimetype || '').toLowerCase();
      
      if (type.includes('image') || type.startsWith('image/')) return 'o_image';
      if (type.includes('video') || type.startsWith('video/')) return 'o_movie';
      if (type.includes('audio') || type.startsWith('audio/')) return 'o_audiotrack';
      if (type.includes('pdf')) return 'o_picture_as_pdf';
      if (type.includes('word') || type.includes('document')) return 'o_description';
      if (type.includes('excel') || type.includes('spreadsheet')) return 'o_grid_on';
      if (type.includes('powerpoint') || type.includes('presentation')) return 'o_slideshow';
      return 'o_insert_drive_file';
    };
    
    const formatFileSize = (size: number | string | undefined): string => {
      // If it's already a formatted string, return it as is
      if (typeof size === 'string' && size.length > 0) {
        return size;
      }
      
      // Handle numeric values
      const bytes = typeof size === 'number' ? size : 0;
      if (!bytes || bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    const openMediaLibrary = () => {
      showMediaDialog.value = true;
    };
    
    const handleMediaSelection = (selectedItems: MediaFile | MediaFile[]) => {
      if (isMultiple.value) {
        const newItems = Array.isArray(selectedItems) ? selectedItems : [selectedItems];
        const currentItems = mediaArray.value;
        emit('update:modelValue', [...currentItems, ...newItems]);
      } else {
        emit('update:modelValue', selectedItems);
      }
      
      emit('validate', true);
      showMediaDialog.value = false;
    };
    
    const previewMedia = (media: MediaFile) => {
      if (media && media.url) {
        window.open(media.url, '_blank');
      }
    };
    
    const removeMedia = () => {
      emit('update:modelValue', isMultiple.value ? [] : null);
      emit('validate', !props.field.required);
    };
    
    const removeMediaItem = (index: number) => {
      const currentItems = [...mediaArray.value];
      currentItems.splice(index, 1);
      emit('update:modelValue', currentItems);
      emit('validate', currentItems.length > 0 || !props.field.required);
    };
    
    const clearAllMedia = () => {
      emit('update:modelValue', []);
      emit('validate', !props.field.required);
    };
    
    return {
      showMediaDialog,
      isMultiple,
      selectedMedia,
      mediaArray,
      hasMedia,
      getSelectionDescription,
      getFileTypesForDialog,
      isImage,
      getMediaUrl,
      getFileIcon,
      formatFileSize,
      openMediaLibrary,
      handleMediaSelection,
      previewMedia,
      removeMedia,
      removeMediaItem,
      clearAllMedia
    };
  }
});
</script>

<style scoped lang="scss">
.media-field {
  display: inline-block;
  width: 100%;
  
  .media-selection-area {
    border: 2px dashed #1976d2;
    border-radius: 12px;
    padding: 32px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #f8fafe;
    
    &:hover {
      border-color: #1565c0;
      background-color: #e3f2fd;
      transform: translateY(-2px);
    }
    
    .selection-text {
      margin-top: 16px;
      
      .text-body1 {
        font-weight: 500;
        color: #1976d2;
      }
    }
  }
  
  .media-preview {
    .image-preview {
      display: inline-block;
      
      .image-container {
        width: auto;
        max-width: 300px;
        background: #f8f8f8;
        border-radius: 8px;
        overflow: hidden;
        display: inline-block;
        
        .preview-image {
          width: auto;
          height: auto;
          max-width: 100%;
          max-height: 200px;
          object-fit: contain;
          display: block;
        }
      }
    }
    
    .file-preview {
      display: flex;
      align-items: center;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 12px;
      gap: 12px;
      border: 1px solid #e0e0e0;
      
      .file-info {
        flex: 1;
        min-width: 0;
        
        .file-name {
          font-weight: 500;
          word-break: break-word;
        }
      }
    }
    
    .media-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
  }
  
  .multiple-media-preview {
    .media-grid {
      display: inline-grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 150px));
      gap: 12px;
      margin-bottom: 16px;
      max-width: 100%;
      
      .media-item {
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #e0e0e0;
        background: white;
        aspect-ratio: 1 / 1;
        
        .image-thumbnail {
          width: 100%;
          height: 100%;
          background: #f8f8f8;
          
          .thumbnail-image {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
          }
        }
        
        .file-thumbnail {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background: #f5f5f5;
          color: #757575;
        }
        
        .media-item-actions {
          position: absolute;
          top: 4px;
          right: 4px;
          display: flex;
          gap: 4px;
          
          .q-btn {
            background: rgba(255, 255, 255, 0.9);
          }
        }
      }
    }
    
    .multiple-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }
  }
}

// Mobile responsive adjustments
@media (max-width: 768px) {
  .media-field {
    .image-container {
      max-width: 250px;
    }
    
    .multiple-media-preview {
      .media-grid {
        grid-template-columns: repeat(auto-fill, minmax(80px, 120px));
        gap: 8px;
      }
    }
  }
}
</style>