<template>
  <g-table :isRowActionEnabled="true" tableKey="account" apiUrl="/account" :apiFilters="[{ deleted: false }]"
    ref="table">
    <template v-slot:row-actions="props">
      <q-btn color="grey-7" round flat icon="more_horiz" @click.stop>
        <q-menu auto-close>
          <q-list style="min-width: 180px">
            <q-item clickable @click="editUser(props.data)">
              <q-item-section avatar>
                <q-icon name="edit" color="grey-7" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-label-medium">Edit User</q-item-label>
              </q-item-section>
            </q-item>
            
            <q-item clickable @click="changePassword(props.data)">
              <q-item-section avatar>
                <q-icon name="key" color="grey-7" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-label-medium">Change Password</q-item-label>
              </q-item-section>
            </q-item>
            
            <q-separator />
            
            <q-item clickable @click="deleteUser(props.data)">
              <q-item-section avatar>
                <q-icon name="delete" color="grey-7" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-label-medium">Delete</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </template>
  </g-table>

  <!-- Create/Edit User Dialog -->
  <user-create-edit-dialog :userId="userId" @saveDone="saveDone" v-model="isFormDialogOpen" :variant="dialogVariant"
    @close="closeCreateDialog" />

  <!-- User Tree Dialog -->
  <user-tree-dialog v-model="isUserTreeDialogVisible" />

  <!-- Change Password Dialog -->
  <change-password-dialog v-if="userId" :userId="userId" @saveDone="saveDone" v-model="isChangePasswordDialogOpen" />
</template>

<script>
import { defineAsyncComponent } from 'vue';
import GTable from "../../../../../components/shared/display/GTable.vue";
import { api } from 'src/boot/axios';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const UserCreateEditDialog = defineAsyncComponent(() =>
  import("../../../../../pages/Member/Settings/dialogs/SettingsUserCreateEditDialog.vue")
);
const UserTreeDialog = defineAsyncComponent(() =>
  import("../../../../../pages/Member/Settings/dialogs/SettingsUserTreeDialog.vue")
);
const ChangePasswordDialog = defineAsyncComponent(() =>
  import("../../../../../components/dialog/ChangePasswordDialog.vue")
);

export default {
  name: 'UserTable',
  components: {
    GTable,
    UserCreateEditDialog,
    UserTreeDialog,
    ChangePasswordDialog,
  },
  props: {
    variant: {
      type: String,
      default: 'create',
      validator: (value) => ['create', 'edit'].includes(value),
    },
  },
  computed: {},
  data: () => ({
    userId: null,
    isFormDialogOpen: false,
    isUserTreeDialogVisible: false,
    dialogVariant: 'create',
    isChangePasswordDialogOpen: false,
  }),
  methods: {
    viewTree() {
      this.isUserTreeDialogVisible = true;
    },
    changePassword(data) {
      this.userId = data.id;
      this.isChangePasswordDialogOpen = true;
    },
    editUser(data) {
      this.dialogVariant = 'edit';
      this.userId = data.id;
      this.isFormDialogOpen = true;
    },
    openCreateDialog() {
      this.dialogVariant = 'create';
      this.userId = null;
      this.isFormDialogOpen = true;
    },
    closeCreateDialog() {
      this.isFormDialogOpen = false;
      this.$refs.table.refetch();
    },
    saveDone() {
      this.closeCreateDialog();
    },
    deleteUser(data) {
      this.$q.dialog({
        title: 'Delete User',
        message: 'Are you sure you want to delete this user?',
        ok: true,
        cancel: true,
      }).onOk(() => {
        this.$q.loading.show();
        api.delete(`/account?id=${data.id}`).then(() => {
          this.$refs.table.refetch();
          this.$q.loading.hide();
        }).catch((error) => {
          this.handleAxiosError(error);
          this.$q.loading.hide();
        });
      });
    },
  },
};
</script>
