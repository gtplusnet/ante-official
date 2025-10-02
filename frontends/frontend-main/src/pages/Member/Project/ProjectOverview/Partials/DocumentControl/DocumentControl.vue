<template>
  <div>
    <q-card class="card">
      <q-card-section>
        <div class="row items-center no-wrap">
          <!-- title -->
          <div class="col">
            <div class="text-title-large">Document Control</div>
          </div>
          <!-- actions -->
          <div class="col-auto">
            <q-btn
              flat
              round
              dense
              icon="add"
              @click="openMediaLibrary"
              color="primary"
            >
              <q-tooltip>Upload Documents</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              icon="folder_open"
              @click="viewAllDocuments"
              color="primary"
            >
              <q-tooltip>View All Documents</q-tooltip>
            </q-btn>
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <!-- media files loading -->
        <q-scroll-area class="task-content">
          <template v-if="loading">
            <GlobalLoader />
          </template>
          <template v-else>
            <!-- no documents loaded -->
            <div class="task-empty text-label-medium" v-if="mediaFiles.length === 0">
              No project documents uploaded
              <div class="text-caption q-mt-xs">
                Click the + button to upload project documents
              </div>
            </div>
            <div v-else>
              <project-document-item
                v-for="file in recentDocuments"
                :key="file.id"
                :document="file"
                @click="openDocumentPreview(file)"
              />
              <div v-if="mediaFiles.length > 5" class="text-center q-mt-sm">
                <q-btn
                  flat
                  no-caps
                  dense
                  label="View All Documents"
                  @click="viewAllDocuments"
                  color="primary"
                />
              </div>
            </div>
          </template>
        </q-scroll-area>
      </q-card-section>
    </q-card>

    <!-- Media Library Dialog -->
    <MediaLibraryDialog
      v-model="showMediaDialog"
      :module="ModuleType.PROJECTS"
      title="Project Documents"
      selection-mode="multiple"
      :allow-upload="true"
      :allow-folders="true"
      confirm-label="Select Documents"
      @select="onDocumentsSelected"
      @cancel="onDialogCancel"
    />

    <!-- Full Library Dialog -->
    <MediaLibraryDialog
      v-model="showFullLibraryDialog"
      :module="ModuleType.PROJECTS"
      title="All Project Documents"
      selection-mode="none"
      :allow-upload="true"
      :allow-folders="true"
      @cancel="onFullLibraryCancel"
    />
  </div>
</template>

<style scoped src="./DocumentControl.scss"></style>
<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import GlobalLoader from "src/components/shared/common/GlobalLoader.vue";
import MediaLibraryDialog from 'src/components/shared/MediaLibrary/MediaLibraryDialog.vue';
import ProjectDocumentItem from './Partials/ProjectDocumentItem/ProjectDocumentItem.vue';
import { ModuleType } from 'src/types/media.types';
import { useMediaLibrary } from 'src/composables/useMediaLibrary';
import type { MediaFile } from 'src/stores/media.store';
import { useRoute } from 'vue-router';

export default defineComponent({
  name: 'DocumentControl',
  components: {
    GlobalLoader,
    MediaLibraryDialog,
    ProjectDocumentItem,
  },
  setup() {
    const route = useRoute();
    const projectId = computed(() => route.params.id as string);
    
    // Media library state
    const showMediaDialog = ref(false);
    const showFullLibraryDialog = ref(false);
    
    // Initialize media library composable for Projects module
    const {
      mediaFiles,
      loading,
      loadMedia,
    } = useMediaLibrary({
      module: ModuleType.PROJECTS,
      autoLoad: true,
      defaultQuery: {
        pageSize: 20,
        // Note: When backend supports project filtering, add projectId here
        // projectId: projectId.value
      }
    });
    
    // Computed properties
    const recentDocuments = computed(() => {
      // Show only recent 5 documents in the widget
      return mediaFiles.value
        .filter(file => file.type === 'DOCUMENT')
        .slice(0, 5);
    });
    
    // Methods
    const openMediaLibrary = () => {
      showMediaDialog.value = true;
    };
    
    const viewAllDocuments = () => {
      showFullLibraryDialog.value = true;
    };
    
    const openDocumentPreview = (file: MediaFile) => {
      // Open document in new tab or show preview
      window.open(file.url, '_blank');
    };
    
    const onDocumentsSelected = (selectedFiles: MediaFile | MediaFile[]) => {
      // Handle selected documents if needed
      console.log('Documents selected:', selectedFiles);
      showMediaDialog.value = false;
      
      // Refresh the document list
      loadMedia();
    };
    
    const onDialogCancel = () => {
      showMediaDialog.value = false;
    };
    
    const onFullLibraryCancel = () => {
      showFullLibraryDialog.value = false;
    };
    
    onMounted(() => {
      // Load project documents on component mount
      loadMedia();
    });
    
    return {
      // Data
      ModuleType,
      projectId,
      showMediaDialog,
      showFullLibraryDialog,
      
      // Media library
      mediaFiles,
      loading,
      recentDocuments,
      
      // Methods
      openMediaLibrary,
      viewAllDocuments,
      openDocumentPreview,
      onDocumentsSelected,
      onDialogCancel,
      onFullLibraryCancel,
    };
  },
});
</script>
