<template>
  <q-dialog ref="dialog" @hide="resetData" @before-show="fetchData" persistent>
    <TemplateDialog>
      <template #DialogTitle>
        {{ this.payrollGroupData ? "Edit" : "Create" }} Payroll Group
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
        <q-form @submit.prevent="save">
          <div class="dialog-content">
            <!-- Basic -->
            <div v-show="activeTab === 'basic'">
              <PayrollGroupDialogBasicTabPage
                :payroll-group-data="payrollGroupData"
                @update-computation="selectedComputation = $event"
                @update-payroll-code="updatePayrollCodeData"
              />
            </div>

            <!-- Deduction Basis -->
            <PayrollGroupDialogDeductionBasisTab
              :payroll-group-data="payrollGroupData"
              v-show="activeTab === 'deduction_basis'"
              @update-deduction-data="updateDeductionData"
            />
            <!-- Overtime Rates -->
            <PayrollGroupDialogOvertimeRatesTab
              :payroll-group-data="payrollGroupData"
              v-show="activeTab === 'overtime_rates'"
              @update-overtime-rates="updateOvertimeRates"
            />

            <!-- Shifting -->
            <PayrollGroupDialogShiftingTab
              :payroll-group-data="payrollGroupData"
              v-show="activeTab === 'shifting'"
              @update-shifting-data="updateShiftingData"
            />
          </div>
          <!-- Action Button -->
          <div class="q-pa-md">
            <div class="row justify-end q-gutter-sm">
              <GButton
                label="Cancel"
                type="button"
                color="primary"
                variant="outline"
                v-close-popup
                class="text-label-large"
              />
              <GButton
                :label="payrollGroupData ? 'Update' : 'Save'"
                type="submit"
                color="primary"
                class="text-label-large"
              />
            </div>
          </div>
        </q-form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style scoped src="./ManpowerPayrollGroupDialog.scss"></style>

