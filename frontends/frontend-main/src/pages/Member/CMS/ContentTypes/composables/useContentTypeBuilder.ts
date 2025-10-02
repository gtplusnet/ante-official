import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { CMSContentTypesService, type CreateContentTypeDto } from 'src/services/cms-content-types.service';
import type { ContentType, Field } from '@components/shared/cms/types/content-type';

export function useContentTypeBuilder() {
  const $q = useQuasar();

  // Main state
  const searchQuery = ref('');
  const activeContentType = ref('');
  
  // Dialog states
  const showCreateDialog = ref(false);
  const showFieldDialog = ref(false);
  const showAddFieldDialog = ref(false);
  const showPreviewDialog = ref(false);
  
  // Form states
  const createTypeMode = ref<'collection' | 'single' | 'component'>('collection');
  const createStep = ref(1);
  const fieldConfigTab = ref('basic');
  const configViewTab = ref('list');
  
  // Expansion states
  const expandedSections = ref({
    collection: true,
    single: false,
    components: false,
  });

  // New content type form
  const newContentType = ref({
    displayName: '',
    singularName: '',
    pluralName: '',
    category: '',
    draftPublish: false,
    internationalization: false,
  });

  // Methods
  const selectContentType = (id: string | number) => {
    console.log('[CMS DEBUG] selectContentType called with ID:', id, 'type:', typeof id);
    activeContentType.value = String(id);
    console.log('[CMS DEBUG] activeContentType set to:', activeContentType.value);
  };

  const resetNewContentTypeForm = () => {
    newContentType.value = {
      displayName: '',
      singularName: '',
      pluralName: '',
      category: '',
      draftPublish: false,
      internationalization: false,
    };
    createStep.value = 1;
  };

  const openCreateDialog = (type: 'collection' | 'single' | 'component') => {
    createTypeMode.value = type;
    resetNewContentTypeForm();
    showCreateDialog.value = true;
  };

  const closeCreateDialog = () => {
    showCreateDialog.value = false;
    resetNewContentTypeForm();
  };

  const openFieldDialog = () => {
    fieldConfigTab.value = 'basic';
    showFieldDialog.value = true;
  };

  const closeFieldDialog = () => {
    showFieldDialog.value = false;
    showAddFieldDialog.value = false;
  };

  const openPreviewDialog = (contentType?: any) => {
    if (!contentType) {
      $q.notify({
        type: 'warning',
        message: 'Please select a content type to preview',
      });
      return;
    }
    showPreviewDialog.value = true;
  };

  const closePreviewDialog = () => {
    showPreviewDialog.value = false;
  };


  const createContentType = async (data: CreateContentTypeDto): Promise<ContentType | null> => {
    try {
      const contentType = await CMSContentTypesService.create(data);
      
      $q.notify({
        type: 'positive',
        message: `${data.displayName} created successfully`,
      });
      
      return contentType;
    } catch (error) {
      console.error('Failed to create content type:', error);
      $q.notify({
        type: 'negative',
        message: 'Failed to create content type',
      });
      return null;
    }
  };

  const deleteContentType = async (id: string, name: string): Promise<boolean> => {
    return new Promise((resolve) => {
      $q.dialog({
        title: 'Delete Content Type',
        message: `Are you sure you want to delete "${name}"? This action cannot be undone and will delete all associated content.`,
        cancel: true,
        persistent: true,
        color: 'negative'
      }).onOk(async () => {
        try {
          await CMSContentTypesService.delete(id);
          
          $q.notify({
            type: 'positive',
            message: `${name} deleted successfully`,
          });
          
          resolve(true);
        } catch (error) {
          console.error('Failed to delete content type:', error);
          $q.notify({
            type: 'negative',
            message: 'Failed to delete content type',
          });
          resolve(false);
        }
      }).onCancel(() => {
        resolve(false);
      });
    });
  };

  const addFieldToContentType = async (contentTypeId: string, field: Field): Promise<ContentType | null> => {
    try {
      const updatedContentType = await CMSContentTypesService.addField(contentTypeId, field);
      
      $q.notify({
        type: 'positive',
        message: 'Field added successfully',
      });
      
      return updatedContentType;
    } catch (error) {
      console.error('Failed to add field:', error);
      $q.notify({
        type: 'negative',
        message: 'Failed to add field',
      });
      return null;
    }
  };

  const updateField = async (contentTypeId: string, fieldId: string, field: Partial<Field>): Promise<ContentType | null> => {
    try {
      const updatedContentType = await CMSContentTypesService.updateField(contentTypeId, fieldId, field);
      
      $q.notify({
        type: 'positive',
        message: 'Field updated successfully',
      });
      
      return updatedContentType;
    } catch (error) {
      console.error('Failed to update field:', error);
      $q.notify({
        type: 'negative',
        message: 'Failed to update field',
      });
      return null;
    }
  };

  const deleteField = async (contentTypeId: string, fieldId: string, fieldName: string): Promise<ContentType | null> => {
    return new Promise((resolve) => {
      $q.dialog({
        title: 'Delete Field',
        message: `Are you sure you want to delete the field "${fieldName}"? This action cannot be undone.`,
        cancel: true,
        persistent: true,
        color: 'negative'
      }).onOk(async () => {
        try {
          const updatedContentType = await CMSContentTypesService.deleteField(contentTypeId, fieldId);
          
          $q.notify({
            type: 'positive',
            message: 'Field deleted successfully',
          });
          
          resolve(updatedContentType);
        } catch (error) {
          console.error('Failed to delete field:', error);
          $q.notify({
            type: 'negative',
            message: 'Failed to delete field',
          });
          resolve(null);
        }
      }).onCancel(() => {
        resolve(null);
      });
    });
  };

  const reorderFields = async (contentTypeId: string, fieldIds: string[]): Promise<ContentType | null> => {
    try {
      const updatedContentType = await CMSContentTypesService.reorderFields(contentTypeId, fieldIds);
      
      $q.notify({
        type: 'positive',
        message: 'Fields reordered successfully',
      });
      
      return updatedContentType;
    } catch (error) {
      console.error('Failed to reorder fields:', error);
      $q.notify({
        type: 'negative',
        message: 'Failed to reorder fields',
      });
      return null;
    }
  };


  // Search filtering
  const filterBySearch = <T extends { name: string }>(items: T[], query?: string): T[] => {
    const searchTerm = query || searchQuery.value;
    if (!searchTerm) return items;
    return items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
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
    searchQuery,
    activeContentType,
    showCreateDialog,
    showFieldDialog,
    showAddFieldDialog,
    showPreviewDialog,
    createTypeMode,
    createStep,
    fieldConfigTab,
    configViewTab,
    expandedSections,
    newContentType,
    
    // Methods
    selectContentType,
    resetNewContentTypeForm,
    openCreateDialog,
    closeCreateDialog,
    openFieldDialog,
    closeFieldDialog,
    openPreviewDialog,
    closePreviewDialog,
    filterBySearch,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    
    // API Methods
    createContentType,
    deleteContentType,
    addFieldToContentType,
    updateField,
    deleteField,
    reorderFields
  };
}