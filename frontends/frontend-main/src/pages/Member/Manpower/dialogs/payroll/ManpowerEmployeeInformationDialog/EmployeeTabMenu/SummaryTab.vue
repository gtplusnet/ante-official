<template>
  <div class="relative-position">
    <!-- Loading overlay -->
    <q-inner-loading :showing="isRecomputing">
      <q-spinner-gears size="50px" color="primary" />
      <div class="q-mt-md">Recomputing salary...</div>
    </q-inner-loading>

    <!-- Data loading state -->
    <div v-if="!isDataLoaded" class="q-pa-lg text-center">
      <q-spinner-dots size="50px" color="primary" />
      <div class="q-mt-md">Loading salary details...</div>
    </div>

    <div v-else class="summary-container">
      <div class="row items-center justify-end">
        <div class="netPay col-6 row justify-between rounded-borders q-pa-sm q-px-md">
          <span class="text-body1 text-bold">Net Pay:</span>
          <span class="text-body1">
            <amount-view :showCurrency="true" :amount="netPayDisplay" />
          </span>
        </div>
      </div>
      <div class="summary-part row q-col-gutter-sm q-pt-sm">
        <!-- Left Column -->
        <div class="col-6">
          <div flat bordered class="card part1 q-pa-md">
            <!-- Basic Salary -->
            <div class="row items-center justify-between q-pb-sm">
              <div class="text-body1 text-bold">Basic Salary</div>
              <div class="text-body2">
                <amount-view :amount="employeeSalaryComputationData.salaryComputation.summary.totalBasicSalary" />
              </div>
            </div>

            <div class="divider"></div>

            <div class="row items-center justify-between q-pb-sm">
              <div class="text-body1 text-bold">Time Deductions</div>
            </div>

            <!-- Late -->
            <div v-if="employeeSalaryComputationData.salaryComputation.summary?.salaryRateType?.key !== 'FIXED_RATE'">
              <div class="row items-center justify-between">
                <div>Late</div>
                <div>
                  <amount-view :amount="employeeSalaryComputationData.salaryComputation.summary.deductions.late" />
                </div>
              </div>
              <!-- Absent -->
              <div class="row items-center justify-between">
                <div>Absent</div>
                <div>
                  <amount-view :amount="employeeSalaryComputationData.salaryComputation.summary.deductions.absent" />
                </div>
              </div>
              <!-- Undertime -->
              <div class="row items-center justify-between">
                <div>Undertime</div>
                <div>
                  <amount-view :amount="employeeSalaryComputationData.salaryComputation.summary.deductions.undertime" />
                </div>
              </div>

              <!-- Total Time Deductions -->
              <div class="row items-center justify-end q-pb-sm q-pt-sm">
                <div class="text-body2 text-bold q-pr-sm">Total Time Deductions:</div>
                <div class="text-body2">
                  <amount-view :amount="employeeSalaryComputationData.salaryComputation.summary.totalDeduction" />
                </div>
              </div>

              <div class="divider"></div>

              <!-- Basic Pay -->
              <div class="row items-center justify-between q-py-sm">
                <div class="text-body1 text-bold">Basic Pay</div>
                <div class="text-body2">
                  <amount-view :amount="employeeSalaryComputationData.salaryComputation.summary.basicPay" />
                </div>
              </div>

              <div class="divider"></div>

              <!-- Holiday Pay -->
              <div>
                <div class="row items-center justify-between q-pb-xs">
                  <div class="text-subtitle2">Holiday Pay</div>
                </div>
                <div class="row items-center justify-between">
                  <div class="q-pl-md">Special Holiday</div>
                  <div class="q-pl-md">
                    <amount-view
                      :amount="
                        employeeSalaryComputationData.salaryComputation.summary.additionalEarnings.specialHoliday
                      "
                    />
                  </div>
                </div>
                <div class="row items-center justify-between q-pb-sm">
                  <div class="q-pl-md">Regular Holiday</div>
                  <div class="q-pl-md">
                    <amount-view
                      :amount="
                        employeeSalaryComputationData.salaryComputation.summary.additionalEarnings.regularHoliday
                      "
                    />
                  </div>
                </div>
              </div>
              <!-- Overtime Pay -->
              <div>
                <div class="row items-center justify-between q-pb-xs">
                  <div class="text-subtitle2">Overtime Pay</div>
                </div>
                <div class="row items-center justify-between">
                  <div class="q-pl-md">Ordinary Day OT</div>
                  <div>
                    <amount-view
                      :amount="employeeSalaryComputationData.salaryComputation.summary.additionalEarnings.overtime"
                    />
                  </div>
                </div>
                <div class="row items-center justify-between">
                  <div class="q-pl-md">Night Differential OT</div>
                  <div>
                    <amount-view
                      :amount="
                        employeeSalaryComputationData.salaryComputation.summary.additionalEarnings
                          .nightDifferentialOvertime
                      "
                    />
                  </div>
                </div>
                <div class="row items-center justify-between q-pb-sm">
                  <div class="q-pl-md">Rest Day OT</div>
                  <div>
                    <amount-view
                      :amount="employeeSalaryComputationData.salaryComputation.summary.additionalEarnings.restDay"
                    />
                  </div>
                </div>
              </div>
              <!-- Night Differential Pay -->
              <div class="row items-center justify-between q-pb-sm">
                <div class="text-subtitle2">Night Differential Pay</div>
                <div>
                  <amount-view
                    :amount="
                      employeeSalaryComputationData.salaryComputation.summary.additionalEarnings.nightDifferential
                    "
                  />
                </div>
              </div>

              <!-- Total Earnings -->
              <div class="row items-center justify-end q-pb-sm">
                <div class="text-body2 text-bold q-pr-sm">Total Earnings:</div>
                <div class="text-body2">
                  <amount-view
                    :amount="
                      employeeSalaryComputationData.salaryComputation.summary.taxComputationBreakdown.totalEarnings
                    "
                  />
                </div>
              </div>
            </div>
            <div class="divider"></div>

            <!-- Allowance -->
            <div class="row items-center justify-between q-pb-sm">
              <div class="text-body1 text-bold">Allowance</div>
            </div>

            <!-- Taxable Allowances -->
            <div class="q-mb-sm">
              <div class="text-subtitle2 q-mb-xs">Taxable</div>
              <template v-if="taxableAllowances.length > 0">
                <div
                  v-for="allowance in taxableAllowances"
                  :key="allowance.id"
                  class="row items-center justify-between full-width q-pl-md hoverable-item"
                >
                  <div>{{ allowance.title }} {{ allowance.isAdjusted ? "- Adjustment" : "" }}</div>
                  <div class="row items-center">
                    <q-icon
                      v-if="allowance.isAdjusted && allowance.originalIndex >= 0"
                      name="close"
                      size="16px"
                      class="q-mr-sm text-white bg-red rounded-borders cursor-pointer hover-icon"
                      @click="removeAllowance(allowance.originalIndex)"
                    />
                    <div>
                      {{
                        allowance.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })
                      }}
                    </div>
                  </div>
                </div>
              </template>
              <div v-else class="q-pl-md text-grey text-italic">No taxable allowances</div>
            </div>

            <!-- De Minimis Allowances -->
            <div class="q-mb-sm">
              <div class="text-subtitle2 q-mb-xs">De Minimis</div>
              <template v-if="deMinimisAllowances.length > 0">
                <div
                  v-for="allowance in deMinimisAllowances"
                  :key="allowance.id"
                  class="row items-center justify-between full-width q-pl-md hoverable-item"
                >
                  <div>{{ allowance.title }} {{ allowance.isAdjusted ? "- Adjustment" : "" }}</div>
                  <div class="row items-center">
                    <q-icon
                      v-if="allowance.isAdjusted && allowance.originalIndex >= 0"
                      name="close"
                      size="16px"
                      class="q-mr-sm text-white bg-red rounded-borders cursor-pointer hover-icon"
                      @click="removeAllowance(allowance.originalIndex)"
                    />
                    <div>
                      {{
                        allowance.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })
                      }}
                    </div>
                  </div>
                </div>
              </template>
              <div v-else class="q-pl-md text-grey text-italic">No de minimis allowances</div>
            </div>

            <!-- Non-Taxable Allowances -->
            <div class="q-mb-sm">
              <div class="text-subtitle2 q-mb-xs">Non-Taxable</div>
              <template v-if="nonTaxableAllowances.length > 0">
                <div
                  v-for="allowance in nonTaxableAllowances"
                  :key="allowance.id"
                  class="row items-center justify-between full-width q-pl-md hoverable-item"
                >
                  <div :class="{ 'text-black': allowance.isAdjusted }">
                    {{ allowance.title }} {{ allowance.isAdjusted ? "- Adjustment" : "" }}
                  </div>
                  <div class="row items-center">
                    <q-icon
                      v-if="allowance.isAdjusted && allowance.originalIndex >= 0"
                      name="close"
                      size="16px"
                      class="q-mr-sm text-white bg-red rounded-borders cursor-pointer hover-icon"
                      @click="removeAllowance(allowance.originalIndex)"
                    />
                    <div :class="{ 'text-black': allowance.isAdjusted }">
                      {{
                        allowance.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })
                      }}
                    </div>
                  </div>
                </div>
              </template>
              <div v-else class="q-pl-md text-grey text-italic">No non-taxable allowances</div>
            </div>

            <!-- Total Allowance -->
            <div class="row items-center justify-end q-pb-sm q-pt-sm">
              <div class="text-body2 text-bold q-pr-sm">Total Allowance:</div>
              <div class="text-body2">
                <amount-view :amount="totalAllowanceDisplay" />
              </div>
            </div>

            <div class="divider"></div>
            <!-- Manual Adjustment -->
            <div class="row items-center justify-between q-pb-sm">
              <div class="text-body1 text-bold">Manual Adjustment</div>
            </div>
            <div class="row items-center justify-between" v-if="salaryAdjustments.length">
              <div
                v-for="(adjust, index) in salaryAdjustments"
                :key="`adjust-${index}`"
                class="row items-center justify-between full-width hoverable-item"
              >
                <div>{{ adjust.title }}</div>
                <div class="row items-center">
                  <q-icon
                    name="close"
                    size="16px"
                    class="q-mr-sm text-white bg-red rounded-borders cursor-pointer hover-icon"
                    @click="removeSalaryAdjustment(index)"
                  />
                  <div>
                    {{
                      adjust.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })
                    }}
                  </div>
                </div>
              </div>
            </div>
            <div class="row items-center justify-end q-pt-sm">
              <div class="text-body2 text-bold q-pr-sm">Total Adjustment:</div>
              <div class="text-body2">
                <amount-view :amount="totalSalaryAdjustmentDisplay" />
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="col-6">
          <div flat bordered class="summary-left-right q-pa-md card">
            <div class="row items-center justify-between q-pb-sm">
              <div class="text-body1 text-bold">Gross Pay</div>
              <div class="text-body2">
                <amount-view :amount="grossPayDisplay" />
              </div>
            </div>

            <div class="divider"></div>

            <div class="row items-center q-pb-xs">
              <div class="text-body1 text-bold">Government Contributions</div>
            </div>

            <!-- SSS -->
            <div class="row items-center justify-between">
              <div class="q-pl-md">SSS</div>
              <div>
                <amount-view :amount="employeeSalaryComputationData.salaryComputation.summary.contributions.sss" />
              </div>
            </div>

            <!-- Philhealth -->
            <div class="row items-center justify-between">
              <div class="q-pl-md">Philhealth</div>
              <div>
                <amount-view
                  :amount="employeeSalaryComputationData.salaryComputation.summary.contributions.philhealth"
                />
              </div>
            </div>

            <!-- Pag-ibig -->
            <div class="row items-center justify-between">
              <div class="q-pl-md">Pag-ibig</div>
              <div>
                <amount-view :amount="employeeSalaryComputationData.salaryComputation.summary.contributions.pagibig" />
              </div>
            </div>
            <!-- Tax -->
            <div class="row items-center justify-between q-pb-sm">
              <div class="q-pl-md">Tax</div>
              <div>
                <amount-view
                  :amount="employeeSalaryComputationData.salaryComputation.summary.contributions.withholdingTax"
                />
              </div>
            </div>

            <!-- Total Government Contributions -->
            <div class="row items-center justify-end q-pb-sm">
              <div class="text-body2 text-bold q-pr-sm">Total Government Contributions:</div>
              <div class="text-body2">
                <amount-view
                  :amount="employeeSalaryComputationData.salaryComputation.summary.totalGovernmentContribution"
                />
              </div>
            </div>

            <div class="divider"></div>

            <!-- Loans and Deductions -->
            <div class="row items-center justify-between q-pb-sm">
              <div class="text-body1 text-bold">Loans & Deductions</div>
            </div>

            <!-- Loans -->
            <div class="q-pb-sm">
              <div class="row items-center justify-between q-pb-sm">
                <div>Loans</div>
              </div>
              <template v-if="loans.length > 0">
                <template v-for="loan in loans" :key="loan.id">
                  <div class="row items-center justify-between">
                    <div class="q-pl-md">
                      {{
                        `${loan.deductionPlan.deductionConfiguration.name} -
                      ${loan.deductionPlan.planCode}`
                      }}
                    </div>
                    <div>
                      <EditableSpan :model-value="loan.amount">
                        <template #default="{ value }">
                          <amount-view :amount="value" />
                        </template>
                      </EditableSpan>
                    </div>
                  </div>
                </template>
              </template>
              <template v-else>
                <div class="text-grey text-italic q-ml-md">No Loans</div>
              </template>
            </div>

            <!-- Deductions -->
            <div>
              <div class="row items-center justify-between q-py-sm">
                <div>Deductions</div>
              </div>
              <template v-if="deductions.length || deduction.length">
                <template v-for="deduct in deductions" :key="deduct.id">
                  <div class="row items-center justify-between">
                    <div class="q-pl-md">
                      {{
                        `${deduct.deductionPlan.deductionConfiguration.name} -
                      ${deduct.deductionPlan.planCode}`
                      }}
                    </div>
                    <div>
                      <EditableSpan :model-value="deduct.amount">
                        <template #default="{ value }">
                          <amount-view :amount="value" />
                        </template>
                      </EditableSpan>
                    </div>
                  </div>
                </template>
                <template v-for="(deduct, index) in deduction" :key="`adjusted-${index}`">
                  <div class="row items-center justify-between hoverable-item">
                    <div class="q-pl-md">{{ deduct.title }} - Adjustment</div>
                    <div class="row items-center">
                      <q-icon
                        name="close"
                        size="16px"
                        class="q-mr-sm text-white bg-red rounded-borders cursor-pointer hover-icon"
                        @click="removeDeduction(index)"
                      />
                      <div class="text-primary">
                        <amount-view :amount="deduct.amount" />
                      </div>
                    </div>
                  </div>
                </template>
              </template>
              <template v-else>
                <div class="text-grey text-italic q-ml-md">No Deductions</div>
              </template>
              <!-- Total Deduction -->
              <div class="row items-center justify-end q-py-sm">
                <div class="text-body2 text-bold q-pr-sm">Total Loans & Deductions:</div>
                <div class="text-body2">
                  <amount-view :amount="employeeSalaryComputationData.salaryComputation.summary.totalLoan" />
                </div>
              </div>
            </div>
            <div class="divider"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="row justify-end items-center q-pa-md q-gutter-sm">
      <GButton variant="outline" label="Adjust Salary" icon="edit_square" @click="openDialog('salary')" />
      <GButton color="primary" label="Add Allowance" icon="add_circle" @click="openDialog('allowance')" />
      <GButton color="primary" label="Add Deductions" icon="add_circle" @click="openDialog('deduction')" />
      <GButton v-if="isPayrollPosted" label="View Payslip" icon="receipt" @click="openPayslipDialog" />
    </div>
    <!-- Show Dialog -->
    <AddAdjustSummaryDialog v-model="showDialog" :dialogMode="dialogMode" @save-data="handleSaveData" />

    <!-- Payslip Preview Dialog -->
    <PayslipPreviewDialog
      v-model="showPayslipDialog"
      :employeeData="employeeSalaryComputationData"
      :cutoffData="cutoffInformation"
    />
  </div>
