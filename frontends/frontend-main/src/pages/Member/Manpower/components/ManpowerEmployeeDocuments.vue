<template>
  <div class="manpower-employee-documents">
    <div class="document-header q-mb-md">
      <div class="text-subtitle1">
        <q-icon name="o_people" class="q-mr-sm" />Employee Documents
      </div>
      <div class="text-caption text-grey-6">
        Secure storage for employee contracts, certificates, and HR records
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="row q-gutter-sm q-mb-md">
      <q-btn
        no-caps
        outline
        color="primary"
        size="sm"
        @click="uploadContracts"
        :loading="loading"
      >
        <q-icon name="gavel" size="14px" class="q-mr-xs" />
        Contracts
      </q-btn>
      <q-btn
        no-caps
        outline
        color="primary"
        size="sm"
        @click="uploadCertificates"
        :loading="loading"
      >
        <q-icon name="verified" size="14px" class="q-mr-xs" />
        Certificates
      </q-btn>
      <q-btn
        no-caps
        outline
        color="primary"
        size="sm"
        @click="uploadGovernmentIds"
        :loading="loading"
      >
        <q-icon name="badge" size="14px" class="q-mr-xs" />
        IDs & Records
      </q-btn>
      <q-btn
        no-caps
        outline
        color="primary"
        size="sm"
        @click="viewAllDocuments"
        :loading="loading"
      >
        <q-icon name="folder_open" size="14px" class="q-mr-xs" />
        View All
      </q-btn>
    </div>

    <!-- Document Summary Cards -->
    <div class="row q-gutter-sm q-mb-md">
      <div class="col">
        <q-card flat bordered class="doc-summary-card">
          <q-card-section class="q-pa-sm text-center">
            <q-icon name="gavel" size="20px" color="blue" class="q-mb-xs" />
            <div class="text-caption text-weight-bold">{{ contractCount }}</div>
            <div class="text-caption text-grey-6">Contracts</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col">
        <q-card flat bordered class="doc-summary-card">
          <q-card-section class="q-pa-sm text-center">
            <q-icon name="verified" size="20px" color="green" class="q-mb-xs" />
            <div class="text-caption text-weight-bold">{{ certificateCount }}</div>
            <div class="text-caption text-grey-6">Certificates</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col">
        <q-card flat bordered class="doc-summary-card">
          <q-card-section class="q-pa-sm text-center">
            <q-icon name="badge" size="20px" color="orange" class="q-mb-xs" />
            <div class="text-caption text-weight-bold">{{ idCount }}</div>
            <div class="text-caption text-grey-6">ID Records</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col">
        <q-card flat bordered class="doc-summary-card">
          <q-card-section class="q-pa-sm text-center">
            <q-icon name="medical_services" size="20px" color="red" class="q-mb-xs" />
            <div class="text-caption text-weight-bold">{{ medicalCount }}</div>
            <div class="text-caption text-grey-6">Medical</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Recent Documents -->
    <div v-if="recentDocuments.length > 0">
      <div class="text-caption text-grey-6 q-mb-sm">Recent Documents</div>
      <div class="document-list">
        <div 
          v-for="doc in recentDocuments" 
          :key="doc.id"
          class="document-item q-pa-sm cursor-pointer"
          @click="openDocument(doc)"
        >
          <div class="row items-center no-wrap">
            <div class="col-auto q-pr-sm">
              <q-icon
                :name="getDocumentIcon(doc)"
                :color="getDocumentColor(doc)"
                size="16px"
              />
            </div>
            <div class="col">
              <div class="text-caption text-weight-medium ellipsis">
                {{ doc.originalName || doc.name }}
              </div>
              <div class="text-caption text-grey-6">
                {{ getDocumentCategory(doc) }}
                <span v-if="doc.createdAt"> • {{ formatDate(doc.createdAt) }}</span>
              </div>
            </div>
            <div class="col-auto">
              <q-chip 
                v-if="doc.tags && doc.tags.length > 0" 
                :label="doc.tags[0]" 
                size="xs" 
                color="primary" 
                text-color="white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state text-center q-py-lg">
      <q-icon name="folder_open" size="48px" color="grey-4" class="q-mb-sm" />
      <div class="text-subtitle2 text-grey-6 q-mb-xs">No employee documents uploaded</div>
      <div class="text-caption text-grey-6">
        Upload employee contracts, certificates, and other HR documents using the buttons above.
      </div>
    </div>

    <!-- Media Library Dialog for Contracts -->
    <MediaLibraryDialog
      v-model="showContractsDialog"
      :module="ModuleType.MANPOWER"
      title="Employee Contracts"
      :default-folder="contractsFolderName"
      selection-mode="multiple"
      :file-types="['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']"
      :allow-upload="true"
      :allow-folders="false"
      confirm-label="Upload Contracts"
      @select="onContractsSelected"
      @cancel="onDialogCancel"
    />

    <!-- Media Library Dialog for Certificates -->
    <MediaLibraryDialog
      v-model="showCertificatesDialog"
      :module="ModuleType.MANPOWER"
      title="Employee Certificates"
      :default-folder="certificatesFolderName"
      selection-mode="multiple"
      :file-types="['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']"
      :allow-upload="true"
      :allow-folders="false"
      confirm-label="Upload Certificates"
      @select="onCertificatesSelected"
      @cancel="onDialogCancel"
    />

    <!-- Media Library Dialog for Government IDs -->
    <MediaLibraryDialog
      v-model="showGovernmentIdsDialog"
      :module="ModuleType.MANPOWER"
      title="Government IDs & Records"
      :default-folder="governmentIdsFolderName"
      selection-mode="multiple"
      :file-types="['image/*', 'application/pdf']"
      :allow-upload="true"
      :allow-folders="false"
      confirm-label="Upload IDs"
      @select="onGovernmentIdsSelected"
      @cancel="onDialogCancel"
    />

    <!-- Full HR Library Dialog -->
    <MediaLibraryDialog
      v-model="showAllDocumentsDialog"
      :module="ModuleType.MANPOWER"
      title="All HR Documents"
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
import { useMediaLibrary } from '../../../../composables/useMediaLibrary';
import type { MediaFile } from '../../../../stores/media.store';
import { date } from 'quasar';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const MediaLibraryDialog = defineAsyncComponent(() =>
  import('../../../../components/shared/MediaLibrary/MediaLibraryDialog.vue')
);

