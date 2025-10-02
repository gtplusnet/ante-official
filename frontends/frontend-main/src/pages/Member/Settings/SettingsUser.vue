<template>
  <div>
    <div class="page-head">
      <div class="title text-title-large">User Management</div>
      <div class="actions">
        <q-btn 
          class="q-mr-sm text-label-large" 
          @click="downloadExcel()" 
          color="primary" 
          outline 
          rounded
        >
          <q-icon size="14px" class="q-mr-xs" name="vertical_align_bottom"></q-icon>
          Export to Excel
        </q-btn>

        <q-btn 
          class="q-mr-sm text-label-large" 
          @click="viewTree()" 
          color="primary" 
          outline 
          rounded
        >
          <q-icon size="14px" class="q-mr-xs" name="account_tree"></q-icon>
          Organization Tree
        </q-btn>

        <q-btn class="text-label-large" color="primary" @click="createUser()" unelevated rounded>
          <q-icon name="add" class="q-mr-xs" size="14px"></q-icon>
          Create User
        </q-btn>
      </div>
    </div>
    
    <div class="page-content q-mt-md">
      <user-table ref="userTable" />
      <!-- User Tree Dialog -->
      <user-tree-dialog v-model="isUserTreeDialogVisible" />
    </div>
  </div>
</template>

<script>
import UserTreeDialog from "./dialogs/SettingsUserTreeDialog.vue";
import UserTable from "./components/tables/SettingsUserTable.vue";
import { api } from 'src/boot/axios';

export default {
  name: 'SettingsUser',
  components: {
    UserTreeDialog,
    UserTable,
  },
  computed: {},
  data: () => ({
    userId: null,
    isUserTreeDialogVisible: false,
  }),
  methods: {
    downloadExcel() {
      api.get('/account/export-accounts-to-excel', { responseType: 'blob' }).then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'accounts.xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    },
    createUser() {
      this.$refs.userTable.openCreateDialog();
    },
    viewTree() {
      this.isUserTreeDialogVisible = true;
    },
    saveDone() {
      this.closeCreateDialog();
    },
  },
};
</script>
