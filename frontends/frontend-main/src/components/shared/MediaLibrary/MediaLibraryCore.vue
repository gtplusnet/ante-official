<template>
  <div class="media-library-core" :class="`mode-${mode}`">
    <!-- Image Preview Dialog -->
    <ImagePreviewDialog
      v-if="previewImage"
      v-model="showImagePreview"
      :image="previewImage"
      :show-info="true"
    />
    
    <!-- Edit Media Dialog -->
    <EditMediaDialog
      v-model="showEditDialog"
      :media="selectedAsset ? {
        ...selectedAsset,
        folder: typeof selectedAsset.folder === 'object' && selectedAsset.folder 
          ? selectedAsset.folder.name 
          : selectedAsset.folder || 'Root'
      } : undefined"
      :folders="folders"
      @save="handleMediaUpdate"
      @delete="handleMediaDelete"
    />
    <!-- Breadcrumb Navigation -->
    <div v-if="showBreadcrumbs" class="breadcrumb-nav">
      <div class="breadcrumb-items">
        <span class="breadcrumb-item" @click="navigateToFolder([])">
          <q-icon name="o_home" size="18px" />
          <span>{{ libraryTitle }}</span>
        </span>
        <template v-for="(folder, index) in currentFolderPath" :key="index">
          <q-icon name="chevron_right" size="18px" class="breadcrumb-separator" />
          <span 
            class="breadcrumb-item" 
            :class="{ active: index === currentFolderPath.length - 1 }"
            @click="navigateToFolder(currentFolderPath.slice(0, index + 1))"
          >
            {{ folder }}
          </span>
        </template>
      </div>
      <div class="breadcrumb-actions">
        <q-btn
          v-if="allowFolders"
          flat
          dense
          no-caps
          size="sm"
          label="New Folder"
          icon="o_create_new_folder"
          class="md3-outlined-btn folder-btn"
          @click="showNewFolderDialog = true"
        />
        <q-btn
          v-if="allowUpload"
          flat
          dense
          no-caps
          size="sm"
          label="Upload Asset"
          icon="o_upload"
          class="md3-filled-btn upload-btn"
          @click="showUploadDialog = true"
        />
      </div>
    </div>

    <!-- Main Header -->
    <div v-if="showHeader" class="page-header">
      <div class="header-left">
        <h1 v-if="mode === 'page'" class="text-h5">{{ currentFolder?.name || 'All Media' }}</h1>
        <h2 v-else class="text-h6">{{ currentFolder || 'All Media' }}</h2>
        <span class="media-count">{{ filteredMediaItems.length }} items • {{ totalStorageUsed }}</span>
      </div>
      <div class="header-actions">
        <q-btn-toggle
          v-model="viewMode"
          toggle-color="primary"
          :options="[
            { value: 'grid', icon: 'o_grid_view' },
            { value: 'list', icon: 'o_view_list' }
          ]"
          unelevated
          size="sm"
          class="view-toggle"
        />
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="filters-bar">
      <div class="filters-left">
        <q-input
          v-model="searchQuery"
          placeholder="Search assets..."
          outlined
          dense
          class="search-input"
        >
          <template v-slot:prepend>
            <q-icon name="o_search" size="20px" />
          </template>
          <template v-slot:append v-if="searchQuery">
            <q-icon name="close" size="18px" @click="searchQuery = ''" class="cursor-pointer" />
          </template>
        </q-input>
        <div class="filter-chips">
          <q-chip
            v-for="filter in activeFilters"
            :key="filter.id"
            removable
            @remove="removeFilter(filter)"
            color="primary"
            text-color="white"
            size="sm"
          >
            {{ filter.label }}
          </q-chip>
        </div>
      </div>
      <div class="filters-right">
        <q-btn
          flat
          dense
          no-caps
          icon="o_filter_list"
          label="Filters"
          class="filter-btn"
          @click="showFiltersPanel = !showFiltersPanel"
        >
          <q-badge v-if="activeFilters.length" color="primary" floating>{{ activeFilters.length }}</q-badge>
        </q-btn>
        <q-select
          v-model="sortBy"
          :options="sortOptions"
          label="Sort by"
          outlined
          dense
          style="min-width: 140px"
        />
      </div>
    </div>

    <!-- Selection Info Bar -->
    <div v-if="hasSelection && selectionMode !== 'none'" class="selection-info-bar">
      <div class="selection-count">
        {{ selectedItems.length }} {{ selectedItems.length === 1 ? 'item' : 'items' }} selected
        <q-btn
          v-if="selectedItems.length > 0"
          flat
          dense
          no-caps
          label="Clear"
          size="sm"
          @click="clearSelection"
        />
      </div>
      <div v-if="mode === 'dialog'" class="selection-limit">
        <span v-if="maxSelections > 0">Max: {{ maxSelections }}</span>
      </div>
    </div>

    <!-- Bulk Actions Bar -->
    <div v-if="selectedItems.length > 0 && mode === 'page'" class="bulk-actions-bar">
      <div class="selection-info">
        <q-checkbox
          :model-value="allSelected"
          @update:model-value="toggleSelectAll"
          indeterminate-value="some"
        />
        <span>{{ selectedItems.length }} selected</span>
      </div>
      <div class="bulk-actions">
        <q-btn flat dense no-caps icon="o_drive_file_move" label="Move" @click="bulkMove" />
        <q-btn flat dense no-caps icon="o_download" label="Download" @click="bulkDownload" />
        <q-btn flat dense no-caps icon="o_delete" label="Delete" color="negative" @click="bulkDelete" />
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="content-area" @dragover.prevent="isDragging = true" @dragleave="isDragging = false">
      <!-- Drag and Drop Overlay -->
      <div
        v-if="isDragging && allowUpload"
        class="drag-overlay"
        @drop="handleDrop"
        @dragover.prevent
        @dragleave="isDragging = false"
      >
        <div class="drag-content">
          <q-icon name="o_cloud_upload" size="64px" color="primary" />
          <div class="text-h6">Drop files here to upload</div>
          <div class="text-caption text-grey">or click to browse</div>
        </div>
      </div>

      <!-- Folders and Media Grid -->
      <div v-if="viewMode === 'grid'" class="media-grid-container">
        <!-- Folders Section -->
        <div v-if="allowFolders" class="folders-section">
          <div class="section-title">Folders</div>
          <div class="folders-grid">
            <!-- Add Folder Button -->
            <div
              class="folder-item add-folder-item"
              @click="showNewFolderDialog = true"
            >
              <div class="folder-icon">
                <q-icon name="o_create_new_folder" size="48px" color="primary" />
              </div>
              <div class="folder-info">
                <div class="folder-name">Add Folder</div>
                <div class="folder-meta">Create new</div>
              </div>
            </div>
            
            <!-- Existing Folders -->
            <div
              v-for="folder in visibleFolders"
              :key="folder.id"
              class="folder-item"
              style="position: relative;"
              @click="navigateToFolder(folder)"
            >
              <div class="folder-icon">
                <q-icon name="o_folder" size="48px" color="primary" />
              </div>
              <div class="folder-info">
                <div class="folder-name">{{ folder.name }}</div>
                <div class="folder-meta">{{ getFolderMetaText(folder) }}</div>
              </div>
              <!-- Folder Actions Button -->
              <div class="folder-actions" style="position: absolute; top: 8px; right: 8px;">
                <q-btn
                  round
                  flat
                  size="sm"
                  icon="more_vert"
                  @click.stop="showFolderMenu(folder)"
                  style="opacity: 0.7;"
                >
                  <q-tooltip>Folder options</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>
        </div>

        <!-- Media Section -->
        <div class="media-section">
          <div v-if="filteredMediaItems.length > 0 || (allowFolders && visibleFolders.length > 0)" class="section-title">Files</div>
          <div class="media-grid">
            <div
              v-for="media in filteredMediaItems"
              :key="media.id"
              class="media-item"
              :class="{ selected: media.selected }"
              @click="selectMedia(media)"
              @dblclick="handleMediaDoubleClick(media)"
              @mouseenter="hoveredMediaId = media.id"
              @mouseleave="hoveredMediaId = null"
            >
              <div class="media-preview">
                <SmartImage 
                  v-if="isImage({ type: media.type.toUpperCase() } as MediaFile)"
                  :media="mediaFiles.find((f) => f.id === media.id)"
                  :alt="media.alternativeText || media.name"
                  size="thumbnail"
                  aspect-ratio="1/1"
                  :lazy-load="true"
                  :show-placeholder="true"
  
                />
                <div v-else class="file-type-icon">
                  <q-icon :name="getFileIcon(media.type)" size="48px" />
                </div>
                <div class="media-overlay" :style="{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: hoveredMediaId === media.id ? 'linear-gradient(to top, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 60%)' : 'transparent',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-end',
                  padding: '8px',
                  transition: 'all 0.15s',
                  zIndex: 20
                }">
                  <div class="overlay-actions" :style="{
                    display: 'flex',
                    gap: '4px',
                    opacity: hoveredMediaId === media.id ? 1 : 0,
                    transform: hoveredMediaId === media.id ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'all 0.15s'
                  }">
                    <q-btn 
                      v-if="media.type === 'image'"
                      round 
                      flat
                      size="sm" 
                      icon="o_visibility"
                      :style="{
                        background: 'rgba(255, 255, 255, 0.9)',
                        width: '32px',
                        height: '32px'
                      }"
                      @click.stop="previewMedia(media)"
                    >
                      <q-tooltip>Preview</q-tooltip>
                    </q-btn>
                    <q-btn 
                      v-if="media.type === 'pdf' || media.type === 'document'"
                      round 
                      flat
                      size="sm" 
                      icon="o_download"
                      :style="{
                        background: 'rgba(255, 255, 255, 0.9)',
                        width: '32px',
                        height: '32px'
                      }"
                      @click.stop="downloadMedia(media)"
                    >
                      <q-tooltip>Download</q-tooltip>
                    </q-btn>
                    <q-btn 
                      round 
                      flat
                      size="sm" 
                      icon="o_edit"
                      :style="{
                        background: 'rgba(255, 255, 255, 0.9)',
                        width: '32px',
                        height: '32px'
                      }"
                      @click.stop="editMedia(media)"
                    >
                      <q-tooltip>Edit</q-tooltip>
                    </q-btn>
                    <q-btn 
                      round 
                      flat
                      size="sm" 
                      icon="o_delete"
                      :style="{
                        background: 'rgba(255, 255, 255, 0.9)',
                        width: '32px',
                        height: '32px'
                      }"
                      @click.stop="deleteMedia(media)"
                    >
                      <q-tooltip>Delete</q-tooltip>
                    </q-btn>
                  </div>
                </div>
                <!-- File type badge and processing status -->
                <div class="media-badge">
                  <q-chip 
                    size="sm" 
                    :color="getTypeColor(media.type)" 
                    text-color="white" 
                    dense
                  >
                    {{ media.type.toUpperCase() }}
                  </q-chip>
                  
                  <!-- Processing status badge -->
                  <q-chip
                    v-if="getMediaFile(media.id)?.processingStatus === 'PROCESSING'"
                    size="xs"
                    color="orange"
                    text-color="white"
                    dense
                    icon="o_sync"
                    class="processing-badge"
                  >
                    Processing
                  </q-chip>
                  <q-chip
                    v-else-if="getMediaFile(media.id)?.processingStatus === 'PENDING'"
                    size="xs"
                    color="grey"
                    text-color="white"
                    dense
                    icon="o_schedule"
                    class="processing-badge"
                  >
                    Pending
                  </q-chip>
                </div>
              </div>
              <div class="media-info">
                <div class="media-name" :title="media.name">{{ media.name }}</div>
                <div class="media-meta">
                  <q-icon name="o_folder" size="12px" />
                  <span>{{ media.folder }}</span>
                  <span class="separator">•</span>
                  <span>{{ media.size }}</span>
                  <span v-if="media.dimensions" class="separator">•</span>
                  <span v-if="media.dimensions">{{ media.dimensions }}</span>
                </div>
              </div>
              <q-checkbox
                v-if="selectionMode !== 'none'"
                v-model="media.selected"
                class="media-checkbox"
                @click.stop
              />
            </div>
          </div>
          
          <!-- Load More Button -->
          <div v-if="hasNextPage && !loadingMore" class="load-more-container">
            <q-btn
              color="primary"
              label="Load More"
              icon="o_expand_more"
              size="md"
              unelevated
              padding="sm lg"
              @click="handleLoadMore"
            />
            <div class="text-caption text-grey-7 q-mt-sm">
              Showing {{ filteredMediaItems.length }} of {{ totalFiles }} items
            </div>
          </div>
          
          <!-- Loading More Indicator -->
          <div v-else-if="loadingMore" class="loading-more-container">
            <q-spinner-dots color="primary" size="40px" />
            <div class="text-caption q-mt-sm">Loading more items...</div>
          </div>
          
          <!-- End of Results Message -->
          <div v-else-if="!hasNextPage && filteredMediaItems.length > 0" class="end-of-results">
            <q-icon name="o_check_circle" size="32px" color="grey-6" />
            <div class="text-caption text-grey-7 q-mt-sm">All {{ totalFiles }} items loaded</div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <q-table
        v-else
        :rows="filteredMediaItems"
        :columns="columns"
        row-key="id"
        flat
        :selection="selectionMode !== 'none' ? 'multiple' : 'none'"
        v-model:selected="selectedTableItems"
        :pagination="pagination"
        class="media-table"
      >
        <template v-slot:body-cell-name="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <div class="media-thumb">
                <SmartImage 
                  v-if="isImage({ type: props.row.type.toUpperCase() } as MediaFile)"
                  :media="mediaFiles.find((f) => f.id === props.row.id)"
                  :alt="props.row.alternativeText || props.row.name"
                  size="thumbnail"
                  aspect-ratio="1/1"
                  :width="40"
                  :height="40"
                />
                <q-icon v-else :name="getFileIcon(props.row.type)" size="24px" />
              </div>
              <div class="media-details">
                <div class="media-name">{{ props.row.originalName || props.value }}</div>
                <div class="media-alt" v-if="props.row.alternativeText">{{ props.row.alternativeText }}</div>
              </div>
            </div>
          </q-td>
        </template>
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn flat dense icon="o_download" size="sm" @click="downloadMedia(props.row)">
              <q-tooltip>Download</q-tooltip>
            </q-btn>
            <q-btn flat dense icon="o_edit" size="sm" @click="editMedia(props.row)">
              <q-tooltip>Edit</q-tooltip>
            </q-btn>
            <q-btn flat dense icon="o_delete" size="sm" color="negative" @click="deleteMedia(props.row)">
              <q-tooltip>Delete</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Asset Details Panel -->
    <q-drawer
      v-model="showDetailsPanel"
      side="right"
      bordered
      :width="400"
      class="asset-details-panel"
    >
      <div v-if="selectedAsset" class="panel-content">
        <div class="panel-header">
          <h6 class="text-h6">Asset Details</h6>
          <q-btn flat round dense icon="close" @click="showDetailsPanel = false" />
        </div>
        <div class="panel-body">
          <!-- Asset Preview -->
          <div class="asset-preview">
            <SmartImage 
              v-if="selectedAsset && isImage({ type: selectedAsset.type.toUpperCase() } as MediaFile)"
              :media="selectedAsset ? mediaFiles.find((f) => f.id === selectedAsset?.id) : undefined"
              :alt="selectedAsset?.alternativeText || selectedAsset?.name || ''"
              size="medium"
              aspect-ratio="auto"
            />
            <q-icon v-else-if="selectedAsset" :name="getFileIcon(selectedAsset.type)" size="64px" />
          </div>
          <!-- Asset Information -->
          <div class="asset-info">
            <q-input
              v-model="selectedAsset.name"
              label="File name"
              outlined
              dense
              class="q-mb-md"
            />
            <q-input
              v-model="selectedAsset.alternativeText"
              label="Alternative text"
              outlined
              dense
              class="q-mb-md"
            />
            <q-input
              v-model="selectedAsset.caption"
              label="Caption"
              outlined
              dense
              type="textarea"
              rows="3"
              class="q-mb-md"
            />
            <div class="info-group">
              <div class="info-label">Type</div>
              <div class="info-value">{{ selectedAsset.type }}</div>
            </div>
            <div class="info-group">
              <div class="info-label">Size</div>
              <div class="info-value">{{ selectedAsset.size }}</div>
            </div>
            <div class="info-group">
              <div class="info-label">Dimensions</div>
              <div class="info-value">{{ selectedAsset.dimensions || 'N/A' }}</div>
            </div>
            <div class="info-group">
              <div class="info-label">Uploaded</div>
              <div class="info-value">{{ new Date(selectedAsset.createdAt).toLocaleDateString() }}</div>
            </div>
          </div>
          <!-- Asset Actions -->
          <div class="asset-actions">
            <q-btn
              label="Copy URL"
              icon="o_content_copy"
              outline
              no-caps
              class="full-width q-mb-sm"
              @click="copyAssetUrl"
            />
            <q-btn
              label="Replace"
              icon="o_swap_horiz"
              outline
              no-caps
              class="full-width q-mb-sm"
            />
            <q-btn
              label="Delete"
              icon="o_delete"
              outline
              color="negative"
              no-caps
              class="full-width"
              @click="deleteMedia(selectedAsset)"
            />
          </div>
        </div>
      </div>
    </q-drawer>

    <!-- Upload Dialog -->
    <q-dialog v-model="showUploadDialog" persistent>
      <q-card style="min-width: 600px; max-width: 800px">
        <q-card-section>
          <div class="text-h6">Upload Assets</div>
        </q-card-section>

        <q-card-section>
          <div class="upload-zone" @drop="handleFileDrop" @dragover.prevent @dragenter.prevent>
            <q-icon name="o_cloud_upload" size="48px" color="primary" />
            <div class="text-h6 q-mt-md">Drag and drop files here</div>
            <div class="text-caption text-grey q-mb-md">or</div>
            <q-btn
              label="Browse files"
              color="primary"
              outline
              @click="triggerFileInput"
            />
            <q-file
              ref="fileInput"
              v-model="uploadFiles"
              multiple
              style="display: none"
              @update:model-value="onFilesSelected"
            />
          </div>
          
          <div v-if="uploadFiles && uploadFiles.length" class="files-list q-mt-md">
            <div class="text-subtitle2 q-mb-sm">Selected files ({{ uploadFiles.length }})</div>
            <div v-for="(file, index) in uploadFiles" :key="index" class="file-item">
              <q-icon :name="getFileIcon(getFileType(file.name))" size="20px" />
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <q-btn
                flat
                round
                dense
                size="sm"
                icon="close"
                @click="removeFile(index)"
              />
            </div>
          </div>

        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="cancelUpload" />
          <q-btn 
            color="primary" 
            label="Upload" 
            :loading="uploading"
            @click="startUpload"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- New Folder Dialog -->
    <q-dialog v-model="showNewFolderDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Create New Folder</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="newFolderName"
            label="Folder name"
            outlined
            dense
            autofocus
            @keyup.enter="createFolder"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn 
            color="primary" 
            label="Create" 
            :disable="!newFolderName"
            @click="createFolder"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Rename Folder Dialog -->
    <q-dialog v-model="showRenameFolderDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Rename Folder</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="renameFolderName"
            label="Folder name"
            outlined
            dense
            autofocus
            @keyup.enter="renameFolder"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn 
            color="primary" 
            label="Rename" 
            :disable="!renameFolderName || renameFolderName === selectedFolderForRename?.name"
            @click="renameFolder"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, PropType, onMounted } from 'vue';
