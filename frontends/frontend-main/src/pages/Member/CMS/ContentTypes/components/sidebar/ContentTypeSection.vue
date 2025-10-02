<template>
  <q-expansion-item
    v-model="isExpanded"
    :icon="icon"
    :label="title"
    header-class="section-header"
    expand-icon="o_expand_more"
  >
    <template v-slot:header>
      <q-item-section avatar>
        <q-icon :name="icon" />
      </q-item-section>
      <q-item-section>
        <span class="section-title">{{ title }}</span>
      </q-item-section>
      <q-item-section side>
        <q-btn
          flat
          dense
          round
          icon="o_add"
          size="xs"
          @click.stop="$emit('create')"
          style="transition: all 0.2s"
        >
          <q-tooltip>Create new {{ tooltipText }}</q-tooltip>
        </q-btn>
      </q-item-section>
    </template>
    
    <q-list dense class="content-type-list">
      <q-item
        v-for="item in items"
        :key="item.id"
        clickable
        :active="activeId === item.id"
        @click="handleItemClick(item)"
        active-class="active-content-type"
        class="content-type-item"
        :class="{ 
          'archived-item': item.deletedAt && viewMode === 'active',
          'archived-tab-item': viewMode === 'archived'
        }"
      >
        <q-item-section>
          <q-item-label>
            {{ itemPrefix }}{{ getItemApiId(item) }}
          </q-item-label>
        </q-item-section>
        
        <q-item-section side class="item-actions">
          <div class="action-buttons">
            <!-- Active View Actions -->
            <template v-if="viewMode === 'active'">
              <!-- Edit button -->
              <q-btn
                flat
                dense
                round
                icon="o_edit"
                size="xs"
                color="grey-6"
                @click.stop="$emit('edit-item', item)"
                class="action-btn edit-btn"
              >
                <q-tooltip>Edit {{ item.displayName || item.name }}</q-tooltip>
              </q-btn>
              
              <!-- Archive button -->
              <q-btn
                flat
                dense
                round
                icon="o_archive"
                size="xs"
                color="grey-6"
                @click.stop="$emit('delete-item', item)"
                class="action-btn archive-btn"
              >
                <q-tooltip>Archive {{ item.displayName || item.name }}</q-tooltip>
              </q-btn>
            </template>
            
            <!-- Archived View Actions -->
            <template v-if="viewMode === 'archived'">
              <!-- Restore button -->
              <q-btn
                flat
                dense
                round
                icon="o_restore"
                size="xs"
                color="grey-6"
                @click.stop="$emit('restore-item', item)"
                class="action-btn restore-btn"
              >
                <q-tooltip>Restore {{ item.displayName || item.name }}</q-tooltip>
              </q-btn>
            </template>
          </div>
        </q-item-section>
      </q-item>
      
      <!-- Empty State -->
      <div v-if="items.length === 0" class="empty-section">
        <div class="text-caption text-grey-6 q-pa-md text-center">
          No {{ title.toLowerCase() }} found
        </div>
      </div>
    </q-list>
  </q-expansion-item>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import type { ContentType } from '@components/shared/cms/types/content-type';

export default defineComponent({
  name: 'ContentTypeSection',
  props: {
    modelValue: {
      type: Boolean,
      default: true
    },
    title: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    items: {
      type: Array as PropType<ContentType[]>,
      default: () => []
    },
    activeId: {
      type: String,
      default: ''
    },
    tooltipText: {
      type: String,
      default: ''
    },
    itemPrefix: {
      type: String,
      default: ''
    },
    viewMode: {
      type: String as PropType<'active' | 'archived'>,
      default: 'active'
    }
  },
  emits: ['update:modelValue', 'select', 'create', 'edit-item', 'delete-item', 'restore-item'],
  setup(props, { emit }) {
    const isExpanded = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    });

    const getItemLabel = (item: ContentType) => {
      if (item.type === 'component' && item.category) {
        return `${item.category}.${item.name}`;
      }
      return item.displayName || item.name;
    };

    const getItemApiId = (item: ContentType) => {
      // For single types, always show the API ID (name)
      if (item.type === 'single') {
        return item.name;
      }
      
      // For all other types, use the existing logic
      return getItemLabel(item);
    };

    const handleItemClick = (item: ContentType) => {
      emit('select', item.id);
    };

    return {
      isExpanded,
      getItemLabel,
      getItemApiId,
      handleItemClick
    };
  },
});
</script>

