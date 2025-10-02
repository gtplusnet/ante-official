<template>
  <draggable
    v-model="localFields"
    class="fields-grid-container"
    handle=".drag-handle"
    @start="handleDragStart"
    @end="handleDragEnd"
    item-key="id"
    :animation="0"
    ghost-class="ghost-preview"
    drag-class="dragging-item"
  >
    <template #item="{ element: field }">
      <ContentTypeFieldItem
        :field="field"
        @edit="$emit('edit-field', field)"
        @delete="$emit('delete-field', field)"
        @size-change="handleSizeChange"
      />
    </template>
    
    <!-- Empty State -->
    <template #footer>
      <div v-if="!localFields || localFields.length === 0" class="empty-fields">
        <q-icon name="o_dashboard_customize" size="32px" color="grey-5" />
        <div class="text-body1 text-grey-7 q-mt-sm">No fields yet</div>
        <div class="text-caption text-grey-6 q-mb-sm">
          Add your first field to start building your content structure
        </div>
        <q-btn
          unelevated
          dense
          label="Add your first field"
          icon="o_add"
          color="primary"
          size="md"
          @click="$emit('add-field')"
          style="border-radius: 20px; height: 36px; font-weight: 500; letter-spacing: 0.02em; padding: 0 16px"
        />
      </div>
    </template>
  </draggable>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType } from 'vue';
import { Notify } from 'quasar';
import draggable from 'vuedraggable';
import type { Field } from '@components/shared/cms/types/content-type';
import { CMSContentTypesService } from 'src/services/cms-content-types.service';
import { useFieldManagement } from '../../composables/useFieldManagement';
import ContentTypeFieldItem from './ContentTypeFieldItem.vue';

export default defineComponent({
  name: 'ContentTypeFieldsGrid',
  components: {
    draggable,
    ContentTypeFieldItem
  },
  props: {
    fields: {
      type: Array as PropType<Field[]>,
      default: () => []
    },
    contentTypeId: {
      type: String,
      required: true
    }
  },
  emits: ['update:fields', 'add-field', 'edit-field', 'delete-field'],
  setup(props, { emit }) {
    const { onDragStart, onDragEnd, setFieldSize } = useFieldManagement();

    // Create local copy to avoid direct prop mutation
    const localFields = ref<Field[]>([...props.fields]);
    
    // Watch for prop changes to sync
    watch(() => props.fields, (newFields) => {
      localFields.value = [...newFields];
    }, { deep: true });

    const handleDragStart = (event: any) => {
      onDragStart(event);
    };

    const handleDragEnd = async (event: any) => {
      onDragEnd(event);
      
      // Save the current order for potential rollback
      const previousFields = [...props.fields];
      
      // Update parent immediately for optimistic UI
      emit('update:fields', localFields.value);
      
      // Auto-save the new field order
      try {
        // Use all fields, prefer _id over id
        const fieldIds = localFields.value.map(field => {
          const fieldId = (field as any)._id || field.id;
          if (!fieldId) {
            console.warn('Field missing ID:', field);
          }
          return String(fieldId);
        }).filter(Boolean);
        
        if (fieldIds.length === 0) {
          console.warn('No valid field IDs found for reordering');
          // Revert to previous order
          localFields.value = [...previousFields];
          emit('update:fields', previousFields);
          return;
        }
        
        await CMSContentTypesService.reorderFields(props.contentTypeId, fieldIds);
        
        // Local state is already updated optimistically, no need to reload
      } catch (error) {
        console.error('Failed to reorder fields:', error);
        
        // Revert to previous order on error
        localFields.value = [...previousFields];
        emit('update:fields', previousFields);
        
        Notify.create({
          type: 'negative',
          message: 'Failed to save field order',
          timeout: 3000,
          position: 'top-right'
        });
      }
    };

    const handleSizeChange = async ({ field, size }: { field: Field; size: 'full' | 'half' | 'third' }) => {
      // Update field size locally first
      setFieldSize(field, size, async () => {
        // Auto-save the field size change only if field has a valid ID
        if (!field.id) {
          console.warn('Cannot save field size: field ID is undefined', field);
          return;
        }
        
        const fieldIdString = String(field.id);
        if (!fieldIdString || fieldIdString === 'undefined') {
          console.warn('Cannot save field size: field ID is invalid', { fieldId: field.id, field });
          return;
        }
        
        try {
          console.log('[CMS DEBUG] Attempting to update field:', {
            contentTypeId: props.contentTypeId,
            fieldId: field.id,
            fieldIdType: typeof field.id,
            field: field,
            requestedSize: size,
            fieldCurrentSize: field.size,
            updates: { ...field, size }
          });
          
          // Send complete field data to preserve all properties
          // Create a clean copy without internal IDs
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, _id, ...fieldDataWithoutIds } = field;
          const fieldToUpdate = {
            ...fieldDataWithoutIds,
            size // Update the size
          };
          
          console.log('[CMS DEBUG] Field data being sent to API:', {
            contentTypeId: props.contentTypeId,
            fieldId: fieldIdString,
            payload: fieldToUpdate,
            sizeInPayload: fieldToUpdate.size,
          });
          
          const response = await CMSContentTypesService.updateField(props.contentTypeId, fieldIdString, fieldToUpdate);
          
          console.log('[CMS DEBUG] API response received:', {
            responseStatus: 'success',
            returnedContentType: response ? 'received' : 'null',
            updatedFieldSize: response?.fields?.find(f => f.id === fieldIdString || f._id === fieldIdString)?.size,
          });
          
          // Size updated successfully, no notification needed
        } catch (error) {
          console.error('Failed to update field size:', error);
          console.error('Error details:', {
            contentTypeId: props.contentTypeId,
            fieldId: field.id,
            field: field,
            error: error
          });
          Notify.create({
            type: 'negative',
            message: 'Failed to save field size',
            timeout: 3000,
            position: 'top-right'
          });
        }
      });
    };

    return {
      localFields,
      handleDragStart,
      handleDragEnd,
      handleSizeChange
    };
  },
});
</script>

