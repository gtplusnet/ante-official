import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/boot/axios';
import { ModuleType } from 'src/types/media.types';

export interface MediaFile {
  id: number;
  name: string;
  originalName: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
  mimetype: string;
  size: number;
  url: string;
  width?: number;
  height?: number;
  duration?: number;
  
  // Processing information
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  processingError?: string;
  
  // Optimization data
  variants?: Record<string, any>;
  blurPlaceholder?: string;
  dominantColor?: string;
  
  // CMS specific
  alternativeText?: string;
  caption?: string;
  tags?: string[];
  
  // Relations
  folderId?: number;
  folder?: MediaFolder;
  
  // Tracking
  lastAccessedAt?: Date;
  accessCount?: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface MediaFolder {
  id: number;
  name: string;
  parentId?: number;
  path: string;
  module?: ModuleType;
  companyId?: number;
  createdAt: Date;
  updatedAt: Date;
  children?: MediaFolder[];
  fileCount?: number;
  subfolderCount?: number;
  totalSize?: number;
}

export interface MediaQuery {
  module?: ModuleType;
  page?: number;
  pageSize?: number;
  search?: string;
  type?: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
  folderId?: number;
  tags?: string[];
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  appendMode?: boolean; // Add append mode for Load More pagination
}

export interface UploadProgress {
  fileId?: number;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface MediaStats {
  totalFiles: number;
  totalSize: number;
  processingQueue: number;
  completedToday: number;
  supportedFormats: {
    images: number;
    videos: number;
  };
}

/**
 * Determine correct file type from MIME type and filename
 * This fixes incorrect types from the backend (e.g., PDFs marked as VIDEO)
 */
function getCorrectFileType(file: { mimetype?: string; originalName?: string; name?: string; type?: string }): 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' {
  // First check MIME type for accurate detection
  if (file.mimetype) {
    if (file.mimetype.startsWith('image/')) return 'IMAGE';
    if (file.mimetype.startsWith('video/')) return 'VIDEO';
    if (file.mimetype.startsWith('audio/')) return 'AUDIO';
    if (file.mimetype === 'application/pdf') return 'DOCUMENT';
    if (file.mimetype.startsWith('application/') || file.mimetype.startsWith('text/')) return 'DOCUMENT';
  }
  
  // Fallback to filename extension if MIME type doesn't help
  return getFileTypeFromName(file.originalName || file.name || '');
}

/**
 * Determine file type from filename for files without backend type
 */
function getFileTypeFromName(filename: string): 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
  const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'webm', 'mkv', 'flv'];
  const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'];
  
  if (imageExts.includes(ext || '')) return 'IMAGE';
  if (videoExts.includes(ext || '')) return 'VIDEO';
  if (audioExts.includes(ext || '')) return 'AUDIO';
  
  // Default to DOCUMENT for everything else (PDFs, docs, etc.)
  return 'DOCUMENT';
}

