<template>
  <q-dialog :maximized="true" persistent transition-show="slide-up" transition-hide="slide-down"
    @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="account_tree" />
        <div class="text-title-medium">User Tree</div>

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
                  <UserTreeDialogChild 
                    :treeList="tree" 
                    :draggedUser="draggedUser"
                    :dropTarget="dropTarget"
                    :canDrop="canDrop"
                    @edit-user="openEditUserDialog" 
                    @create-child-user="openCreateChildUserDialog" 
                    @delete-user="confirmDeleteUser"
                    @drag-start="onDragStart"
                    @drag-over="onDragOver"
                    @drag-leave="onDragLeave"
                    @drop="onDrop"
                    @user-reassign="handleUserReassignment"
                  />
                </template>
              </div>
            </div>
          </div>
        </VueZoomable>
      </q-card-section>
      <settings-user-create-edit-dialog v-model="isCreateEditUserDialogVisible" :userId="editUserId" :parentUserId="createParentUserId" :roleId="createRoleId" @update:userId="editUserId = $event" @saveDone="onUserEditDone" />
    </q-card>
  </q-dialog>
</template>

<style src="./SettingsTreeDialog.scss" scoped lang="scss"></style>

<script>
import VueZoomable from 'vue-zoomable';
import 'vue-zoomable/dist/style.css';
import UserTreeDialogChild from './SettingsUserTreeDialogChild.vue';
import { api } from 'src/boot/axios';
import GlobalLoader from "../../../../components/shared/common/GlobalLoader.vue";
import SettingsUserCreateEditDialog from './SettingsUserCreateEditDialog.vue';

export default {
  name: 'UserTreeDialog',
  components: {
    UserTreeDialogChild,
    VueZoomable,
    GlobalLoader,
    SettingsUserCreateEditDialog,
  },
  data: () => ({
    tree: [],
    isLoading: true,
    isCreateEditUserDialogVisible: false,
    editUserId: null,
    createParentUserId: null,
    createRoleId: null,
    draggedUser: null,
    dropTarget: null,
    canDrop: false,
    isReassigning: false,
  }),
  watch: {
  },
  methods: {
    fetchData() {
      this.isLoading = true;
      api.get('/user-org')
        .then((response) => {
          this.tree = response.data;
        }).catch((error) => {
          this.$q.notify({
            type: 'negative',
            message: error?.response?.data?.message || 'Failed to load user tree.'
          });
        }).finally(() => {
          this.isLoading = false;
        });
    },
    openEditUserDialog(userId) {
      this.editUserId = userId;
      this.createParentUserId = null;
      this.createRoleId = null;
      this.isCreateEditUserDialogVisible = true;
    },
    openCreateChildUserDialog({ parentUserId }) {
      this.editUserId = null;
      this.createParentUserId = parentUserId;
      this.createRoleId = null;
      this.isCreateEditUserDialogVisible = true;
    },
    onUserEditDone() {
      this.isCreateEditUserDialogVisible = false;
      this.editUserId = null;
      this.createParentUserId = null;
      this.createRoleId = null;
      this.fetchData();
    },
    confirmDeleteUser(userId) {
      this.$q.dialog({
        title: 'Delete User',
        message: 'Are you sure you want to delete this user? This action cannot be undone.',
        ok: true,
        cancel: true,
      }).onOk(() => {
        api.delete('/account', { params: { id: userId } })
          .then(() => {
            this.$q.notify({ type: 'positive', message: 'User deleted successfully.' });
            this.fetchData();
          })
          .catch((error) => {
            this.$q.notify({ type: 'negative', message: error?.response?.data?.message || 'Failed to delete user.' });
          });
      });
    },
    
    onDragStart(treeData) {
      this.draggedUser = treeData;
      this.dropTarget = null;
      this.canDrop = false;
    },

    onDragOver(treeData) {
      if (!this.draggedUser) return;
      
      this.dropTarget = treeData;
      
      // Check if drop is valid
      this.canDrop = this.isValidDrop(this.draggedUser, treeData);
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
      this.draggedUser = null;
      this.dropTarget = null;
      this.canDrop = false;
    },

    isValidDrop(draggedUser, targetUser) {
      // Can't drop on self
      if (draggedUser.id === targetUser.id) {
        return false;
      }
      
      // Check if target is a descendant of dragged user (prevent circular reference)
      return !this.isDescendant(targetUser, draggedUser.id);
    },

    isDescendant(user, ancestorId, visitedIds = new Set()) {
      if (!user || !user.child) return false;
      
      // Prevent infinite loops
      if (visitedIds.has(user.id)) return false;
      visitedIds.add(user.id);
      
      for (const child of user.child) {
        if (child.id === ancestorId) {
          return true;
        }
        if (this.isDescendant(child, ancestorId, visitedIds)) {
          return true;
        }
      }
      return false;
    },

    handleUserReassignment({ draggedUserId, newParentId, draggedUser, newParent }) {
      const newParentName = newParent 
        ? `${newParent.firstName} ${newParent.lastName}` 
        : 'Company Root';
      
      const draggedUserName = `${draggedUser.firstName} ${draggedUser.lastName}`;
      
      this.$q.dialog({
        title: 'Confirm User Reassignment',
        message: `Move "${draggedUserName}" to report to "${newParentName}"?`,
        ok: {
          label: 'Move',
          color: 'primary'
        },
        cancel: {
          label: 'Cancel',
          flat: true
        }
      }).onOk(() => {
        this.reassignUser(draggedUserId, newParentId);
      });
    },

    async reassignUser(userId, newParentId) {
      if (this.isReassigning) return;
      
      this.isReassigning = true;
      
      try {
        await this.$api.patch('/user-org/change-parent', {
          userId: userId,
          newParentId: newParentId
        });
        
        this.$q.notify({
          type: 'positive',
          message: 'User successfully reassigned!'
        });
        
        // Refresh the tree data
        this.fetchData();
        
      } catch (error) {
        console.error('Reassignment error:', error);
        
        const errorMessage = error?.response?.data?.message || 
                            error?.message || 
                            'Failed to reassign user. Please try again.';
        
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
