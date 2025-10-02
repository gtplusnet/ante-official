<template>
  <q-dialog @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <div class="row items-center q-pa-md">
        <q-icon name="o_task" size="20px" />
        <div class="text-title-medium q-ml-xs">Task Account Summary</div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </div>
      <q-separator />
      <q-card-section>
        <q-table flat :rows="accountList" :columns="columns" row-key="id" class="text-body-small">
          <template v-slot:body-cell-image="props">
            <q-td :props="props">
              <q-img :src="props.row.image" style="width: 50px; height: 50px" />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 1000px;
  border-radius: 16px;
}
</style>

<script>
import { api } from 'src/boot/axios';

export default {
  name: 'TemplateDialog',
  props: {},
  data: () => ({
    accountList: [],
    columns: [
      { name: 'image', label: 'Image', align: 'left', field: 'image' },
      { name: 'username', label: 'Username', align: 'left', field: 'username' },
      { name: 'firstName', label: 'First Name', align: 'left', field: 'firstName' },
      { name: 'lastName', label: 'Last Name', align: 'left', field: 'lastName' },
      {
        name: 'taskCount',
        label: 'Task Count',
        sortable: true,
        align: 'center',
        field: 'taskCount',
      },
      {
        name: 'totalDifficultyBy',
        label: 'Total Difficulty By',
        sortable: true,
        align: 'center',
        field: 'totalDifficultyBy',
      },
      {
        name: 'totalDifficultyTo',
        label: 'Total Difficulty To',
        sortable: true,
        align: 'center',
        field: 'totalDifficultyTo',
      },
    ],
  }),
  watch: {},
  methods: {
    fetchData() {
      api
        .get('/task/users')
        .then((response) => {
          // Handle the new response format where users are in the 'items' property
          this.accountList = response.data.items || response.data.users || [];
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });
    },
  },
};
</script>
