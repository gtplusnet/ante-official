<template>
  <ul>
    <li v-for="treeData in treeList" :key="treeData.id" style="position: relative; display: inline-block; margin: 0 0; vertical-align: top;">
      <div style="position: relative; display: inline-block;">
        <a 
          href="#" 
          @click.prevent.stop="$emit('edit-role', treeData.id)" 
          :draggable="treeData.id !== 'static-head'"
          @dragstart="onDragStart($event, treeData)"
          @dragover="onDragOver($event, treeData)"
          @dragleave="onDragLeave($event, treeData)"
          @drop="onDrop($event, treeData)"
          :class="{
            'user-node': true,
            'dragging': draggedRole?.id === treeData.id,
            'drag-over': dropTarget?.id === treeData.id && canDrop,
            'cannot-drop': dropTarget?.id === treeData.id && !canDrop
          }"
          style="display: inline-block; width: 180px; padding: 12px 24px 12px 16px; border-radius: 8px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.04); cursor: pointer; position: relative;"
        >
          <div class="tree-data">
            <div class="text-label-large-w-[600]">{{ treeData.name }}</div>
            <div class="text-body-small" v-if="treeData.hasOwnProperty('roleGroup')">{{ treeData.roleGroup.name }}</div>
          </div>

          <q-btn v-if="treeData.id != 'static-head'" dense flat color="grey" icon="close" size="sm" style="position: absolute; top: 4px; right: 4px; z-index: 2;" @click.stop="$emit('delete-role', treeData.id)" :title="'Delete ' + treeData.name" />
        </a>
        <div v-if="treeData.id != 'static-head'" class="q-mt-xs q-mb-xs text-center" style="position: absolute; bottom: -10px; left: 4px; right: 4px; z-index: 2;">
          <q-btn dense unelevated color="grey" icon="add" size="sm" @click.stop="$emit('create-child-role', { parentRoleId: treeData.id, roleGroupId: treeData.roleGroup ? treeData.roleGroup.id : null })" :title="'Add child role to ' + treeData.name" />
        </div>
      </div>
      <RoleTreeDialogChild 
        v-if="treeData.child && treeData.child.length > 0" 
        :treeList="treeData.child" 
        :draggedRole="draggedRole"
        :dropTarget="dropTarget"
        :canDrop="canDrop"
        @edit-role="$emit('edit-role', $event)" 
        @create-child-role="$emit('create-child-role', $event)" 
        @delete-role="$emit('delete-role', $event)"
        @drag-start="onChildDragStart"
        @drag-over="onChildDragOver"
        @drag-leave="onChildDragLeave"
        @drop="onChildDrop"
        @role-reassign="$emit('role-reassign', $event)"
      />
    </li>
  </ul>
</template>

<style src="./SettingsTreeDialog.scss" scoped lang="scss"></style>

<script>
export default {
  name: 'RoleTreeDialogChild',
  props: {
    treeList: {
      type: Array,
      required: true,
    },
    draggedRole: {
      type: Object,
      default: null
    },
    dropTarget: {
      type: Object,
      default: null
    },
    canDrop: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    onDragStart(event, treeData) {
      if (treeData.id === 'static-head') {
        event.preventDefault();
        return;
      }
      
      event.dataTransfer.setData('text/plain', JSON.stringify(treeData));
      event.dataTransfer.effectAllowed = 'move';
      this.$emit('drag-start', treeData);
    },

    onDragOver(event, treeData) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      this.$emit('drag-over', treeData);
    },

    onDragLeave(event, treeData) {
      // Only trigger if we're actually leaving this element, not a child
      if (!event.currentTarget.contains(event.relatedTarget)) {
        this.$emit('drag-leave', treeData);
      }
    },

    onDrop(event, treeData) {
      event.preventDefault();
      
      try {
        const draggedData = JSON.parse(event.dataTransfer.getData('text/plain'));
        
        // Validate drop
        if (draggedData.id === treeData.id) {
          // Can't drop on self
          return;
        }
        
        if (treeData.id === 'static-head') {
          // Dropping on company/default root - set parent to null
          this.$emit('role-reassign', {
            draggedRoleId: draggedData.id,
            newParentId: null,
            draggedRole: draggedData,
            newParent: null
          });
        } else {
          // Dropping on another role
          this.$emit('role-reassign', {
            draggedRoleId: draggedData.id,
            newParentId: treeData.id,
            draggedRole: draggedData,
            newParent: treeData
          });
        }
        
        this.$emit('drop', null);
      } catch (error) {
        console.error('Error processing role drop:', error);
      }
    },

    // Handle events from child components
    onChildDragStart(treeData) {
      this.$emit('drag-start', treeData);
    },

    onChildDragOver(treeData) {
      this.$emit('drag-over', treeData);
    },

    onChildDragLeave(treeData) {
      this.$emit('drag-leave', treeData);
    },

    onChildDrop(treeData) {
      this.$emit('drop', treeData);
    }
  }
}
</script>
