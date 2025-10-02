<template>
  <div class="asset-equipment-media">
    <!-- Quick Actions -->
    <div class="row q-mb-md">
      <div class="col">
        <div class="row q-gutter-sm">
          <q-btn
            no-caps
            outline
            color="primary"
            size="sm"
            @click="uploadPhotos"
            :loading="loading"
          >
            <q-icon name="camera_alt" size="16px" class="q-mr-xs" />
            Add Photos
          </q-btn>
          <q-btn
            no-caps
            outline
            color="primary"
            size="sm"
            @click="uploadManuals"
            :loading="loading"
          >
            <q-icon name="description" size="16px" class="q-mr-xs" />
            Add Manuals
          </q-btn>
          <q-btn
            no-caps
            outline
            color="primary"
            size="sm"
            @click="uploadWarranties"
            :loading="loading"
          >
            <q-icon name="verified_user" size="16px" class="q-mr-xs" />
            Add Warranties
          </q-btn>
          <q-btn
            no-caps
            outline
            color="primary"
            size="sm"
            @click="viewAllMedia"
            :loading="loading"
          >
            <q-icon name="folder_open" size="16px" class="q-mr-xs" />
            View All
          </q-btn>
        </div>
      </div>
    </div>

    <!-- Media Summary -->
    <div class="row q-mb-md">
      <!-- Equipment Photos -->
      <div class="col-4 q-pr-sm">
        <q-card flat bordered class="media-summary-card">
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-grey-6 q-mb-xs">Equipment Photos</div>
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-h6">{{ photoCount }}</div>
                <div class="text-caption text-grey-6">images</div>
              </div>
              <div class="col-auto">
                <q-icon name="camera_alt" size="24px" color="blue" />
              </div>
            </div>
            <div v-if="recentPhotos.length > 0" class="q-mt-xs">
              <div class="row q-gutter-xs">
                <div 
                  v-for="photo in recentPhotos.slice(0, 3)" 
                  :key="photo.id"
                  class="col"
                >
                  <q-img 
                    :src="getThumbnailUrl(photo)"
                    :ratio="1"
                    class="rounded-borders cursor-pointer"
                    @click="previewImage(photo)"
                  >
                    <template v-slot:error>
                      <div class="absolute-full flex flex-center bg-grey-3">
                        <q-icon name="image" color="grey-6" size="20px" />
                      </div>
                    </template>
                  </q-img>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Manuals & Documentation -->
      <div class="col-4 q-px-xs">
        <q-card flat bordered class="media-summary-card">
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-grey-6 q-mb-xs">Manuals & Docs</div>
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-h6">{{ documentCount }}</div>
                <div class="text-caption text-grey-6">files</div>
              </div>
              <div class="col-auto">
                <q-icon name="description" size="24px" color="green" />
              </div>
            </div>
            <div v-if="recentDocuments.length > 0" class="q-mt-xs">
              <div 
                v-for="doc in recentDocuments.slice(0, 2)" 
                :key="doc.id"
                class="document-item cursor-pointer q-mb-xs"
                @click="openDocument(doc)"
              >
                <div class="row items-center no-wrap">
                  <q-icon :name="getFileIcon(doc)" size="16px" class="q-mr-xs" />
                  <div class="col text-caption ellipsis">
                    {{ doc.originalName || doc.name }}
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Maintenance Records -->
      <div class="col-4 q-pl-sm">
        <q-card flat bordered class="media-summary-card">
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-grey-6 q-mb-xs">Maintenance & Reports</div>
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-h6">{{ maintenanceCount }}</div>
                <div class="text-caption text-grey-6">records</div>
              </div>
              <div class="col-auto">
                <q-icon name="build" size="24px" color="orange" />
              </div>
            </div>
            <div v-if="maintenanceRecords.length > 0" class="q-mt-xs">
              <div class="text-caption text-grey-6">
                Last updated: {{ formatDate(maintenanceRecords[0].createdAt) }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Recent Files List -->
    <div v-if="recentFiles.length > 0" class="q-mb-md">
      <div class="text-caption text-grey-6 q-mb-sm">Recent Files</div>
      <div class="row q-gutter-xs">
        <div 
          v-for="file in recentFiles.slice(0, 6)" 
          :key="file.id"
          class="col-2"
        >
          <asset-media-item 
            :media-file="file"
            @click="openFile(file)"
          />
        </div>
      </div>
    </div>

    <!-- Media Library Dialog for Photos -->
    <MediaLibraryDialog
      v-model="showPhotosDialog"
      :module="ModuleType.ASSETS"
      title="Equipment Photos"
      :default-folder="equipmentPhotoFolderName"
      selection-mode="multiple"
      :file-types="['image/*']"
      :allow-upload="true"
      :allow-folders="false"
      confirm-label="Upload Photos"
      @select="onPhotosSelected"
      @cancel="onDialogCancel"
    />

    <!-- Media Library Dialog for Manuals -->
    <MediaLibraryDialog
      v-model="showManualsDialog"
      :module="ModuleType.ASSETS"
      title="Equipment Manuals"
      :default-folder="equipmentManualFolderName"
      selection-mode="multiple"
      :file-types="['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']"
      :allow-upload="true"
      :allow-folders="false"
      confirm-label="Upload Manuals"
      @select="onManualsSelected"
      @cancel="onDialogCancel"
    />

    <!-- Media Library Dialog for Warranties -->
    <MediaLibraryDialog
      v-model="showWarrantiesDialog"
      :module="ModuleType.ASSETS"
      title="Warranty Documents"
      :default-folder="equipmentWarrantyFolderName"
      selection-mode="multiple"
      :file-types="['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']"
      :allow-upload="true"
      :allow-folders="false"
      confirm-label="Upload Warranties"
      @select="onWarrantiesSelected"
      @cancel="onDialogCancel"
    />

    <!-- Full Media Library Dialog -->
    <MediaLibraryDialog
      v-model="showFullMediaDialog"
      :module="ModuleType.ASSETS"
      title="All Equipment Media"
      selection-mode="none"
      :allow-upload="true"
      :allow-folders="true"
      @cancel="onDialogCancel"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, PropType } from 'vue';