export default defineComponent({
  name: 'ManpowerEmployeeDocuments',
  components: {
    MediaLibraryDialog,
  },
  props: {
    employeeId: {
      type: [Number, String] as PropType<number | string | null>,
      default: null,
    },
  },
  setup(props) {
    // Dialog states
    const showContractsDialog = ref(false);
    const showCertificatesDialog = ref(false);
    const showGovernmentIdsDialog = ref(false);
    const showAllDocumentsDialog = ref(false);
    
    // Initialize media library composable for Manpower module
    const {
      mediaFiles,
      loading,
      loadMedia,
    } = useMediaLibrary({
      module: ModuleType.MANPOWER,
      autoLoad: true,
      defaultQuery: {
        pageSize: 50,
        // Note: When backend supports employee filtering, add employeeId here
        // employeeId: props.employeeId
      }
    });
    
    // Computed properties
    const recentDocuments = computed(() => {
      return mediaFiles.value
        .slice(0, 10)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
    
    const contractCount = computed(() => {
      return mediaFiles.value.filter(file => 
        file.folder?.name?.toLowerCase().includes('contract') ||
        file.tags?.some(tag => tag.toLowerCase().includes('contract'))
      ).length;
    });
    
    const certificateCount = computed(() => {
      return mediaFiles.value.filter(file => 
        file.folder?.name?.toLowerCase().includes('certificate') ||
        file.tags?.some(tag => tag.toLowerCase().includes('certificate'))
      ).length;
    });
    
    const idCount = computed(() => {
      return mediaFiles.value.filter(file => 
        file.folder?.name?.toLowerCase().includes('id') ||
        file.folder?.name?.toLowerCase().includes('government') ||
        file.tags?.some(tag => tag.toLowerCase().includes('id'))
      ).length;
    });
    
    const medicalCount = computed(() => {
      return mediaFiles.value.filter(file => 
        file.folder?.name?.toLowerCase().includes('medical') ||
        file.tags?.some(tag => tag.toLowerCase().includes('medical'))
      ).length;
    });
    
    // Folder names for organization
    const contractsFolderName = computed(() => 
      props.employeeId ? `Employee-${props.employeeId}-Contracts` : 'Contracts'
    );
    const certificatesFolderName = computed(() => 
      props.employeeId ? `Employee-${props.employeeId}-Certificates` : 'Certificates'
    );
    const governmentIdsFolderName = computed(() => 
      props.employeeId ? `Employee-${props.employeeId}-Government-IDs` : 'Government-IDs'
    );
    
    // Methods
    const uploadContracts = () => {
      showContractsDialog.value = true;
    };
    
    const uploadCertificates = () => {
      showCertificatesDialog.value = true;
    };
    
    const uploadGovernmentIds = () => {
      showGovernmentIdsDialog.value = true;
    };
    
    const viewAllDocuments = () => {
      showAllDocumentsDialog.value = true;
    };
    
    const getDocumentIcon = (file: MediaFile): string => {
      if (file.mimetype?.includes('pdf')) return 'picture_as_pdf';
      if (file.mimetype?.includes('word')) return 'description';
      if (file.mimetype?.includes('image')) return 'image';
      return 'insert_drive_file';
    };
    
    const getDocumentColor = (file: MediaFile): string => {
      if (file.mimetype?.includes('pdf')) return 'red';
      if (file.mimetype?.includes('word')) return 'blue';
      if (file.mimetype?.includes('image')) return 'purple';
      return 'grey-6';
    };
    
    const getDocumentCategory = (file: MediaFile): string => {
      if (file.folder?.name?.toLowerCase().includes('contract')) return 'Contract';
      if (file.folder?.name?.toLowerCase().includes('certificate')) return 'Certificate';
      if (file.folder?.name?.toLowerCase().includes('id')) return 'Government ID';
      if (file.folder?.name?.toLowerCase().includes('medical')) return 'Medical Record';
      if (file.tags?.length) return file.tags[0];
      return 'HR Document';
    };
    
    const formatDate = (dateValue: Date): string => {
      return date.formatDate(new Date(dateValue), 'MMM DD, YYYY');
    };
    
    const openDocument = (file: MediaFile) => {
      window.open(file.url, '_blank');
    };
    
    // Event handlers
    const onContractsSelected = (files: MediaFile | MediaFile[]) => {
      console.log('Contracts selected:', files);
      showContractsDialog.value = false;
      loadMedia();
    };
    
    const onCertificatesSelected = (files: MediaFile | MediaFile[]) => {
      console.log('Certificates selected:', files);
      showCertificatesDialog.value = false;
      loadMedia();
    };
    
    const onGovernmentIdsSelected = (files: MediaFile | MediaFile[]) => {
      console.log('Government IDs selected:', files);
      showGovernmentIdsDialog.value = false;
      loadMedia();
    };
    
    const onDialogCancel = () => {
      showContractsDialog.value = false;
      showCertificatesDialog.value = false;
      showGovernmentIdsDialog.value = false;
      showAllDocumentsDialog.value = false;
    };
    
    onMounted(() => {
      loadMedia();
    });
    
    return {
      // Data
      ModuleType,
      showContractsDialog,
      showCertificatesDialog,
      showGovernmentIdsDialog,
      showAllDocumentsDialog,
      
      // Media library
      mediaFiles,
      loading,
      recentDocuments,
      contractCount,
      certificateCount,
      idCount,
      medicalCount,
      
      // Folder names
      contractsFolderName,
      certificatesFolderName,
      governmentIdsFolderName,
      
      // Methods
      uploadContracts,
      uploadCertificates,
      uploadGovernmentIds,
      viewAllDocuments,
      getDocumentIcon,
      getDocumentColor,
      getDocumentCategory,
      formatDate,
      openDocument,
      onContractsSelected,
      onCertificatesSelected,
      onGovernmentIdsSelected,
      onDialogCancel,
    };
  },
});
</script>

<style scoped lang="scss">
.manpower-employee-documents {
  .doc-summary-card {
    min-height: 70px;
  }
  
  .document-item {
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