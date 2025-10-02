<template>
  <expanded-nav-page-container>
    <div class="page-head">
      <div class="text-title-large">Media Library</div>
      <div class="q-gutter-sm">
        <q-btn
          outline
          color="primary"
          no-caps
          icon="upload"
          label="Upload Files"
          @click="openUploadDialog"
        />
        <q-btn
          outline
          color="primary"
          no-caps
          icon="create_new_folder"
          label="New Folder"
          @click="createNewFolder"
        />
      </div>
    </div>

    <div class="bread-crumbs text-body-small">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_dashboard' }" />
        <q-breadcrumbs-el label="Projects" :to="{ name: 'member_project_dashboard' }" />
        <q-breadcrumbs-el label="Media Library" />
        <q-breadcrumbs-el v-for="(folder, index) in breadcrumbPath" :key="index" :label="folder" />
      </q-breadcrumbs>
    </div>

    <div class="page-content q-mt-lg">
      <!-- Filter and View Options -->
      <q-card class="q-mb-lg">
        <q-card-section>
          <div class="row q-col-gutter-md items-center">
            <div class="col-12 col-md-4">
              <q-input
                v-model="searchQuery"
                outlined
                placeholder="Search files..."
                dense
                clearable
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-md-2">
              <q-select
                v-model="filterType"
                outlined
                dense
                options-dense
                emit-value
                map-options
                :options="fileTypeOptions"
                label="File Type"
                clearable
              />
            </div>
            <div class="col-12 col-md-2">
              <q-select
                v-model="sortBy"
                outlined
                dense
                options-dense
                emit-value
                map-options
                :options="sortOptions"
                label="Sort By"
              />
            </div>
            <div class="col-12 col-md-2">
              <q-btn-toggle
                v-model="viewMode"
                toggle-color="primary"
                :options="[
                  {icon: 'grid_view', value: 'grid'},
                  {icon: 'view_list', value: 'list'}
                ]"
                dense
                unelevated
              />
            </div>
            <div class="col-12 col-md-2">
              <div class="text-caption text-grey">
                {{ filteredFiles.length }} items
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Grid View -->
      <div v-if="viewMode === 'grid'" class="media-grid">
        <div
          v-for="item in filteredFiles"
          :key="item.id"
          class="media-item"
          @click="handleItemClick(item)"
          @dblclick="handleItemDoubleClick(item)"
        >
          <q-card class="media-card">
            <div class="media-preview">
              <q-icon
                v-if="item.type === 'folder'"
                name="folder"
                size="64px"
                color="orange"
              />
              <q-icon
                v-else-if="isImageFile(item)"
                name="image"
                size="64px"
                color="green"
              />
              <q-icon
                v-else-if="isVideoFile(item)"
                name="videocam"
                size="64px"
                color="red"
              />
              <q-icon
                v-else-if="isDocumentFile(item)"
                name="description"
                size="64px"
                color="blue"
              />
              <q-icon
                v-else
                name="insert_drive_file"
                size="64px"
                color="grey"
              />
            </div>
            <q-card-section class="q-pt-sm">
              <div class="text-body-medium text-center ellipsis">{{ item.name }}</div>
              <div class="text-caption text-grey text-center">
                {{ item.type === 'folder' ? 'Folder' : formatFileSize(item.size) }}
              </div>
            </q-card-section>
            <q-menu touch-position context-menu>
              <q-list dense>
                <q-item clickable v-close-popup @click="downloadFile(item)">
                  <q-item-section avatar>
                    <q-icon name="download" />
                  </q-item-section>
                  <q-item-section>Download</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="renameFile(item)">
                  <q-item-section avatar>
                    <q-icon name="edit" />
                  </q-item-section>
                  <q-item-section>Rename</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup @click="deleteFile(item)">
                  <q-item-section avatar>
                    <q-icon name="delete" color="negative" />
                  </q-item-section>
                  <q-item-section>Delete</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-card>
        </div>
      </div>

      <!-- List View -->
      <q-card v-else>
        <q-table
          :rows="filteredFiles"
          :columns="tableColumns"
          row-key="id"
          flat
          :pagination="{ rowsPerPage: 20 }"
        >
          <template v-slot:body-cell-name="props">
            <q-td :props="props" @click="handleItemClick(props.row)" class="cursor-pointer">
              <div class="row items-center no-wrap">
                <q-icon
                  :name="getFileIcon(props.row)"
                  :color="getFileIconColor(props.row)"
                  size="24px"
                  class="q-mr-sm"
                />
                <span>{{ props.value }}</span>
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-size="props">
            <q-td :props="props">
              {{ props.row.type === 'folder' ? '-' : formatFileSize(props.value) }}
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                round
                dense
                icon="download"
                @click="downloadFile(props.row)"
              >
                <q-tooltip>Download</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                icon="edit"
                @click="renameFile(props.row)"
              >
                <q-tooltip>Rename</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                icon="delete"
                @click="deleteFile(props.row)"
              >
                <q-tooltip>Delete</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';

