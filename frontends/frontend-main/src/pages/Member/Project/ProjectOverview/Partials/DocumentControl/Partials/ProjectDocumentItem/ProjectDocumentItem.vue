<template>
  <div class="project-document-item q-pa-xs cursor-pointer" @click="$emit('click')">
    <div class="row items-center no-wrap">
      <!-- Document Icon -->
      <div class="col-auto q-pr-sm">
        <q-icon
          :name="getDocumentIcon(document)"
          size="20px"
          :color="getDocumentColor(document)"
        />
      </div>
      
      <!-- Document Info -->
      <div class="col">
        <div class="text-body-medium text-weight-medium document-name">
          {{ document.originalName || document.name }}
        </div>
        <div class="text-caption text-grey-6">
          <span v-if="document.uploadedBy">
            Uploaded by {{ document.uploadedBy.firstName }} {{ document.uploadedBy.lastName }}
          </span>
          <span v-if="document.uploadedBy && document.createdAt"> • </span>
          <span v-if="document.createdAt">
            {{ formatDate(document.createdAt) }}
          </span>
        </div>
      </div>
      
      <!-- File Size -->
      <div class="col-auto text-caption text-grey-6">
        {{ formatFileSize(document.size) }}
      </div>
      
      <!-- Actions -->
      <div class="col-auto q-pl-sm">
        <q-btn
          flat
          round
          dense
          size="sm"
          icon="download"
          @click.stop="downloadDocument"
          color="primary"
        >
          <q-tooltip>Download</q-tooltip>
        </q-btn>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { MediaFile } from '@/stores/media.store';
import { date } from 'quasar';

export default defineComponent({
  name: 'ProjectDocumentItem',
  props: {
    document: {
      type: Object as PropType<MediaFile>,
      required: true,
    },
  },
  emits: ['click'],
  methods: {
    getDocumentIcon(file: MediaFile): string {
      if (file.mimetype?.includes('pdf')) return 'picture_as_pdf';
      if (file.mimetype?.includes('word')) return 'description';
      if (file.mimetype?.includes('excel') || file.mimetype?.includes('spreadsheet')) return 'grid_on';
      if (file.mimetype?.includes('powerpoint') || file.mimetype?.includes('presentation')) return 'slideshow';
      if (file.mimetype?.includes('image')) return 'image';
      if (file.mimetype?.includes('zip') || file.mimetype?.includes('rar')) return 'folder_zip';
      return 'insert_drive_file';
    },
    
    getDocumentColor(file: MediaFile): string {
      if (file.mimetype?.includes('pdf')) return 'red';
      if (file.mimetype?.includes('word')) return 'blue';
      if (file.mimetype?.includes('excel') || file.mimetype?.includes('spreadsheet')) return 'green';
      if (file.mimetype?.includes('powerpoint') || file.mimetype?.includes('presentation')) return 'orange';
      if (file.mimetype?.includes('image')) return 'purple';
      return 'grey-6';
    },
    
    formatDate(dateValue: Date): string {
      if (!dateValue) return '';
      return date.formatDate(new Date(dateValue), 'MMM DD, YYYY');
    },
    
    formatFileSize(bytes: number): string {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    downloadDocument() {
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = this.document.url;
      link.download = this.document.originalName || this.document.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
  },
});
</script>

<style scoped lang="scss">
.project-document-item {
  border-radius: 4px;
  margin-bottom: 4px;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
  
  .document-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 200px;
  }
}
</style>