import MediaLibraryDialog from '../../../../components/shared/MediaLibrary/MediaLibraryDialog.vue';
import AssetMediaItem from './AssetMediaItem.vue';
import { ModuleType } from 'src/types/media.types';
import { useMediaLibrary } from '../../../../composables/useMediaLibrary';
import type { MediaFile } from '../../../../stores/media.store';
import { date } from 'quasar';

export default defineComponent({
  name: 'AssetEquipmentMedia',
  components: {
    MediaLibraryDialog,
    AssetMediaItem,
  },
  props: {
    equipmentId: {
      type: [Number, String] as PropType<number | string>,
      required: true,
    },
  },
  setup(props) {
    // Dialog states
    const showPhotosDialog = ref(false);
    const showManualsDialog = ref(false);
    const showWarrantiesDialog = ref(false);
    const showFullMediaDialog = ref(false);
    
    // Initialize media library composable for Assets module
    const {
      mediaFiles,
      loading,
      loadMedia,
    } = useMediaLibrary({
      module: ModuleType.ASSETS,
      autoLoad: true,
      defaultQuery: {
        pageSize: 50,
        // Note: When backend supports equipment filtering, add equipmentId here
        // equipmentId: props.equipmentId
      }
    });
    
    // Computed properties
    const recentFiles = computed(() => {
      return mediaFiles.value
        .slice(0, 20)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
    
    const recentPhotos = computed(() => {
      return mediaFiles.value.filter(file => file.type === 'IMAGE');
    });
    
    const recentDocuments = computed(() => {
      return mediaFiles.value.filter(file => file.type === 'DOCUMENT');
    });
    
    const maintenanceRecords = computed(() => {
      // Filter files that might be in maintenance or inspection folders
      return mediaFiles.value.filter(file => 
        file.folder?.name?.toLowerCase().includes('maintenance') ||
        file.folder?.name?.toLowerCase().includes('inspection') ||
        file.tags?.some(tag => tag.toLowerCase().includes('maintenance'))
      );
    });
    
    const photoCount = computed(() => recentPhotos.value.length);
    const documentCount = computed(() => recentDocuments.value.length);
    const maintenanceCount = computed(() => maintenanceRecords.value.length);
    
    // Folder names for organization
    const equipmentPhotoFolderName = computed(() => `Equipment-${props.equipmentId}-Photos`);
    const equipmentManualFolderName = computed(() => `Equipment-${props.equipmentId}-Manuals`);
    const equipmentWarrantyFolderName = computed(() => `Equipment-${props.equipmentId}-Warranties`);
    
    // Methods
    const uploadPhotos = () => {
      showPhotosDialog.value = true;
    };
    
    const uploadManuals = () => {
      showManualsDialog.value = true;
    };
    
    const uploadWarranties = () => {
      showWarrantiesDialog.value = true;
    };
    
    const viewAllMedia = () => {
      showFullMediaDialog.value = true;
    };
    
    const getThumbnailUrl = (file: MediaFile) => {
      if (file.variants?.thumbnail) {
        return file.variants.thumbnail.url;
      }
      return file.url;
    };
    
    const getFileIcon = (file: MediaFile): string => {
      if (file.mimetype?.includes('pdf')) return 'picture_as_pdf';
      if (file.mimetype?.includes('word')) return 'description';
      if (file.mimetype?.includes('excel')) return 'grid_on';
      if (file.mimetype?.includes('image')) return 'image';
      return 'insert_drive_file';
    };
    
    const formatDate = (dateValue: Date): string => {
      return date.formatDate(new Date(dateValue), 'MMM DD, YYYY');
    };
    
    const previewImage = (file: MediaFile) => {
      window.open(file.url, '_blank');
    };
    
    const openDocument = (file: MediaFile) => {
      window.open(file.url, '_blank');
    };
    
    const openFile = (file: MediaFile) => {
      window.open(file.url, '_blank');
    };
    
    // Event handlers
    const onPhotosSelected = (files: MediaFile | MediaFile[]) => {
      console.log('Photos selected:', files);
      showPhotosDialog.value = false;
      loadMedia();
    };
    
    const onManualsSelected = (files: MediaFile | MediaFile[]) => {
      console.log('Manuals selected:', files);
      showManualsDialog.value = false;
      loadMedia();
    };
    
    const onWarrantiesSelected = (files: MediaFile | MediaFile[]) => {
      console.log('Warranties selected:', files);
      showWarrantiesDialog.value = false;
      loadMedia();
    };
    
    const onDialogCancel = () => {
      showPhotosDialog.value = false;
      showManualsDialog.value = false;
      showWarrantiesDialog.value = false;
      showFullMediaDialog.value = false;
    };
    
    onMounted(() => {
      loadMedia();
    });
    
    return {
      // Data
      ModuleType,
      showPhotosDialog,
      showManualsDialog,
      showWarrantiesDialog,
      showFullMediaDialog,
      
      // Media library
      mediaFiles,
      loading,
      recentFiles,
      recentPhotos,
      recentDocuments,
      maintenanceRecords,
      photoCount,
      documentCount,
      maintenanceCount,
      
      // Folder names
      equipmentPhotoFolderName,
      equipmentManualFolderName,
      equipmentWarrantyFolderName,
      
      // Methods
      uploadPhotos,
      uploadManuals,
      uploadWarranties,
      viewAllMedia,
      getThumbnailUrl,
      getFileIcon,
      formatDate,
      previewImage,
      openDocument,
      openFile,
      onPhotosSelected,
      onManualsSelected,
      onWarrantiesSelected,
      onDialogCancel,
    };
  },
});
</script>

<style scoped lang="scss">
.asset-equipment-media {
  .media-summary-card {
    height: 120px;
    
    .q-card-section {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
  }
  
  .document-item {
    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
      border-radius: 4px;
    }
  }
}
</style>