<style scoped lang="scss">
.fields-grid-container {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-content: flex-start;
  background: #f8f9fa;
  min-height: 200px;
  
  &.sortable-ghost {
    .field-item {
      opacity: 0.4;
    }
  }
  
  // Field item specific widths within grid
  :deep(.field-item) {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    position: relative;
    min-height: 60px;
    transition: width 0.4s ease, flex-basis 0.4s ease, background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
    box-sizing: border-box;
    
    &.size-full {
      flex-basis: 100%;
      width: 100%;
    }
    
    &.size-half {
      flex-basis: calc(66.666% - 8px);
      width: calc(66.666% - 8px);
    }
    
    &.size-third {
      flex-basis: calc(33.333% - 8px);
      width: calc(33.333% - 8px);
    }
    
    &.sortable-drag {
      opacity: 0;
    }
    
    // Dragging states
    &.dragging-item {
      opacity: 0.4;
      transform: scale(0.95);
    }
    
    &.ghost-preview {
      opacity: 0.3;
      border: 2px dashed #1976d2;
      background: #e3f2fd;
      transform: scale(0.98);
    }
    
    // Highlight when size is changing
    &.size-changing {
      background-color: #f0f8ff;
      border-color: #1976d2;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
      z-index: 10;
    }
    
    // Animation when dropped
    &.drop-animation {
      animation: dropInPlace 0.3s ease-out;
    }

    &:hover {
      border-color: #1976d2;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.15);

      .drag-handle {
        opacity: 1;
      }

      .field-actions {
        opacity: 1;
      }
    }
  }
}

.empty-fields {
  width: 100%;
  padding: 48px;
  text-align: center;
  background: white;
  border: 2px dashed #e0e0e0;
  border-radius: 12px;
  
  .q-btn {
    margin-top: 16px;
  }
}

// Styles for dragging
:deep(.dragging-item) {
  opacity: 0;
}

:deep(.ghost-preview) {
  opacity: 0.5;
  background: #f0f0f0;
  border: 2px dashed #1976d2;
  
  * {
    opacity: 0;
  }
}

// Drop animation
@keyframes dropInPlace {
  0% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  50% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}</style>
