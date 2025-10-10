<template>
  <div class="category-node-container" :class="{ 'root-category': depth === 0 }">
    <div class="category-node-content">
      <div class="category-node-main">
        <q-btn
          v-if="hasChildren"
          :icon="expanded ? 'expand_more' : 'chevron_right'"
          size="sm"
          flat
          round
          dense
          class="category-expand-btn"
          @click="toggleExpand"
        />
        <div v-else class="category-expand-placeholder"></div>

        <div class="category-icon">
          <q-icon
            :name="hasChildren ? 'folder' : 'label'"
            size="20px"
            :color="hasChildren ? 'primary' : 'grey-6'"
          />
        </div>

        <div class="category-info">
          <div class="category-header">
            <span class="category-name">
              {{ category.name }}
            </span>
            <q-badge
              :color="hasChildren ? 'primary' : 'grey-5'"
              text-color="white"
              class="category-code"
            >
              {{ category.code }}
            </q-badge>
            <q-chip
              v-if="hasChildren"
              size="sm"
              color="blue-1"
              text-color="primary"
              icon="subdirectory_arrow_right"
              dense
            >
              {{ category.children.length }} sub-categor{{ category.children.length !== 1 ? 'ies' : 'y' }}
            </q-chip>
          </div>
          <div class="category-meta" v-if="category.description">
            <div class="category-description">
              <q-icon name="info" size="14px" color="grey-6" />
              <span>{{ category.description }}</span>
            </div>
          </div>
        </div>

        <q-space />

        <div class="category-actions">
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="visibility"
            color="grey-7"
            @click="$emit('view', category)"
          >
            <q-tooltip>View Details</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="edit"
            color="primary"
            @click="$emit('edit', category)"
          >
            <q-tooltip>Edit Category</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="delete"
            color="negative"
            @click="$emit('delete', category)"
          >
            <q-tooltip>Delete Category</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>

    <transition
      enter-active-class="animated fadeIn"
      leave-active-class="animated fadeOut"
    >
      <div v-if="expanded && hasChildren" class="category-children">
        <div v-for="child in category.children" :key="child.id" class="child-category">
          <ItemCategoryNode
            :category="child"
            :depth="depth + 1"
            @view="$emit('view', $event)"
            @edit="$emit('edit', $event)"
            @delete="$emit('delete', $event)"
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';

export default defineComponent({
  name: 'ItemCategoryNode',
  props: {
    category: {
      type: Object,
      required: true
    },
    depth: {
      type: Number,
      default: 0
    }
  },
  emits: ['view', 'edit', 'delete'],
  setup(props) {
    const expanded = ref(true);

    const hasChildren = computed(() => {
      return props.category.children && props.category.children.length > 0;
    });

    const toggleExpand = () => {
      if (hasChildren.value) {
        expanded.value = !expanded.value;
      }
    };

    return {
      expanded,
      hasChildren,
      toggleExpand
    };
  }
});
</script>

<style lang="scss" scoped>
.category-node-container {
  width: 100%;

  &.root-category {
    margin-bottom: 16px;

    > .category-node-content {
      border: 1px solid rgba(0, 0, 0, 0.06);
    }
  }
}

.category-node-content {
  background: white;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.01);
  }
}

.category-node-main {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 8px;
  min-height: 56px;
}

.category-expand-btn {
  flex-shrink: 0;
  width: 28px !important;
  height: 28px !important;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
}

.category-expand-placeholder {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.category-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: rgba(33, 150, 243, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-info {
  flex: 1;
  min-width: 0;
  padding-left: 4px;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  min-height: 24px;
}

.category-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.4;
}

.category-code {
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  letter-spacing: 0.3px;
  height: 20px;
  line-height: 1;
}

.category-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 20px;
}

.category-description {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  line-height: 1;

  .q-icon {
    opacity: 0.6;
  }
}

.category-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s ease;

  .q-btn {
    width: 32px !important;
    height: 32px !important;
  }
}

.category-node-content:hover .category-actions {
  opacity: 1;
}

.category-children {
  padding-left: 48px;
  padding-top: 8px;
  position: relative;

  // Vertical line from parent to first child
  &::before {
    content: '';
    position: absolute;
    left: 30px;
    top: 0;
    width: 1px;
    height: 36px;
    background-color: rgba(0, 0, 0, 0.08);
  }
}

.child-category {
  position: relative;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }

  // Horizontal line connecting to each child
  &::before {
    content: '';
    position: absolute;
    left: -18px;
    top: 28px;
    width: 18px;
    height: 1px;
    background-color: rgba(0, 0, 0, 0.08);
  }

  // Vertical line from current child to next sibling
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    left: -18px;
    top: 28px;
    width: 1px;
    height: calc(100% + 8px);
    background-color: rgba(0, 0, 0, 0.08);
  }
}

:deep(.q-chip) {
  height: 22px;
  padding: 0 8px;
  font-size: 11px;

  .q-icon {
    font-size: 14px;
  }
}

// Responsive
@media (max-width: 768px) {
  .category-node-main {
    padding: 10px 12px;
  }

  .category-header {
    gap: 6px;
  }

  .category-actions {
    opacity: 1;
  }

  .category-children {
    padding-left: 32px;

    &::before {
      left: 16px;
    }
  }

  .child-category {
    &::before {
      left: -16px;
    }
  }
}
</style>
