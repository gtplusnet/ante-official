<template>
  <div class="text-right">
    <q-btn @click="isUserSelectionDialogVisible = true" class="q-mb-sm text-label-large" color="primary" unelevated>
      <q-icon name="add" size="14px" class="q-mr-xs"></q-icon>
      Add Watchers
    </q-btn>
  </div>
  <div class="g-table">
    <table>
      <thead>
        <tr class="text-label-medium">
          <th class="text-left">Name</th>
          <th class="text-center">Role</th>
          <th class="text-center">Email</th>
          <th class="text-center">Type</th>
          <th class="text-center"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="collaborator in taskCollaborators" :key="collaborator.id" class="text-body-small">
          <td class="text-left">
            {{ collaborator.firstName }} {{ collaborator.lastName }}
          </td>
          <td class="text-center">{{ collaborator.role.name }}</td>
          <td class="text-center">{{ collaborator.email }}</td>
          <td class="text-center">{{ collaborator.watcherType.label }}</td>
          <td class="text-center">
            <q-btn @click="removeWatchers(collaborator.id)" color="red" rounded dense
              v-if="collaborator.watcherType.key == 'WATCHER'" flat>Remove</q-btn>
          </td>

        </tr>
      </tbody>
    </table>

    <!-- User Selection Dialog -->
    <UserSelectionDialog @userSelect="addWatcher" v-model="isUserSelectionDialogVisible" @close="fetchData"
      :taskInformation="taskInformation" />
  </div>
</template>

<style scoped src="../../../shared/display/GTable.scss"></style>

<script>
import { api } from 'boot/axios';
import UserSelectionDialog from '../../../../pages/Member/Settings/dialogs/SettingsUserSelectionDialog.vue';

export default {
  name: 'TaskCollaborators',
  components: {
    UserSelectionDialog,
  },
  props: {
    taskInformation: {
      type: Object,
      required: true,
    },
  },
  data: () => ({
    taskCollaborators: [],
    isUserSelectionDialogVisible: false,
  }),
  watch: {},
  mounted() {
    this.fetchData();
  },
  methods: {
    removeWatchers(accountId) {
      api
        .put('/task/remove-watcher', {
          taskId: this.taskInformation.id,
          accountId: accountId,
        })
        .then(() => {
          this.fetchData();
        });
    },
    addWatcher(data) {
      api
        .put('/task/add-watcher', {
          taskId: this.taskInformation.id,
          accountId: data.id,
        })
        .then(() => {
          this.fetchData();
        });
    },
    fetchData() {
      api
        .get(`/task/collaborators?taskId=${this.taskInformation.id}`)
        .then((response) => {
          // Handle the new response format where collaborators are in the 'items' property
          this.taskCollaborators = response.data.items || response.data.collaborators || [];
        });
    },
  },
};
</script>
