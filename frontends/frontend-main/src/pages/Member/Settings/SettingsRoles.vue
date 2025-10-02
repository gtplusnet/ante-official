<template>
  <div class="page-head">
    <div class="title text-title-large">Role Management</div>
    <div class="actions">
      <q-btn class="q-mr-sm text-label-large" color="red" outline unelevated rounded @click="resetDefaultRoles">
        <q-icon name="refresh" size="14px" class="q-mr-xs"></q-icon>
        Reset Default Roles
      </q-btn>
      <q-btn class="q-mr-sm text-label-large" @click="viewTree()" color="primary" outline rounded>
        <q-icon size="14px" class="q-mr-xs" name="account_tree"></q-icon>
        View Tree
      </q-btn>
      <q-btn @click="add()" color="primary" unelevated rounded class="text-label-large">
        <q-icon name="add" size="14px" class="q-mr-xs"></q-icon>
        Create Role
      </q-btn>
    </div>
  </div>
  <div class="page-content q-mt-md text-body-small">
    <g-table :is-row-action-enabled="true" ref="table" tableKey="role" apiUrl="/role"
      :apiFilters="[{ deleted: false }]">
      <template v-slot:row-actions="props">
        <q-btn rounded class="q-mr-sm text-label-medium" @click="edit(props.data)" no-caps color="primary" unelevated>
          <q-icon class="q-mr-sm" size="20px" name="edit"></q-icon> Edit
        </q-btn>
        <q-btn rounded @click="deleteRole(props.data)" no-caps color="red" outline class="text-label-medium">
          <q-icon class="q-mr-sm" size="20px" name="delete"></q-icon> Delete
        </q-btn>
      </template>

      <template v-slot:employeeCount="props">
        <span @click="showEmployees(props.data)" class="clickable-code text-label-medium">{{ props.data.employeeCount }} Employee(s)</span>
      </template>
    </g-table>
  </div>

  <!-- Create/Edit Role Dialog -->
  <create-edit-role-dialog :roleId="roleId" @saveDone="saveDone()" v-model="isCreateEditRoleDialogVisible" />

  <!-- Role Tree Dialog -->
  <role-tree-dialog v-model="isRoleTreeDialogVisible" />

  <!-- Role Employee List Dialog -->
  <role-employee-list-dialog v-model="isRoleEmployeeListDialogVisible" :roleId="selectedRoleId" />
</template>

<script>
import GTable from "../../../components/shared/display/GTable.vue";
import CreateEditRoleDialog from './dialogs/SettingsCreateEditRoleDialog.vue';
import RoleTreeDialog from './dialogs/SettingsRoleTreeDialog.vue';
import RoleEmployeeListDialog from './dialogs/SettingsRoleEmployeeListDialog.vue';
import { api } from 'src/boot/axios';

export default {
  name: 'SettingsRoles',
  components: {
    GTable,
    CreateEditRoleDialog,
    RoleTreeDialog,
    RoleEmployeeListDialog,
  },
  computed: {},
  data: () => ({
    roleId: null,
    isCreateEditRoleDialogVisible: false,
    isRoleTreeDialogVisible: false,
    isRoleEmployeeListDialogVisible: false,
    selectedRoleId: null,
  }),
  methods: {
    viewTree() {
      this.isRoleTreeDialogVisible = true;
    },
    add() {
      this.roleId = null;
      this.isCreateEditRoleDialogVisible = true;
    },
    edit(data) {
      this.roleId = data.id;
      this.isCreateEditRoleDialogVisible = true;
    },
    showEmployees(data) {
      this.selectedRoleId = data.id;
      this.isRoleEmployeeListDialogVisible = true;
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
      this.isCreateEditRoleDialogVisible = false;
      this.$refs.table.refetch();
    },
    resetDefaultRoles() {
      this.$q.dialog({
        title: 'Reset Default Roles',
        message: 'Are you sure you want to reset all roles to default? This will overwrite current roles.',
        ok: true,
        cancel: true,
      }).onOk(() => {
        api.post('/role/populate-default')
          .then(() => {
            this.$q.notify({ type: 'positive', message: 'Default roles have been reset.' });
            this.$refs.table.refetch();
          })
          .catch((error) => {
            this.$q.notify({ type: 'negative', message: error?.response?.data?.message || 'Failed to reset roles.' });
          });
      });
    },
  },
};
</script>
