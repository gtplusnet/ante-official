<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="group" />
        <div class="text-title-medium">Select User</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-table flat :rows="accountList" :columns="columns" row-key="id">
          <template v-slot:body-cell-image="props">
            <q-td :props="props" class="text-body-small">
              <q-img :src="props.row.image" style="width: 50px; height: 50px;" />
            </q-td>
          </template>
          <template v-slot:body-cell-select="props">
            <q-td :props="props">
              <q-btn unelevated rounded @click="selectUser(props.row)" label="Select" color="primary" class="text-label-medium" />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 800px;
  min-height: 480px;
}
</style>

<script>
import { api } from 'src/boot/axios';

export default {
  name: 'TemplateDialog',
  props: {
  },
  data: () => ({
    accountList: [],
    columns: [
      { name: 'image', label: 'Image', align: 'left', field: 'image' },
      { name: 'username', label: 'Username', align: 'left', field: 'username' },
      { name: 'firstName', label: 'First Name', align: 'left', field: 'firstName' },
      { name: 'lastName', label: 'Last Name', align: 'left', field: 'lastName' },
      { name: 'taskCount', label: 'Task Count', sortable: true, align: 'center', field: 'taskCount' },
      { name: 'select', label: 'Select', align: 'center' },
    ],
  }),
  watch: {
  },
  methods: {
    fetchData() {
      api.get('/task/users')
        .then((response) => {
          // Handle the new response format where users are in the 'items' property
          this.accountList = response.data.items || response.data.users || [];
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });
    },
    selectUser(user) {
      this.$refs.dialog.hide();
      this.$emit('userSelect', user);
    },
  },
};
</script>
