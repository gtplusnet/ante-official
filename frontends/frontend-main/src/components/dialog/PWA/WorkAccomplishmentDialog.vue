<template>
  <q-dialog @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div class="text-title-medium">Work Accomplishment</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section>
        <div
          class="flex flex-center q-pa-lg column"
          v-if="isProjectStarted == false"
        >
          <p class="q-ma-sm text-label-medium">This Projects is not yet started.</p>
          <q-btn
            rounded
            @click="addEditWorkAccomplishment()"
            no-caps
            color="primary"
            unelevated
            class="text-label-large"
          >
            <q-icon class="q-mr-sm" size="20px" name="add"></q-icon> Start
            Project
          </q-btn>
        </div>
        <div v-else>
          <div class="row justify-end q-mb-md">
            <q-btn
              rounded
              class="q-mr-sm text-label-large"
              @click="addEditWorkAccomplishment()"
              no-caps
              color="primary"
              unelevated
            >
              <q-icon class="q-mr-sm" size="20px" name="add"></q-icon> Add
              Progress
            </q-btn>
          </div>
          <g-table
            :isRowActionEnabled="true"
            tableKey="accomplishment"
            apiUrl="project-accomplishment/table"
            :apiFilters="[{ project: projectAccomplishmentsData.id }]"
            ref="table"
          >
            <!-- slot action -->
            <template v-slot:row-actions="props">
              <q-btn
                rounded
                class="q-mr-sm text-label-large"
                @click="deleteProject(props.data)"
                no-caps
                color="red"
                outline
              >
                <q-icon class="q-mr-sm" size="20px" name="delete"></q-icon>
                Delete
              </q-btn>
            </template>
          </g-table>
        </div>
      </q-card-section>
    </q-card>

    <!-- Add Work Accomplishment -->
    <AddWorkAccomplishmentFormDialog
      @saveDone="saveDone()"
      @close="openAddWorkAccomplishmentForm = false"
      v-model="openAddWorkAccomplishmentForm"
      :workAccomplishmentFormData="workAccomplishmentFormData"
      :projectData="projectAccomplishmentsData"
      :projectId="projectId"
      :isProjectStarted="isProjectStarted"
    />
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 1000px;
}
</style>

<script>
import { defineAsyncComponent } from 'vue';
import GTable from "../../../components/shared/display/GTable.vue";
import { api } from 'src/boot/axios';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddWorkAccomplishmentFormDialog = defineAsyncComponent(() =>
  import('./AddEditWorkAccomplishmentFormDialog.vue')
);

export default {
  name: 'WorkAccomplishmentDialog',
  components: {
    GTable,
    AddWorkAccomplishmentFormDialog,
  },
  props: {
    projectAccomplishmentsData: {
      type: Object || null,
      default: null,
    },
  },
  data: () => ({
    openAddWorkAccomplishmentForm: false,
    workAccomplishmentFormData: null,
    isProjectStarted: false,
    projectId: null,
  }),
  watch: {},
  methods: {
    saveDone() {
      this.isProjectStarted = true;
      this.$refs.table.refetch();
    },
    addEditWorkAccomplishment(data) {
      this.workAccomplishmentFormData = data;
      this.projectId = this.projectAccomplishmentsData.id;
      this.openAddWorkAccomplishmentForm = true;
    },
    deleteProject(data) {
      console.log(data.id);
      this.$q
        .dialog({
          title: 'Confirm',
          message: 'Are you sure you want to delete?',
          ok: 'Yes',
          cancel: 'No',
          html: true,
        })
        .onOk(() => {
          this.deleteProjectId(data.id);
        });
    },
    deleteProjectId(id) {
      api
        .delete('project-accomplishment/delete?id=' + id)
        .then(() => {
          this.$refs.table.refetch();
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });
    },
    fetchData() {
      this.isProjectStarted = this.projectAccomplishmentsData.isProjectStarted;
    },
  },
};
</script>
