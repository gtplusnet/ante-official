<template>
  <q-dialog :maximized="true" persistent transition-show="slide-up" transition-hide="slide-down"
    @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="account_tree" />
        <div class="text-title-medium"  >{{ isDefaultTree ? 'Default Role Tree' : 'Company Role Tree' }}</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <VueZoomable class="zoomable-container" :initialZoom="1.2">
          <div class="container">
            <div class="tree-content">
              <div class="tree">
                <template v-if="isLoading">
                  <div class="loader">
                    <GlobalLoader />
                  </div>
                </template>
                <template v-else>
                  <RoleTreeDialogChild 
                    :treeList="tree" 
                    :draggedRole="draggedRole"
                    :dropTarget="dropTarget"
                    :canDrop="canDrop"
                    @edit-role="openEditRoleDialog" 
                    @create-child-role="openCreateChildRoleDialog" 
                    @delete-role="confirmDeleteRole"
                    @drag-start="onDragStart"
                    @drag-over="onDragOver"
                    @drag-leave="onDragLeave"
                    @drop="onDrop"
                    @role-reassign="handleRoleReassignment"
                  />
                </template>
              </div>
            </div>
          </div>
        </VueZoomable>
      </q-card-section>
      <create-edit-role-dialog v-model="isCreateEditRoleDialogVisible" :roleId="editRoleId" :parentRoleId="createParentRoleId" :roleGroupId="createRoleGroupId" @update:roleId="editRoleId = $event" @saveDone="onRoleEditDone" />
    </q-card>
  </q-dialog>
</template>

<style src="./SettingsTreeDialog.scss" scoped lang="scss"></style>

<script>
import { defineAsyncComponent } from 'vue';
import VueZoomable from 'vue-zoomable';
import 'vue-zoomable/dist/style.css';
import RoleTreeDialogChild from './SettingsRoleTreeDialogChild.vue';
import { api } from 'src/boot/axios';
import GlobalLoader from "../../../../components/shared/common/GlobalLoader.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const CreateEditRoleDialog = defineAsyncComponent(() =>
  import('./SettingsCreateEditRoleDialog.vue')
);

export default {
  name: 'RoleTreeDialog',
  components: {
    RoleTreeDialogChild,
    VueZoomable,
    GlobalLoader,
    CreateEditRoleDialog,
  },
  data: () => ({
    tree: [],
    isLoading: true,
    isCreateEditRoleDialogVisible: false,
    editRoleId: null,
    createParentRoleId: null,
    createRoleGroupId: null,
    draggedRole: null,
    dropTarget: null,
    canDrop: false,
    isReassigning: false,
  }),
  props: {
    isDefaultTree: {
      type: Boolean,
      default: false,
    },
  },
  watch: {
  },
  methods: {
    fetchData() {
      this.isLoading = true;
      const url = this.isDefaultTree ? '/developer-role/tree' : '/role/tree';
      api.get(url)
        .then((response) => {
          this.tree = response.data;
        }).catch((error) => {
          this.handleAxiosError(error);
        }).finally(() => {
          this.isLoading = false;
        });
    },
    openEditRoleDialog(roleId) {
      this.editRoleId = roleId;
      this.createParentRoleId = null;
      this.isCreateEditRoleDialogVisible = true;
    },
    openCreateChildRoleDialog({ parentRoleId, roleGroupId }) {
      this.editRoleId = null;
      this.createParentRoleId = parentRoleId;
      this.createRoleGroupId = roleGroupId;
      this.isCreateEditRoleDialogVisible = true;
    },
    onRoleEditDone() {
      this.isCreateEditRoleDialogVisible = false;
      this.editRoleId = null;
      this.createParentRoleId = null;
      this.createRoleGroupId = null;
      this.fetchData();
    },
    confirmDeleteRole(roleId) {
      this.$q.dialog({
        title: 'Delete Role',
        message: 'Are you sure you want to delete this role?',
        ok: true,
        cancel: true,
      }).onOk(() => {
        api.delete('/role', { params: { id: roleId } })
          .then(() => {
            this.$q.notify({ type: 'positive', message: 'Role deleted successfully.' });
            this.fetchData();
          })
          .catch((error) => {
            this.$q.notify({ type: 'negative', message: error?.response?.data?.message || 'Failed to delete role.' });
          });
      });
    },

    onDragStart(treeData) {
      this.draggedRole = treeData;
      this.dropTarget = null;
      this.canDrop = false;
    },

    onDragOver(treeData) {
      if (!this.draggedRole) return;
      
      this.dropTarget = treeData;
      
      // Check if drop is valid
      this.canDrop = this.isValidDrop(this.draggedRole, treeData);
    },

    onDragLeave(treeData) {
      // Clear drop target if leaving the current target
      if (this.dropTarget?.id === treeData.id) {
        this.dropTarget = null;
        this.canDrop = false;
      }
    },

    onDrop() {
      // Clear drag state
      this.draggedRole = null;
      this.dropTarget = null;
      this.canDrop = false;
    },

    isValidDrop(draggedRole, targetRole) {
      // Can't drop on self
      if (draggedRole.id === targetRole.id) {
        return false;
      }
      
      // Check if target is a descendant of dragged role (prevent circular reference)
      return !this.isDescendant(targetRole, draggedRole.id);
    },

    isDescendant(role, ancestorId, visitedIds = new Set()) {
      if (!role || !role.child) return false;
      
      // Prevent infinite loops
      if (visitedIds.has(role.id)) return false;
      visitedIds.add(role.id);
      
      for (const child of role.child) {
        if (child.id === ancestorId) {
          return true;
        }
        if (this.isDescendant(child, ancestorId, visitedIds)) {
          return true;
        }
      }
      return false;
    },

    handleRoleReassignment({ draggedRoleId, newParentId, draggedRole, newParent }) {
      const newParentName = newParent 
        ? newParent.name
        : (this.isDefaultTree ? 'Default Root' : 'Company Root');
      
      const draggedRoleName = draggedRole.name;
      
      this.$q.dialog({
        title: 'Confirm Role Reassignment',
        message: `Move "${draggedRoleName}" to be a child of "${newParentName}"?`,
        ok: {
          label: 'Move',
          color: 'primary'
        },
        cancel: {
          label: 'Cancel',
          flat: true
        }
      }).onOk(() => {
        this.reassignRole(draggedRoleId, newParentId);
      });
    },

    async reassignRole(roleId, newParentId) {
      if (this.isReassigning) return;
      
      this.isReassigning = true;
      
      try {
        // Use different endpoints based on tree type
        const endpoint = this.isDefaultTree 
          ? '/developer-role/change-parent'
          : '/role/change-parent';
        
        await this.$api.patch(endpoint, {
          roleId: roleId,
          newParentId: newParentId
        });
        
        this.$q.notify({
          type: 'positive',
          message: 'Role successfully reassigned!'
        });
        
        // Refresh the tree data
        this.fetchData();
        
      } catch (error) {
        console.error('Role reassignment error:', error);
        
        const errorMessage = error?.response?.data?.message || 
                            error?.message || 
                            'Failed to reassign role. Please try again.';
        
        this.$q.notify({
          type: 'negative',
          message: errorMessage
        });
      } finally {
        this.isReassigning = false;
        // Clear drag state
        this.onDrop();
      }
    },
  },
};
</script>
