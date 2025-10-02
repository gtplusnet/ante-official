<template>
  <q-card flat bordered class="asset-media-item cursor-pointer" @click="$emit('click')">
    <div class="media-preview">
      <!-- Image Preview -->
      <q-img 
        v-if="mediaFile.type === 'IMAGE'"
        :src="getThumbnailUrl(mediaFile)"
        :ratio="16/9"
        class="rounded-borders-top"
      >
        <template v-slot:error>
          <div class="absolute-full flex flex-center bg-grey-3">
            <q-icon name="image" color="grey-6" size="24px" />
          </div>
        </template>
        <div class="absolute-top-right q-pa-xs">
          <q-badge color="blue" floating>
            <q-icon name="image" size="12px" />
          </q-badge>
        </div>
      </q-img>
      
      <!-- Document Preview -->
      <div 
        v-else 
        class="document-preview flex flex-center"
        :class="getDocumentClass(mediaFile)"
      >
        <q-icon 
          :name="getFileIcon(mediaFile)" 
          :color="getDocumentColor(mediaFile)"
          size="32px"
        />
        <div class="absolute-top-right q-pa-xs">
          <q-badge :color="getDocumentColor(mediaFile)" floating>
            <q-icon name="description" size="12px" />
          </q-badge>
        </div>
      </div>
    </div>
    
    <!-- File Info -->
    <q-card-section class="q-pa-sm">
      <div class="text-caption text-weight-medium ellipsis" :title="mediaFile.originalName || mediaFile.name">
        {{ mediaFile.originalName || mediaFile.name }}
      </div>
      <div class="text-caption text-grey-6 ellipsis">
        {{ formatFileSize(mediaFile.size) }}
        <span v-if="mediaFile.createdAt"> • {{ formatDate(mediaFile.createdAt) }}</span>
      </div>
    </q-card-section>
    
    <!-- Processing Status -->
    <div v-if="mediaFile.processingStatus !== 'COMPLETED'" class="processing-overlay absolute-full flex flex-center">
      <div class="processing-content bg-white q-pa-sm rounded-borders shadow-2">
        <q-spinner v-if="mediaFile.processingStatus === 'PROCESSING'" size="20px" color="primary" />
        <q-icon v-else-if="mediaFile.processingStatus === 'FAILED'" name="error" color="negative" size="20px" />
        <q-icon v-else name="hourglass_empty" color="orange" size="20px" />
        <div class="text-caption q-mt-xs">
          {{ getProcessingStatusLabel(mediaFile.processingStatus) }}
        </div>
      </div>
    </div>
  </q-card>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { MediaFile } from '@/stores/media.store';
import { date } from 'quasar';

export default defineComponent({
  name: 'AssetMediaItem',
  props: {
    mediaFile: {
      type: Object as PropType<MediaFile>,
      required: true,
    },
  },
  emits: ['click'],
  methods: {
    getThumbnailUrl(file: MediaFile): string {
      if (file.variants?.thumbnail) {
        return file.variants.thumbnail.url;
      }
      return file.url;
    },
    
    getFileIcon(file: MediaFile): string {
      if (file.mimetype?.includes('pdf')) return 'picture_as_pdf';
      if (file.mimetype?.includes('word')) return 'description';
      if (file.mimetype?.includes('excel') || file.mimetype?.includes('spreadsheet')) return 'grid_on';
      if (file.mimetype?.includes('powerpoint') || file.mimetype?.includes('presentation')) return 'slideshow';
      if (file.mimetype?.includes('zip') || file.mimetype?.includes('rar')) return 'folder_zip';
      if (file.mimetype?.includes('video')) return 'movie';
      if (file.mimetype?.includes('audio')) return 'audiotrack';
      return 'insert_drive_file';
    },
    
    getDocumentColor(file: MediaFile): string {
      if (file.mimetype?.includes('pdf')) return 'red';
      if (file.mimetype?.includes('word')) return 'blue';
      if (file.mimetype?.includes('excel') || file.mimetype?.includes('spreadsheet')) return 'green';
      if (file.mimetype?.includes('powerpoint') || file.mimetype?.includes('presentation')) return 'orange';
      if (file.mimetype?.includes('zip') || file.mimetype?.includes('rar')) return 'purple';
      return 'grey-6';
    },
    
    getDocumentClass(file: MediaFile): string {
      const baseClass = 'document-preview-bg';
      if (file.mimetype?.includes('pdf')) return `${baseClass} bg-red-1`;
      if (file.mimetype?.includes('word')) return `${baseClass} bg-blue-1`;
      if (file.mimetype?.includes('excel')) return `${baseClass} bg-green-1`;
      if (file.mimetype?.includes('powerpoint')) return `${baseClass} bg-orange-1`;
      return `${baseClass} bg-grey-2`;
    },
    
    formatFileSize(bytes: number): string {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },
    
    formatDate(dateValue: Date): string {
      if (!dateValue) return '';
      const now = new Date();
      const fileDate = new Date(dateValue);
      const diffInDays = Math.floor((now.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) return 'Today';
      if (diffInDays === 1) return 'Yesterday';
      if (diffInDays < 7) return `${diffInDays} days ago`;
      
      return date.formatDate(fileDate, 'MMM DD');
    },
    
    getProcessingStatusLabel(status: string): string {
      switch (status) {
        case 'PENDING': return 'Pending';
        case 'PROCESSING': return 'Processing';
        case 'FAILED': return 'Failed';
        default: return 'Unknown';
      }
    },
  },
});
</script>

<style scoped lang="scss">
.asset-media-item {
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .media-preview {
    position: relative;
    height: 80px;
  }
  
  .document-preview {
    height: 100%;
    border-radius: 4px 4px 0 0;
  }
  
  .processing-overlay {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(2px);
    
    .processing-content {
      text-align: center;
      min-width: 80px;
    }
  }
  
  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>