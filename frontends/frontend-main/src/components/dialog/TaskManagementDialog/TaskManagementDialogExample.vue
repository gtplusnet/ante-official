<template>
  <div class="example-container q-pa-md">
    <h2>Task Management Dialog Example</h2>

    <!-- Example button to open task management dialog -->
    <q-btn
      color="primary"
      icon="task"
      label="Task Management"
      @click="showTaskDialog = true"
      unelevated
    />

    <!-- Task Management Dialog -->
    <TaskManagementDialog
      v-model="showTaskDialog"
      :projectId="currentProjectId"
      :projectName="currentProjectName"
      filter="all"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { defineAsyncComponent } from 'vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TaskManagementDialog = defineAsyncComponent(() =>
  import('./TaskManagementDialog.vue')
);

export default defineComponent({
  name: 'TaskManagementDialogExample',
  components: {
    TaskManagementDialog
  },
  setup() {
    const showTaskDialog = ref(false);

    // Example project data
    const currentProjectId = ref(1); // Replace with actual project ID
    const currentProjectName = ref('Example Project'); // Replace with actual project name

    return {
      showTaskDialog,
      currentProjectId,
      currentProjectName
    };
  }
});
</script>

<style lang="scss" scoped>
.example-container {
  min-height: 200px;
}
</style>