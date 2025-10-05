<template>
  <div class="calendar-event-attachments">
    <!-- Quick Upload Actions -->
    <div class="row q-gutter-sm q-mb-md">
      <q-btn
        no-caps
        outline
        color="primary"
        size="sm"
        @click="uploadAgenda"
        :loading="loading"
      >
        <q-icon name="event_note" size="14px" class="q-mr-xs" />
        Upload Agenda
      </q-btn>
      <q-btn
        no-caps
        outline
        color="primary"
        size="sm"
        @click="uploadDocuments"
        :loading="loading"
      >
        <q-icon name="description" size="14px" class="q-mr-xs" />
        Add Documents
      </q-btn>
      <q-btn
        no-caps
        outline
        color="primary"
        size="sm"
        @click="uploadPresentations"
        :loading="loading"
      >
        <q-icon name="slideshow" size="14px" class="q-mr-xs" />
        Presentations
      </q-btn>
      <q-btn
        no-caps
        outline
        color="primary"
        size="sm"
        @click="viewAllFiles"
        :loading="loading"
      >
        <q-icon name="folder_open" size="14px" class="q-mr-xs" />
        View All
      </q-btn>
    </div>

    <!-- Attachment Summary -->
    <div v-if="mediaFiles.length > 0" class="attachment-summary q-mb-md">
      <div class="row items-center q-mb-sm">
        <div class="col">
          <div class="text-caption text-grey-6">
            {{ mediaFiles.length }} attachment{{ mediaFiles.length !== 1 ? 's' : '' }}
          </div>
        </div>
        <div class="col-auto">
          <q-btn
            flat
            dense
            size="sm"
            @click="clearAllAttachments"
            color="negative"
            icon="clear_all"
          >
            <q-tooltip>Clear All</q-tooltip>
          </q-btn>
        </div>
      </div>
      
      <!-- File List -->
      <div class="attachment-list">
        <div 
          v-for="file in recentAttachments" 
          :key="file.id"
          class="attachment-item q-pa-xs cursor-pointer"
          @click="openFile(file)"
        >
          <div class="row items-center no-wrap">
            <div class="col-auto q-pr-sm">
              <q-icon
                :name="getFileIcon(file)"
                :color="getFileColor(file)"
                size="16px"
              />
            </div>
            <div class="col">
              <div class="text-caption text-weight-medium ellipsis">
                {{ file.originalName || file.name }}
              </div>
              <div class="text-caption text-grey-6">
                {{ formatFileSize(file.size) }}
                <span v-if="file.createdAt"> • {{ formatDate(file.createdAt) }}</span>
              </div>
            </div>
            <div class="col-auto">
              <q-btn
                flat
                round
                dense
                size="xs"
                icon="close"
                @click.stop="removeAttachment(file)"
                color="negative"
              />
            </div>
          </div>
        </div>
        
        <!-- Show more indicator -->
        <div v-if="mediaFiles.length > 3" class="text-center q-mt-xs">
          <q-btn
            flat
            dense
            size="sm"
            :label="`+${mediaFiles.length - 3} more`"
            @click="viewAllFiles"
            color="primary"
          />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state text-center q-py-md">
      <q-icon name="attach_file" size="32px" color="grey-4" class="q-mb-sm" />
      <div class="text-caption text-grey-6">
        No attachments yet. Use the buttons above to add event documents.
      </div>
    </div>

    <!-- Media Library Dialog for Agendas -->
    <MediaLibraryDialog
      v-model="showAgendaDialog"
      :module="ModuleType.CALENDAR"
      title="Event Agenda"
      :default-folder="eventAgendaFolderName"
      selection-mode="multiple"
      :file-types="['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']"
      :allow-upload="true"
      :allow-folders="false"
      confirm-label="Add Agenda"
      @select="onAgendaSelected"
      @cancel="onDialogCancel"
    />

    <!-- Media Library Dialog for Documents -->
    <MediaLibraryDialog
      v-model="showDocumentsDialog"
      :module="ModuleType.CALENDAR"
      title="Meeting Documents"
      :default-folder="eventDocumentsFolderName"
      selection-mode="multiple"
      :file-types="['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']"
      :allow-upload="true"
      :allow-folders="false"
      confirm-label="Add Documents"
      @select="onDocumentsSelected"
      @cancel="onDialogCancel"
    />

    <!-- Media Library Dialog for Presentations -->
    <MediaLibraryDialog
      v-model="showPresentationsDialog"
      :module="ModuleType.CALENDAR"
      title="Presentations"
      :default-folder="eventPresentationsFolderName"
      selection-mode="multiple"
      :file-types="['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/pdf']"
      :allow-upload="true"
      :allow-folders="false"
      confirm-label="Add Presentations"
      @select="onPresentationsSelected"
      @cancel="onDialogCancel"
    />

    <!-- Full Media Library Dialog -->
    <MediaLibraryDialog
      v-model="showAllFilesDialog"
      :module="ModuleType.CALENDAR"
      title="All Event Attachments"
      selection-mode="none"
      :allow-upload="true"
      :allow-folders="true"
      @cancel="onDialogCancel"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, PropType } from 'vue';
import { defineAsyncComponent } from 'vue';
import { ModuleType } from 'src/types/media.types';
import { useMediaLibrary } from '../../../../../composables/useMediaLibrary';
import type { MediaFile } from '../../../../../stores/media.store';
import { date, Dialog } from 'quasar';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const MediaLibraryDialog = defineAsyncComponent(() =>
  import('../../../../../components/shared/MediaLibrary/MediaLibraryDialog.vue')
);

