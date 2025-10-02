<template>
  <g-table 
    :isRowActionEnabled="true" 
    tableKey="account" 
    apiUrl="/account" 
    :apiFilters="[{ deleted: true }]"
    ref="table"
  >
    <template v-slot:row-actions="props">
      <q-btn class="q-mr-sm text text-label-medium" rounded @click="restoreUser(props.data)" no-caps color="primary" unelevated>
        <q-icon class="q-mr-sm" size="20px" name="restore"></q-icon> 
        Restore
      </q-btn>
    </template>
  </g-table>
</template>

<script>
import GTable from "../../../../../components/shared/display/GTable.vue";
import { api } from 'src/boot/axios';

export default {
  name: 'InactiveUsersTable',
  components: {
    GTable,
  },
  data: () => ({
    userId: null,
  }),
  methods: {
    restoreUser(data) {
      this.$q.dialog({
        title: 'Restore User',
        message: `Are you sure you want to restore the user "${data.name}"? This will reactivate their account.`,
        ok: {
          label: 'Restore',
          color: 'primary',
        },
        cancel: true,
      }).onOk(() => {
        this.$q.loading.show();
        api.post('/account/restore', {
          id: data.id,
        }).then(() => {
          this.$q.notify({
            type: 'positive',
            message: 'User restored successfully',
          });
          this.refetch();
          this.$q.loading.hide();
        }).catch((error) => {
          this.handleAxiosError(error);
          this.$q.loading.hide();
        });
      });
    },
    refetch() {
      this.$refs.table.refetch();
    },
  },
};
</script>