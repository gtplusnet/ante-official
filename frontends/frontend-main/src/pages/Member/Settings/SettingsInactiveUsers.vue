<template>
  <div class="page-head">
    <div class="title text-title-large">Inactive Users Management</div>
    <div class="actions">
      <q-btn class="text-label-large" @click="refreshTable()" color="primary" outline rounded>
        <q-icon size="14px" class="q-mr-xs" name="refresh"></q-icon>
        Refresh
      </q-btn>
    </div>
  </div>
  <div class="page-content q-mt-md text-body-small">
    <inactive-users-table ref="inactiveUsersTable" />
  </div>
</template>

<script>
import InactiveUsersTable from "../../../pages/Member/Settings/components/tables/SettingsInactiveUsersTable.vue";

export default {
  name: 'SettingsInactiveUsers',
  components: {
    InactiveUsersTable,
  },
  data: () => ({
  }),
  methods: {
    refreshTable() {
      this.$refs.inactiveUsersTable.refetch();
    },
  },
};
</script>