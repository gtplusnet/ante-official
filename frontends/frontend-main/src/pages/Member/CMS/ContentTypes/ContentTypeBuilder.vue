<template>
  <expanded-nav-page-container>
    <div class="content-type-builder">
      <!-- Left Sidebar -->
      <ContentTypeSidebar
        :collection-types="collectionTypes"
        :single-types="singleTypes"
        :components="components"
        :active-content-type="activeContentType"
        :loading="contentTypesLoading"
        :error="contentTypesError"
        :show-archived="true"
        @select-content-type="handleSelectContentType"
        @create-content-type="openCreateDialog"
        @edit-content-type="handleSidebarEditContentType"
        @delete-content-type="handleSidebarDeleteContentType"
        @restore-content-type="handleRestoreContentType"
      />

      <!-- Main Content Area -->
      <div class="content-area">
        <ContentTypeEditor
          v-if="selectedContentType"
          :content-type="selectedContentType"
          :loading="fieldOperationLoading"
          @preview="() => openPreviewDialog(selectedContentType)"
          @add-field="openAddFieldDialog"
          @edit-field="editField"
          @delete-field="deleteField"
          @edit="openEditDialog"
          @delete="confirmDeleteContentType"
          @update:content-type="handleContentTypeUpdate"
        />
        
        <!-- No Content Type Selected -->
        <div v-else class="empty-state">
          <q-icon name="o_widgets" size="48px" color="grey-5" />
          <div class="text-h6 text-grey-7 q-mt-sm">Select a content type</div>
          <div class="text-body2 text-grey-6 q-mt-xs">
            Choose a content type from the sidebar to start editing its structure
          </div>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <CreateContentTypeDialog
      v-model="showCreateDialog"
      :content-type="createTypeMode"
      @create="handleCreateContentType"
    />

    <EditContentTypeDialog
      v-model="showEditDialog"
      :content-type="selectedContentType"
      @update="handleUpdateContentType"
    />

    <AddEditFieldDialog
      v-model="showFieldDialog"
      :field="editingField"
      :available-content-types="availableContentTypes"
      :content-type-id="selectedContentType?.id || ''"
      @save="handleSaveField"
    />
    
    <PreviewFormDialog
      v-model="showPreviewDialog"
      :content-type="selectedContentType"
      :all-content-types="allContentTypes"
      :components="components"
    />
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { defineAsyncComponent } from 'vue';
import { useQuasar } from 'quasar';
import type { Field } from '@components/shared/cms/types/content-type';

// Components
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import ContentTypeSidebar from './components/sidebar/ContentTypeSidebar.vue';
import ContentTypeEditor from './components/editor/ContentTypeEditor.vue';

// Composables
import { useContentTypes } from './composables/useContentTypes';
import { useFieldManagement } from './composables/useFieldManagement';
import { useContentTypeBuilder } from './composables/useContentTypeBuilder';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const CreateContentTypeDialog = defineAsyncComponent(() =>
  import('./components/dialogs/CreateContentTypeDialog.vue')
);
const EditContentTypeDialog = defineAsyncComponent(() =>
  import('./components/dialogs/EditContentTypeDialog.vue')
);
const AddEditFieldDialog = defineAsyncComponent(() =>
  import('./components/dialogs/AddEditFieldDialog.vue')
);
const PreviewFormDialog = defineAsyncComponent(() =>
  import('./components/dialogs/PreviewFormDialog.vue')
);

