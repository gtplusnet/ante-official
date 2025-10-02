<template>
  <q-dialog @before-show="initialize">
    <TemplateDialog minWidth="1300px" dialogMinHeight="calc(100vh - 100px)">
      <template #DialogIcon>
        <q-icon name="o_task" size="24px" />
      </template>
      <template #DialogTitle>
        <div>{{ employeeName }} ({{ cutoffDateRange.startDate.date }} - {{ cutoffDateRange.endDate.date }})</div>
      </template>
      <template #DialogContent>
        <q-tabs
          v-model="tab"
          dense
          class="text-grey"
          active-color="primary"
          indicator-color="primary"
          align="justify"
          narrow-indicator
        >
          <q-tab name="timekeeping" label="Summary" />
          <q-tab name="rawlogs" label="Raw Logs" />
          <q-tab name="filings" label="Filings" />
          <q-tab name="conflicts" label="Conflicts" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab">
          <q-tab-panel name="timekeeping">
            <payroll-time-keeping-tab
              :employeeName="employeeName"
              :employeeAccountId="employeeAccountId"
              :cutoffDateRange="cutoffDateRange"
            />
          </q-tab-panel>
          <q-tab-panel name="rawlogs" class="q-panel-container">
            <payroll-time-keeping-raw-logs
              @simulation-completed="simulationCompleted"
              :employeeAccountId="employeeAccountId"
              :cutoffDateRange="cutoffDateRange"
            ></payroll-time-keeping-raw-logs>
          </q-tab-panel>
          <q-tab-panel name="filings" class="q-panel-container">
            <payroll-filings-tab :employeeAccountId="employeeAccountId" :cutoffDateRange="cutoffDateRange" />
          </q-tab-panel>
          <q-tab-panel name="conflicts" class="q-panel-container">
            <payroll-conflicts-tab :employeeAccountId="employeeAccountId" :cutoffDateRange="cutoffDateRange" />
          </q-tab-panel>
        </q-tab-panels>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style scoped lang="scss">
.q-panel-container {
  min-height: calc(100vh - 210px);
  max-height: calc(100vh - 210px);
  overflow-y: auto;

  &::-webkit-scrollbar {
    height: 8px;
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #d9d9d9;
    border-radius: 50px;
  }

  &::-webkit-scrollbar-track {
    background-color: #f4f4f4;
    border-radius: 50px;
  }
}
</style>

<style scoped lang="scss" src="./PayrollTimekeepingDialog.scss"></style>

<script lang="ts">
import { computed, ref, Ref } from "vue";
import { CutoffDateRangeResponse, TimekeepingOutputResponse } from "@shared/response";
import { useEmployeeTimekeepingStore } from "../../../../stores/employee-timekeeping.store";
import PayrollTimeKeepingRawLogs from "./PayrollTimeKeepingRawLogs.vue";
import { useQuasar } from "quasar";
import PayrollTimeKeepingTab from "./PayrollTimeKeepingTab.vue";
import PayrollFilingsTab from "./PayrollFilingsTab.vue";
import PayrollConflictsTab from "./PayrollConflictsTab.vue";
import TemplateDialog from "src/components/dialog/TemplateDialog.vue";

export default {
  name: "PayrollTimeKeepingDialog",
  components: {
    PayrollTimeKeepingRawLogs,
    PayrollTimeKeepingTab,
    PayrollFilingsTab,
    PayrollConflictsTab,
    TemplateDialog,
  },
  props: {
    employeeName: {
      type: String,
      required: true,
    },
    employeeAccountId: {
      type: String,
      required: true,
    },
    cutoffDateRange: {
      type: Object as () => CutoffDateRangeResponse,
      required: true,
    },
  },
  emits: ["simulation-completed"],
  setup(props, { emit }) {
    const $q = useQuasar();
    const employeeTimekeepingStore = useEmployeeTimekeepingStore();
    const selectedOutputData: Ref<TimekeepingOutputResponse | null> = ref(null);
    const isTimeKeepingSimulationOutputDialogOpen = ref(false);
    const isTimeKeepingOverrideDialogOpen = ref(false);
    const tab = ref("timekeeping");

    const cutoffDateRange = computed(() => props.cutoffDateRange);
    const employeeAccountId = computed(() => props.employeeAccountId);

    const initialize = () => {
      tab.value = "timekeeping";
      loadEmployeeTimekeeping();
    };

    const loadEmployeeTimekeeping = async () => {
      $q.loading.show({ message: "Loading timekeeping data..." });
      employeeTimekeepingStore.startLoading();
      employeeTimekeepingStore.setParams({
        cutoffDateRange: cutoffDateRange.value.key,
        employeeAccountId: employeeAccountId.value,
      });
      await employeeTimekeepingStore.requestData();
      $q.loading.hide();
    };

    const simulationCompleted = () => {
      emit("simulation-completed");
      loadEmployeeTimekeeping();
    };

    return {
      employeeTimekeepingStore,
      isTimeKeepingSimulationOutputDialogOpen,
      isTimeKeepingOverrideDialogOpen,
      selectedOutputData,
      tab,
      loadEmployeeTimekeeping,
      simulationCompleted,
      initialize,
    };
  },
};
</script>
