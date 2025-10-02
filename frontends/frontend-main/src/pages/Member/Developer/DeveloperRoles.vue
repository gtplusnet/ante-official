<template>
  <div class="page-head">
    <div class="title text-title-large">Default Role Management</div>
    <div class="actions">
      <q-btn class="q-mr-sm text-label-large" @click="viewDefaultTree()" color="secondary" outline rounded>
        <q-icon size="14px" class="q-mr-xs" name="account_tree"></q-icon>
        View Default Tree
      </q-btn>
      <q-btn @click="add()" class="text-label-large" color="primary" unelevated rounded>
        <q-icon name="add" size="14px" class="q-mr-xs"></q-icon>
        Create Role
      </q-btn>
    </div>
  </div>
  <div class="page-content q-mt-md ">
    <g-table :is-row-action-enabled="true" class="text-body-small" ref="table" tableKey="developerRole" apiUrl="/developer-role">
      <template v-slot:row-actions="props">
        <q-btn rounded class="q-mr-sm text-label-medium" @click="edit(props.data)" no-caps color="primary" unelevated>
          <q-icon class="q-mr-sm" size="20px" name="edit"></q-icon> Edit
        </q-btn>
        <q-btn rounded class="text-label-medium" @click="deleteRole(props.data)" no-caps color="red" outline>
          <q-icon class="q-mr-sm" size="20px" name="delete"></q-icon> Delete
        </q-btn>
      </template>
    </g-table>
  </div>

  <!-- Create/Edit Role Dialog -->
  <create-edit-role-dialog :roleId="roleId" :isDeveloperRole="true" @saveDone="saveDone()" v-model="isCreateEditRoleDialogVisible" />


  <!-- Default Role Tree Dialog -->
  <role-tree-dialog v-model="isDefaultRoleTreeDialogVisible" :isDefaultTree="true" />
</template>

<script>
import GTable from "../../../components/shared/display/GTable.vue";
import CreateEditRoleDialog from "../../../pages/Member/Settings/dialogs/SettingsCreateEditRoleDialog.vue";
import RoleTreeDialog from "../../../pages/Member/Settings/dialogs/SettingsRoleTreeDialog.vue";
import { api } from 'src/boot/axios';

export default {
  name: 'DeveloperRoles',
  components: {
    GTable,
    CreateEditRoleDialog,
    RoleTreeDialog,
  },
  computed: {},
  data: () => ({
    roleId: null,
    isCreateEditRoleDialogVisible: false,
    isRoleTreeDialogVisible: false,
    isDefaultRoleTreeDialogVisible: false,
  }),
  methods: {
    viewTree() {
      this.isRoleTreeDialogVisible = true;
    },
    viewDefaultTree() {
      this.isDefaultRoleTreeDialogVisible = true;
    },
    add() {
      this.roleId = null;
      this.isCreateEditRoleDialogVisible = true;
    },
    edit(data) {
      this.roleId = data.id;
      this.isCreateEditRoleDialogVisible = true;
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
        api.delete('/developer-role', params).then(() => {
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
  },
};
</script>
