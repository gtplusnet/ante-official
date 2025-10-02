<template>
  <div class="field-item" :class="`size-${field.size || 'full'}`" :data-field-id="field._id || field.id">
    <div class="drag-handle">
      <q-icon name="o_drag_indicator" size="16px" />
    </div>
    
    <div class="field-icon">
      <q-avatar 
        :style="{ backgroundColor: getFieldColor(field.type) + '20' }"
        size="24px"
        text-color="white"
      >
        <q-icon 
          :name="getFieldIcon(field.type)" 
          :style="{ color: getFieldColor(field.type) }"
          size="16px"
        />
      </q-avatar>
    </div>

    <div class="field-details">
      <div class="field-name">{{ field.name || field.displayName || `Field ${field._id ? field._id.slice(-6) : (field.id || '').toString().slice(-6)}` }}</div>
      <div class="field-type">{{ getFieldTypeLabel(field.type) }}</div>
    </div>

    <div class="field-badges">
      <q-chip
        v-if="field.required"
        dense
        color="orange-2"
        text-color="orange-9"
        size="xs"
        style="border-radius: 8px; font-weight: 500; letter-spacing: 0.02em"
      >
        Required
      </q-chip>
      <q-chip
        v-if="field.unique"
        dense
        color="purple-2"
        text-color="purple-9"
        size="xs"
        style="border-radius: 8px; font-weight: 500; letter-spacing: 0.02em"
      >
        Unique
      </q-chip>
      <q-chip
        v-if="field.private"
        dense
        color="grey-3"
        text-color="grey-9"
        size="xs"
        style="border-radius: 8px; font-weight: 500; letter-spacing: 0.02em"
      >
        Private
      </q-chip>
    </div>

    <div class="field-actions">
      <!-- Size buttons -->
      <q-btn-group flat class="md3-btn-group">
        <q-btn
          flat
          dense
          size="xs"
          :color="field.size === 'third' ? 'primary' : 'grey'"
          @click="setFieldSize('third')"
          padding="4px 8px"
          style="border-radius: 12px 0 0 12px"
        >
          <div class="size-icon size-icon-third"></div>
          <q-tooltip>One Third Width</q-tooltip>
        </q-btn>
        <q-btn
          flat
          dense
          size="xs"
          :color="field.size === 'half' ? 'primary' : 'grey'"
          @click="setFieldSize('half')"
          padding="4px 8px"
          style="border-radius: 0"
        >
          <div class="size-icon size-icon-half"></div>
          <q-tooltip>Half Width</q-tooltip>
        </q-btn>
        <q-btn
          flat
          dense
          size="xs"
          :color="field.size === 'full' ? 'primary' : 'grey'"
          @click="setFieldSize('full')"
          padding="4px 8px"
          style="border-radius: 0 12px 12px 0"
        >
          <div class="size-icon size-icon-full"></div>
          <q-tooltip>Full Width</q-tooltip>
        </q-btn>
      </q-btn-group>
      
      <q-separator vertical class="q-mx-sm" />
      
      <q-btn
        flat
        dense
        round
        icon="o_edit"
        size="sm"
        @click="$emit('edit', field)"
        class="md3-icon-btn"
      >
        <q-tooltip>Edit field</q-tooltip>
      </q-btn>
      <q-btn
        flat
        dense
        round
        icon="o_delete"
        size="sm"
        @click="$emit('delete', field)"
        class="md3-icon-btn"
      >
        <q-tooltip>Delete field</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { Field } from '@components/shared/cms/types/content-type';
import { useFieldManagement } from '../../composables/useFieldManagement';

export default defineComponent({
  name: 'ContentTypeFieldItem',
  props: {
    field: {
      type: Object as PropType<Field>,
      required: true
    }
  },
  emits: ['edit', 'delete', 'size-change'],
  setup(props, { emit }) {
    const { getFieldIcon, getFieldColor, getFieldTypeLabel } = useFieldManagement();

    const setFieldSize = (size: 'full' | 'half' | 'third') => {
      if (props.field.size !== size) {
        emit('size-change', { field: props.field, size });
      }
    };

    return {
      getFieldIcon,
      getFieldColor,
      getFieldTypeLabel,
      setFieldSize
    };
  },
});
</script>

<style scoped lang="scss">
.field-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  gap: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: move;
  position: relative;
  
  // Grid sizing classes
  &.size-full {
    grid-column: span 12;
    width: 100%;
  }
  
  &.size-half {
    grid-column: span 6;
    width: calc(50% - 6px);
  }
  
  &.size-third {
    grid-column: span 4;
    width: calc(33.333% - 8px);
  }
  
  &:hover {
    border-color: #bdbdbd;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
    
    .drag-handle {
      opacity: 1;
    }
    
    .field-actions {
      opacity: 1;
    }
  }
  
  &.size-changing {
    animation: sizeChange 0.4s ease;
    background: #e3f2fd;
    border-color: #1976d2;
  }
  
  .drag-handle {
    display: flex;
    align-items: center;
    color: #bdbdbd;
    opacity: 0;
    transition: opacity 0.2s;
    cursor: grab;
    
    &:active {
      cursor: grabbing;
    }
  }
  
  .field-icon {
    flex-shrink: 0;
  }
  
  .field-details {
    flex: 1;
    min-width: 0;
    
    .field-name {
      font-weight: 500;
      color: #212121;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .field-type {
      font-size: 12px;
      color: #757575;
      margin-top: 2px;
    }
  }
  
  .field-badges {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
    
    @media (max-width: 768px) {
      display: none;
    }
  }
  
  .field-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
    
    .md3-btn-group {
      :deep(.q-btn) {
        min-width: 28px;
        height: 28px;
        border: 1px solid #e0e0e0;
        
        &:first-child {
          border-right: none;
        }
        
        &:last-child {
          border-left: none;
        }
        
        &:hover {
          background: rgba(0, 0, 0, 0.04);
        }
        
        &.q-btn--active {
          background: #1976d2;
          color: white;
          border-color: #1976d2;
        }
      }
    }
    
    .size-icon {
      width: 16px;
      height: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      
      &-third::before {
        content: '';
        width: 4px;
        height: 100%;
        background: currentColor;
        border-radius: 1px;
      }
      
      &-half::before {
        content: '';
        width: 8px;
        height: 100%;
        background: currentColor;
        border-radius: 1px;
      }
      
      &-full::before {
        content: '';
        width: 14px;
        height: 100%;
        background: currentColor;
        border-radius: 1px;
      }
    }
    
    .md3-icon-btn {
      color: #757575;
      transition: all 0.2s;
      
      &:hover {
        color: #212121;
        background: rgba(0, 0, 0, 0.04);
      }
    }
  }
}

// Drag and drop styles
.dragging-item {
  opacity: 0;
}

.ghost-preview {
  opacity: 0.5;
  background: #f0f0f0;
  border: 2px dashed #1976d2;
  
  * {
    opacity: 0;
  }
}

.drop-animation {
  animation: dropBounce 0.3s ease;
}

@keyframes sizeChange {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.98);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes dropBounce {
  0% {
    transform: translateY(-5px);
    opacity: 0.8;
  }
  50% {
    transform: translateY(2px);
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}</style>
