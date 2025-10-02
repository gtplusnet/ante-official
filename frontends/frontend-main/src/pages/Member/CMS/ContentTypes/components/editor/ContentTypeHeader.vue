<template>
  <div class="content-header">
    <div class="content-title">{{ title }}</div>
    <div class="content-actions">
      <q-btn
        outline
        label="Preview Form"
        icon="o_visibility"
        no-caps
        color="primary"
        @click="$emit('preview')"
        style="border-radius: 20px; height: 36px; font-weight: 500; letter-spacing: 0.02em; padding: 0 16px"
      />
      
      <q-btn
        outline
        label="Add"
        icon="o_add"
        no-caps
        color="secondary"
        @click="$emit('add-field')"
        style="border-radius: 20px; height: 36px; font-weight: 500; letter-spacing: 0.02em; padding: 0 16px"
      />
      
      
      <q-btn
        flat
        round
        dense
        icon="more_vert"
        color="grey-7"
        size="sm"
      >
        <q-menu auto-close anchor="bottom end" self="top end">
          <q-list class="text-label-medium">
            <q-item clickable @click="handleEdit">
              <q-item-section avatar>
                <q-icon name="o_edit" size="18px" />
              </q-item-section>
              <q-item-section>Edit Content Type</q-item-section>
            </q-item>
            <q-item clickable @click="handleDelete" class="text-orange">
              <q-item-section avatar>
                <q-icon name="o_archive" size="18px" />
              </q-item-section>
              <q-item-section>Archive Content Type</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ContentTypeHeader',
  props: {
    title: {
      type: String,
      required: true
    }
  },
  emits: ['preview', 'add-field', 'edit', 'delete'],
  setup(props, { emit }) {
    const handleEdit = () => {
      emit('edit');
    };
    
    const handleDelete = () => {
      emit('delete');
    };
    
    return {
      handleEdit,
      handleDelete
    };
  }
});
</script>

<style scoped lang="scss">
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  border-bottom: 1px solid #e0e0e0;
  background: #ffffff;
  min-height: 65px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .content-title {
    font-size: 20px;
    font-weight: 500;
    color: #1a1a1a;
    margin: 0;
    letter-spacing: 0.01em;
  }

  .content-actions {
    display: flex;
    gap: 8px;
    align-items: center;

    .q-btn {
      font-weight: 500;
      transition: all 0.2s ease;
      
      &:not(.q-btn--outline):not(:disabled) {
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        
        &:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
        }
      }
      
      &.q-btn--outline {
        border-width: 1px;
        
        &:hover {
          background: rgba(25, 118, 210, 0.08);
        }
      }
    }
  }
}</style>