export default defineComponent({
  name: 'CalendarEventAttachments',
  components: {
    MediaLibraryDialog,
  },
  props: {
    eventId: {
      type: [Number, String] as PropType<number | string | null>,
      default: null,
    },
  },
  setup(props) {
    // Dialog states
    const showAgendaDialog = ref(false);
    const showDocumentsDialog = ref(false);
    const showPresentationsDialog = ref(false);
    const showAllFilesDialog = ref(false);
    
    // Initialize media library composable for Calendar module
    const {
      mediaFiles,
      loading,
      loadMedia,
      deleteFile,
    } = useMediaLibrary({
      module: ModuleType.CALENDAR,
      autoLoad: true,
      defaultQuery: {
        pageSize: 20,
        // Note: When backend supports event filtering, add eventId here
        // eventId: props.eventId
      }
    });
    
    // Computed properties
    const recentAttachments = computed(() => {
      return mediaFiles.value
        .slice(0, 3)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
    
    // Folder names for organization
    const eventAgendaFolderName = computed(() => 
      props.eventId ? `Event-${props.eventId}-Agenda` : 'Event-Agendas'
    );
    const eventDocumentsFolderName = computed(() => 
      props.eventId ? `Event-${props.eventId}-Documents` : 'Meeting-Documents'
    );
    const eventPresentationsFolderName = computed(() => 
      props.eventId ? `Event-${props.eventId}-Presentations` : 'Presentations'
    );
    
    // Methods
    const uploadAgenda = () => {
      showAgendaDialog.value = true;
    };
    
    const uploadDocuments = () => {
      showDocumentsDialog.value = true;
    };
    
    const uploadPresentations = () => {
      showPresentationsDialog.value = true;
    };
    
    const viewAllFiles = () => {
      showAllFilesDialog.value = true;
    };
    
    const getFileIcon = (file: MediaFile): string => {
      if (file.mimetype?.includes('pdf')) return 'picture_as_pdf';
      if (file.mimetype?.includes('word')) return 'description';
      if (file.mimetype?.includes('excel') || file.mimetype?.includes('spreadsheet')) return 'grid_on';
      if (file.mimetype?.includes('powerpoint') || file.mimetype?.includes('presentation')) return 'slideshow';
      if (file.mimetype?.includes('image')) return 'image';
      return 'insert_drive_file';
    };
    
    const getFileColor = (file: MediaFile): string => {
      if (file.mimetype?.includes('pdf')) return 'red';
      if (file.mimetype?.includes('word')) return 'blue';
      if (file.mimetype?.includes('excel') || file.mimetype?.includes('spreadsheet')) return 'green';
      if (file.mimetype?.includes('powerpoint') || file.mimetype?.includes('presentation')) return 'orange';
      if (file.mimetype?.includes('image')) return 'purple';
      return 'grey-6';
    };
    
    const formatFileSize = (bytes: number): string => {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };
    
    const formatDate = (dateValue: Date): string => {
      return date.formatDate(new Date(dateValue), 'MMM DD');
    };
    
    const openFile = (file: MediaFile) => {
      window.open(file.url, '_blank');
    };
    
    const removeAttachment = async (file: MediaFile) => {
      Dialog.create({
        title: 'Remove Attachment',
        message: `Are you sure you want to remove "${file.originalName || file.name}"?`,
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          await deleteFile(file);
          loadMedia();
        } catch (error) {
          console.error('Failed to remove attachment:', error);
        }
      });
    };
    
    const clearAllAttachments = () => {
      Dialog.create({
        title: 'Clear All Attachments',
        message: 'Are you sure you want to remove all attachments from this event?',
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          // Remove all current attachments
          for (const file of mediaFiles.value) {
            await deleteFile(file);
          }
          loadMedia();
        } catch (error) {
          console.error('Failed to clear attachments:', error);
        }
      });
    };
    
    // Event handlers
    const onAgendaSelected = (files: MediaFile | MediaFile[]) => {
      console.log('Agenda selected:', files);
      showAgendaDialog.value = false;
      loadMedia();
    };
    
    const onDocumentsSelected = (files: MediaFile | MediaFile[]) => {
      console.log('Documents selected:', files);
      showDocumentsDialog.value = false;
      loadMedia();
    };
    
    const onPresentationsSelected = (files: MediaFile | MediaFile[]) => {
      console.log('Presentations selected:', files);
      showPresentationsDialog.value = false;
      loadMedia();
    };
    
    const onDialogCancel = () => {
      showAgendaDialog.value = false;
      showDocumentsDialog.value = false;
      showPresentationsDialog.value = false;
      showAllFilesDialog.value = false;
    };
    
    onMounted(() => {
      if (props.eventId) {
        loadMedia();
      }
    });
    
    return {
      // Data
      ModuleType,
      showAgendaDialog,
      showDocumentsDialog,
      showPresentationsDialog,
      showAllFilesDialog,
      
      // Media library
      mediaFiles,
      loading,
      recentAttachments,
      
      // Folder names
      eventAgendaFolderName,
      eventDocumentsFolderName,
      eventPresentationsFolderName,
      
      // Methods
      uploadAgenda,
      uploadDocuments,
      uploadPresentations,
      viewAllFiles,
      getFileIcon,
      getFileColor,
      formatFileSize,
      formatDate,
      openFile,
      removeAttachment,
      clearAllAttachments,
      onAgendaSelected,
      onDocumentsSelected,
      onPresentationsSelected,
      onDialogCancel,
    };
  },
});
</script>

<style scoped lang="scss">
.calendar-event-attachments {
  .attachment-item {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    margin-bottom: 4px;
    transition: background-color 0.2s ease;
    
    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
  }
  
  .empty-state {
    border: 2px dashed #e0e0e0;
    border-radius: 8px;
    background-color: #fafafa;
  }
  
  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>