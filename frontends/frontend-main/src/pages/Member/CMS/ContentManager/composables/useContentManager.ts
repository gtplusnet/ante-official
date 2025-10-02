import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { CMSContentService } from 'src/services/cms-content.service';
import type { 
  ContentEntry, 
  ContentQuery, 
  CreateContentDto, 
  UpdateContentDto 
} from 'src/services/cms-content.service';

type ViewMode = 'list' | 'create' | 'edit';

export function useContentManager() {
  const $q = useQuasar();
  
  // State with persistence to prevent loss during reloads
  const activeContentType = ref(localStorage.getItem('cms_active_content_type') || '');
  const currentView = ref<ViewMode>('list');
  const contentEntries = ref<ContentEntry[]>([]);
  const contentLoading = ref(false);
  const editingEntry = ref<ContentEntry | null>(null);
  const previewingEntry = ref<ContentEntry | null>(null);
  const showPreviewDialog = ref(false);
  
  // Pagination state
  const contentPagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  
  // Current query filters
  const currentQuery = ref<ContentQuery>({});
  
  // Methods
  const selectContentType = (id: string) => {
    console.log('[Content Manager] Selecting content type:', id);
    activeContentType.value = id;
    // Persist to localStorage to prevent loss during component reloads
    localStorage.setItem('cms_active_content_type', id);
    // Reset pagination when switching content types
    contentPagination.value.page = 1;
    currentQuery.value = {};
  };
  
  const setView = (view: ViewMode) => {
    console.log('[Content Manager] setView called:', {
      previousView: currentView.value,
      newView: view,
      activeContentType: activeContentType.value,
      contentEntriesLength: contentEntries.value.length
    });
    currentView.value = view;
    console.log('[Content Manager] setView completed, currentView is now:', currentView.value);
  };
  
  const loadContent = async (contentTypeName: string, query: Partial<ContentQuery> = {}) => {
    console.log('[Content Manager] Loading content for:', contentTypeName, query);
    console.log('[Content Manager] Current contentEntries before load:', {
      length: contentEntries.value.length,
      entries: contentEntries.value
    });
    
    // Don't clear existing data unnecessarily - keep it during loading for better UX
    console.log('[Content Manager] Preserving existing contentEntries during load');
    contentLoading.value = true;
    
    try {
      // Merge with current query
      const mergedQuery: ContentQuery = {
        ...currentQuery.value,
        ...query,
        page: query.page || contentPagination.value.page,
        limit: query.limit || contentPagination.value.limit
      };
      
      currentQuery.value = mergedQuery;
      console.log('[Content Manager] Making API call with query:', mergedQuery);
      
      const response = await CMSContentService.getContent(contentTypeName, mergedQuery);
      console.log('[Content Manager] Raw API response:', response);
      console.log('[Content Manager] API response data:', response.data);
      console.log('[Content Manager] API response data length:', response.data?.length || 0);
      
      if (response.data && response.data.length > 0) {
        console.log('[Content Manager] First entry structure:', response.data[0]);
      }
      
      // Update content entries
      const newEntries = response.data || [];
      console.log('[Content Manager] Setting contentEntries to:', newEntries);
      contentEntries.value = newEntries;
      
      // Update pagination
      contentPagination.value = {
        page: response.page || 1,
        limit: response.limit || 20,
        total: response.total || 0,
        totalPages: response.totalPages || 0
      };
      
      console.log('[Content Manager] Content loaded successfully:', {
        entriesCount: contentEntries.value.length,
        actualEntries: contentEntries.value,
        pagination: contentPagination.value
      });
      
      // Verify reactivity
      setTimeout(() => {
        console.log('[Content Manager] contentEntries after timeout:', {
          length: contentEntries.value.length,
          entries: contentEntries.value
        });
      }, 100);
      
    } catch (error) {
      console.error('[Content Manager] Failed to load content:', error);
      contentEntries.value = [];
      contentPagination.value = {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      };
      
      showError('Failed to load content entries');
    } finally {
      contentLoading.value = false;
      console.log('[Content Manager] Loading finished, contentLoading set to false');
    }
  };
  
  const createEntry = async (contentTypeName: string, data: CreateContentDto): Promise<ContentEntry> => {
    console.log('[Content Manager] Creating entry for:', contentTypeName, data);
    
    try {
      const entry = await CMSContentService.create(contentTypeName, data);
      console.log('[Content Manager] Entry created:', entry);
      return entry;
    } catch (error) {
      console.error('[Content Manager] Failed to create entry:', error);
      throw error;
    }
  };
  
  const updateEntry = async (contentTypeName: string, entryId: string, data: UpdateContentDto): Promise<ContentEntry> => {
    console.log('[Content Manager] Updating entry:', { contentTypeName, entryId, data });
    
    try {
      const entry = await CMSContentService.update(contentTypeName, entryId, data);
      console.log('[Content Manager] Entry updated successfully:', entry);
      return entry;
    } catch (error: any) {
      console.error('[Content Manager] Failed to update entry:', {
        contentTypeName,
        entryId,
        error: error?.response?.data || error?.message || error
      });
      
      // Extract more specific error message from backend
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update entry';
      
      // Create enhanced error for better user feedback
      const enhancedError = new Error(errorMessage);
      (enhancedError as any).originalError = error;
      (enhancedError as any).entryId = entryId;
      (enhancedError as any).contentTypeName = contentTypeName;
      
      throw enhancedError;
    }
  };
  
  const deleteEntry = async (contentTypeName: string, entryId: string): Promise<void> => {
    console.log('[Content Manager] Deleting entry:', { contentTypeName, entryId });
    
    try {
      await CMSContentService.delete(contentTypeName, entryId);
      console.log('[Content Manager] Entry deleted successfully:', { contentTypeName, entryId });
    } catch (error: any) {
      console.error('[Content Manager] Failed to delete entry:', {
        contentTypeName,
        entryId,
        error: error?.response?.data || error?.message || error
      });
      
      // Extract more specific error message from backend
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete entry';
      
      // Create enhanced error for better user feedback
      const enhancedError = new Error(errorMessage);
      (enhancedError as any).originalError = error;
      (enhancedError as any).entryId = entryId;
      (enhancedError as any).contentTypeName = contentTypeName;
      
      throw enhancedError;
    }
  };
  
  const publishEntry = async (contentTypeName: string, entryId: string): Promise<ContentEntry> => {
    console.log('[Content Manager] Publishing entry:', contentTypeName, entryId);
    
    try {
      const entry = await CMSContentService.publish(contentTypeName, entryId);
      console.log('[Content Manager] Entry published:', entry);
      return entry;
    } catch (error) {
      console.error('[Content Manager] Failed to publish entry:', error);
      throw error;
    }
  };
  
  const unpublishEntry = async (contentTypeName: string, entryId: string): Promise<ContentEntry> => {
    console.log('[Content Manager] Unpublishing entry:', contentTypeName, entryId);
    
    try {
      const entry = await CMSContentService.unpublish(contentTypeName, entryId);
      console.log('[Content Manager] Entry unpublished:', entry);
      return entry;
    } catch (error) {
      console.error('[Content Manager] Failed to unpublish entry:', error);
      throw error;
    }
  };
  
  const archiveEntry = async (contentTypeName: string, entryId: string): Promise<ContentEntry> => {
    console.log('[Content Manager] Archiving entry:', contentTypeName, entryId);
    
    try {
      const entry = await CMSContentService.archive(contentTypeName, entryId);
      console.log('[Content Manager] Entry archived:', entry);
      return entry;
    } catch (error) {
      console.error('[Content Manager] Failed to archive entry:', error);
      throw error;
    }
  };

  // Single Type Methods
  const loadSingleTypeContent = async (contentTypeName: string) => {
    console.log('[Content Manager] Loading single type content for:', contentTypeName);
    contentLoading.value = true;
    
    try {
      const entry = await CMSContentService.getSingleTypeContent(contentTypeName);
      
      // For single types, store the single entry in editingEntry
      editingEntry.value = entry;
      
      console.log('[Content Manager] Single type content loaded:', entry);
      
    } catch (error) {
      console.error('[Content Manager] Failed to load single type content:', error);
      editingEntry.value = null;
      showError('Failed to load single type content');
    } finally {
      contentLoading.value = false;
    }
  };

  const saveSingleTypeContent = async (contentTypeName: string, data: CreateContentDto): Promise<ContentEntry> => {
    console.log('[Content Manager] Saving single type content:', contentTypeName, data);
    
    try {
      const entry = await CMSContentService.updateSingleTypeContent(contentTypeName, data);
      console.log('[Content Manager] Single type content saved:', entry);
      return entry;
    } catch (error) {
      console.error('[Content Manager] Failed to save single type content:', error);
      throw error;
    }
  };

  const publishSingleType = async (contentTypeName: string): Promise<ContentEntry> => {
    console.log('[Content Manager] Publishing single type:', contentTypeName);
    
    try {
      const entry = await CMSContentService.publishSingleType(contentTypeName);
      console.log('[Content Manager] Single type published:', entry);
      return entry;
    } catch (error) {
      console.error('[Content Manager] Failed to publish single type:', error);
      throw error;
    }
  };

  const unpublishSingleType = async (contentTypeName: string): Promise<ContentEntry> => {
    console.log('[Content Manager] Unpublishing single type:', contentTypeName);
    
    try {
      const entry = await CMSContentService.unpublishSingleType(contentTypeName);
      console.log('[Content Manager] Single type unpublished:', entry);
      return entry;
    } catch (error) {
      console.error('[Content Manager] Failed to unpublish single type:', error);
      throw error;
    }
  };
  
  const duplicateEntry = async (contentTypeName: string, entryId: string): Promise<ContentEntry> => {
    console.log('[Content Manager] Duplicating entry:', contentTypeName, entryId);
    
    try {
      const entry = await CMSContentService.duplicate(contentTypeName, entryId);
      console.log('[Content Manager] Entry duplicated:', entry);
      return entry;
    } catch (error) {
      console.error('[Content Manager] Failed to duplicate entry:', error);
      throw error;
    }
  };
  
  // Bulk operations
  const bulkPublish = async (contentTypeName: string, entryIds: string[]): Promise<void> => {
    console.log('[Content Manager] Bulk publishing entries:', contentTypeName, entryIds);
    
    try {
      await CMSContentService.bulkPublish(contentTypeName, entryIds);
      console.log('[Content Manager] Entries bulk published');
    } catch (error) {
      console.error('[Content Manager] Failed to bulk publish entries:', error);
      throw error;
    }
  };
  
  const bulkUnpublish = async (contentTypeName: string, entryIds: string[]): Promise<void> => {
    console.log('[Content Manager] Bulk unpublishing entries:', contentTypeName, entryIds);
    
    try {
      await CMSContentService.bulkUnpublish(contentTypeName, entryIds);
      console.log('[Content Manager] Entries bulk unpublished');
    } catch (error) {
      console.error('[Content Manager] Failed to bulk unpublish entries:', error);
      throw error;
    }
  };
  
  const bulkDelete = async (contentTypeName: string, entryIds: string[]): Promise<void> => {
    console.log('[Content Manager] Bulk deleting entries:', contentTypeName, entryIds);
    
    try {
      await CMSContentService.bulkDelete(contentTypeName, entryIds);
      console.log('[Content Manager] Entries bulk deleted');
    } catch (error) {
      console.error('[Content Manager] Failed to bulk delete entries:', error);
      throw error;
    }
  };
  
  // Utility functions
  const getEntryTitle = (entry: ContentEntry): string => {
    // Try common title fields
    const titleFields = ['title', 'name', 'displayName', 'label'];
    for (const field of titleFields) {
      if (entry.data[field]) {
        return entry.data[field];
      }
    }
    
    // Fallback to first string field or ID
    const firstStringValue = Object.values(entry.data).find(value => 
      typeof value === 'string' && value.trim().length > 0
    );
    
    return firstStringValue as string || `Entry ${entry.id}`;
  };
  
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'published': return 'positive';
      case 'draft': return 'warning';
      case 'archived': return 'grey';
      default: return 'grey';
    }
  };
  
  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'published': return 'o_public';
      case 'draft': return 'o_edit_note';
      case 'archived': return 'o_archive';
      default: return 'o_help';
    }
  };
  
  // Notifications
  const showSuccess = (message: string) => {
    $q.notify({
      type: 'positive',
      message,
      position: 'top',
      timeout: 3000
    });
  };
  
  const showError = (message: string) => {
    $q.notify({
      type: 'negative',
      message,
      position: 'top',
      timeout: 5000
    });
  };
  
  const showWarning = (message: string) => {
    $q.notify({
      type: 'warning',
      message,
      position: 'top',
      timeout: 4000
    });
  };
  
  const showInfo = (message: string) => {
    $q.notify({
      type: 'info',
      message,
      position: 'top',
      timeout: 3000
    });
  };
  
  return {
    // State
    activeContentType,
    currentView,
    contentEntries,
    contentLoading,
    contentPagination,
    editingEntry,
    previewingEntry,
    showPreviewDialog,
    currentQuery,
    
    // Methods
    selectContentType,
    setView,
    loadContent,
    createEntry,
    updateEntry,
    deleteEntry,
    publishEntry,
    unpublishEntry,
    archiveEntry,
    duplicateEntry,
    bulkPublish,
    bulkUnpublish,
    bulkDelete,
    
    // Single Type Methods
    loadSingleTypeContent,
    saveSingleTypeContent,
    publishSingleType,
    unpublishSingleType,
    
    // Utilities
    getEntryTitle,
    getStatusColor,
    getStatusIcon,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}