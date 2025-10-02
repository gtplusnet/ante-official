<template>
  <q-dialog ref="dialog" class="salary-employee-information-dialog">
    <TemplateDialog >
      <template #DialogIcon>
        <q-icon name="account_circle" size="24px" />
      </template>

      <template #DialogTitle>
        <div>Salary Computations Details - {{ employeeSalaryComputationData.employeeInformation.accountDetails.fullName }}</div>
      </template>

      <template #DialogContent>
        <div class="bot-tabs">
        <q-tabs v-model="activeTab" dense class="text-grey" active-color="primary" indicator-color="primary" align="justify" narrow-indicator>
          <template v-for="tab in tabList" :key="tab.key">
            <q-tab :name="tab.key" :label="tab.name" />
          </template>
        </q-tabs>
      </div>
      <div class="tab-content">
        <!-- Summary Tab -->
        <SummaryTab
          :key="`summary-${employeeSalaryComputationData.salaryComputation.timekeepingCutoffId}-${Date.now()}`"
          :employeeSalaryComputationData 
          :cutoffDateRangeId="cutoffInformation.key" 
          :cutoffInformation="cutoffInformation"
          v-if="activeTab == 'summary'" 
          @update:salary="handleSalaryUpdate" 
        />

        <!-- Time Sheet Tab -->
        <payroll-time-keeping-tab
          :readonly="true"
          :cutoffDateRange="cutoffInformation"
          :employeeName="employeeSalaryComputationData.employeeInformation.accountDetails.fullName || 'N/A'"
          :employeeAccountId="employeeSalaryComputationData.employeeInformation.accountDetails.id"
          v-if="activeTab == 'time_sheet'"
        />

        <!-- Timekeeping Raw Logs -->
        <payroll-time-keeping-raw-logs :readonly="true" v-if="activeTab == 'raw_logs'" :employeeAccountId="employeeSalaryComputationData.employeeInformation.accountDetails.id" :cutoffDateRange="cutoffInformation"></payroll-time-keeping-raw-logs>
        <payroll-salary-computation
          v-if="activeTab == 'salary_breakdown'"
          :timekeepingCutoffId="Number(employeeSalaryComputationData.salaryComputation.timekeepingCutoffId)"
          :accountId="employeeSalaryComputationData.employeeInformation.accountDetails.id"
          :cutoffDateRangeId="cutoffInformation.key"
        ></payroll-salary-computation>
      </div>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style src="./EmployeeSalaryInformationDialog.scss" scoped></style>

<script lang="ts">
import { ref } from 'vue';
import SummaryTab from './EmployeeTabMenu/SummaryTab.vue';
import PayrollTimeKeepingTab from "../../../../../../pages/Member/Manpower/Payroll/PayrollTimeKeepingTab.vue";
import PayrollTimeKeepingRawLogs from "../../../../../../pages/Member/Manpower/Payroll/PayrollTimeKeepingRawLogs.vue";
import PayrollSalaryComputation from "../../../../../../pages/Member/Manpower/Payroll/PayrollSalaryComputation/PayrollSalaryComputation.vue";
import type { CutoffDateRangeResponse, SalaryInformationListResponse } from "@shared/response";
import TemplateDialog from "src/components/dialog/TemplateDialog.vue";

export default {
  name: 'EmployeeInformationDialog',
  components: {
    SummaryTab,
    PayrollTimeKeepingTab,
    PayrollTimeKeepingRawLogs,
    PayrollSalaryComputation,
    TemplateDialog,
  },
  props: {
    cutoffInformation: {
      type: Object as () => CutoffDateRangeResponse,
      required: true,
    },
    employeeSalaryComputationData: {
      type: Object as () => SalaryInformationListResponse,
      required: true,
    },
  },
  emits: ['update:salary'],

  setup(props, { emit }) {
    const isViewSalaryBreakdownDialogOpen = ref(false);

    const activeTab = ref('summary');
    const tabList = [
      { name: 'Summary', key: 'summary' },
      { name: 'Time Sheet', key: 'time_sheet' },
      { name: 'RAW Logs', key: 'raw_logs' },
      { name: 'Salary Breakdown', key: 'salary_breakdown' },
    ];

    const isSalaryBreakdownOpen = () => {
      isViewSalaryBreakdownDialogOpen.value = true;
    };

    const handleSalaryUpdate = () => {
      // Emit the event to parent dialog to refresh the payroll list
      emit('update:salary');
    };

    return {
      isViewSalaryBreakdownDialogOpen,
      tabList,
      activeTab,
      isSalaryBreakdownOpen,
      handleSalaryUpdate,
    };
  },
};
</script>
