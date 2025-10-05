<template>
  <q-dialog ref="dialog" @show="fetchTableData">
    <TemplateDialog minWidth="calc(80vw - 80px)" maxWidth="calc(1000px)">
    <template #DialogTitle>
      Allowance History
      <span> ({{ employeeAllowanceData?.accountInformation?.fullName }}) </span>
    </template>
    <template #DialogContent>
      <section class="q-pa-md">
        <div class="row items-center justify-between">
          <div>
            <GButton icon="output" label="Export" color="grey-8" variant="outline" rounded />
          </div>
        </div>
        <div class="q-mt-md">
          <table class="global-table">
            <thead class="text-left text-label-medium">
              <tr>
                <th>Date Created</th>
                <th>Reference</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody class="text-body-small">
              <tr v-for="row in allowanceHistoryData" :key="row.id" class="deduction-item">
                <td class="text-left">{{ row.createdAt.dateTime }}</td>
                <td>
                  <span v-if="row.cutoffDateRange"
                        class="text-primary cursor-pointer"
                        @click="showCutoffDetails(row.cutoffDateRange)">
                    {{ formatCutoffPeriod(row.cutoffDateRange) }}
                  </span>
                  <span v-else class="text-grey">-</span>
                </td>
                <td>{{ row.remarks }}</td>
                <td>{{ row.amount.formatCurrency }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
    </TemplateDialog>

    <!-- Cutoff Details Dialog -->
    <q-dialog v-model="showCutoffDialog" position="standard">
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <div class="text-h6">Cutoff Details</div>
          <q-space />
          <GButton icon="close" variant="flat" round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="selectedCutoff">
          <div class="q-gutter-sm">
            <div class="row">
              <div class="col-5 text-body-small text-grey-7">Cutoff ID:</div>
              <div class="col-7 text-body-small">{{ selectedCutoff.id }}</div>
            </div>
            <div class="row">
              <div class="col-5 text-body-small text-grey-7">Period:</div>
              <div class="col-7 text-body-small">{{ formatCutoffPeriod(selectedCutoff) }}</div>
            </div>
            <div class="row">
              <div class="col-5 text-body-small text-grey-7">Status:</div>
              <div class="col-7 text-body-small">
                <q-badge :color="getCutoffStatusColor(selectedCutoff.status)" :label="selectedCutoff.status" />
              </div>
            </div>
            <div class="row">
              <div class="col-5 text-body-small text-grey-7">Processing Date:</div>
              <div class="col-7 text-body-small">{{ selectedCutoff.processingDate.dateFull }}</div>
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
  table-layout: fixed;
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
  width: 100%;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

table.global-table th {
  font-weight: 500;
  background-color: #f5f5f5;
  position: sticky;
  top: 0;
}

/* Set column widths */
th:nth-child(1), td:nth-child(1) { width: 20%; } /* Date Created */
th:nth-child(2), td:nth-child(2) { width: 20%; } /* Reference */
th:nth-child(3), td:nth-child(3) { width: 40%; } /* Description */
th:nth-child(4), td:nth-child(4) { width: 20%; } /* Amount */

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  text-decoration: underline;
}
</style>

<script lang="ts">
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import { ref, PropType } from 'vue';
import { defineAsyncComponent } from 'vue';
import { AllowancePlanHistoryDataResponse, AllowancePlanDataResponse } from "@shared/response";
import GButton from 'src/components/shared/buttons/GButton.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: 'DeductionHistoryDialog',
  components: {
    TemplateDialog,
    GButton,
  },
  props: {
    employeeAllowanceData: {
      type: Object as PropType<AllowancePlanDataResponse | null>,
      default: null,
    },
  },

  setup(props) {
    const $q = useQuasar();
    const isAddPayDialogOpen = ref(false);
    const dialogMode = ref<'Add' | 'Pay' | null>(null);
    const allowanceHistoryData = ref<AllowancePlanHistoryDataResponse[]>([]);
    const showCutoffDialog = ref(false);
    const selectedCutoff = ref<any>(null);

    const fetchTableData = () => {
      $q.loading.show();
      api
        .get(`hr-configuration/allowance/plan/history?id=${props.employeeAllowanceData?.id || ''}`)
        .then((response) => {
          allowanceHistoryData.value = response.data;
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const formatCutoffPeriod = (cutoff: any) => {
      if (!cutoff) return '-';
      return `${cutoff.startDate.dateFull} - ${cutoff.endDate.dateFull}`;
    };

    const showCutoffDetails = (cutoff: any) => {
      selectedCutoff.value = cutoff;
      showCutoffDialog.value = true;
    };

    const getCutoffStatusColor = (status: string) => {
      const statusColors: Record<string, string> = {
        'TIMEKEEPING': 'blue',
        'PENDING': 'orange',
        'PROCESSED': 'purple',
        'APPROVED': 'green',
        'REJECTED': 'red',
        'POSTED': 'teal'
      };
      return statusColors[status] || 'grey';
    };

    return {
      dialogMode,
      allowanceHistoryData,
      isAddPayDialogOpen,
      fetchTableData,
      showCutoffDialog,
      selectedCutoff,
      formatCutoffPeriod,
      showCutoffDetails,
      getCutoffStatusColor,
    };
  },
};
</script>