<style scoped lang="scss">
:deep(.q-expansion-item) {
  .section-header {
    background: transparent;
    color: #5f6368;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 8px 16px;
    min-height: 40px;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(25, 118, 210, 0.04);
      border-radius: 8px;
    }
  }

  .section-title {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .q-item__section--avatar {
    min-width: 24px;
    padding-right: 8px;
    
    .q-icon {
      font-size: 18px;
      color: #757575;
    }
  }

  .q-item__section--side {
    .q-btn {
      opacity: 0;
      transition: opacity 0.2s;
      color: #757575;
      
      &:hover {
        color: #212529;
      }
    }
  }

  &:hover .q-item__section--side .q-btn {
    opacity: 1;
  }

  .q-expansion-item__content {
    background: #fafafa;
  }
}

.content-type-list {
  padding: 0;

  :deep(.q-item) {
    color: #616161;
    padding: 8px 16px 8px 40px;
    min-height: 36px;
    font-size: 14px;
    transition: all 0.2s;
    position: relative;

    &.content-type-item {
      .item-actions {
        opacity: 0;
        transition: opacity 0.2s;
        
        .action-buttons {
          display: flex;
          gap: 2px;
          
          .action-btn {
            width: 24px;
            height: 24px;
            transition: all 0.2s;
            
            &:hover {
              transform: scale(1.1);
              
              &.edit-btn {
                color: #1976d2 !important;
              }
              
              &.archive-btn {
                color: #ff9800 !important;
              }
              
              &.restore-btn {
                color: #4caf50 !important;
              }
            }
          }
        }
      }
      
      &:hover {
        .item-actions {
          opacity: 1;
        }
      }
    }

    &:hover {
      background: #f5f5f5;
      color: #1a1a1a;
      border-radius: 8px;
      margin: 0 4px;
    }

    &.archived-item {
      opacity: 0.6;
      background: #f5f5f5;
      
      .q-item__label {
        text-decoration: line-through;
        color: #999;
        font-style: italic;
        
        &:before {
          content: '[ARCHIVED] ';
          font-size: 10px;
          font-weight: bold;
          color: #ff9800;
        }
      }
      
      &:hover {
        background: #eeeeee;
        opacity: 0.8;
      }
    }

    &.archived-tab-item {
      background: #fafafa;
      border-left: 3px solid #ff9800;
      
      .q-item__label {
        color: #666;
        opacity: 0.9;
      }
      
      &:hover {
        background: #f0f0f0;
        
        .q-item__label {
          color: #444;
        }
      }
      
      &.active-content-type {
        background: #fff3e0;
        border-left-color: #ff9800;
        
        .q-item__label {
          color: #e65100;
          font-weight: 500;
        }
      }
    }

    &.active-content-type {
      background: #e8f0fe;
      color: #1976d2;
      font-weight: 500;
      border-radius: 8px;
      margin: 0 4px;
      position: relative;
      
      .item-actions {
        opacity: 1;
      }
      
      &:before {
        content: '';
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 20px;
        background: #1976d2;
        border-radius: 3px;
      }
      
      &.archived-item {
        background: #fff3e0;
        color: #ff9800;
        opacity: 1;
        
        &:before {
          background: #ff9800;
        }
      }
    }
  }
}

.empty-section {
  padding: 8px;
  font-style: italic;
}</style>
