<template>
  <div class="branch-node-container" :class="{ 'root-branch': depth === 0 }">
    <div class="branch-node-content">
      <div class="branch-node-main">
        <q-btn
          v-if="hasChildren"
          :icon="expanded ? 'expand_more' : 'chevron_right'"
          size="sm"
          flat
          round
          dense
          class="branch-expand-btn"
          @click="toggleExpand"
        />
        <div v-else class="branch-expand-placeholder"></div>
        
        <div class="branch-icon">
          <q-icon 
            :name="hasChildren ? 'account_tree' : 'scatter_plot'" 
            size="20px"
            :color="hasChildren ? 'primary' : 'grey-6'"
          />
        </div>
        
        <div class="branch-info">
          <div class="branch-header">
            <span class="branch-name">
              {{ branch.name }}
            </span>
            <q-badge 
              :color="hasChildren ? 'primary' : 'grey-5'" 
              text-color="white"
              class="branch-code"
            >
              {{ branch.code }}
            </q-badge>
            <q-chip 
              v-if="hasChildren" 
              size="sm" 
              color="blue-1" 
              text-color="primary"
              icon="subdirectory_arrow_right"
              dense
            >
              {{ branch.children.length }} sub-branch{{ branch.children.length !== 1 ? 'es' : '' }}
            </q-chip>
          </div>
          <div class="branch-meta">
            <div class="branch-location">
              <q-icon name="place" size="14px" color="grey-6" />
              <span>{{ branch.location?.name || 'No location' }}</span>
            </div>
            <div v-if="branch.parentId" class="branch-parent">
              <q-icon name="account_tree" size="14px" color="grey-6" />
              <span>Child branch</span>
            </div>
          </div>
        </div>

        <q-space />

        <div class="branch-actions">
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="visibility"
            color="grey-7"
            @click="$emit('view', branch)"
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
            @click="$emit('edit', branch)"
          >
            <q-tooltip>Edit Branch</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="delete"
            color="negative"
            @click="$emit('delete', branch)"
          >
            <q-tooltip>Delete Branch</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>

    <transition
      enter-active-class="animated fadeIn"
      leave-active-class="animated fadeOut"
    >
      <div v-if="expanded && hasChildren" class="branch-children">
        <div v-for="child in branch.children" :key="child.id" class="child-branch">
          <BranchNode 
            :branch="child" 
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
  name: 'BranchNode',
  props: {
    branch: {
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
      return props.branch.children && props.branch.children.length > 0;
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
.branch-node-container {
  width: 100%;
  
  &.root-branch {
    margin-bottom: 16px;
    
    > .branch-node-content {
      border: 1px solid rgba(0, 0, 0, 0.06);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }
  }
}

.branch-node-content {
  background: white;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.01);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
}

.branch-node-main {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 8px;
  min-height: 56px;
}

.branch-expand-btn {
  flex-shrink: 0;
  width: 28px !important;
  height: 28px !important;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
}

.branch-expand-placeholder {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.branch-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: rgba(33, 150, 243, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.branch-info {
  flex: 1;
  min-width: 0;
  padding-left: 4px;
}

.branch-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  min-height: 24px;
}

.branch-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.4;
}

.branch-code {
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  letter-spacing: 0.3px;
  height: 20px;
  line-height: 1;
}

.branch-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 20px;
}

.branch-location,
.branch-parent {
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

.branch-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  .q-btn {
    width: 32px !important;
    height: 32px !important;
  }
}

.branch-node-content:hover .branch-actions {
  opacity: 1;
}

.branch-children {
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
    height: 36px; // Height to reach first child's horizontal line
    background-color: rgba(0, 0, 0, 0.08);
  }
}

.child-branch {
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
  
  // Vertical line from current child to next sibling (not on last child)
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    left: -18px;
    top: 28px;
    width: 1px;
    height: calc(100% + 8px); // Height to reach next sibling
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

// Responsive adjustments
@media (max-width: 768px) {
  .branch-node-main {
    padding: 10px 12px;
  }
  
  .branch-header {
    gap: 6px;
  }
  
  .branch-actions {
    opacity: 1;
  }
  
  .branch-children {
    padding-left: 32px;
    
    &::before {
      left: 16px;
    }
  }
  
  .child-branch {
    &::before {
      left: -16px;
    }
  }
}
</style>