export const useMediaStore = defineStore('media', () => {
  // State
  const mediaFiles = ref<MediaFile[]>([]);
  const folders = ref<MediaFolder[]>([]);
  const currentFolder = ref<MediaFolder | null>(null);
  const selectedFiles = ref<MediaFile[]>([]);
  const uploadProgress = ref<UploadProgress[]>([]);
  const loading = ref(false);
  const loadingMore = ref(false); // New state for Load More button loading
  const error = ref<string | null>(null);
  
  // Current module state - tracks which module is being used
  const currentModule = ref<ModuleType>(ModuleType.CMS);
  
  // Pagination
  const currentPage = ref(1);
  const pageSize = ref(50); // Default to 50 items per page
  const totalFiles = ref(0);
  const totalPages = ref(0);
  
  // Filters
  const searchQuery = ref('');
  const typeFilter = ref<string | null>(null);
  const statusFilter = ref<string | null>(null);
  const tagFilter = ref<string[]>([]);
  
  // Statistics
  const stats = ref<MediaStats | null>(null);

  // Computed
  const filteredFiles = computed(() => {
    let files = mediaFiles.value;
    
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      files = files.filter((file: MediaFile) => 
        file.name.toLowerCase().includes(query) ||
        file.originalName.toLowerCase().includes(query) ||
        file.alternativeText?.toLowerCase().includes(query) ||
        file.caption?.toLowerCase().includes(query) ||
        file.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }
    
    if (typeFilter.value) {
      files = files.filter((file: MediaFile) => file.type === typeFilter.value);
    }
    
    if (statusFilter.value) {
      files = files.filter((file: MediaFile) => file.processingStatus === statusFilter.value);
    }
    
    if (tagFilter.value.length > 0) {
      files = files.filter((file: MediaFile) => 
        file.tags?.some((tag: string) => tagFilter.value.includes(tag))
      );
    }
    
    return files;
  });

  const isUploading = computed(() => {
    return uploadProgress.value.some((progress: UploadProgress) => 
      progress.status === 'uploading' || progress.status === 'processing'
    );
  });

  const processingFiles = computed(() => {
    return mediaFiles.value.filter((file: MediaFile) => 
      file.processingStatus === 'PENDING' || file.processingStatus === 'PROCESSING'
    );
  });

  const hasSelection = computed(() => {
    return selectedFiles.value.length > 0;
  });

  // Actions
  const fetchMediaFiles = async (query: MediaQuery = {}) => {
    // Use different loading states for append vs replace
    if (query.appendMode) {
      loadingMore.value = true;
    } else {
      loading.value = true;
    }
    error.value = null;
    
    try {
      const params = new URLSearchParams();
      
      // Add query parameters
      if (query.module) params.append('module', query.module);
      if (query.page) params.append('page', query.page.toString());
      if (query.pageSize) params.append('pageSize', query.pageSize.toString());
      if (query.search) params.append('search', query.search);
      if (query.type) params.append('type', query.type);
      if (query.folderId) params.append('folderId', query.folderId.toString());
      if (query.status) params.append('status', query.status);
      if (query.tags && query.tags.length > 0) {
        params.append('tags', query.tags.join(','));
      }
      
      const response = await api.get(`/media?${params.toString()}`);
      
      if (response.data.statusCode === 200) {
        const newFiles = response.data.data.map((file: { 
          id: number;
          name: string;
          originalName: string;
          type: string;
          mimetype: string;
          size: number;
          url: string;
          width?: number;
          height?: number;
          duration?: number;
          processingStatus: string;
          processingError?: string;
          variants?: Record<string, any>;
          blurPlaceholder?: string;
          dominantColor?: string;
          alternativeText?: string;
          caption?: string;
          tags?: string[];
          folderId?: number;
          folder?: any;
          lastAccessedAt?: string;
          accessCount?: number;
          createdAt: string;
          updatedAt: string;
          uploadedBy?: {
            id: string;
            firstName: string;
            lastName: string;
          };
        }) => ({
          ...file,
          type: getCorrectFileType(file),
          createdAt: new Date(file.createdAt),
          updatedAt: new Date(file.updatedAt),
          lastAccessedAt: file.lastAccessedAt ? new Date(file.lastAccessedAt) : undefined,
        }));
        
        if (query.appendMode) {
          // Append new files to existing ones, avoiding duplicates
          const existingIds = new Set(mediaFiles.value.map((f: MediaFile) => f.id));
          const uniqueNewFiles = newFiles.filter((file: MediaFile) => !existingIds.has(file.id));
          console.log(`[MediaStore] Appending ${uniqueNewFiles.length} items. Before: ${mediaFiles.value.length}, After: ${mediaFiles.value.length + uniqueNewFiles.length}`);
          mediaFiles.value = [...mediaFiles.value, ...uniqueNewFiles];
        } else {
          // Replace all files (default behavior)
          console.log(`[MediaStore] Replacing with ${newFiles.length} items`);
          mediaFiles.value = newFiles;
        }
        
        // Update pagination info - handle both old (meta) and new (pagination) formats
        if (response.data.pagination) {
          // New format with pagination object
          currentPage.value = response.data.currentPage || query.page || 1;
          totalFiles.value = response.data.pagination.total || 0;
          totalPages.value = response.data.pagination.totalPages || 0;
          pageSize.value = response.data.pagination.pageSize || query.pageSize || 50;
        } else if (response.data.meta) {
          // Old format with meta object (current staging)
          currentPage.value = response.data.meta.page || query.page || 1;
          totalFiles.value = response.data.meta.total || 0;
          totalPages.value = response.data.meta.pageCount || 0;
          pageSize.value = response.data.meta.pageSize || query.pageSize || 50;
        }
        console.log(`[MediaStore] Pagination updated - Page: ${currentPage.value}/${totalPages.value}, PageSize: ${pageSize.value}, Total: ${totalFiles.value}`);
      } else {
        throw new Error(response.data.message || 'Failed to fetch media files');
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to fetch media files';
      console.error('Failed to fetch media files:', err);
    } finally {
      if (query.appendMode) {
        loadingMore.value = false;
      } else {
        loading.value = false;
      }
    }
  };

  const uploadMediaFile = async (file: File, options: {
    module?: ModuleType;
    folderId?: number;
    folderName?: string;
    alternativeText?: string;
    caption?: string;
    tags?: string[];
    processInBackground?: boolean;
  } = {}) => {
    // const progressId = Date.now().toString(); // TODO: Implement progress tracking with ID
    
    // Add to upload progress tracking
    uploadProgress.value.push({
      fileName: file.name,
      progress: 0,
      status: 'uploading',
    });
    
    const progressIndex = uploadProgress.value.length - 1;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.module) formData.append('module', options.module);
      if (options.folderId) formData.append('folderId', options.folderId.toString());
      if (options.folderName) formData.append('folderName', options.folderName);
      if (options.alternativeText) formData.append('alternativeText', options.alternativeText);
      if (options.caption) formData.append('caption', options.caption);
      if (options.tags && options.tags.length > 0) {
        formData.append('tags', options.tags.join(','));
      }
      if (options.processInBackground) {
        formData.append('processInBackground', 'true');
      }
      
      const response = await api.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: { loaded: number; total?: number }) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            uploadProgress.value[progressIndex].progress = progress;
          }
        },
      });
      
      if (response.data.statusCode === 201) {
        const uploadedFile = response.data.data;
        
        // Update progress status - handle missing processingStatus field
        const processingStatus = uploadedFile.processingStatus || 'COMPLETED'; // Default to completed if field missing
        uploadProgress.value[progressIndex].status = processingStatus === 'COMPLETED' ? 'completed' : 'processing';
        uploadProgress.value[progressIndex].fileId = uploadedFile.id;
        
        // Add to media files if processing is complete
        if (processingStatus === 'COMPLETED') {
          mediaFiles.value.unshift({
            ...uploadedFile,
            type: getCorrectFileType(uploadedFile),
            createdAt: new Date(uploadedFile.createdAt),
            updatedAt: new Date(uploadedFile.updatedAt),
          });
        } else {
          // Refresh the list to show the pending file
          await fetchMediaFiles({
            module: options.module || ModuleType.CMS,
            page: currentPage.value,
            pageSize: pageSize.value,
            folderId: currentFolder.value?.id,
          });
        }
        
        return uploadedFile;
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (err: any) {
      uploadProgress.value[progressIndex].status = 'failed';
      uploadProgress.value[progressIndex].error = err.response?.data?.message || err.message;
      throw err;
    }
  };

  const deleteMediaFile = async (fileId: number) => {
    try {
      const response = await api.delete(`/media/${fileId}`);
      
      if (response.data.statusCode === 200) {
        // Remove from local state
        mediaFiles.value = mediaFiles.value.filter((file: MediaFile) => file.id !== fileId);
        selectedFiles.value = selectedFiles.value.filter((file: MediaFile) => file.id !== fileId);
        totalFiles.value = Math.max(0, totalFiles.value - 1);
      } else {
        throw new Error(response.data.message || 'Failed to delete file');
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to delete file';
      throw err;
    }
  };

  const bulkDeleteFiles = async (fileIds: number[]) => {
    try {
      const response = await api.post('/media/bulk-delete', { ids: fileIds });
      
      if (response.data.statusCode === 200) {
        const { succeeded } = response.data.data;
        const successfulIds = succeeded.map((item: { id: number }) => item.id);
        
        // Remove successful deletions from local state
        mediaFiles.value = mediaFiles.value.filter((file: MediaFile) => !successfulIds.includes(file.id));
        selectedFiles.value = selectedFiles.value.filter((file: MediaFile) => !successfulIds.includes(file.id));
        totalFiles.value = Math.max(0, totalFiles.value - successfulIds.length);
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Bulk delete failed');
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Bulk delete failed';
      throw err;
    }
  };

  const createFolder = async (data: { name: string; parentId?: number; module?: ModuleType }) => {
    try {
      const response = await api.post('/media/folders', data);
      
      if (response.data.statusCode === 201) {
        const newFolder = response.data.data;
        folders.value.push(newFolder);
        return newFolder;
      } else {
        throw new Error(response.data.message || 'Failed to create folder');
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to create folder';
      throw err;
    }
  };

  const updateFolder = async (folderId: number, data: { name?: string; parentId?: number }) => {
    try {
      const response = await api.put(`/media/folders/${folderId}`, data);
      
      if (response.data.statusCode === 200) {
        const updatedFolder = response.data.data;
        
        // Update folder in the local array
        const index = folders.value.findIndex((folder: MediaFolder) => folder.id === folderId);
        if (index !== -1) {
          folders.value[index] = { ...folders.value[index], ...updatedFolder };
        }
        
        return updatedFolder;
      } else {
        throw new Error(response.data.message || 'Failed to update folder');
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to update folder';
      throw err;
    }
  };

  const deleteFolder = async (folderId: number, options: { 
    deleteFiles?: boolean;
    moveToParent?: boolean;
    confirmFolderName?: string;
  } = {}) => {
    try {
      const response = await api.delete(`/media/folders/${folderId}`, {
        data: options
      });
      
      if (response.data.statusCode === 200) {
        // Find the folder being deleted to get its parent info
        const deletedFolder = folders.value.find((folder: MediaFolder) => folder.id === folderId);
        const isCurrentFolderDeleted = currentFolder.value?.id === folderId;
        
        // Remove folder from local state
        folders.value = folders.value.filter((folder: MediaFolder) => folder.id !== folderId);
        
        // If we're deleting the current folder, navigate to parent or root
        let targetFolderId: number | undefined = undefined;
        if (isCurrentFolderDeleted) {
          if (deletedFolder?.parentId) {
            // Navigate to parent folder
            const parentFolder = folders.value.find((f: MediaFolder) => f.id === deletedFolder.parentId);
            if (parentFolder) {
              currentFolder.value = parentFolder;
              targetFolderId = parentFolder.id;
            } else {
              // Parent folder not found, go to root
              currentFolder.value = null;
              targetFolderId = undefined;
            }
          } else {
            // No parent, go to root
            currentFolder.value = null;
            targetFolderId = undefined;
          }
        } else {
          // Keep current folder context
          targetFolderId = currentFolder.value?.id;
        }
        
        // Always refresh media files to show correct context
        await fetchMediaFiles({
          page: 1, // Reset to first page after deletion
          pageSize: pageSize.value,
          folderId: targetFolderId,
          module: currentModule.value,
        });
        
        return {
          ...response.data.data,
          wasCurrentFolder: isCurrentFolderDeleted,
          navigatedToParent: isCurrentFolderDeleted && targetFolderId !== undefined,
          navigatedToRoot: isCurrentFolderDeleted && targetFolderId === undefined
        };
      } else {
        throw new Error(response.data.message || 'Failed to delete folder');
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to delete folder';
      throw err;
    }
  };

  const fetchFolders = async (module?: ModuleType) => {
    try {
      const params = new URLSearchParams();
      if (module) params.append('module', module);
      
      const response = await api.get(`/media/folders/list?${params.toString()}`);
      
      if (response.data.statusCode === 200) {
        folders.value = response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch folders');
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to fetch folders';
      console.error('Failed to fetch folders:', err);
    }
  };

  const fetchStats = async (module?: ModuleType) => {
    try {
      // TODO: Implement real media statistics endpoint with module filtering
      // For now, calculate basic stats from current mediaFiles
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _moduleParam = module; // Keep parameter for future implementation
      const totalFiles = mediaFiles.value.length;
      const totalSize = mediaFiles.value.reduce((sum: number, file: MediaFile) => sum + (file.size || 0), 0);
      const completedToday = mediaFiles.value.filter((file: MediaFile) => {
        const today = new Date().toDateString();
        return file.processingStatus === 'COMPLETED' && 
               new Date(file.createdAt).toDateString() === today;
      }).length;
      
      stats.value = {
        totalFiles,
        totalSize,
        processingQueue: mediaFiles.value.filter((f: MediaFile) => f.processingStatus === 'PROCESSING' || f.processingStatus === 'PENDING').length,
        completedToday,
        supportedFormats: {
          images: mediaFiles.value.filter((f: MediaFile) => f.type === 'IMAGE').length,
          videos: mediaFiles.value.filter((f: MediaFile) => f.type === 'VIDEO').length,
        }
      };
    } catch (err: any) {
      error.value = err.message || 'Failed to calculate stats';
      console.error('Failed to calculate stats:', err);
    }
  };

  // Selection management
  const selectFile = (file: MediaFile) => {
    const index = selectedFiles.value.findIndex((f: MediaFile) => f.id === file.id);
    if (index === -1) {
      selectedFiles.value.push(file);
    }
  };

  const unselectFile = (file: MediaFile) => {
    selectedFiles.value = selectedFiles.value.filter((f: MediaFile) => f.id !== file.id);
  };

  const toggleFileSelection = (file: MediaFile) => {
    const index = selectedFiles.value.findIndex((f: MediaFile) => f.id === file.id);
    if (index === -1) {
      selectedFiles.value.push(file);
    } else {
      selectedFiles.value.splice(index, 1);
    }
  };

  const selectAllFiles = () => {
    selectedFiles.value = [...filteredFiles.value];
  };

  const clearSelection = () => {
    selectedFiles.value = [];
  };

  // Utility functions
  const clearUploadProgress = () => {
    uploadProgress.value = uploadProgress.value.filter(
      (progress: UploadProgress) => progress.status === 'uploading' || progress.status === 'processing'
    );
  };

  const navigateToFolder = async (folder: MediaFolder | null) => {
    currentFolder.value = folder;
    await fetchMediaFiles({
      module: currentModule.value,
      page: 1,
      pageSize: pageSize.value,
      folderId: folder?.id,
    });
  };

  const setFilters = (filters: {
    search?: string;
    type?: string | null;
    status?: string | null;
    tags?: string[];
  }) => {
    if (filters.search !== undefined) searchQuery.value = filters.search;
    if (filters.type !== undefined) typeFilter.value = filters.type;
    if (filters.status !== undefined) statusFilter.value = filters.status;
    if (filters.tags !== undefined) tagFilter.value = filters.tags;
  };

  const clearFolders = () => {
    folders.value = [];
    currentFolder.value = null;
  };

  // Set current module
  const setCurrentModule = (module: ModuleType) => {
    currentModule.value = module;
  };

  return {
    // State
    mediaFiles,
    folders,
    currentFolder,
    selectedFiles,
    uploadProgress,
    loading,
    loadingMore,
    error,
    currentModule,
    currentPage,
    pageSize,
    totalFiles,
    totalPages,
    searchQuery,
    typeFilter,
    statusFilter,
    tagFilter,
    stats,
    
    // Computed
    filteredFiles,
    isUploading,
    processingFiles,
    hasSelection,
    
    // Actions
    fetchMediaFiles,
    uploadMediaFile,
    deleteMediaFile,
    bulkDeleteFiles,
    createFolder,
    updateFolder,
    deleteFolder,
    fetchFolders,
    fetchStats,
    selectFile,
    unselectFile,
    toggleFileSelection,
    selectAllFiles,
    clearSelection,
    clearUploadProgress,
    navigateToFolder,
    setFilters,
    clearFolders,
    setCurrentModule,
  };
});