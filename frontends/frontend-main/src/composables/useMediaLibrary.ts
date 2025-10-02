import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useMediaStore, type MediaFile, type MediaFolder, type MediaQuery } from 'src/stores/media.store';
import { useGlobalMethods } from 'src/composables/useGlobalMethods';
import { ModuleType } from 'src/types/media.types';
import { Notify } from 'quasar';

export interface UseMediaLibraryOptions {
  module?: ModuleType;
  autoLoad?: boolean;
  defaultQuery?: MediaQuery;
  enableRealTimeUpdates?: boolean;
}

export function useMediaLibrary(options: UseMediaLibraryOptions = {}) {
  const {
    module = ModuleType.CMS,
    autoLoad = true,
    defaultQuery = {},
    enableRealTimeUpdates = true,
  } = options;

  const mediaStore = useMediaStore();
  const { handleAxiosError, socketStore } = useGlobalMethods();
  
  // Local state
  const refreshing = ref(false);
  const realTimeEnabled = ref(enableRealTimeUpdates);
  const loadedPages = ref(1); // Track how many pages have been loaded
  
  // Computed properties from store
  const mediaFiles = computed(() => mediaStore.mediaFiles);
  const folders = computed(() => mediaStore.folders);
  const currentFolder = computed(() => mediaStore.currentFolder);
  const selectedFiles = computed(() => mediaStore.selectedFiles);
  const uploadProgress = computed(() => mediaStore.uploadProgress);
  const loading = computed(() => mediaStore.loading);
  const loadingMore = computed(() => mediaStore.loadingMore);
  const error = computed(() => mediaStore.error);
  const filteredFiles = computed(() => mediaStore.filteredFiles);
  const isUploading = computed(() => mediaStore.isUploading);
  const processingFiles = computed(() => mediaStore.processingFiles);
  const hasSelection = computed(() => mediaStore.hasSelection);
  const stats = computed(() => mediaStore.stats);
  
  // Pagination
  const currentPage = computed(() => mediaStore.currentPage);
  const pageSize = computed(() => mediaStore.pageSize);
  const totalFiles = computed(() => mediaStore.totalFiles);
  const totalPages = computed(() => mediaStore.totalPages);
  const hasNextPage = computed(() => currentPage.value < totalPages.value);
  const hasPrevPage = computed(() => currentPage.value > 1);
  
  // Filters
  const searchQuery = computed({
    get: () => mediaStore.searchQuery,
    set: (value: string) => mediaStore.setFilters({ search: value }),
  });
  
  const typeFilter = computed({
    get: () => mediaStore.typeFilter,
    set: (value: string | null) => mediaStore.setFilters({ type: value }),
  });
  
  const statusFilter = computed({
    get: () => mediaStore.statusFilter,
    set: (value: string | null) => mediaStore.setFilters({ status: value }),
  });

  // Methods
  const loadMedia = async (query: MediaQuery = {}) => {
    try {
      console.log(`[LoadMedia] Called with page ${query.page}, append: ${query.appendMode}, current loadedPages: ${loadedPages.value}`);
      await mediaStore.fetchMediaFiles({ module, ...defaultQuery, ...query });
      // Only reset loaded pages count for completely fresh loads (not refreshes)
      if (!query.appendMode && query.page === 1 && loadedPages.value === 1) {
        loadedPages.value = 1;
        console.log(`[LoadMedia] Reset loadedPages to 1`);
      }
    } catch (err: any) {
      handleAxiosError(err);
    }
  };

  const refreshMedia = async () => {
    refreshing.value = true;
    try {
      console.log(`[RefreshMedia] Starting refresh with ${loadedPages.value} loaded pages`);
      // If we've loaded multiple pages, we need to reload all of them
      if (loadedPages.value > 1) {
        console.log(`[RefreshMedia] Reloading all ${loadedPages.value} pages to preserve accumulation`);
        // First, load page 1 to replace existing data
        await loadMedia({
          page: 1,
          pageSize: pageSize.value,
          folderId: currentFolder.value?.id,
        });
        
        // Then append the remaining pages
        for (let page = 2; page <= loadedPages.value; page++) {
          console.log(`[RefreshMedia] Re-appending page ${page}`);
          await mediaStore.fetchMediaFiles({
            module,
            page,
            pageSize: pageSize.value,
            folderId: currentFolder.value?.id,
            appendMode: true,
          });
        }
        console.log(`[RefreshMedia] Finished reloading all pages. Total items: ${mediaFiles.value.length}`);
      } else {
        // Just reload the first page
        console.log(`[RefreshMedia] Only reloading page 1`);
        await loadMedia({
          page: 1,
          pageSize: pageSize.value,
          folderId: currentFolder.value?.id,
        });
      }
    } catch (err: any) {
      handleAxiosError(err);
    } finally {
      refreshing.value = false;
    }
  };

  const uploadFiles = async (
    files: File[], 
    options: {
      folderId?: number;
      folderName?: string;
      alternativeText?: string;
      caption?: string;
      tags?: string[];
      processInBackground?: boolean;
    } = {}
  ) => {
    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const result = await mediaStore.uploadMediaFile(file, { module, ...options });
        results.push(result);
        
        Notify.create({
          type: 'positive',
          message: `${file.name} uploaded successfully`,
          position: 'top-right',
        });
      } catch (err: any) {
        errors.push({ file: file.name, error: err.message });
        
        Notify.create({
          type: 'negative',
          message: `Failed to upload ${file.name}: ${err.message}`,
          position: 'top-right',
        });
      }
    }

    if (results.length > 0 && errors.length === 0) {
      Notify.create({
        type: 'positive',
        message: `Successfully uploaded ${results.length} file(s)`,
        position: 'top-right',
      });
    } else if (errors.length > 0) {
      Notify.create({
        type: 'warning',
        message: `Uploaded ${results.length} files, ${errors.length} failed`,
        position: 'top-right',
      });
    }

    return { results, errors };
  };

  const deleteFile = async (file: MediaFile) => {
    try {
      await mediaStore.deleteMediaFile(file.id);
      
      Notify.create({
        type: 'positive',
        message: `${file.name} deleted successfully`,
        position: 'top-right',
      });
    } catch (err: any) {
      handleAxiosError(err);
    }
  };

  const deleteSelectedFiles = async () => {
    if (selectedFiles.value.length === 0) return;

    try {
      const fileIds = selectedFiles.value.map(file => file.id);
      const result = await mediaStore.bulkDeleteFiles(fileIds);
      
      const successCount = result.succeeded.length;
      const failureCount = result.failed.length;
      
      if (successCount > 0) {
        Notify.create({
          type: 'positive',
          message: `Successfully deleted ${successCount} file(s)`,
          position: 'top-right',
        });
      }
      
      if (failureCount > 0) {
        Notify.create({
          type: 'negative',
          message: `Failed to delete ${failureCount} file(s)`,
          position: 'top-right',
        });
      }
    } catch (err: any) {
      handleAxiosError(err);
    }
  };

  const createFolder = async (name: string, parentId?: number) => {
    try {
      const folder = await mediaStore.createFolder({ name, parentId, module });
      
      Notify.create({
        type: 'positive',
        message: `Folder "${name}" created successfully`,
        position: 'top-right',
      });
      
      return folder;
    } catch (err: any) {
      handleAxiosError(err);
      throw err;
    }
  };

  const navigateToFolder = async (folder: MediaFolder | null) => {
    try {
      // Reset loaded pages when navigating to a different folder
      loadedPages.value = 1;
      await mediaStore.navigateToFolder(folder);
    } catch (err: any) {
      handleAxiosError(err);
    }
  };

  const goToPage = async (page: number) => {
    if (page < 1 || page > totalPages.value) return;
    
    await loadMedia({
      page,
      pageSize: pageSize.value,
      folderId: currentFolder.value?.id,
    });
  };

  const nextPage = async () => {
    if (hasNextPage.value) {
      await goToPage(currentPage.value + 1);
    }
  };

  const prevPage = async () => {
    if (hasPrevPage.value) {
      await goToPage(currentPage.value - 1);
    }
  };
  
  // Load more items for Load More button
  const loadMore = async () => {
    if (!hasNextPage.value || loadingMore.value) {
      console.log(`[LoadMore] Cannot load - hasNextPage: ${hasNextPage.value}, loadingMore: ${loadingMore.value}`);
      return false; // No more pages or already loading
    }
    
    try {
      const nextPage = currentPage.value + 1;
      console.log(`[LoadMore] Loading page ${nextPage}. Current page: ${currentPage.value}, Total pages: ${totalPages.value}`);
      await mediaStore.fetchMediaFiles({
        module,
        page: nextPage,
        pageSize: pageSize.value,
        folderId: currentFolder.value?.id,
        appendMode: true
      });
      // Track that we've loaded another page
      loadedPages.value = nextPage;
      console.log(`[LoadMore] Success! Now have ${mediaFiles.value.length} items`);
      return true; // Successfully loaded more
    } catch (err: any) {
      console.error('[LoadMore] Error:', err);
      handleAxiosError(err);
      return false;
    }
  };

  const setPageSize = async (size: number) => {
    await loadMedia({
      page: 1,
      pageSize: size,
      folderId: currentFolder.value?.id,
    });
  };

  // Selection helpers
  const selectFile = (file: MediaFile) => {
    mediaStore.selectFile(file);
  };

  const unselectFile = (file: MediaFile) => {
    mediaStore.unselectFile(file);
  };

  const toggleSelection = (file: MediaFile) => {
    mediaStore.toggleFileSelection(file);
  };

  const selectAll = () => {
    mediaStore.selectAllFiles();
  };

  const clearSelection = () => {
    mediaStore.clearSelection();
  };

  const isSelected = (file: MediaFile) => {
    return selectedFiles.value.some(f => f.id === file.id);
  };

  // Filter helpers
  const setSearch = (query: string) => {
    // Reset loaded pages when search changes
    loadedPages.value = 1;
    searchQuery.value = query;
  };

  const setTypeFilter = (type: string | null) => {
    // Reset loaded pages when filter changes
    loadedPages.value = 1;
    typeFilter.value = type;
  };

  const setStatusFilter = (status: string | null) => {
    // Reset loaded pages when filter changes
    loadedPages.value = 1;
    statusFilter.value = status;
  };

  const clearFilters = () => {
    // Reset loaded pages when clearing filters
    loadedPages.value = 1;
    mediaStore.setFilters({
      search: '',
      type: null,
      status: null,
      tags: [],
    });
  };

  // File utilities
  const getFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: MediaFile): string => {
    if (file.type === 'IMAGE') return 'image';
    if (file.type === 'VIDEO') return 'movie';
    if (file.type === 'AUDIO') return 'audiotrack';
    if (file.mimetype?.includes('pdf')) return 'picture_as_pdf';
    if (file.mimetype?.includes('word')) return 'description';
    if (file.mimetype?.includes('excel') || file.mimetype?.includes('spreadsheet')) return 'grid_on';
    return 'insert_drive_file';
  };

  const isImage = (file: MediaFile): boolean => {
    return file.type === 'IMAGE';
  };

  const isVideo = (file: MediaFile): boolean => {
    return file.type === 'VIDEO';
  };

  const canPreview = (file: MediaFile): boolean => {
    return isImage(file) || isVideo(file);
  };

  const getImageSrc = (file: MediaFile, variant: string = 'medium'): string => {
    if (!isImage(file)) return '';
    
    // Use variant if available
    if (file.variants && file.variants[variant]) {
      // Prefer AVIF, then WebP, then JPEG
      if (file.variants[variant].avif) return file.variants[variant].avif.url;
      if (file.variants[variant].webp) return file.variants[variant].webp.url;
      if (file.variants[variant].jpg) return file.variants[variant].jpg.url;
    }
    
    // Fallback to original URL
    return file.url;
  };

  const getThumbnailSrc = (file: MediaFile): string => {
    if (isImage(file)) {
      return getImageSrc(file, 'thumbnail');
    } else if (isVideo(file) && file.variants?.thumbnail) {
      return file.variants.thumbnail.url;
    }
    return '';
  };

  // Real-time updates
  const setupRealTimeUpdates = () => {
    if (!realTimeEnabled.value || !socketStore || !socketStore.socket) return;

    // Listen for media upload completion
    socketStore.socket.on('media:processed', () => {
      // Refresh the specific file or reload the list
      refreshMedia();
    });

    // Listen for media deletion
    socketStore.socket.on('media:deleted', (data: { fileId: number }) => {
      mediaStore.mediaFiles = mediaStore.mediaFiles.filter(f => f.id !== data.fileId);
    });
  };

  const cleanupRealTimeUpdates = () => {
    if (!socketStore || !socketStore.socket) return;

    socketStore.socket.off('media:processed');
    socketStore.socket.off('media:deleted');
  };

  // Polling mechanism for processing files
  const pollingInterval = ref<NodeJS.Timeout | null>(null);
  
  const startPolling = () => {
    if (pollingInterval.value) return; // Already polling
    
    pollingInterval.value = setInterval(async () => {
      const hasProcessingFiles = processingFiles.value.length > 0;
      
      if (hasProcessingFiles) {
        try {
          console.log(`Polling for ${processingFiles.value.length} processing files...`);
          await refreshMedia();
        } catch (error) {
          console.error('Polling error:', error);
        }
      } else {
        // Stop polling if no files are processing
        stopPolling();
      }
    }, 3000); // Poll every 3 seconds
  };
  
  const stopPolling = () => {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
      console.log('Stopped polling for processing files');
    }
  };
  
  // Watch for processing files to start/stop polling
  watch(
    () => processingFiles.value.length,
    (newCount: number, oldCount?: number) => {
      const prevCount = oldCount ?? 0;
      if (newCount > 0 && prevCount === 0) {
        console.log('Starting polling for processing files...');
        startPolling();
      } else if (newCount === 0 && prevCount > 0) {
        console.log('All files processed, stopping polling');
        stopPolling();
      }
    },
    { immediate: true }
  );

  // Watchers
  watch(
    [searchQuery, typeFilter, statusFilter],
    () => {
      // Debounce search
      // For now, filters work on client-side via computed property
    },
    { deep: true }
  );

  // Lifecycle
  onMounted(async () => {
    // Set the current module in the store
    mediaStore.setCurrentModule(module);
    
    if (autoLoad) {
      await loadMedia(defaultQuery);
      await mediaStore.fetchFolders(module);
      await mediaStore.fetchStats(module);
    }
    
    if (realTimeEnabled.value) {
      setupRealTimeUpdates();
    }
  });

  // Watch for module changes and clear folders when switching modules
  watch(() => module, (newModule, oldModule) => {
    if (oldModule && newModule !== oldModule) {
      // Set the new current module in the store
      mediaStore.setCurrentModule(newModule);
      // Clear existing folders and reload for new module
      mediaStore.clearFolders();
      mediaStore.fetchFolders(newModule);
      mediaStore.fetchStats(newModule);
    }
  });

  onUnmounted(() => {
    if (realTimeEnabled.value) {
      cleanupRealTimeUpdates();
    }
    
    // Stop polling
    stopPolling();
    
    // Clear upload progress on unmount
    mediaStore.clearUploadProgress();
  });

  return {
    // Module
    module,
    
    // State
    mediaFiles,
    folders,
    currentFolder,
    selectedFiles,
    uploadProgress,
    loading,
    loadingMore,
    error,
    refreshing,
    filteredFiles,
    isUploading,
    processingFiles,
    hasSelection,
    stats,
    
    // Pagination
    currentPage,
    pageSize,
    totalFiles,
    totalPages,
    hasNextPage,
    hasPrevPage,
    
    // Filters
    searchQuery,
    typeFilter,
    statusFilter,
    
    // Methods
    loadMedia,
    refreshMedia,
    uploadFiles,
    deleteFile,
    deleteSelectedFiles,
    createFolder,
    navigateToFolder,
    goToPage,
    nextPage,
    prevPage,
    loadMore,
    setPageSize,
    
    // Selection
    selectFile,
    unselectFile,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    
    // Filters
    setSearch,
    setTypeFilter,
    setStatusFilter,
    clearFilters,
    
    // Utilities
    getFileSize,
    getFileIcon,
    isImage,
    isVideo,
    canPreview,
    getImageSrc,
    getThumbnailSrc,
  };
}