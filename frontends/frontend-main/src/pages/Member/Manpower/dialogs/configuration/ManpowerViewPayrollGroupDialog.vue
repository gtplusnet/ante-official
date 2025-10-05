<template>
  <q-dialog ref="dialog" @hide="fetchData">
    <TemplateDialog>
      <template #DialogIcon>
        <q-icon name="visibility" size="24px" class="q-pr-xs" />
      </template>
      <template #DialogTitle>
          View Payroll Group
      </template>
      <template #DialogContent>
          <div class="page-tabs q-my-md">
            <div
              v-for="tab in tabList"
              :class="tab.key === activeTab ? 'active' : ''"
              :key="tab.key"
              @click="activeTab = tab.key"
              class="tab"
            >
              {{ tab.name }}
            </div>
          </div>

        <div class="dialog-content">
            <!-- Basic -->
            <ViewPayrollGroupBasicTab
              :payroll-group-data="payrollGroupData"
              @update-computation="selectedComputation = $event"
              @update-payroll-code="updatePayrollCodeData"
              v-show="activeTab === 'basic'"
            />
            <!-- Deduction Basis -->
            <ViewPayrollGroupDeductionBasisTab
              :payroll-group-data="payrollGroupData"
              v-show="activeTab === 'deduction_basis'"
              @update-deduction-data="updateDeductionData"
            />
            <!-- Overtime Rates -->
            <ViewPayrollGroupOvertimeRatesTab
              :payroll-group-data="payrollGroupData"
              v-show="activeTab === 'overtime_rates'"
              @update-overtime-rates="updateOvertimeRates"
            />
            <!-- Shifting -->
            <ViewPayrollGroupShiftingTab
              :payroll-group-data="payrollGroupData"
              v-show="activeTab === 'shifting'"
              @update-shifting-data="updateShiftingData"
            />
          </div>

          <!-- Action Buttons -->
          <div class="row justify-end q-pa-md">
            <GButton
              class="q-mr-sm"
              variant="outline"
              label="Close"
              type="button"
              color="primary"
              v-close-popup
            />
            <GButton
              label="Edit"
              @click="this.$emit('edit', this.payrollGroupData)"
              type="button"
              color="primary"
              v-close-popup
            />
          </div>
    </template>
  </TemplateDialog>
  </q-dialog>
</template>

<style scoped src="./ManpowerPayrollGroupDialog.scss"></style>

<script>
import ViewPayrollGroupBasicTab from './ManpowerViewPayrollGroupDialog/ViewPayrollGroupBasicTab.vue';
import ViewPayrollGroupDeductionBasisTab from './ManpowerViewPayrollGroupDialog/ViewPayrollGroupDeductionBasisTab.vue';
import ViewPayrollGroupOvertimeRatesTab from './ManpowerViewPayrollGroupDialog/ViewPayrollGroupOvertimeRatesTab.vue';
import ViewPayrollGroupShiftingTab from './ManpowerViewPayrollGroupDialog/ViewPayrollGroupShiftingTab.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: 'ViewPayrollGroup',
  components: {
    ViewPayrollGroupBasicTab,
    ViewPayrollGroupDeductionBasisTab,
    ViewPayrollGroupOvertimeRatesTab,
    ViewPayrollGroupShiftingTab,
    TemplateDialog,
    GButton,
  },
  props: {
    payrollGroupData: {
      type: Object || null,
      default: null,
    },
  },
  data: () => ({
    activeTab: 'basic',
    tabList: [
      { key: 'basic', name: 'Basic' },
      { key: 'deduction_basis', name: 'Deduction Basis' },
      { key: 'overtime_rates', name: 'Overtime Rates' },
      { key: 'shifting', name: 'Shifting' },
    ],
    selectedComputation: 'FIXED_RATE',
    basisPayrollCode: '',
    cutOff: '',
    deductionData: {
      withholding: 'EVERY_PERIOD',
      sss: 'EVERY_PERIOD',
      philhealth: 'EVERY_PERIOD',
      pagibig: 'EVERY_PERIOD',
      SSSBasis: 'BASIC_SALARY',
      phicBasis: 'BASIC_SALARY',
      lateDeduction: {
        type: 'BASED_ON_SALARY',
        amount: '',
        timeBasis: '',
      },
      undertimeDeduction: {
        type: 'BASED_ON_SALARY',
        amount: '',
        timeBasis: '',
      },
      absentAmount: '',
    },
    overtimeRateFactors: null,
    shiftingData: {
      workingDays: 5,
      late: '15',
      under: '15',
      overTime: '15',
    },
  }),
  mounted() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.activeTab = 'basic';
    },
  },
};
</script>
