<template>
  <q-dialog ref="dialog" @show="fetchTableData">
    <TemplateDialog minWidth="calc(80vw - 80px)" scrollable="false">
      <template #DialogIcon>
        <q-icon name="add" size="22px" class="q-pr-xs" />
      </template>
      <template #DialogTitle>
        <div>
          Deduction History
          <span>
            ({{ employeeDeductionData?.accountInformation?.fullName }})
          </span>
        </div>
      </template>
      <template #DialogContent>
        <div class="dialog-card">
          <section class="q-pa-md">
            <div class="row items-center justify-between">
              <div>
                <GButton
                  icon="output"
                  label="Export"
                  color="grey-8"
                  variant="outline"
                  rounded
                />
              </div>
              <div
                v-if="
                  employeeDeductionData?.deductionConfiguration.category
                    .hasTotalAmount == true &&
                  employeeDeductionData?.isActive == true
                "
                class="q-gutter-x-sm"
              >
                <GButton
                  @click="
                    openAddPayBalanceDeductionDialog(
                      'Add',
                      employeeDeductionData
                    )
                  "
                  size="small"
                  variant="text"
                  color="primary"
                >
                  <q-icon
                    class="q-mr-xs"
                    size="16px"
                    name="add_circle"
                  ></q-icon>
                  Add Balance Deduction
                </GButton>
                <GButton
                  @click="
                    openAddPayBalanceDeductionDialog(
                      'Pay',
                      employeeDeductionData
                    )
                  "
                  size="small"
                  variant="text"
                  color="primary"
                >
                  <q-icon class="q-mr-xs" size="16px" name="paid"></q-icon>
                  Pay Balance Deduction
                </GButton>
              </div>
            </div>
            <div class="q-mt-md">
              <table class="global-table">
                <thead class="text-left text-title-small">
                  <tr>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Description</th>
                    <th>Balance Before</th>
                    <th>Balance After</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody class="text-body-small">
                  <tr
                    v-for="row in deductionHistoryData"
                    :key="row.id"
                    class="deduction-item"
                  >
                    <td class="text-left">{{ row.createdAt.dateTime }}</td>
                    <td>
                      <span
                        v-if="row.cutoffDateRange"
                        class="text-primary cursor-pointer"
                        @click="showCutoffDetails(row.cutoffDateRange)"
                      >
                        {{ formatCutoffPeriod(row.cutoffDateRange) }}
                      </span>
                      <span v-else class="text-grey">-</span>
                    </td>
                    <td>{{ row.remarks }}</td>
                    <td>{{ row.beforeBalance.formatCurrency }}</td>
                    <td>{{ row.afterBalance.formatCurrency }}</td>
                    <td>{{ row.amount.formatCurrency }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <!-- Add and Pay Balance Deduction -->
        <AddPayBalanceDeductionDialog
          v-if="localEmployeeDeductionData"
          :dialogMode="dialogMode"
          :localEmployeeDeductionData="localEmployeeDeductionData"
          @saveDone="fetchTableData"
          v-model="isAddPayDialogOpen"
        />
      </template>
    </TemplateDialog>

    <!-- Cutoff Details Dialog -->
    <q-dialog v-model="showCutoffDialog" position="standard">
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <div class="text-h6">Cutoff Details</div>
          <q-space />
          <GButton
            icon="close"
            variant="icon"
            size="small"
            color="gray"
            v-close-popup
          />
        </q-card-section>

        <q-card-section v-if="selectedCutoff">
          <div class="q-gutter-sm">
            <div class="row">
              <div class="col-5 text-body-small text-grey-7">Cutoff ID:</div>
              <div class="col-7 text-body-small">{{ selectedCutoff.id }}</div>
            </div>
            <div class="row">
              <div class="col-5 text-body-small text-grey-7">Period:</div>
              <div class="col-7 text-body-small">
                {{ formatCutoffPeriod(selectedCutoff) }}
              </div>
            </div>
            <div class="row">
              <div class="col-5 text-body-small text-grey-7">Status:</div>
              <div class="col-7 text-body-small">
                <q-badge
                  :color="getCutoffStatusColor(selectedCutoff.status)"
                  :label="selectedCutoff.status"
                />
              </div>
            </div>
            <div class="row">
              <div class="col-5 text-body-small text-grey-7">
                Processing Date:
              </div>
              <div class="col-7 text-body-small">
                {{ selectedCutoff.processingDate.dateFull }}
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<style scoped>
.dialog-card {
  min-width: 1100px;
  height: 75vh;
  display: flex;
  flex-direction: column;
}

table.global-table {
  width: 100%;
  border-collapse: collapse;
}

table.global-table thead {
  position: sticky;
  top: 0;
  background-color: #fff;
  z-index: 1;
}

table.global-table tbody {
  display: block;
  overflow-y: auto;
  max-height: calc(70vh - 120px);
}

table.global-table thead,
table.global-table tbody tr {
  display: table;
  width: 100%;
  table-layout: fixed;
}

table.global-table th,
table.global-table td {
  padding: 8px 16px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

table.global-table th {
  font-weight: 500;
  background-color: #f5f5f5;
  position: sticky;
  top: 0;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  text-decoration: underline;
}
</style>

<script lang="ts">
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { handleAxiosError } from "src/utility/axios.error.handler";
import { ref } from "vue";
import { defineAsyncComponent } from 'vue';
import {
  DeductionPlanConfigurationDataResponse,
  DeductionPlanHistoryDataResponse,
} from "@shared/response/deduction-configuration.response";
import GButton from "src/components/shared/buttons/GButton.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddPayBalanceDeductionDialog = defineAsyncComponent(() =>
  import('./ManpowerAddPayBalanceDeductionDialog.vue')
);
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: "DeductionHistoryDialog",
  components: {
    AddPayBalanceDeductionDialog,
    TemplateDialog,
    GButton,
  },
  props: {
    employeeDeductionData: {
      type: Object as () => DeductionPlanConfigurationDataResponse | null,
      default: null,
    },
  },

  setup(props, { emit }) {
    const $q = useQuasar();
    const isAddPayDialogOpen = ref(false);
    const dialogMode = ref<"Add" | "Pay" | null>(null);
    const deductionHistoryData = ref<DeductionPlanHistoryDataResponse[]>([]);
    const localEmployeeDeductionData =
      ref<DeductionPlanConfigurationDataResponse | null>(null);
    const showCutoffDialog = ref(false);
    const selectedCutoff = ref<any>(null);

    const fetchTableData = () => {
      $q.loading.show();
      api
        .get(
          `hr-configuration/deduction/plan/history?id=${
            props.employeeDeductionData?.id || ""
          }`
        )
        .then((response) => {
          deductionHistoryData.value = response.data;
          emit("refreshDeductionPlanTable");
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const openAddPayBalanceDeductionDialog = (
      type: "Add" | "Pay",
      data: DeductionPlanConfigurationDataResponse
    ) => {
      localEmployeeDeductionData.value = data;
      dialogMode.value = type;
      isAddPayDialogOpen.value = true;
    };

    const formatCutoffPeriod = (cutoff: any) => {
      if (!cutoff) return "-";
      return `${cutoff.startDate.dateFull} - ${cutoff.endDate.dateFull}`;
    };

    const showCutoffDetails = (cutoff: any) => {
      selectedCutoff.value = cutoff;
      showCutoffDialog.value = true;
    };

    const getCutoffStatusColor = (status: string) => {
      const statusColors: Record<string, string> = {
        TIMEKEEPING: "blue",
        PENDING: "orange",
        PROCESSED: "purple",
        APPROVED: "green",
        REJECTED: "red",
        POSTED: "teal",
      };
      return statusColors[status] || "grey";
    };

    return {
      dialogMode,
      deductionHistoryData,
      localEmployeeDeductionData,
      isAddPayDialogOpen,
      fetchTableData,
      openAddPayBalanceDeductionDialog,
      showCutoffDialog,
      selectedCutoff,
      formatCutoffPeriod,
      showCutoffDetails,
      getCutoffStatusColor,
    };
  },
};
</script>
