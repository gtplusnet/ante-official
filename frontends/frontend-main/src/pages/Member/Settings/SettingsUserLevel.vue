<template>
  <div class="page-head">
    <div class="title text-title-large">User Level Management</div>
    <div class="actions">
      <q-btn @click="add()" color="primary" unelevated rounded class="text-label-large">
        <q-icon name="add" size="14px" class="q-mr-xs"></q-icon>
        Create User Level
      </q-btn>
    </div>
  </div>
  <div class="page-content q-mt-md text-body-small">
    <g-table :is-row-action-enabled="true" ref="table" tableKey="userLevel" apiUrl="/user-level/table">
      <template v-slot:row-actions="props">
        <q-btn rounded class="q-mr-sm text-label-medium" @click="edit(props.data)" no-caps color="primary" unelevated>
          <q-icon class="q-mr-sm" size="20px" name="edit"></q-icon> Edit
        </q-btn>
        <q-btn rounded @click="deleteRole(props.data)" no-caps color="red" outline class="text-label-medium">
          <q-icon class="q-mr-sm" size="20px" name="delete"></q-icon> Delete
        </q-btn>
      </template>
    </g-table>
  </div>

  <!-- Add/Edit User Level Dialog -->
  <add-edit-user-level-dialog
    v-model="isEditUserLevelDialogVisible"
    :userLevel="selectedUserLevel"
    :isDefault="false"
    @saveDone="saveDone"
    @close="isEditUserLevelDialogVisible = false"
  />

  <!-- Role Tree Dialog -->
  <role-tree-dialog v-model="isRoleTreeDialogVisible" />
</template>

<script>
import GTable from "../../../components/shared/display/GTable.vue";
import AddEditUserLevelDialog from './dialogs/SettingsAddEditUserLevelDialog.vue';
import RoleTreeDialog from './dialogs/SettingsRoleTreeDialog.vue';
import { api } from 'src/boot/axios';

export default {
  name: 'SettingsUserLevel',
  components: {
    GTable,
    AddEditUserLevelDialog,
    RoleTreeDialog,
  },
  computed: {},
  data: () => ({
    isEditUserLevelDialogVisible: false,
    selectedUserLevel: null,
    isRoleTreeDialogVisible: false,
  }),
  methods: {
    viewTree() {
      this.isRoleTreeDialogVisible = true;
    },
    add() {
      this.selectedUserLevel = null;
      this.isEditUserLevelDialogVisible = true;
    },
    edit(data) {
      this.selectedUserLevel = data;
      this.isEditUserLevelDialogVisible = true;
    },
    deleteRole(data) {
      this.$q.dialog({
        title: 'Delete Role',
        message: 'Are you sure you want to delete this role?',
        ok: true,
        cancel: true,
      }).onOk(() => {
        const params = {
          params: {
            id: data.id,
          },
        };
        api.delete('/role', params).then(() => {
          this.$refs.table.refetch();
        }).catch((error) => {
          this.handleAxiosError(error);
        });
      });
    },
    saveDone() {
      this.isEditUserLevelDialogVisible = false;
      this.$refs.table.refetch();
    },
    resetUserLevel() {
      this.$q.dialog({
        title: 'Reset User Level',
        message: 'Are you sure you want to reset all user levels? This action cannot be undone.',
        ok: true,
        cancel: true,
      }).onOk(() => {
        this.$q.loading.show();
        this.$api.post('/user-level/request-reset-otp', {})
          .then(() => {
            this.$q.loading.hide();
            this.$q.dialog({
              title: 'OTP Verification',
              message: 'Enter the OTP sent to your registered device/email.',
              prompt: {
                type: 'text',
                model: '',
                isValid: val => !!val || 'OTP is required',
              },
              cancel: true,
              ok: {
                label: 'Verify',
                color: 'primary',
              },
            }).onOk((otp) => {
              this.$q.loading.show();
              this.$api.post('/user-level/reset-default-with-otp', { otp })
                .then(() => {
                  this.$q.notify({ type: 'positive', message: 'User levels reset successfully.' });
                  this.$refs.table.refetch();
                })
                .catch((err) => {
                  this.$q.notify({ type: 'negative', message: err?.response?.data?.message || 'OTP verification failed.' });
                })
                .finally(() => {
                  this.$q.loading.hide();
                });
            });
          })
          .catch((err) => {
            this.$q.loading.hide();
            this.$q.notify({ type: 'negative', message: err?.response?.data?.message || 'Failed to send OTP.' });
          });
      });
    },
  },
};
</script>