import { defineAsyncComponent } from 'vue';
import { useQuasar } from 'quasar';
import type { QFile } from 'quasar';
import type { ImageData } from './ImagePreviewDialog.vue';
import { useMediaLibrary } from 'src/composables/useMediaLibrary';
import type { MediaFile, MediaFolder } from 'src/stores/media.store';
import { useMediaStore } from 'src/stores/media.store';
import { ModuleType, MediaModuleConfig } from 'src/types/media.types';
import { getModuleConfig } from 'src/config/media-module.config';
import SmartImage from 'src/components/shared/SmartImage/SmartImage.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ImagePreviewDialog = defineAsyncComponent(() =>
  import('./ImagePreviewDialog.vue')
);
const EditMediaDialog = defineAsyncComponent(() =>
  import('./EditMediaDialog.vue')
);

export interface MediaItem extends Omit<MediaFile, 'size' | 'type' | 'folder'> {
  selected?: boolean;
  size: string; // Formatted size string
  type: string; // Lowercase type for UI compatibility
  thumbnail?: string; // Thumbnail URL
  dimensions?: string; // Formatted dimensions string
  folder?: string | MediaFolder | undefined;
}

export default defineComponent({
  name: 'MediaLibraryCore',
  components: {
    ImagePreviewDialog,
    EditMediaDialog,
    SmartImage,
  },
  props: {
    mode: {
      type: String as PropType<'page' | 'dialog'>,
      default: 'page',
    },
    module: {
      type: String as PropType<ModuleType>,
      default: ModuleType.CMS,
      validator: (value: string) => Object.values(ModuleType).includes(value as ModuleType)
    },
    selectionMode: {
      type: String as PropType<'single' | 'multiple' | 'none'>,
      default: 'multiple',
    },
    allowUpload: {
      type: Boolean,
      default: true,
    },
    allowFolders: {
      type: Boolean,
      default: true,
    },
    fileTypes: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    maxSelections: {
      type: Number,
      default: 0,
    },
    initialFolder: {
      type: String,
      default: null,
    },
    defaultFolder: {
      type: String,
      default: null,
    },
    showHeader: {
      type: Boolean,
      default: true,
    },
    showBreadcrumbs: {
      type: Boolean,
      default: true,
    },
    libraryTitle: {
      type: String,
      default: 'Media Library',
    },
    customConfig: {
      type: Object as PropType<Partial<MediaModuleConfig>>,
      default: null,
    },
  },
  emits: ['select', 'close', 'upload-complete', 'items-selected'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const fileInput = ref<QFile | null>(null);
    const mediaStore = useMediaStore();
    
    // Module configuration with optional custom overrides
    const moduleConfig = computed(() => {
      const baseConfig = getModuleConfig(props.module);
      return props.customConfig 
        ? { ...baseConfig, ...props.customConfig }
        : baseConfig;
    });
    
    // Initialize media library composable
    const {
      // State
      mediaFiles,
      folders,
      currentFolder,
      selectedFiles,
      uploadProgress,
      loading,
      loadingMore,
      refreshing,
      isUploading,
      hasSelection,
      stats,
      hasNextPage,
      totalFiles,
      
      // Methods
      navigateToFolder: apiNavigateToFolder,
      loadMore,
      
      // Utilities
      getFileSize,
      isImage,
      getThumbnailSrc,
    } = useMediaLibrary({
      module: props.module,
      autoLoad: true,
      defaultQuery: {
        folderId: props.initialFolder ? parseInt(props.initialFolder) : undefined,
        pageSize: 50 
      },
      enableRealTimeUpdates: true,
    });
    
    // Initialize data on mount
    onMounted(() => {
      // Ensure the store has the correct module set
      mediaStore.setCurrentModule(props.module);
      // Data is already loaded by the composable's autoLoad option
    });
    
    // View and Navigation
    const viewMode = ref('grid');
    const searchQuery = ref('');
    const sortBy = ref('Date modified');
    const showFiltersPanel = ref(false);
    const showDetailsPanel = ref(false);
    const showEditDialog = ref(false);
    const selectedAsset = ref<MediaItem | null>(null);
    
    // Image Preview
    const showImagePreview = ref(false);
    const previewImage = ref<ImageData | null>(null);
    
    // Upload
    const showUploadDialog = ref(false);
    const showNewFolderDialog = ref(false);
    const showRenameFolderDialog = ref(false);
    const uploadFiles = ref<File[] | null>(null);
    const newFolderName = ref('');
    const renameFolderName = ref('');
    const selectedFolderForRename = ref<MediaFolder | null>(null);
    const uploading = ref(false);
    const isDragging = ref(false);
    
    // Local selection state (for UI only - actual selection managed by composable)
    const selectedTableItems = ref<MediaItem[]>([]);
    const activeFilters = ref<any[]>([]);
    const hoveredMediaId = ref<string | number | null>(null);
    
    // Options
    const sortOptions = ['Date modified', 'Name', 'Size', 'Type'];
    
    // Pagination
    const pagination = ref({
      sortBy: 'uploadedAt',
      descending: true,
      page: 1,
      rowsPerPage: 20,
    });

    // Columns for table view
    const columns = [
      { name: 'name', label: 'Name', field: 'name', align: 'left' as const, sortable: true },
      { name: 'type', label: 'Type', field: 'type', align: 'left' as const, sortable: true },
      { name: 'size', label: 'Size', field: 'size', align: 'left' as const, sortable: true },
      { name: 'dimensions', label: 'Dimensions', field: 'dimensions', align: 'left' as const },
      { name: 'folder', label: 'Folder', field: 'folder', align: 'left' as const, sortable: true },
      { name: 'uploadedAt', label: 'Modified', field: 'uploadedAt', align: 'left' as const, sortable: true },
      { name: 'actions', label: '', field: 'actions', align: 'center' as const },
    ];



    // Computed
    const visibleFolders = computed(() => {
      // Filter folders based on current folder context and module
      return folders.value.filter(folder => {
        // First filter by module to ensure module isolation
        // Handle folders without module field (assume CMS for legacy compatibility)
        const folderModule = folder.module || 'CMS';
        if (folderModule !== props.module) {
          return false;
        }
        
        if (!currentFolder.value) {
          // Root level - show folders with no parent
          return !folder.parentId;
        } else {
          // Show folders whose parent matches current folder ID
          return folder.parentId === currentFolder.value.id;
        }
      });
    });
    
    // Convert MediaFile to MediaItem for component compatibility
    const filteredMediaItems = computed(() => {
      return mediaFiles.value.map((file: MediaFile) => ({
        ...file,
        type: file.type.toLowerCase(),
        size: getFileSize(file.size),
        dimensions: file.width && file.height ? `${file.width}x${file.height}` : undefined,
        folder: currentFolder.value?.name || 'Root',
        uploadedAt: file.createdAt.toLocaleDateString(),
        thumbnail: getThumbnailSrc(file),
        selected: selectedFileIds.value.includes(file.id),
        url: file.url,
      }));
    });
    
    const folderOptions = computed(() => {
      const options = ['Root'];
      folders.value.forEach((folder: MediaFolder) => {
        options.push(folder.name);
      });
      return options;
    });
    
    const currentFolderPath = computed(() => {
      const path: string[] = [];
      let folder = currentFolder.value;
      
      while (folder) {
        path.unshift(folder.name);
        // Find parent folder
        folder = folders.value.find((f: MediaFolder) => f.id === folder?.parentId) || null;
      }
      
      return path;
    });
    
    const totalStorageUsed = computed(() => {
      if (stats.value) {
        return `${getFileSize(stats.value.totalSize)} used`;
      }
      return 'Loading...';
    });
    
    const allSelected = computed(() => {
      const selected = selectedFiles.value.length;
      const total = filteredMediaItems.value.length;
      
      if (selected === 0) return false;
      if (selected === total) return true;
      return 'some';
    });
    
    // Track selected file IDs instead of computed
    const selectedFileIds = ref<number[]>([]);
    
    const selectedItems = computed(() => {
      return filteredMediaItems.value.filter(item => selectedFileIds.value.includes(item.id));
    });

    // Watch for selection changes
    watch(selectedItems, (newVal) => {
      emit('items-selected', newVal);
    });

    // Watch for table selection changes
    watch(selectedTableItems, (newVal) => {
      selectedFileIds.value = newVal.map((item: MediaItem) => item.id);
    });
    
    // Watch for search changes to reset pagination
    watch(searchQuery, () => {
      // Reset pagination when search changes
      mediaStore.currentPage = 1;
      // Note: Since search currently works on client-side, we need to handle this differently
      // For now, search filtering happens via computed property
    });
    
    // Watch for changes in filtered items
    watch(filteredMediaItems, (newVal, oldVal) => {
      console.log(`[Watch] filteredMediaItems changed from ${oldVal?.length || 0} to ${newVal.length} items`);
    });

    // Handle Load More button click
    const handleLoadMore = async () => {
      console.log(`[HandleLoadMore] Button clicked. Current items: ${filteredMediaItems.value.length}, Total: ${totalFiles.value}`);
      await loadMore();
      console.log(`[HandleLoadMore] After loadMore. Current items: ${filteredMediaItems.value.length}, Total: ${totalFiles.value}`);
    };
    
    // Methods
    const getFileIcon = (type: string) => {
      const icons: Record<string, string> = {
        image: 'o_image',
        video: 'o_movie',
        document: 'o_description',
        pdf: 'o_picture_as_pdf',
        audio: 'o_audiotrack',
        archive: 'o_folder_zip',
      };
      return icons[type] || 'o_insert_drive_file';
    };
    
    const getFileType = (filename: string): string => {
      const ext = filename.split('.').pop()?.toLowerCase();
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
      const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'webm'];
      const docExts = ['doc', 'docx', 'txt', 'rtf'];
      
      if (imageExts.includes(ext || '')) return 'image';
      if (videoExts.includes(ext || '')) return 'video';
      if (ext === 'pdf') return 'pdf';
      if (docExts.includes(ext || '')) return 'document';
      return 'other';
    };
    
    const formatFileSize = (bytes: number): string => {
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      if (bytes === 0) return '0 B';
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };


    const selectMedia = (media: MediaItem) => {
      if (props.selectionMode === 'none') {
        emit('select', media);
        return;
      }
      
      if (props.selectionMode === 'single') {
        // Clear previous selections and select new item
        selectedFileIds.value = [media.id];
      } else {
        // Multiple selection mode
        const isCurrentlySelected = selectedFileIds.value.includes(media.id);
        
        if (props.maxSelections > 0 && selectedFileIds.value.length >= props.maxSelections && !isCurrentlySelected) {
          $q.notify({
            type: 'warning',
            message: `Maximum ${props.maxSelections} items can be selected`,
          });
          return;
        }
        
        if (isCurrentlySelected) {
          // Remove from selection
          selectedFileIds.value = selectedFileIds.value.filter(id => id !== media.id);
        } else {
          // Add to selection
          selectedFileIds.value.push(media.id);
        }
      }
    };
    
    const handleMediaDoubleClick = (media: MediaItem) => {
      if (props.mode === 'dialog') {
        emit('select', props.selectionMode === 'single' ? media : selectedItems.value);
      } else {
        openAssetDetails(media);
      }
    };
    
    const openAssetDetails = (media: MediaItem) => {
      selectedAsset.value = media;
      showDetailsPanel.value = true;
    };
    
    const clearSelection = () => {
      selectedFileIds.value = [];
      selectedTableItems.value = [];
    };
    
    const navigateToFolder = (path: string[] | string | MediaFolder) => {
      clearSelection();
      
      // Reset pagination when changing folders
      mediaStore.currentPage = 1;
      
      if (Array.isArray(path)) {
        // Navigate to specific path depth
        const targetFolderName = path[path.length - 1];
        if (targetFolderName) {
          const folder = folders.value.find((f: MediaFolder) => f.name === targetFolderName);
          if (folder) {
            apiNavigateToFolder(folder);
          }
        } else {
          apiNavigateToFolder(null);
        }
      } else if (typeof path === 'object' && path !== null) {
        // Navigate to folder object directly
        apiNavigateToFolder(path);
      } else {
        // Navigate into a subfolder by name
        const folder = folders.value.find((f: MediaFolder) => f.name === path);
        if (folder) {
          apiNavigateToFolder(folder);
        }
      }
    };
    
    const toggleSelectAll = (val: boolean) => {
      if (val === true) {
        selectedFileIds.value = filteredMediaItems.value.map(item => item.id);
      } else {
        clearSelection();
      }
    };
    
    const removeFilter = (filter: string) => {
      const index = activeFilters.value.indexOf(filter);
      if (index > -1) activeFilters.value.splice(index, 1);
    };
    
    // File operations
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      isDragging.value = false;
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length) {
        uploadFiles.value = files;
        showUploadDialog.value = true;
      }
    };
    
    const handleFileDrop = (e: DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length) {
        uploadFiles.value = files;
      }
    };
    
    const onFilesSelected = (files: File[]) => {
      uploadFiles.value = files;
    };
    
    const triggerFileInput = () => {
      if (fileInput.value) {
        (fileInput.value.$el as HTMLElement).click();
      }
    };
    
    const removeFile = (index: number) => {
      if (uploadFiles.value) {
        uploadFiles.value.splice(index, 1);
        if (uploadFiles.value.length === 0) {
          uploadFiles.value = null;
        }
      }
    };
    
    const startUpload = async () => {
      if (!uploadFiles.value || uploadFiles.value.length === 0) return;
      
      uploading.value = true;
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      try {
        // Upload each file
        for (const file of uploadFiles.value) {
          try {
            await mediaStore.uploadMediaFile(file, {
              module: props.module,
              folderId: currentFolder.value?.id,
              folderName: props.defaultFolder,
              processInBackground: true,
            });
            successCount++;
          } catch (error: any) {
            errorCount++;
            errors.push(`${file.name}: ${error.message}`);
            console.error(`Failed to upload ${file.name}:`, error);
          }
        }
        
        // Show results
        if (successCount > 0 && errorCount === 0) {
          $q.notify({
            type: 'positive',
            message: `Successfully uploaded ${successCount} file(s)`,
          });
        } else if (successCount > 0 && errorCount > 0) {
          $q.notify({
            type: 'warning',
            message: `Uploaded ${successCount} files, ${errorCount} failed`,
          });
        } else if (errorCount > 0) {
          $q.notify({
            type: 'negative',
            message: `Failed to upload ${errorCount} file(s)`,
            caption: errors.join(', '),
          });
        }
        
        // Close dialog and clean up
        showUploadDialog.value = false;
        uploadFiles.value = null;
        emit('upload-complete');
        
      } catch (error) {
        console.error('Upload error:', error);
        $q.notify({
          type: 'negative',
          message: 'Upload failed',
        });
      } finally {
        uploading.value = false;
      }
    };
    
    const cancelUpload = () => {
      showUploadDialog.value = false;
      uploadFiles.value = null;
    };
    
    const createFolder = async () => {
      if (newFolderName.value) {
        try {
          await mediaStore.createFolder({
            name: newFolderName.value,
            parentId: currentFolder.value?.id,
            module: props.module,
          });
          
          // Refresh folders to ensure the new folder appears with correct module data
          await mediaStore.fetchFolders(props.module);
          
          showNewFolderDialog.value = false;
          newFolderName.value = '';
          $q.notify({
            type: 'positive',
            message: 'Folder created successfully',
          });
        } catch (error: any) {
          $q.notify({
            type: 'negative',
            message: `Failed to create folder: ${error.message}`,
          });
        }
      }
    };

    const openRenameDialog = (folder: MediaFolder) => {
      selectedFolderForRename.value = folder;
      renameFolderName.value = folder.name;
      showRenameFolderDialog.value = true;
    };

    const renameFolder = async () => {
      if (renameFolderName.value && selectedFolderForRename.value && renameFolderName.value !== selectedFolderForRename.value.name) {
        try {
          await mediaStore.updateFolder(selectedFolderForRename.value.id, {
            name: renameFolderName.value,
          });
          
          showRenameFolderDialog.value = false;
          selectedFolderForRename.value = null;
          renameFolderName.value = '';
          $q.notify({
            type: 'positive',
            message: 'Folder renamed successfully',
          });
        } catch (error: any) {
          $q.notify({
            type: 'negative',
            message: `Failed to rename folder: ${error.message}`,
          });
        }
      }
    };
    
    // Asset operations
    const downloadMedia = (media: MediaItem) => {
      try {
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = media.url;
        link.download = media.originalName || media.name;
        link.target = '_blank';
        
        // Append to body, trigger click, then remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        $q.notify({
          type: 'positive',
          message: `Downloading ${media.originalName || media.name}...`,
          position: 'top',
        });
      } catch (error) {
        console.error('Download failed:', error);
        $q.notify({
          type: 'negative',
          message: 'Download failed. Please try again.',
          position: 'top',
        });
      }
    };
    
    const editMedia = (media: MediaItem) => {
      selectedAsset.value = media;
      showEditDialog.value = true;
    };
    
    const viewMedia = (media: MediaItem) => {
      selectedAsset.value = media;
      showDetailsPanel.value = true;
    };
    
    const previewMedia = (media: MediaItem) => {
      if (media.type.toLowerCase() === 'image' && (media.url || media.thumbnail)) {
        // Open image in the preview dialog
        previewImage.value = {
          url: media.url || media.thumbnail || '',
          name: media.name,
          size: media.size,
          dimensions: media.dimensions || undefined,
        };
        showImagePreview.value = true;
        console.log('Opening preview with image:', previewImage.value);
      }
    };
    
    const getTypeColor = (type: string) => {
      const colors: Record<string, string> = {
        image: 'green',
        video: 'blue',
        document: 'orange',
        pdf: 'red',
      };
      return colors[type] || 'grey';
    };
    
    const deleteMedia = (media: MediaItem) => {
      $q.dialog({
        title: 'Delete Asset',
        message: `Are you sure you want to delete "${media.name}"?`,
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          // Show loading state
          $q.loading.show({ message: 'Deleting file...' });
          
          // Call the store's delete method
          await mediaStore.deleteMediaFile(media.id);
          
          // Show success notification
          $q.notify({
            type: 'positive',
            message: 'Asset deleted successfully',
          });
          
          // The store automatically updates the local state, no need to refresh
          
        } catch (error: any) {
          // Show error notification
          $q.notify({
            type: 'negative',
            message: `Failed to delete asset: ${error.message}`,
          });
        } finally {
          $q.loading.hide();
        }
      });
    };
    
    const handleMediaUpdate = () => {
      // Note: The store will handle the update and the computed will reflect the changes
    };
    
    const handleMediaDelete = () => {
      // Note: The store will handle the deletion and the computed will reflect the changes
    };
    
    const copyAssetUrl = () => {
      if (selectedAsset.value?.url) {
        navigator.clipboard.writeText(selectedAsset.value.url);
        $q.notify({
          type: 'positive',
          message: 'URL copied to clipboard',
        });
      }
    };
    
    // Bulk operations
    const bulkMove = () => {
      $q.notify({
        type: 'info',
        message: 'Move functionality coming soon',
      });
    };
    
    const bulkDownload = () => {
      $q.notify({
        type: 'info',
        message: `Downloading ${selectedItems.value.length} items...`,
      });
    };
    
    const bulkDelete = () => {
      $q.dialog({
        title: 'Delete Assets',
        message: `Are you sure you want to delete ${selectedItems.value.length} items?`,
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          // Show loading state
          const itemCount = selectedItems.value.length;
          $q.loading.show({ message: `Deleting ${itemCount} files...` });
          
          // Get the IDs of selected items
          const fileIds = selectedItems.value.map(item => item.id);
          
          // Call the store's bulk delete method
          const result = await mediaStore.bulkDeleteFiles(fileIds);
          
          // Clear selection
          clearSelection();
          
          // Show success/partial success notification
          const succeeded = result.succeeded?.length || 0;
          const failed = result.failed?.length || 0;
          
          if (succeeded > 0 && failed === 0) {
            $q.notify({
              type: 'positive',
              message: `Successfully deleted ${succeeded} assets`,
            });
          } else if (succeeded > 0 && failed > 0) {
            $q.notify({
              type: 'warning',
              message: `Deleted ${succeeded} assets, ${failed} failed`,
            });
          } else {
            $q.notify({
              type: 'negative',
              message: `Failed to delete assets`,
            });
          }
          
        } catch (error: any) {
          // Show error notification
          $q.notify({
            type: 'negative',
            message: `Failed to delete assets: ${error.message}`,
          });
        } finally {
          $q.loading.hide();
        }
      });
    };

    const deleteFolderWithConfirmation = (folder: MediaFolder) => {
      // First dialog - choose deletion method
      $q.dialog({
        title: 'Delete Folder',
        message: `Choose how to delete "${folder.name}":`,
        cancel: true,
        persistent: true,
        options: {
          type: 'radio',
          model: 'move',
          items: [
            { 
              label: `Move files to parent folder (${folder.fileCount || 0} files, ${folder.subfolderCount || 0} subfolders)`, 
              value: 'move' 
            },
            { 
              label: `Permanently delete all contents (⚠️ Cannot be undone!)`, 
              value: 'delete' 
            }
          ]
        }
      }).onOk(async (deletionMethod) => {
        if (deletionMethod === 'delete') {
          // Second dialog - folder name confirmation for destructive delete
          $q.dialog({
            title: '⚠️ Confirm Permanent Deletion',
            message: `This will permanently delete "${folder.name}" and ALL its contents including:\n\n` +
                    `• ${folder.fileCount || 0} files\n` +
                    `• ${folder.subfolderCount || 0} subfolders\n` +
                    `• All image variants and S3 data\n\n` +
                    `This action CANNOT be undone!\n\n` +
                    `To confirm, please type the folder name exactly:`,
            prompt: {
              model: '',
              type: 'text',
              hint: `Type: ${folder.name}`,
              counter: true,
              maxlength: 50,
            },
            cancel: true,
            persistent: true,
          }).onOk(async (confirmName) => {
            if (confirmName !== folder.name) {
              $q.notify({
                type: 'negative',
                message: `Folder name doesn't match. Expected: "${folder.name}"`,
              });
              return;
            }
            
            // Proceed with destructive deletion
            await performFolderDeletion(folder, {
              deleteFiles: true,
              moveToParent: false,
              confirmFolderName: confirmName,
            });
          });
        } else {
          // Proceed with move to parent
          await performFolderDeletion(folder, {
            deleteFiles: false,
            moveToParent: true,
          });
        }
      });
    };

    const performFolderDeletion = async (folder: MediaFolder, options: {
      deleteFiles?: boolean;
      moveToParent?: boolean;
      confirmFolderName?: string;
    }) => {
      try {
        // Show loading state with appropriate message
        const loadingMessage = options.deleteFiles 
          ? 'Permanently deleting folder and all contents...' 
          : 'Moving files to parent folder...';
        $q.loading.show({ message: loadingMessage });
        
        // Call the store's delete folder method with new options
        const result = await mediaStore.deleteFolder(folder.id, options);
        
        // Create appropriate success message
        let successMessage = '';
        if (options.deleteFiles) {
          successMessage = `Permanently deleted "${result.deletedFolder}" and ${result.totalFilesAffected} files`;
        } else if (options.moveToParent) {
          successMessage = `Moved ${result.totalFilesAffected} files to parent folder and deleted "${result.deletedFolder}"`;
        } else {
          successMessage = 'Folder deleted successfully';
        }
        
        if (result.wasCurrentFolder) {
          if (result.navigatedToParent) {
            successMessage += ' (navigated to parent folder)';
          } else if (result.navigatedToRoot) {
            successMessage += ' (navigated to root folder)';
          }
        }
        
        $q.notify({
          type: 'positive',
          message: successMessage,
          timeout: 5000,
        });
        
        // Refresh folders list to reflect changes
        await mediaStore.fetchFolders(props.module);
        
      } catch (error: any) {
        $q.notify({
          type: 'negative',
          message: `Failed to delete folder: ${error.message}`,
          timeout: 8000,
        });
      } finally {
        $q.loading.hide();
      }
    };
    
    // Folder menu
    const showFolderMenu = (folder: MediaFolder) => {
      console.log('Menu clicked for folder:', folder.name);
      
      // Use dialog with actions for folder menu
      $q.dialog({
        title: 'Folder Actions',
        message: `Choose an action for "${folder.name}":`,
        options: {
          type: 'radio',
          model: '',
          items: [
            { label: 'Rename', value: 'rename' },
            { label: 'Delete', value: 'delete' }
          ]
        },
        cancel: true,
        persistent: true
      }).onOk((selected) => {
        console.log('Selected action:', selected);
        switch (selected) {
          case 'rename':
            openRenameDialog(folder);
            break;
          case 'delete':
            deleteFolderWithConfirmation(folder);
            break;
        }
      });
    };
    
    const showMediaMenu = (media: MediaItem, event: MouseEvent) => {
      console.log('Media context menu', media, event);
    };
    
    // Helper function to get folder meta text
    const getFolderMetaText = (folder: MediaFolder) => {
      const parts = [];
      
      // Use backend-provided counts when available, fallback to frontend calculation
      const fileCount = folder.fileCount || 0;
      const subfolderCount = folder.subfolderCount !== undefined 
        ? folder.subfolderCount 
        : folders.value.filter((f: MediaFolder) => f.parentId === folder.id).length;
      
      if (fileCount > 0) {
        parts.push(`${fileCount} ${fileCount === 1 ? 'item' : 'items'}`);
      }
      
      if (subfolderCount > 0) {
        parts.push(`${subfolderCount} ${subfolderCount === 1 ? 'folder' : 'folders'}`);
      }
      
      // Show total size if available
      if (folder.totalSize && folder.totalSize > 0) {
        parts.push(formatFileSize(folder.totalSize));
      }
      
      if (parts.length === 0) {
        return 'Empty';
      }
      
      return parts.join(' • ');
    };
    
    // Helper to get media file with processing status
    const getMediaFile = (id: number): MediaFile | undefined => {
      return mediaFiles.value.find((f: MediaFile) => f.id === id);
    };

    return {
      // Refs
      fileInput,
      
      // Data
      viewMode,
      searchQuery,
      sortBy,
      showFiltersPanel,
      showDetailsPanel,
      showEditDialog,
      showUploadDialog,
      showNewFolderDialog,
      showRenameFolderDialog,
      selectedAsset,
      showImagePreview,
      previewImage,
      uploadFiles,
      newFolderName,
      renameFolderName,
      selectedFolderForRename,
      uploading,
      isDragging,
      selectedItems,
      selectedTableItems,
      activeFilters,
      hoveredMediaId,
      
      // Composable data
      mediaFiles,
      folders,
      currentFolder,
      currentFolderPath,
      loading,
      loadingMore,
      refreshing,
      isUploading,
      uploadProgress,
      hasSelection,
      hasNextPage,
      totalFiles,
      
      // Options
      moduleConfig,
      sortOptions,
      folderOptions,
      columns,
      pagination,
      
      // Computed
      visibleFolders,
      filteredMediaItems,
      totalStorageUsed,
      allSelected,
      
      // Methods
      isImage,
      getFileIcon,
      getFileType,
      formatFileSize,
      selectMedia,
      handleMediaDoubleClick,
      openAssetDetails,
      clearSelection,
      navigateToFolder,
      toggleSelectAll,
      removeFilter,
      handleDrop,
      handleFileDrop,
      onFilesSelected,
      triggerFileInput,
      removeFile,
      startUpload,
      cancelUpload,
      createFolder,
      openRenameDialog,
      renameFolder,
      deleteFolderWithConfirmation,
      performFolderDeletion,
      downloadMedia,
      editMedia,
      deleteMedia,
      handleMediaUpdate,
      handleMediaDelete,
      viewMedia,
      previewMedia,
      getTypeColor,
      copyAssetUrl,
      bulkMove,
      bulkDownload,
      bulkDelete,
      showFolderMenu,
      showMediaMenu,
      getFolderMetaText,
      getMediaFile,
      handleLoadMore,
    };
  },
});
</script>

<style scoped lang="scss">
@import './MediaLibraryCore.styles.scss';
</style>