export default defineComponent({
  name: 'ContentTypeBuilder',
  components: {
    ExpandedNavPageContainer,
    ContentTypeSidebar,
    ContentTypeEditor,
    CreateContentTypeDialog,
    EditContentTypeDialog,
    AddEditFieldDialog,
    PreviewFormDialog
  },
  setup() {
    const $q = useQuasar();
    
    // Use composables
    const {
      collectionTypes,
      singleTypes,
      components,
      allContentTypes,
      availableContentTypes,
      loading: contentTypesLoading,
      error: contentTypesError,
      findContentType,
      createContentType,
      updateContentType,
      updateContentTypeInLocalState,
      deleteContentType,
      restoreContentType,
      refreshSingleContentType
    } = useContentTypes();
    
    const {
      deleteFieldWithConfirm
    } = useFieldManagement();
    
    const {
      activeContentType,
      showCreateDialog,
      showFieldDialog,
      showPreviewDialog,
      createTypeMode,
      selectContentType,
      openCreateDialog,
      openPreviewDialog,
      showSuccess,
      showError,
      addFieldToContentType,
      updateField,
      deleteField: deleteFieldFromContentType
    } = useContentTypeBuilder();
    
    // Local state
    const editingField = ref<Field | null>(null);
    const showAddFieldDialog = ref(false);
    const showEditDialog = ref(false);
    const fieldOperationLoading = ref(false);
    
    // Computed
    const selectedContentType = computed(() => {
      return findContentType(activeContentType.value);
    });
    
    // Methods
    const openAddFieldDialog = () => {
      editingField.value = null;
      showAddFieldDialog.value = true;
      showFieldDialog.value = true;
    };
    
    const editField = (field: Field) => {
      editingField.value = field;
      showFieldDialog.value = true;
    };
    
    const deleteField = (field: Field) => {
      deleteFieldWithConfirm(field, async () => {
        if (selectedContentType.value) {
          fieldOperationLoading.value = true;
          
          // Store original field for potential rollback
          const fieldToDelete = { ...field };
          const originalFieldIndex = selectedContentType.value.fields.findIndex(f => f.id === field.id);
          
          if (originalFieldIndex === -1) {
            showError('Field not found');
            fieldOperationLoading.value = false;
            return;
          }
          
          // OPTIMISTIC UPDATE: Immediately remove from UI
          selectedContentType.value.fields.splice(originalFieldIndex, 1);
          console.log('[CMS DEBUG] Field removed from UI immediately (optimistic update)');
          
          try {
            // Use proper field deletion endpoint
            const updatedContentType = await deleteFieldFromContentType(selectedContentType.value.id, field.id.toString(), field.name);
            showSuccess('Field deleted successfully');
            
            // Confirm with fresh data from backend
            if (updatedContentType) {
              await refreshSingleContentType(selectedContentType.value.id);
              console.log('[CMS DEBUG] Content type refreshed from backend after field deletion');
            }
            
          } catch (error) {
            console.error('[CMS DEBUG] Field deletion failed:', error);
            
            // ROLLBACK: Restore field to original position
            selectedContentType.value.fields.splice(originalFieldIndex, 0, fieldToDelete);
            console.log('[CMS DEBUG] Field deletion rolled back due to API failure');
            
            showError('Failed to delete field');
          } finally {
            fieldOperationLoading.value = false;
          }
        }
      });
    };
    
    const handleContentTypeUpdate = async (updatedContentType: any) => {
      console.log('[CMS DEBUG] Content type update requested:', {
        id: updatedContentType.id,
        fieldsCount: updatedContentType.fields?.length,
        updateType: 'likely field reorder'
      });
      
      // OPTIMISTIC UPDATE: Update local state immediately
      updateContentTypeInLocalState(updatedContentType);
      console.log('[CMS DEBUG] Local state updated immediately (optimistic update)');
      
      // Skip API call for field reorder - the individual operations already handle backend sync
      // Field reordering is handled by ContentTypeFieldsGrid which calls the reorderFields API
      console.log('[CMS DEBUG] Skipping API call - using optimistic update only');
    };
    
    const handleCreateContentType = async (data: any) => {
      try {
        const newType = await createContentType(data.type, {
          ...data,
          fields: []
        });
        if (newType) {
          selectContentType(newType.id);
          showSuccess('Content type created successfully');
        }
      } catch (error) {
        showError('Failed to create content type');
      }
    };
    
    const handleSaveField = async (field: Field) => {
      if (!selectedContentType.value) return;
      
      fieldOperationLoading.value = true;
      
      try {
        let updatedContentType;
        
        if (editingField.value) {
          // UPDATE EXISTING FIELD
          const originalFieldIndex = selectedContentType.value.fields.findIndex(f => f.id === editingField.value!.id);
          const originalField = originalFieldIndex > -1 ? { ...selectedContentType.value.fields[originalFieldIndex] } : null;
          
          // OPTIMISTIC UPDATE: Immediately update field in UI
          if (originalFieldIndex > -1) {
            selectedContentType.value.fields[originalFieldIndex] = { ...selectedContentType.value.fields[originalFieldIndex], ...field };
            console.log('[CMS DEBUG] Field updated in UI immediately (optimistic update)');
          }
          
          try {
            updatedContentType = await updateField(selectedContentType.value.id, editingField.value.id.toString(), field);
            showSuccess('Field updated successfully');
          } catch (error) {
            // ROLLBACK: Restore original field
            if (originalFieldIndex > -1 && originalField) {
              selectedContentType.value.fields[originalFieldIndex] = originalField;
              console.log('[CMS DEBUG] Field update rolled back due to API failure');
            }
            throw error;
          }
        } else {
          // ADD NEW FIELD
          const tempId = `temp_${Date.now()}_${Math.random()}`;
          const tempField = { ...field, id: tempId, _id: tempId };
          
          // OPTIMISTIC UPDATE: Immediately add field to UI
          selectedContentType.value.fields.push(tempField);
          console.log('[CMS DEBUG] Field added to UI immediately (optimistic update)');
          
          try {
            updatedContentType = await addFieldToContentType(selectedContentType.value.id, field);
            showSuccess('Field added successfully');
          } catch (error) {
            // ROLLBACK: Remove temporary field
            const tempFieldIndex = selectedContentType.value.fields.findIndex(f => f.id === tempId);
            if (tempFieldIndex > -1) {
              selectedContentType.value.fields.splice(tempFieldIndex, 1);
              console.log('[CMS DEBUG] Field addition rolled back due to API failure');
            }
            throw error;
          }
        }
        
        // Confirm with fresh data from backend (this will replace temp field with real one)
        if (updatedContentType) {
          await refreshSingleContentType(selectedContentType.value.id);
          console.log('[CMS DEBUG] Content type refreshed from backend after field operation');
        }
        
        editingField.value = null;
        
      } catch (error) {
        console.error('[CMS DEBUG] Field operation failed:', error);
        showError(`Failed to ${editingField.value ? 'update' : 'add'} field`);
      } finally {
        fieldOperationLoading.value = false;
      }
    };
    
    const openEditDialog = () => {
      if (!selectedContentType.value) return;
      showEditDialog.value = true;
    };
    
    const handleUpdateContentType = async (updateData: any) => {
      try {
        await updateContentType(updateData.id, updateData);
        showSuccess('Content type updated successfully');
        showEditDialog.value = false;
      } catch (error) {
        showError('Failed to update content type');
      }
    };
    
    const confirmDeleteContentType = () => {
      if (!selectedContentType.value) return;
      
      $q.dialog({
        title: 'Archive Content Type',
        message: `Are you sure you want to archive "${selectedContentType.value.displayName || selectedContentType.value.name}"? This will hide the content type from the interface, but all data will be preserved and can be restored by an administrator if needed.`,
        cancel: true,
        persistent: true,
        color: 'warning',
        ok: {
          label: 'Archive',
          color: 'warning'
        }
      }).onOk(async () => {
        await handleDeleteContentType();
      });
    };
    
    const handleDeleteContentType = async () => {
      if (!selectedContentType.value) return;
      
      try {
        await deleteContentType(selectedContentType.value.id);
        showSuccess('Content type archived successfully');
        
        // Clear selection after deletion
        selectContentType('');
      } catch (error) {
        showError('Failed to archive content type');
      }
    };
    
    const handleSidebarEditContentType = (contentType: any) => {
      // Select the content type first, then open edit dialog
      selectContentType(contentType.id);
      setTimeout(() => {
        showEditDialog.value = true;
      }, 100);
    };
    
    const handleSidebarDeleteContentType = (contentType: any) => {
      // Select the content type first, then confirm delete
      selectContentType(contentType.id);
      setTimeout(() => {
        confirmDeleteContentType();
      }, 100);
    };
    
    
    const handleRestoreContentType = async (contentType: any) => {
      try {
        await restoreContentType(contentType.id);
        showSuccess(`Content type "${contentType.displayName || contentType.name}" restored successfully`);
      } catch (error) {
        showError('Failed to restore content type');
      }
    };
    
    const handleSelectContentType = async (id: string) => {
      console.log('[CMS DEBUG] Selecting content type:', id);
      selectContentType(id);
      
      // Force refresh the content type to get latest fields
      if (id) {
        try {
          await refreshSingleContentType(id);
          console.log('[CMS DEBUG] Content type refreshed after selection');
        } catch (error) {
          console.error('[CMS DEBUG] Failed to refresh content type on selection:', error);
        }
      }
    };
    
    return {
      // State
      collectionTypes,
      singleTypes,
      components,
      allContentTypes,
      availableContentTypes,
      activeContentType,
      showCreateDialog,
      showEditDialog,
      showFieldDialog,
      showPreviewDialog,
      showAddFieldDialog,
      createTypeMode,
      editingField,
      selectedContentType,
      contentTypesLoading,
      contentTypesError,
      fieldOperationLoading,
      
      // Methods
      selectContentType,
      handleSelectContentType,
      openCreateDialog,
      openEditDialog,
      openPreviewDialog,
      openAddFieldDialog,
      editField,
      deleteField,
      handleContentTypeUpdate,
      handleCreateContentType,
      handleUpdateContentType,
      confirmDeleteContentType,
      handleSidebarEditContentType,
      handleSidebarDeleteContentType,
      handleRestoreContentType,
      handleSaveField
    };
  },
});
</script>

<style scoped lang="scss">
.content-type-builder {
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