<template>
  <div class="content-editor">
    <ContentTypeHeader
      :title="contentType.displayName || contentType.name"
      @preview="$emit('preview')"
      @add-field="$emit('add-field')"
      @edit="$emit('edit')"
      @delete="$emit('delete')"
    />
    
    <ContentTypeFieldsGrid
      :fields="contentType.fields"
      :content-type-id="contentType.id"
      :loading="loading"
      @update:fields="updateFields"
      @add-field="$emit('add-field')"
      @edit-field="$emit('edit-field', $event)"
      @delete-field="$emit('delete-field', $event)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { ContentType, Field } from '@components/shared/cms/types/content-type';
import ContentTypeHeader from './ContentTypeHeader.vue';
import ContentTypeFieldsGrid from './ContentTypeFieldsGrid.vue';

export default defineComponent({
  name: 'ContentTypeEditor',
  components: {
    ContentTypeHeader,
    ContentTypeFieldsGrid
  },
  props: {
    contentType: {
      type: Object as PropType<ContentType>,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['preview', 'add-field', 'edit-field', 'delete-field', 'edit', 'delete', 'update:contentType'],
  setup(props, { emit }) {
    const updateFields = (fields: Field[]) => {
      // Save previous state for potential rollback
      const previousFields = [...props.contentType.fields];
      
      try {
        const updatedContentType = {
          ...props.contentType,
          fields
        };
        emit('update:contentType', updatedContentType);
      } catch (error) {
        // Revert on error
        console.error('Failed to update fields:', error);
        emit('update:contentType', {
          ...props.contentType,
          fields: previousFields
        });
      }
    };

    return {
      updateFields
    };
  },
});
</script>

<style scoped lang="scss">
.content-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}</style>