<script>
import { defineAsyncComponent } from 'vue';
import { api } from "src/boot/axios";
import { handleAxiosError } from "src/utility/axios.error.handler";
import GButton from "src/components/shared/buttons/GButton.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const PayrollGroupDialogBasicTabPage = defineAsyncComponent(() =>
  import('./ManpowerPayrollGroupDialogTab/PayrollGroupDialogBasicTab.vue')
);
const PayrollGroupDialogDeductionBasisTab = defineAsyncComponent(() =>
  import('./ManpowerPayrollGroupDialogTab/PayrollGroupDialogDeductionBasisTab.vue')
);
const PayrollGroupDialogOvertimeRatesTab = defineAsyncComponent(() =>
  import('./ManpowerPayrollGroupDialogTab/PayrollGroupDialogOvertimeRatesTab.vue')
);
const PayrollGroupDialogShiftingTab = defineAsyncComponent(() =>
  import('./ManpowerPayrollGroupDialogTab/PayrollGroupDialogShiftingTab.vue')
);
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: "AddPayrollGroupDialog",
  components: {
    PayrollGroupDialogBasicTabPage,
    PayrollGroupDialogDeductionBasisTab,
    PayrollGroupDialogOvertimeRatesTab,
    PayrollGroupDialogShiftingTab,
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
    activeTab: "basic",
    tabList: [
      { key: "basic", name: "Basic" },
      { key: "deduction_basis", name: "Deduction Basis" },
      { key: "overtime_rates", name: "Overtime Rates" },
      { key: "shifting", name: "Shifting" },
    ],
    selectedComputation: "FIXED_RATE",
    basisPayrollCode: "",
    cutOff: "",
    deductionData: {
      withholding: "EVERY_PERIOD",
      sss: "EVERY_PERIOD",
      philhealth: "EVERY_PERIOD",
      pagibig: "EVERY_PERIOD",
      SSSBasis: "BASIC_SALARY",
      phicBasis: "BASIC_SALARY",
      lateDeduction: {
        type: "BASED_ON_SALARY",
        amount: "",
        timeBasis: "",
      },
      undertimeDeduction: {
        type: "BASED_ON_SALARY",
        amount: "",
        timeBasis: "",
      },
      absentAmount: "",
    },
    overtimeRateFactors: null,
    shiftingData: {
      workingDays: 5,
      late: "15",
      under: "15",
      overTime: "15",
    },
  }),
  methods: {
    updatePayrollCodeData(data) {
      this.basisPayrollCode = data.payrollCode;
      this.cutOff = data.cutOff;
    },
    updateDeductionData(data) {
      this.deductionData = { ...this.deductionData, ...data };
    },
    updateOvertimeRates(data) {
      this.overtimeRateFactors = data;
    },
    updateShiftingData(data) {
      this.shiftingData = { ...data };
    },
    async save() {
      this.$q.loading.show();

      if (this.payrollGroupData) {
        await this.apiUpdate();
      } else {
        await this.apiSave();
      }
    },

    apiSave() {
      const params = {
        payrollGroupCode: this.basisPayrollCode,
        cutoffId: this.cutOff,
        salaryRateType: this.selectedComputation,
        deductionPeriodWitholdingTax: this.deductionData.withholding,
        deductionPeriodSSS: this.deductionData.sss,
        deductionPeriodPhilhealth: this.deductionData.philhealth,
        deductionPeriodPagibig: this.deductionData.pagibig,
        deductionBasisSSS: this.deductionData.SSSBasis,
        deductionBasisPhilhealth: this.deductionData.phicBasis,
        lateDeductionType: this.deductionData.lateDeduction.type,
        lateDeductionCustom: {
          amount: parseFloat(this.deductionData.lateDeduction.amount || 0),
          timeBasis: this.deductionData.lateDeduction.timeBasis || "PER_MINUTE",
        },
        undertimeDeductionType: this.deductionData.undertimeDeduction.type,
        undertimeDeductionCustom: {
          amount: parseFloat(this.deductionData.undertimeDeduction.amount || 0),
          timeBasis:
            this.deductionData.undertimeDeduction.timeBasis || "PER_MINUTE",
        },
        absentDeductionHours: parseFloat(this.deductionData.absentAmount || 0),
        shiftingWorkingDaysPerWeek: parseInt(
          this.shiftingData.workingDays || 6
        ),
        lateGraceTimeMinutes: parseInt(this.shiftingData.late || 15),
        undertimeGraceTimeMinutes: parseInt(this.shiftingData.under || 15),
        overtimeGraceTimeMinutes: parseInt(this.shiftingData.overTime || 15),
        overtimeRateFactors: this.overtimeRateFactors || {
          workDay: {
            nonHoliday: {
              noOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.nonHoliday.noOvertime
              ),
              withOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.nonHoliday.withOvertime
              ),
              withNightDifferential: parseFloatOrZero(
                this.overtimeRateFactors.workDay.nonHoliday
                  .withNightDifferential
              ),
              withNightDifferentialAndOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.nonHoliday
                  .withNightDifferentialAndOvertime
              ),
            },
            regularHoliday: {
              noOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.regularHoliday.noOvertime
              ),
              withOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.regularHoliday.withOvertime
              ),
              withNightDifferential: parseFloatOrZero(
                this.overtimeRateFactors.workDay.regularHoliday
                  .withNightDifferential
              ),
              withNightDifferentialAndOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.regularHoliday
                  .withNightDifferentialAndOvertime
              ),
            },
            specialHoliday: {
              noOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.specialHoliday.noOvertime
              ),
              withOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.specialHoliday.withOvertime
              ),
              withNightDifferential: parseFloatOrZero(
                this.overtimeRateFactors.workDay.specialHoliday
                  .withNightDifferential
              ),
              withNightDifferentialAndOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.specialHoliday
                  .withNightDifferentialAndOvertime
              ),
            },
            doubleHoliday: {
              noOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.doubleHoliday.noOvertime
              ),
              withOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.doubleHoliday.withOvertime
              ),
              withNightDifferential: parseFloatOrZero(
                this.overtimeRateFactors.workDay.doubleHoliday
                  .withNightDifferential
              ),
              withNightDifferentialAndOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.doubleHoliday
                  .withNightDifferentialAndOvertime
              ),
            },
          },
          restDay: {
            nonHoliday: {
              noOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.nonHoliday.noOvertime
              ),
              withOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.nonHoliday.withOvertime
              ),
              withNightDifferential: parseFloatOrZero(
                this.overtimeRateFactors.restDay.nonHoliday
                  .withNightDifferential
              ),
              withNightDifferentialAndOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.nonHoliday
                  .withNightDifferentialAndOvertime
              ),
            },
            regularHoliday: {
              noOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.regularHoliday.noOvertime
              ),
              withOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.regularHoliday.withOvertime
              ),
              withNightDifferential: parseFloatOrZero(
                this.overtimeRateFactors.restDay.regularHoliday
                  .withNightDifferential
              ),
              withNightDifferentialAndOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.regularHoliday
                  .withNightDifferentialAndOvertime
              ),
            },
            specialHoliday: {
              noOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.specialHoliday.noOvertime
              ),
              withOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.specialHoliday.withOvertime
              ),
              withNightDifferential: parseFloatOrZero(
                this.overtimeRateFactors.restDay.specialHoliday
                  .withNightDifferential
              ),
              withNightDifferentialAndOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.specialHoliday
                  .withNightDifferentialAndOvertime
              ),
            },
            doubleHoliday: {
              noOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.doubleHoliday.noOvertime
              ),
              withOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.doubleHoliday.withOvertime
              ),
              withNightDifferential: parseFloatOrZero(
                this.overtimeRateFactors.restDay.doubleHoliday
                  .withNightDifferential
              ),
              withNightDifferentialAndOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.doubleHoliday
                  .withNightDifferentialAndOvertime
              ),
            },
          },
        },
      };

      api
        .post("hr-configuration/payroll-group/create", params)
        .then(() => {
          this.$q.loading.hide();
          this.$emit("saveDone");
          this.$refs.dialog.hide();
        })
        .catch((error) => {
          handleAxiosError(this.$q, error);
        })
        .finally(() => {
          this.$q.loading.hide();
        });
    },
    apiUpdate() {
      const updateParams = {
        id: this.payrollGroupData.data.id,
        cutoffId: this.cutOff,
        salaryRateType: this.selectedComputation,
        deductionPeriodWitholdingTax: this.deductionData.withholding,
        deductionPeriodSSS: this.deductionData.sss,
        deductionPeriodPhilhealth: this.deductionData.philhealth,
        deductionPeriodPagibig: this.deductionData.pagibig,
        deductionBasisSSS: this.deductionData.SSSBasis,
        deductionBasisPhilhealth: this.deductionData.phicBasis,
        lateDeductionType: this.deductionData.lateDeduction.type,
        lateDeductionCustom: {
          amount: parseFloat(this.deductionData.lateDeduction.amount || 0),
          timeBasis: this.deductionData.lateDeduction.timeBasis || "PER_MINUTE",
        },
        undertimeDeductionType: this.deductionData.undertimeDeduction.type,
        undertimeDeductionCustom: {
          amount: parseFloat(this.deductionData.undertimeDeduction.amount || 0),
          timeBasis:
            this.deductionData.undertimeDeduction.timeBasis || "PER_MINUTE",
        },
        absentDeductionHours: parseFloat(this.deductionData.absentAmount || 0),
        shiftingWorkingDaysPerWeek: parseInt(
          this.shiftingData.workingDays || 6
        ),
        lateGraceTimeMinutes: parseInt(this.shiftingData.late || 15),
        undertimeGraceTimeMinutes: parseInt(this.shiftingData.under || 15),
        overtimeGraceTimeMinutes: parseInt(this.shiftingData.overTime || 15),
        overtimeRateFactors: this.overtimeRateFactors || {
          workDay: {
            nonHoliday: {
              noOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.nonHoliday.noOvertime
              ),
              withOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.nonHoliday.withOvertime
              ),
              withNightDifferential: parseFloatOrZero(
                this.overtimeRateFactors.workDay.nonHoliday
                  .withNightDifferential
              ),
              withNightDifferentialAndOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.nonHoliday
                  .withNightDifferentialAndOvertime
              ),
            },
            regularHoliday: {
              noOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.regularHoliday.noOvertime
              ),
              withOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.regularHoliday.withOvertime
              ),
              withNightDifferential: parseFloatOrZero(
                this.overtimeRateFactors.workDay.regularHoliday
                  .withNightDifferential
              ),
              withNightDifferentialAndOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.regularHoliday
                  .withNightDifferentialAndOvertime
              ),
            },
            specialHoliday: {
              noOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.specialHoliday.noOvertime
              ),
              withOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.specialHoliday.withOvertime
              ),
              withNightDifferential: parseFloatOrZero(
                this.overtimeRateFactors.workDay.specialHoliday
                  .withNightDifferential
              ),
              withNightDifferentialAndOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.specialHoliday
                  .withNightDifferentialAndOvertime
              ),
            },
            doubleHoliday: {
              noOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.doubleHoliday.noOvertime
              ),
              withOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.doubleHoliday.withOvertime
              ),
              withNightDifferential: parseFloatOrZero(
                this.overtimeRateFactors.workDay.doubleHoliday
                  .withNightDifferential
              ),
              withNightDifferentialAndOvertime: parseFloatOrZero(
                this.overtimeRateFactors.workDay.doubleHoliday
                  .withNightDifferentialAndOvertime
              ),
            },
          },
          restDay: {
            nonHoliday: {
              noOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.nonHoliday.noOvertime
              ),
              withOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.nonHoliday.withOvertime
              ),
              withNightDifferential: parseFloatOrZero(
                this.overtimeRateFactors.restDay.nonHoliday
                  .withNightDifferential
              ),
              withNightDifferentialAndOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.nonHoliday
                  .withNightDifferentialAndOvertime
              ),
            },
            regularHoliday: {
              noOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.regularHoliday.noOvertime
              ),
              withOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.regularHoliday.withOvertime
              ),
              withNightDifferential: parseFloatOrZero(
                this.overtimeRateFactors.restDay.regularHoliday
                  .withNightDifferential
              ),
              withNightDifferentialAndOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.regularHoliday
                  .withNightDifferentialAndOvertime
              ),
            },
            specialHoliday: {
              noOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.specialHoliday.noOvertime
              ),
              withOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.specialHoliday.withOvertime
              ),
              withNightDifferential: parseFloatOrZero(
                this.overtimeRateFactors.restDay.specialHoliday
                  .withNightDifferential
              ),
              withNightDifferentialAndOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.specialHoliday
                  .withNightDifferentialAndOvertime
              ),
            },
            doubleHoliday: {
              noOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.doubleHoliday.noOvertime
              ),
              withOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.doubleHoliday.withOvertime
              ),
              withNightDifferential: parseFloatOrZero(
                this.overtimeRateFactors.restDay.doubleHoliday
                  .withNightDifferential
              ),
              withNightDifferentialAndOvertime: parseFloatOrZero(
                this.overtimeRateFactors.restDay.doubleHoliday
                  .withNightDifferentialAndOvertime
              ),
            },
          },
        },
      };

      api
        .patch("hr-configuration/payroll-group/update", updateParams)
        .then(() => {
          this.$q.loading.hide();
          this.$emit("saveDone");
          this.$refs.dialog.hide();
        })
        .catch((error) => {
          this.handleAxiosError(error);
          this.$q.loading.hide();
        });
    },
    parseFloatOrZero(value) {
      return parseFloat(value || 0);
    },

    fetchData() {
      this.$q.loading.show();

      if (this.payrollGroupData) {
        this.payrollCode = this.payrollGroupData.data.payrollGroupCode;
        this.cutOff = this.payrollGroupData.data.cutoff.id;
        this.selectedComputation =
          this.payrollGroupData.data.salaryRateType.key;
      }
      this.$q.loading.hide();
    },

    resetData() {
      this.activeTab = "basic";
      this.selectedComputation = "FIXED_RATE";
      this.basisPayrollCode = "";
      this.cutOff = "";
      this.deductionData = {
        withholding: "EVERY_PERIOD",
        sss: "EVERY_PERIOD",
        philhealth: "EVERY_PERIOD",
        pagibig: "EVERY_PERIOD",
        SSSBasis: "BASIC_SALARY",
        phicBasis: "BASIC_SALARY",
        lateDeduction: {
          type: "BASED_ON_SALARY",
          amount: "",
          timeBasis: "",
        },
        undertimeDeduction: {
          type: "BASED_ON_SALARY",
          amount: "",
          timeBasis: "",
        },
        absentAmount: "",
      };
      this.overtimeRateFactors = null;
      this.shiftingData = {
        workingDays: 5,
        late: "15",
        under: "15",
        overTime: "15",
      };
    },
  },
};
</script>