</template>

<style lang="scss" src="./SummaryTab.scss" scoped></style>

<script lang="ts">
import { defineComponent, defineAsyncComponent, ref, reactive, onMounted, computed, watch } from "vue";
import { EmployeeSalaryComputationDeductionsResponse, SalaryInformationListResponse } from "@shared/response";
import AmountView from "../../../../../../../components/shared/display/AmountView.vue";
import { api } from "src/boot/axios";
import { AxiosResponse } from "axios";
import EditableSpan from "../../../../../../../components/shared/common/EditableSpan.vue";
import GButton from "src/components/shared/buttons/GButton.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddAdjustSummaryDialog = defineAsyncComponent(() =>
  import('../AddAdjustSummaryDialog.vue')
);

// Lazy-loaded heavy dialog (TASK-008: Extended - Reduce initial bundle)
const PayslipPreviewDialog = defineAsyncComponent(() =>
  import("../../PayslipPreviewDialog.vue")
);

interface SalaryAdjustment {
  id?: number;
  configurationId: number;
  title: string;
  amount: number;
  taxBasis?: "TAXABLE" | "NON_TAXABLE";
  category?: "DEMINIMIS" | "TAXABLE" | "NON_TAXABLE";
}

export default defineComponent({
  name: "SummaryTab",
  components: {
    AddAdjustSummaryDialog,
    PayslipPreviewDialog,
    EditableSpan,
    AmountView,
    GButton,
  },
  props: {
    employeeSalaryComputationData: {
      type: Object as () => SalaryInformationListResponse,
      required: true,
    },
    cutoffDateRangeId: {
      type: String,
      required: true,
    },
    cutoffInformation: {
      type: Object,
      required: false,
    },
  },
  emits: ["update:salary"],

  setup(props, { emit }) {
    const showDialog = ref(false);
    const showPayslipDialog = ref(false);
    const dialogMode = ref<"allowance" | "salary" | "deduction" | null>(null);
    const allowances = ref<SalaryAdjustment[]>([]);
    const salaryAdjustments = ref<SalaryAdjustment[]>([]);
    const deduction = ref<SalaryAdjustment[]>([]);
    const loans = ref<EmployeeSalaryComputationDeductionsResponse[]>([]);
    const deductions = ref<EmployeeSalaryComputationDeductionsResponse[]>([]);
    const isEditing = ref(false);
    const isRecomputing = ref(false);

    // Check if full data is loaded
    const isDataLoaded = computed(() => {
      return !!(
        props.employeeSalaryComputationData?.salaryComputation?.summary?.salaryRateType &&
        props.employeeSalaryComputationData?.salaryComputation?.summary?.taxComputationBreakdown
      );
    });
    const originalDeductions = {
      cashAdvance: 100.0,
      sssLoan: 5000.0,
      hdmf: 2000.0,
    };
    const editedDeductions = reactive({ ...originalDeductions });
    const modifiedFields = ref(new Set<keyof typeof editedDeductions>());
    const accountId = ref("");
    const cutoffDateRangeId = ref("");

    const deductionFields: {
      key: keyof typeof editedDeductions;
      label: string;
    }[] = [{ key: "cashAdvance", label: "Cash Advance" }];

    onMounted(async () => {
      // Extract accountId and cutoffDateRangeId from props
      if (props.employeeSalaryComputationData?.employeeInformation?.accountDetails) {
        accountId.value = props.employeeSalaryComputationData.employeeInformation.accountDetails.id;
        cutoffDateRangeId.value = props.cutoffDateRangeId;
      }
      fetchData();
      fetchAllowances();
      fetchSalaryAdjustments();
    });

    const isModified = (key: keyof typeof editedDeductions): boolean => {
      return editedDeductions[key] !== originalDeductions[key];
    };

    const fetchSalaryAdjustments = async () => {
      if (!accountId.value || !cutoffDateRangeId.value) return;

      try {
        const response = await api.get(
          `/hr-processing/employee-salary-adjustments/employee/${accountId.value}/cutoff/${cutoffDateRangeId.value}`
        );
        if (response.data) {
          interface AdjustmentResponse {
            id: number;
            configurationId: number;
            title: string;
            amount: string | number;
            taxBasis?: "TAXABLE" | "NON_TAXABLE";
            category?: "DEMINIMIS" | "TAXABLE" | "NON_TAXABLE";
          }

          allowances.value = response.data.allowances.map((adj: AdjustmentResponse) => ({
            id: adj.id,
            configurationId: adj.configurationId,
            title: adj.title,
            amount: Number(adj.amount),
            taxBasis: (adj.taxBasis || "TAXABLE") as "TAXABLE" | "NON_TAXABLE",
            category: adj.category || "TAXABLE",
          }));
          deduction.value = response.data.deductions.map((adj: AdjustmentResponse) => ({
            id: adj.id,
            configurationId: adj.configurationId,
            title: adj.title,
            amount: Number(adj.amount),
          }));
          // Handle salary adjustments from API
          salaryAdjustments.value = response.data.salaryAdjustments
            ? response.data.salaryAdjustments.map((adj: AdjustmentResponse) => ({
                id: adj.id,
                configurationId: adj.configurationId,
                title: adj.title,
                amount: Number(adj.amount),
              }))
            : [];
        }
      } catch (error) {
        console.error("Error fetching salary adjustments:", error);
      }
    };

    const handleSaveData = async (payload: {
      type: "allowance" | "salary" | "deduction";
      data: { configurationId?: number; title: string; amount: number };
    }) => {
      if (!accountId.value || !cutoffDateRangeId.value) {
        console.error("Missing accountId or cutoffDateRangeId");
        return;
      }

      console.log("Saving adjustment:", payload);
      isRecomputing.value = true;
      try {
        // For allowances and deductions, we need to get the title from the configuration
        let title = payload.data.title;
        let taxBasis: "TAXABLE" | "NON_TAXABLE" | undefined;

        if (payload.type === "allowance" && payload.data.configurationId) {
          // Fetch allowance configuration to get the title and tax basis
          const configResponse = await api.get(`/hr-configuration/allowance?id=${payload.data.configurationId}`);
          title = configResponse.data.name;
          taxBasis = configResponse.data.taxBasis;
        } else if (payload.type === "deduction" && payload.data.configurationId) {
          // Fetch deduction configuration to get the title
          const configResponse = await api.get(`/hr-configuration/deduction?id=${payload.data.configurationId}`);
          title = configResponse.data.name;
        }

        const adjustmentData = {
          accountId: accountId.value,
          cutoffDateRangeId: cutoffDateRangeId.value,
          adjustmentType:
            payload.type === "allowance" ? "ALLOWANCE" : payload.type === "salary" ? "SALARY" : "DEDUCTION",
          configurationId: payload.data.configurationId || 0, // 0 for salary adjustments
          title: title,
          amount: payload.data.amount,
        };

        const response = await api.post("/hr-processing/employee-salary-adjustments", adjustmentData);

        if (response.data) {
          const newAdjustment: SalaryAdjustment = {
            id: response.data.id,
            configurationId: response.data.configurationId,
            title: response.data.title,
            amount: Number(response.data.amount),
          };

          if (payload.type === "allowance") {
            allowances.value.push({
              ...newAdjustment,
              taxBasis: taxBasis || "TAXABLE",
            });
          } else if (payload.type === "salary") {
            salaryAdjustments.value.push(newAdjustment);
          } else if (payload.type === "deduction") {
            deduction.value.push(newAdjustment);
          }
        }

        showDialog.value = false;

        // Backend computation is synchronous, but add small delay for DB consistency
        console.log("Adjustment saved, waiting for DB consistency...");

        // Small delay to ensure database has been updated
        await new Promise((resolve) => setTimeout(resolve, 500));

        console.log("Reloading data after adjustment save...");

        // Reload all local data
        await Promise.all([fetchData(), fetchAllowances(), fetchSalaryAdjustments()]);

        console.log("Data reloaded, emitting update:salary event");

        // Emit event to parent to reload salary computation
        // This will fetch fresh data from the server
        emit("update:salary");

        // Stop the loading spinner
        isRecomputing.value = false;
      } catch (error) {
        console.error("Error saving adjustment:", error);
        isRecomputing.value = false;
      }
    };

    const openDialog = (mode: "allowance" | "salary" | "deduction") => {
      dialogMode.value = mode;
      showDialog.value = true;
    };

    const openPayslipDialog = () => {
      showPayslipDialog.value = true;
    };

    const saveEdit = () => {
      (Object.keys(originalDeductions) as (keyof typeof originalDeductions)[]).forEach((key) => {
        if (originalDeductions[key] !== editedDeductions[key]) {
          modifiedFields.value.add(key);
          originalDeductions[key] = editedDeductions[key];
        }
      });
      isEditing.value = false;
    };

    const cancelEdit = () => {
      (Object.keys(originalDeductions) as (keyof typeof originalDeductions)[]).forEach((key) => {
        editedDeductions[key] = originalDeductions[key];
      });
      isEditing.value = false;
    };

    const removeAllowance = async (index: number) => {
      const adjustment = allowances.value[index];
      if (adjustment.id) {
        isRecomputing.value = true;
        try {
          await api.delete(`/hr-processing/employee-salary-adjustments/${adjustment.id}`);
          allowances.value.splice(index, 1);

          // Small delay to ensure database consistency
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Reload all local data
          await Promise.all([fetchData(), fetchAllowances(), fetchSalaryAdjustments()]);

          // Emit event to parent to reload salary computation
          emit("update:salary");

          // Stop loading
          isRecomputing.value = false;
        } catch (error) {
          console.error("Error removing allowance:", error);
          isRecomputing.value = false;
        }
      } else {
        allowances.value.splice(index, 1);
      }
    };

    const removeSalaryAdjustment = async (index: number) => {
      const adjustment = salaryAdjustments.value[index];
      if (adjustment.id) {
        isRecomputing.value = true;
        try {
          await api.delete(`/hr-processing/employee-salary-adjustments/${adjustment.id}`);
          salaryAdjustments.value.splice(index, 1);

          // Small delay to ensure database consistency
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Reload all local data
          await Promise.all([fetchData(), fetchAllowances(), fetchSalaryAdjustments()]);

          // Emit event to parent to reload salary computation
          emit("update:salary");

          // Stop loading
          isRecomputing.value = false;
        } catch (error) {
          console.error("Error removing salary adjustment:", error);
          isRecomputing.value = false;
        }
      } else {
        salaryAdjustments.value.splice(index, 1);
      }
    };

    const removeDeduction = async (index: number) => {
      const adjustment = deduction.value[index];
      if (adjustment.id) {
        isRecomputing.value = true;
        try {
          await api.delete(`/hr-processing/employee-salary-adjustments/${adjustment.id}`);
          deduction.value.splice(index, 1);

          // Small delay to ensure database consistency
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Reload all local data
          await Promise.all([fetchData(), fetchAllowances(), fetchSalaryAdjustments()]);

          // Emit event to parent to reload salary computation
          emit("update:salary");

          // Stop loading
          isRecomputing.value = false;
        } catch (error) {
          console.error("Error removing deduction:", error);
          isRecomputing.value = false;
        }
      } else {
        deduction.value.splice(index, 1);
      }
    };

    const fetchData = () => {
      const url = `/hr-processing/get-employee-salary-computation-deductions?employeeTimekeepingCutoffId=${props.employeeSalaryComputationData.salaryComputation.timekeepingCutoffId}`;
      api.get(url).then((response: AxiosResponse<EmployeeSalaryComputationDeductionsResponse[]>) => {
        loans.value =
          response.data.length > 0
            ? response.data.filter(
                (deduction) => deduction.deductionPlan.deductionConfiguration.category.key === "LOAN"
              )
            : [];
        deductions.value =
          response.data.length > 0
            ? response.data.filter(
                (deduction) => deduction.deductionPlan.deductionConfiguration.category.key === "DEDUCTION"
              )
            : [];
      });
    };

    interface AllowanceResponse {
      allowancePlan: {
        id: number;
        name: string;
        allowanceConfiguration: {
          id: number;
          name: string;
          taxBasis: "TAXABLE" | "NON_TAXABLE";
          category: "DEMINIMIS" | "TAXABLE" | "NON_TAXABLE";
        };
      };
      amount: number;
    }

    const regularAllowances = ref<AllowanceResponse[]>([]);

    const fetchAllowances = async () => {
      try {
        const url = `/hr-processing/get-employee-salary-computation-allowances?employeeTimekeepingCutoffId=${props.employeeSalaryComputationData.salaryComputation.timekeepingCutoffId}`;
        const response = await api.get(url);
        regularAllowances.value = response.data || [];
      } catch (error) {
        console.error("Error fetching allowances:", error);
      }
    };

    // Computed properties for merged allowances
    const allAllowances = computed(() => {
      // Map regular allowances
      console.log(regularAllowances.value);
      const regular = regularAllowances.value.map((a) => ({
        id: `regular-${a.allowancePlan.id}`,
        title: `${a.allowancePlan.allowanceConfiguration.name} - AL${a.allowancePlan.id}`,
        amount: Number(a.amount),
        taxBasis: a.allowancePlan.allowanceConfiguration.taxBasis,
        category: a.allowancePlan.allowanceConfiguration.category,
        isAdjusted: false as const,
        originalData: a,
        originalIndex: -1,
      }));

      // Map adjusted allowances
      const adjusted = allowances.value.map((a, index) => ({
        id: a.id ? `adjusted-${a.id}` : `adjusted-temp-${index}`,
        title: a.title,
        amount: a.amount,
        taxBasis: a.taxBasis || ("TAXABLE" as "TAXABLE" | "NON_TAXABLE"),
        category: a.category || "TAXABLE",
        isAdjusted: true as const,
        originalIndex: index,
        originalData: null,
      }));

      return [...regular, ...adjusted];
    });

    const taxableAllowances = computed(() => allAllowances.value.filter((a) => a.category === "TAXABLE"));

    const nonTaxableAllowances = computed(() => allAllowances.value.filter((a) => a.category === "NON_TAXABLE"));

    const deMinimisAllowances = computed(() => allAllowances.value.filter((a) => a.category === "DEMINIMIS"));

    // Check if payroll is posted
    const isPayrollPosted = computed(() => {
      return props.cutoffInformation?.status === "POSTED";
    });

    // Computed properties for summary values that update when props change
    const totalAllowanceDisplay = computed(() => {
      return props.employeeSalaryComputationData?.salaryComputation?.summary?.totalAllowance || 0;
    });

    const totalSalaryAdjustmentDisplay = computed(() => {
      // Calculate the sum of all salary adjustments
      return salaryAdjustments.value.reduce((sum, adj) => sum + Number(adj.amount), 0);
    });

    const netPayDisplay = computed(() => {
      return props.employeeSalaryComputationData?.salaryComputation?.summary?.netPay || 0;
    });

    const grossPayDisplay = computed(() => {
      return props.employeeSalaryComputationData?.salaryComputation?.summary?.grossPay || 0;
    });

    // Watch for prop changes to reload data
    watch(
      () => props.employeeSalaryComputationData,
      (newVal) => {
        if (newVal) {
          // Update accountId and cutoffDateRangeId if needed
          if (newVal.employeeInformation?.accountDetails) {
            accountId.value = newVal.employeeInformation.accountDetails.id;
            cutoffDateRangeId.value = props.cutoffDateRangeId;
          }
          // Reload all data
          fetchData();
          fetchAllowances();
          fetchSalaryAdjustments();
        }
      },
      { deep: true }
    );

    return {
      loans,
      deductions,
      showDialog,
      showPayslipDialog,
      dialogMode,
      allowances,
      isEditing,
      editedDeductions,
      modifiedFields,
      deductionFields,
      salaryAdjustments,
      deduction,
      isModified,
      cancelEdit,
      openDialog,
      openPayslipDialog,
      saveEdit,
      handleSaveData,
      removeAllowance,
      removeSalaryAdjustment,
      removeDeduction,
      fetchSalaryAdjustments,
      isDataLoaded,
      regularAllowances,
      allAllowances,
      taxableAllowances,
      nonTaxableAllowances,
      deMinimisAllowances,
      isRecomputing,
      totalAllowanceDisplay,
      totalSalaryAdjustmentDisplay,
      netPayDisplay,
      grossPayDisplay,
      isPayrollPosted,
    };
  },
});
</script>
