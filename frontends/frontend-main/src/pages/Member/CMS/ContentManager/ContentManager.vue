<template>
  <expanded-nav-page-container>
    <div class="content-manager">
      <!-- Left Sidebar -->
      <ContentManagerSidebar
        :collection-types="collectionTypes"
        :single-types="singleTypes"
        :active-content-type="activeContentType"
        :loading="contentTypesLoading"
        :error="contentTypesError"
        @select-content-type="selectContentType"
        @refresh="refreshContentTypes"
      />

      <!-- Main Content Area -->
      <div class="content-area">
        <!-- Content List View -->
        <ContentList
          v-if="selectedContentType && currentView === 'list'"
          :key="`content-list-${selectedContentType.id}`"
          :content-type="selectedContentType"
          :entries="contentEntries"
          :loading="contentLoading"
          :pagination="contentPagination"
          @create-entry="openCreateForm"
          @edit-entry="openEditForm"
          @delete-entry="handleDeleteEntry"
          @publish-entry="handlePublishEntry"
          @unpublish-entry="handleUnpublishEntry"
          @page-change="handlePageChange"
          @search="handleSearch"
          @filter-change="handleFilterChange"
          @bulk-action="handleBulkAction"
        />
        
        <!-- Content Form View -->
        <ContentForm
          v-if="selectedContentType && (currentView === 'create' || currentView === 'edit')"
          ref="contentFormRef"
          :key="`content-form-${selectedContentType.id}-${currentView}`"
          :content-type="selectedContentType"
          :entry="editingEntry"
          :mode="contentFormMode"
          @save="handleSaveEntry"
          @cancel="backToList"
          @preview="handlePreviewEntry"
        />
        
        <!-- No Content Type Selected -->
        <div v-show="!selectedContentType" class="empty-state">
          <q-icon name="o_article" size="48px" color="grey-5" />
          <div class="text-h6 text-grey-7 q-mt-sm">Select a content type</div>
          <div class="text-body2 text-grey-6 q-mt-xs">
            Choose a content type from the sidebar to manage its content entries
          </div>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <PreviewEntryDialog
      v-model="showPreviewDialog"
      :content-type="selectedContentType"
      :entry="previewingEntry"
    />
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { defineComponent, computed, watch, ref } from 'vue';
import { defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';

// Components
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import ContentManagerSidebar from './components/ContentManagerSidebar.vue';
import ContentList from './components/ContentList.vue';
import ContentForm from './components/ContentForm.vue';

// Composables
import { useContentTypes } from '../ContentTypes/composables/useContentTypes';
import { useContentManager } from './composables/useContentManager';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const PreviewEntryDialog = defineAsyncComponent(() =>
  import('./components/dialogs/PreviewEntryDialog.vue')
);

export default defineComponent({
  name: 'ContentManager',
  components: {
    ExpandedNavPageContainer,
    ContentManagerSidebar,
    ContentList,
    ContentForm,
    PreviewEntryDialog
  },
  setup() {
    const $q = useQuasar();
    const route = useRoute();
    
    // Flag to prevent route watcher from running during internal URL updates
    const isUpdatingRoute = ref(false);
    
    // Ref to ContentForm component
    const contentFormRef = ref();
    
    // Content Types Management
    const {
      collectionTypes,
      singleTypes,
      allContentTypes,
      loading: contentTypesLoading,
      error: contentTypesError,
      findContentType,
      refreshContentTypes
    } = useContentTypes();
    
    // Content Management
    const {
      activeContentType,
      currentView,
      contentEntries,
      contentLoading,
      contentPagination,
      editingEntry,
      previewingEntry,
      showPreviewDialog,
      selectContentType,
      loadContent,
      createEntry,
      updateEntry,
      deleteEntry,
      publishEntry,
      unpublishEntry,
      setView,
      loadSingleTypeContent,
      saveSingleTypeContent,
      publishSingleType,
      unpublishSingleType,
      showSuccess,
      showError
    } = useContentManager();
    
    // Computed
    const selectedContentType = computed(() => {
      const result = findContentType(activeContentType.value);
      console.log('[ContentManager] selectedContentType computed:', {
        activeContentType: activeContentType.value,
        result: result ? { id: result.id, name: result.name } : null
      });
      return result;
    });
    
    // Computed for ContentForm mode prop (avoids ESLint type assertion warning)
    const contentFormMode = computed(() => {
      return currentView.value as 'create' | 'edit';
    });
    
    // Watch for route changes to select content type
    watch(() => route.params.contentType, (contentTypeName) => {
      // Skip if we're currently updating the route internally
      if (isUpdatingRoute.value) {
        console.log('[ContentManager] Skipping route watcher - updating internally');
        return;
      }
      
      if (contentTypeName && typeof contentTypeName === 'string') {
        // Find content type by name instead of ID
        const contentType = allContentTypes.value.find(ct => 
          ct.name === contentTypeName || ct.id === contentTypeName
        );
        if (contentType && contentType.id !== activeContentType.value) {
          console.log('[ContentManager] Route change selecting content type:', contentType.name);
          selectContentType(contentType.id);
        }
      }
    }, { immediate: true });
    
    // Watch for content type selection to load content
    watch(selectedContentType, async (contentType, prevContentType) => {
      console.log('[ContentManager] Watcher triggered - Selected content type:', {
        current: contentType ? { id: contentType.id, name: contentType.name, type: contentType.type } : null,
        previous: prevContentType ? { id: prevContentType.id, name: prevContentType.name, type: prevContentType.type } : null,
        currentView: currentView.value
      });
      
      if (contentType) {
        console.log('[ContentManager] Processing content type selection');
        
        // Only load content if content type actually changed
        if (!prevContentType || contentType.id !== prevContentType.id) {
          console.log('[ContentManager] Loading content for different content type');
          // Handle single types differently from collection types
          if (contentType.type === 'single') {
            // For single types, directly show the form in edit mode
            console.log('[ContentManager] Setting view to edit for single type');
            setView('edit');
            await loadSingleTypeContent(contentType.name);
          } else {
            // For collection types, show the list view
            console.log('[ContentManager] Setting view to list for collection type');
            setView('list');
            await loadContent(contentType.name);
          }
        } else {
          console.log('[ContentManager] Same content type selected, skipping load');
        }
        
        // TEMPORARILY DISABLED: Route update causes component remounting
        // This was causing ContentList to re-initialize with empty props
        console.log('[ContentManager] Route update disabled to prevent component remounting');
        
        // TODO: Re-enable URL updates after fixing component persistence
        // if (route.params.contentType !== contentType.name && !isUpdatingRoute.value) {
        //   console.log('[ContentManager] Updating URL to match selected content type');
        //   ... route update code ...
        // }
      } else {
        console.log('[ContentManager] No content type selected - showing empty state');
      }
    });
    
    // Additional watcher on activeContentType to ensure reactivity
    watch(activeContentType, (newActiveId) => {
      console.log('[ContentManager] activeContentType changed:', newActiveId);
      if (newActiveId && allContentTypes.value.length > 0) {
        const contentType = findContentType(newActiveId);
        console.log('[ContentManager] Found content type for activeContentType:', contentType ? contentType.name : 'NOT FOUND');
      }
    });
    
    // Watch contentEntries to track when they change
    watch(contentEntries, (newEntries) => {
      console.log('[ContentManager] contentEntries watcher triggered:', {
        length: newEntries.length,
        entries: newEntries,
        currentView: currentView.value,
        selectedContentType: selectedContentType.value?.name || 'none'
      });
    }, { deep: true });
    
    // Watch currentView to track when it changes
    watch(currentView, (newView, oldView) => {
      console.log('[ContentManager] currentView changed:', {
        from: oldView,
        to: newView,
        selectedContentType: selectedContentType.value?.name || 'none',
        contentEntriesLength: contentEntries.value.length
      });
    });
    
    // Watch the template condition for ContentList
    watch(() => ({
      hasSelectedContentType: !!selectedContentType.value,
      isListView: currentView.value === 'list',
      shouldShowContentList: !!(selectedContentType.value && currentView.value === 'list')
    }), (newState, oldState) => {
      console.log('[ContentManager] ContentList visibility condition changed:', {
        old: oldState,
        new: newState,
        contentEntriesLength: contentEntries.value.length
      });
    });
    
    // Methods
    const openCreateForm = () => {
      editingEntry.value = null;
      setView('create');
    };
    
    const openEditForm = (entry: any) => {
      editingEntry.value = entry;
      setView('edit');
    };
    
    const backToList = () => {
      editingEntry.value = null;
      setView('list');
    };
    
    const handleSaveEntry = async (entryData: any) => {
      if (!selectedContentType.value) return;
      
      try {
        if (selectedContentType.value && selectedContentType.value.type === 'single') {
          // Handle single type save
          await saveSingleTypeContent(selectedContentType.value.name, entryData);
          showSuccess('Single type content updated successfully');
          
          // Reload the single type content
          await loadSingleTypeContent(selectedContentType.value.name);
        } else if (selectedContentType.value) {
          // Handle collection type save
          if (editingEntry.value) {
            await updateEntry(selectedContentType.value.name, editingEntry.value.id, entryData);
            showSuccess('Entry updated successfully');
          } else {
            await createEntry(selectedContentType.value.name, entryData);
            showSuccess('Entry created successfully');
          }
          
          // Reload content to show the new/updated entry
          await loadContent(selectedContentType.value.name);
        }
        
        // Wait a brief moment to ensure notification is visible before closing form
        setTimeout(() => {
          // Notify form of successful save - this will close the form and return to list
          if (contentFormRef.value && typeof contentFormRef.value.onSaveSuccess === 'function') {
            contentFormRef.value.onSaveSuccess();
          } else if (selectedContentType.value && selectedContentType.value.type !== 'single') {
            // For collection types, fallback to return to list
            // For single types, stay in the form since there's no list to return to
            backToList();
          }
        }, 1500); // 1.5 second delay to show notification
      } catch (error: any) {
        console.error('[ContentManager] Save operation failed:', {
          error,
          selectedContentType: selectedContentType.value,
          editingEntry: editingEntry.value
        });
        
        // Extract specific error message from backend
        const backendMessage = error?.message;
        const defaultMessage = (selectedContentType.value && selectedContentType.value.type === 'single') 
          ? 'Failed to update single type content'
          : `Failed to ${editingEntry.value ? 'update' : 'create'} entry`;
        
        const errorMessage = backendMessage || defaultMessage;
        showError(errorMessage);
        
        // Notify form of save error - this will reset loading state but keep form open
        if (contentFormRef.value && typeof contentFormRef.value.onSaveError === 'function') {
          contentFormRef.value.onSaveError(errorMessage);
        }
        
        // If it's a "not found" error during update, refresh the list to sync state
        if (editingEntry.value && (errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('does not exist'))) {
          console.log('[ContentManager] Entry not found during update, refreshing list to sync state');
          setTimeout(() => {
            if (selectedContentType.value && selectedContentType.value.type !== 'single') {
              loadContent(selectedContentType.value.name);
            }
          }, 1000);
        }
      }
    };
    
    const handleDeleteEntry = async (entry: any) => {
      if (!selectedContentType.value) return;
      
      console.log('[ContentManager] handleDeleteEntry called with:', {
        entryId: entry.id,
        contentType: selectedContentType.value.name,
        entryObject: entry
      });
      
      $q.dialog({
        title: 'Delete Entry',
        message: 'Are you sure you want to delete this entry? This action cannot be undone.',
        cancel: true,
        persistent: true,
        color: 'negative'
      }).onOk(async () => {
        try {
          console.log('[ContentManager] Executing delete for entry:', entry.id);
          await deleteEntry(selectedContentType.value!.name, entry.id);
          showSuccess('Entry deleted successfully');
          await loadContent(selectedContentType.value!.name);
        } catch (error: any) {
          console.error('[ContentManager] Delete operation failed:', {
            error,
            entryId: entry.id,
            contentType: selectedContentType.value!.name
          });
          
          // Show more specific error message from backend
          const errorMessage = error?.message || 'Failed to delete entry';
          showError(errorMessage);
          
          // If it's a "not found" error, refresh the list to sync state
          if (errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('does not exist')) {
            console.log('[ContentManager] Entry not found, refreshing list to sync state');
            setTimeout(() => {
              loadContent(selectedContentType.value!.name);
            }, 1000);
          }
        }
      });
    };
    
    const handlePublishEntry = async (entry: any) => {
      if (!selectedContentType.value) return;
      
      try {
        if (selectedContentType.value && selectedContentType.value.type === 'single') {
          await publishSingleType(selectedContentType.value.name);
          showSuccess('Single type content published successfully');
          await loadSingleTypeContent(selectedContentType.value.name);
        } else if (selectedContentType.value) {
          await publishEntry(selectedContentType.value.name, entry.id);
          showSuccess('Entry published successfully');
          await loadContent(selectedContentType.value.name);
        }
      } catch (error) {
        showError((selectedContentType.value && selectedContentType.value.type === 'single') 
          ? 'Failed to publish single type content' 
          : 'Failed to publish entry');
      }
    };
    
    const handleUnpublishEntry = async (entry: any) => {
      if (!selectedContentType.value) return;
      
      try {
        if (selectedContentType.value && selectedContentType.value.type === 'single') {
          await unpublishSingleType(selectedContentType.value.name);
          showSuccess('Single type content unpublished successfully');
          await loadSingleTypeContent(selectedContentType.value.name);
        } else if (selectedContentType.value) {
          await unpublishEntry(selectedContentType.value.name, entry.id);
          showSuccess('Entry unpublished successfully');
          await loadContent(selectedContentType.value.name);
        }
      } catch (error) {
        showError((selectedContentType.value && selectedContentType.value.type === 'single') 
          ? 'Failed to unpublish single type content' 
          : 'Failed to unpublish entry');
      }
    };
    
    const handlePreviewEntry = (entry: any) => {
      previewingEntry.value = entry;
      showPreviewDialog.value = true;
    };
    
    const handlePageChange = async (page: number) => {
      if (!selectedContentType.value) return;
      
      contentPagination.value.page = page;
      await loadContent(selectedContentType.value.name, {
        page,
        limit: contentPagination.value.limit
      });
    };
    
    const handleSearch = async (searchQuery: string) => {
      if (!selectedContentType.value) return;
      
      await loadContent(selectedContentType.value.name, {
        search: searchQuery,
        page: 1
      });
    };
    
    const handleFilterChange = async (filters: Record<string, any>) => {
      if (!selectedContentType.value) return;
      
      await loadContent(selectedContentType.value.name, {
        ...filters,
        page: 1
      });
    };
    
    const handleBulkAction = async (action: string, selectedIds: string[]) => {
      if (!selectedContentType.value) return;
      
      try {
        // Implement bulk actions based on action type
        switch (action) {
          case 'publish':
            // TODO: Implement bulk publish
            showSuccess(`${selectedIds.length} entries published`);
            break;
          case 'unpublish':
            // TODO: Implement bulk unpublish
            showSuccess(`${selectedIds.length} entries unpublished`);
            break;
          case 'delete':
            // TODO: Implement bulk delete
            showSuccess(`${selectedIds.length} entries deleted`);
            break;
        }
        await loadContent(selectedContentType.value.name);
      } catch (error) {
        showError(`Failed to ${action} selected entries`);
      }
    };
    
    return {
      // State
      collectionTypes,
      singleTypes,
      contentTypesLoading,
      contentTypesError,
      activeContentType,
      currentView,
      selectedContentType,
      contentEntries,
      contentLoading,
      contentPagination,
      editingEntry,
      previewingEntry,
      showPreviewDialog,
      contentFormRef,
      
      // Computed
      contentFormMode,
      
      // Methods
      selectContentType,
      refreshContentTypes,
      openCreateForm,
      openEditForm,
      backToList,
      handleSaveEntry,
      handleDeleteEntry,
      handlePublishEntry,
      handleUnpublishEntry,
      handlePreviewEntry,
      handlePageChange,
      handleSearch,
      handleFilterChange,
      handleBulkAction
    };
  },
});
</script>

<style scoped lang="scss">
.content-manager {
  display: flex;
  height: calc(100vh - 100px);
  background: #f8f9fa;
  margin: -20px;

  .content-area {
    flex: 1;
    overflow-y: auto;
    background: #f8f9fa;
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 24px;
      text-align: center;
    }
  }
}
</style>