interface MediaFile {
  id: number;
  name: string;
  type: 'folder' | 'file';
  size?: number;
  extension?: string;
  modifiedAt: string;
  project?: string;
}

export default defineComponent({
  name: 'MediaLibrary',
  components: {
    ExpandedNavPageContainer,
  },
  setup() {
    const $q = useQuasar();

    const searchQuery = ref('');
    const filterType = ref('');
    const sortBy = ref('name');
    const viewMode = ref<'grid' | 'list'>('grid');
    const breadcrumbPath = ref<string[]>([]);

    // Dummy data for demonstration
    const files = ref<MediaFile[]>([
      {
        id: 1,
        name: 'Project Images',
        type: 'folder',
        modifiedAt: '2024-03-15',
      },
      {
        id: 2,
        name: 'Documents',
        type: 'folder',
        modifiedAt: '2024-03-14',
      },
      {
        id: 3,
        name: 'project-plan.pdf',
        type: 'file',
        size: 1024000,
        extension: 'pdf',
        modifiedAt: '2024-03-13',
        project: 'Project Alpha',
      },
      {
        id: 4,
        name: 'blueprint.jpg',
        type: 'file',
        size: 2048000,
        extension: 'jpg',
        modifiedAt: '2024-03-12',
        project: 'Project Beta',
      },
      {
        id: 5,
        name: 'presentation.pptx',
        type: 'file',
        size: 5120000,
        extension: 'pptx',
        modifiedAt: '2024-03-11',
        project: 'Project Gamma',
      },
      {
        id: 6,
        name: 'site-photo-1.png',
        type: 'file',
        size: 3072000,
        extension: 'png',
        modifiedAt: '2024-03-10',
        project: 'Project Alpha',
      },
      {
        id: 7,
        name: 'contract.docx',
        type: 'file',
        size: 512000,
        extension: 'docx',
        modifiedAt: '2024-03-09',
        project: 'Project Delta',
      },
      {
        id: 8,
        name: 'budget.xlsx',
        type: 'file',
        size: 768000,
        extension: 'xlsx',
        modifiedAt: '2024-03-08',
        project: 'Project Alpha',
      },
    ]);

    const fileTypeOptions = [
      { label: 'All Types', value: '' },
      { label: 'Images', value: 'image' },
      { label: 'Documents', value: 'document' },
      { label: 'Videos', value: 'video' },
      { label: 'Others', value: 'other' },
    ];

    const sortOptions = [
      { label: 'Name', value: 'name' },
      { label: 'Size', value: 'size' },
      { label: 'Modified', value: 'modified' },
      { label: 'Type', value: 'type' },
    ];

    const tableColumns = [
      {
        name: 'name',
        required: true,
        label: 'Name',
        align: 'left',
        field: 'name',
        sortable: true,
      },
      {
        name: 'type',
        label: 'Type',
        align: 'left',
        field: (row: MediaFile) => row.extension?.toUpperCase() || 'Folder',
        sortable: true,
      },
      {
        name: 'size',
        label: 'Size',
        align: 'left',
        field: 'size',
        sortable: true,
      },
      {
        name: 'modifiedAt',
        label: 'Modified',
        align: 'left',
        field: 'modifiedAt',
        sortable: true,
      },
      {
        name: 'project',
        label: 'Project',
        align: 'left',
        field: 'project',
        sortable: true,
      },
      {
        name: 'actions',
        label: 'Actions',
        align: 'center',
        field: 'actions',
      },
    ];

    const filteredFiles = computed(() => {
      let result = files.value;

      // Apply search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(file =>
          file.name.toLowerCase().includes(query)
        );
      }

      // Apply type filter
      if (filterType.value) {
        result = result.filter(file => {
          if (filterType.value === 'image') {
            return ['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(file.extension || '');
          }
          if (filterType.value === 'document') {
            return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(file.extension || '');
          }
          if (filterType.value === 'video') {
            return ['mp4', 'avi', 'mov', 'wmv'].includes(file.extension || '');
          }
          return true;
        });
      }

      // Apply sorting
      result.sort((a, b) => {
        if (sortBy.value === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy.value === 'size') {
          return (b.size || 0) - (a.size || 0);
        }
        if (sortBy.value === 'modified') {
          return b.modifiedAt.localeCompare(a.modifiedAt);
        }
        return 0;
      });

      return result;
    });

    const isImageFile = (file: MediaFile) => {
      return ['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(file.extension || '');
    };

    const isVideoFile = (file: MediaFile) => {
      return ['mp4', 'avi', 'mov', 'wmv'].includes(file.extension || '');
    };

    const isDocumentFile = (file: MediaFile) => {
      return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(file.extension || '');
    };

    const getFileIcon = (file: MediaFile) => {
      if (file.type === 'folder') return 'folder';
      if (isImageFile(file)) return 'image';
      if (isVideoFile(file)) return 'videocam';
      if (isDocumentFile(file)) return 'description';
      return 'insert_drive_file';
    };

    const getFileIconColor = (file: MediaFile) => {
      if (file.type === 'folder') return 'orange';
      if (isImageFile(file)) return 'green';
      if (isVideoFile(file)) return 'red';
      if (isDocumentFile(file)) return 'blue';
      return 'grey';
    };

    const formatFileSize = (bytes?: number) => {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
    };

    const handleItemClick = (_item: MediaFile) => {
      // Handle single click (selection)
    };

    const handleItemDoubleClick = (item: MediaFile) => {
      if (item.type === 'folder') {
        breadcrumbPath.value.push(item.name);
        // Load folder contents
      } else {
        // Open file preview
      }
    };

    const openUploadDialog = () => {
      $q.notify({
        message: 'Upload dialog would open',
        color: 'info',
      });
    };

    const createNewFolder = () => {
      $q.dialog({
        title: 'New Folder',
        message: 'Enter folder name:',
        prompt: {
          model: '',
          type: 'text',
        },
        cancel: true,
        persistent: true,
      }).onOk((name: string) => {
        $q.notify({
          message: `Folder "${name}" created`,
          color: 'positive',
        });
      });
    };

    const downloadFile = (file: MediaFile) => {
      if (file.type !== 'folder') {
        $q.notify({
          message: `Downloading ${file.name}`,
          color: 'info',
        });
      }
    };

    const renameFile = (file: MediaFile) => {
      $q.dialog({
        title: 'Rename',
        message: 'Enter new name:',
        prompt: {
          model: file.name,
          type: 'text',
        },
        cancel: true,
        persistent: true,
      }).onOk((name: string) => {
        $q.notify({
          message: `Renamed to "${name}"`,
          color: 'positive',
        });
      });
    };

    const deleteFile = (file: MediaFile) => {
      $q.dialog({
        title: 'Confirm',
        message: `Are you sure you want to delete "${file.name}"?`,
        cancel: true,
        persistent: true,
      }).onOk(() => {
        $q.notify({
          message: `"${file.name}" deleted`,
          color: 'negative',
        });
      });
    };

    return {
      searchQuery,
      filterType,
      sortBy,
      viewMode,
      breadcrumbPath,
      files,
      filteredFiles,
      fileTypeOptions,
      sortOptions,
      tableColumns,
      isImageFile,
      isVideoFile,
      isDocumentFile,
      getFileIcon,
      getFileIconColor,
      formatFileSize,
      handleItemClick,
      handleItemDoubleClick,
      openUploadDialog,
      createNewFolder,
      downloadFile,
      renameFile,
      deleteFile,
    };
  },
});
</script>

<style lang="scss" scoped>
.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;

  .media-item {
    cursor: pointer;

    .media-card {
      transition: transform 0.2s ease;

      &:hover {
        transform: translateY(-2px);
      }

      .media-preview {
        height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f5f5f5;
      }
    }
  }
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cursor-pointer {
  cursor: pointer;
}
</style>