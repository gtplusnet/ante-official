<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog maxWidth="800px">
      <template #DialogIcon>
          <q-icon name="list" size="30px" />
      </template>
      <template #DialogTitle>
        <div>{{ editData ? 'Edit Raw Logs' : 'Create Raw Logs' }}</div>
      </template>
      <template #DialogContent>
        <TimeKeepingSimulationForm
        @simulation-completed="simulationComplete"
        :editData="editData"
        :employeeAccountId="employeeAccountId"
        :cutoffDateRange="cutoffDateRange"
      />
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style scoped lang="scss">
</style>

<script>
import { api } from 'src/boot/axios';
import TimeKeepingSimulationForm from '../TimeKeepingSimulation/TimeKeepingSimulationForm.vue';
import TemplateDialog from 'src/components/dialog/TemplateDialog.vue';

export default {
  name: 'PayrollTimeKeepingRawLogsCreateDialog',
  props: {
    employeeAccountId: {
      type: String,
      required: true,
    },
    cutoffDateRange: {
      type: Object,
      required: true,
    },
    editData: {
      type: Object,
      default: null,
    },
  },
  components: {
    TimeKeepingSimulationForm,
    TemplateDialog,
  },
  data: () => ({
    form: {},
  }),
  methods: {
    simulationComplete() {
      this.$emit('simulation-completed', this.form);
    },
    submitRequest() {
      api
        .post('url', this.form)
        .then(() => {
          this.$refs.dialog.hide();
          this.$emit('saveDone');
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });
    },
    fetchData() {
      this.form = {};
    },
    resetList() {
      resetList();
    },
    addTime() {
      addTime();
    },
    submitForSimulation() {
      submitForSimulation();
    },
  },
};
</script>
