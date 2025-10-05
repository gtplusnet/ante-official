<template>
  <div class="page-head">
    <div class="title text-title-large">Role Group Management</div>
    <div class="actions">
      <q-btn color="primary" @click="openCreateDialog" unelevated rounded class="text-label-large">
        <q-icon name="add" class="q-mr-xs" size="14px"></q-icon>
        Create Role Group
      </q-btn>
    </div>
  </div>
  <div class="page-content q-mt-md text-body-small">
    <g-table ref="table" tableKey="roleGroup" :isRowActionEnabled="true" apiUrl="/role-group"
      :apiFilters="[{ deleted: false }]">
      <template v-slot:row-actions="props">
        <q-btn rounded class="q-mr-sm text-label-medium" @click="viewRoleGroup(props.data)" no-caps color="primary" unelevated>
          <q-icon name="visibility" left />
          View
        </q-btn>
        <q-btn rounded class="q-mr-sm text-label-medium" @click="editRoleGroup(props.data)" no-caps color="primary" outline>
          <q-icon name="edit" left />
          Edit
        </q-btn>
      </template>
    </g-table>
  </div>

  <!-- Role Group Create / Edit dialog -->
  <RoleGroupCreateEditDialog @close="this.$refs.table.refetch()" v-model="isRoleGroupCreateEditDialogOpen"
    :variant="dialogVariant" :roleGroupInfo="roleGroupInfo"></RoleGroupCreateEditDialog>

  <!-- View Role Group -->
  <RoleGroupViewDialog v-model="isViewRoleGroupDialog" :roleGroupId="roleGroupId" />
</template>

<script>
import { defineAsyncComponent } from 'vue';
import GTable from "../../../components/shared/display/GTable.vue";
import { api } from 'src/boot/axios';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const RoleGroupCreateEditDialog = defineAsyncComponent(() =>
  import('./dialogs/SettingsRoleGroupCreateEditDialog.vue')
);
const RoleGroupViewDialog = defineAsyncComponent(() =>
  import('./dialogs/SettingsRoleGroupViewDialog.vue')
);

export default {
  name: 'SettingsRoleGroup',
  components: { GTable, RoleGroupCreateEditDialog, RoleGroupViewDialog },
  data: () => ({
    isRoleGroupCreateEditDialogOpen: false,
    isViewRoleGroupDialog: false,
    dialogVariant: 'create',
    roleGroupInfo: {},
    roleGroupId: '',
  }),
  computed: {},
  methods: {
    openCreateDialog() {
      this.dialogVariant = 'create';
      this.isRoleGroupCreateEditDialogOpen = true;
    },
    editRoleGroup(data) {
      this.dialogVariant = 'edit';
      this.isRoleGroupCreateEditDialogOpen = true;
      this.roleGroupInfo = data;
    },
    viewRoleGroup(data) {
      this.isViewRoleGroupDialog = true;
      this.roleGroupId = data.id;
    },
    deleteRoleGroup(data) {
      try {
        if (!data.id || typeof data.id !== 'string') {
          throw new BadRequestException('Invalid role group ID');
        }

        const payload = {
          id: data.id,
        };

        this.$q.dialog({
          title: 'Delete Role Group',
          message: 'Are you sure you want to delete this role group?',
          ok: true,
          cancel: true,
        }).onOk(async () => {
          this.$q.loading.show();
          api.delete('/role-group', { data: payload }).then(() => {
            this.$refs.table.refetch();
          }).catch((error) => {
            this.handleAxiosError(error);
          }).finally(() => {
            this.$q.loading.hide();
          });
        });
      } catch (error) {
        this.handleAxiosError(error);
      }
    },
  },
};
</script>
