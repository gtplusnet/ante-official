<template>
  <div class="thirteenth-month-table">
    <div class="table-wrapper">
      <q-table
        :rows="rows"
        row-key="id"
        :pagination="pagination"
        @request="onRequest"
        :rows-per-page-options="[10, 20, 50, 100]"
        :no-data-label="''"
        class="md3-table"
        flat
        square
      >
        <template v-slot:top>
          <div class="col row items-center ">
            <div>
              <div class="text-title-medium text-dark">{{ title }}</div>
              <div class="text-body-medium text-dark q-mt-xs">{{ rows.length }} records found</div>
            </div>
            <q-space />
            <GButton
              round
              icon="table_view"
              size="md"
              variant="tonal"
              icon-size="md"
              @click="exportToExcel"
              :disable="!rows.length"
            >
              <q-tooltip class="text-body-small">Export to Excel</q-tooltip>
            </GButton>
          </div>
        </template>

        <template v-slot:header>
          <q-tr class="table-header-row">
            <q-th class="text-body-medium text-weight-medium">Employee No.</q-th>
            <q-th class="text-body-medium text-weight-medium">Employee Name</q-th>
            <q-th class="text-body-medium text-weight-medium">Department</q-th>
            <q-th class="text-body-medium text-weight-medium text-right">Basic Salary</q-th>
            <q-th class="text-body-medium text-weight-medium text-center">No. of Months Worked</q-th>
            <q-th class="text-body-medium text-weight-medium text-right">Total Basic Pay Earned</q-th>
            <q-th class="text-body-medium text-weight-medium text-right">13th Month Pay (Total Basic Pay ÷ 12)</q-th>
          </q-tr>
        </template>

        <template v-slot:body="props">
          <q-tr :props="props" class="table-body-row">
            <q-td class="text-body-medium">
              <span class="text-weight-medium">{{ props.row.employeeNo || "-" }}</span>
            </q-td>
            <q-td class="text-body-medium">
              {{ props.row.employeeName || "-" }}
            </q-td>
            <q-td class="text-body-medium">
              <q-chip size="sm" color="surface-variant" text-color="on-surface-variant" square>
                {{ props.row.department || "-" }}
              </q-chip>
            </q-td>
            <q-td class="text-right text-body-medium">
              {{ formatCurrency(props.row.basicSalary) }}
            </q-td>
            <q-td class="text-center text-body-medium">
              {{ props.row.monthsWorked || 0 }}
            </q-td>
            <q-td class="text-right text-body-medium">
              {{ formatCurrency(props.row.totalBasicPayEarned) }}
            </q-td>
            <q-td class="text-right text-body-medium">
              <span class="text-primary text-weight-bold">{{ formatCurrency(props.row.thirteenthMonthPay) }}</span>
            </q-td>
          </q-tr>
        </template>

        <template v-slot:bottom-row v-if="rows.length > 0">
          <q-tr class="totals-row">
            <q-td colspan="5" class="text-right text-body-large text-weight-medium">Total</q-td>
            <q-td class="text-right text-body-large text-weight-medium">
              {{ formatCurrency(totals.totalBasicPayEarned) }}
            </q-td>
            <q-td class="text-right text-body-large text-weight-bold text-primary">
              {{ formatCurrency(totals.thirteenthMonthPay) }}
            </q-td>
          </q-tr>
        </template>

        <template v-slot:no-data>
          <div class="no-data-container">
            <q-icon name="o_description" size="48px" color="on-surface-variant" />
            <div class="text-h6 q-mt-md text-on-surface-variant">No Data Available</div>
            <div class="text-body2 text-on-surface-variant">No 13th month pay records found for the selected criteria</div>
          </div>
        </template>

      </q-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import * as XLSX from 'xlsx';
import GButton from 'src/components/shared/buttons/GButton.vue';

interface ThirteenthMonthPayData {
  id: number;
  employeeNo: string;
  employeeName: string;
  department: string;
  basicSalary: number;
  monthsWorked: number;
  totalBasicPayEarned: number;
  thirteenthMonthPay: number;
}

interface Props {
  title: string;
  rows: ThirteenthMonthPayData[];
  pagination: {
    sortBy: string | null;
    descending: boolean;
    page: number;
    rowsPerPage: number;
    rowsNumber: number;
  };
}

const props = defineProps<Props>();
const emit = defineEmits(['request']);
const $q = useQuasar();

const formatCurrency = (value: number | undefined | null) => {
  if (value === undefined || value === null) return '₱ 0.00';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const totals = computed(() => {
  return {
    totalBasicPayEarned: props.rows.reduce((sum, row) => sum + (row.totalBasicPayEarned || 0), 0),
    thirteenthMonthPay: props.rows.reduce((sum, row) => sum + (row.thirteenthMonthPay || 0), 0)
  };
});

const onRequest = (props: any) => {
  emit('request', props);
};

const exportToExcel = () => {
  try {
    const exportData = props.rows.map((row) => ({
      'Employee No.': row.employeeNo,
      'Employee Name': row.employeeName,
      'Department': row.department,
      'Basic Salary': row.basicSalary,
      'No. of Months Worked': row.monthsWorked,
      'Total Basic Pay Earned': row.totalBasicPayEarned,
      '13th Month Pay': row.thirteenthMonthPay
    }));

    // Add totals row
    exportData.push({
      'Employee No.': '',
      'Employee Name': '',
      'Department': '',
      'Basic Salary': '',
      'No. of Months Worked': 'TOTAL',
      'Total Basic Pay Earned': totals.value.totalBasicPayEarned,
      '13th Month Pay': totals.value.thirteenthMonthPay
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '13th Month Pay');

    // Generate filename with current date
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const filename = `13th-month-pay-${dateStr}.xlsx`;

    XLSX.writeFile(wb, filename);

    $q.notify({
      type: 'positive',
      message: 'Report exported successfully',
      position: 'top'
    });
  } catch (error) {
    console.error('Export failed:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to export report',
      position: 'top'
    });
  }
};
</script>

<style scoped lang="scss">
.thirteenth-month-table {
  width: 100%;
}

.table-wrapper {
  width: 100%;
  overflow: hidden;
}

.md3-table {
  display: flex;
  flex-direction: column;
  background-color: var(--q-surface);
}

.table-header-row {
  background-color: var(--q-surface-variant, #F2F2F7);

  th {
    font-weight: 500;
    color: var(--q-on-surface-variant, #49454E);
    border-bottom: 1px solid var(--q-outline-variant, #C4C6CF);
    padding: 12px 16px;
  }
}

.table-body-row {
  td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--q-outline, #E0E0E5);
  }

  &:hover {
    background-color: var(--q-surface-variant, #F2F2F7);
  }
}

.totals-row {
  background-color: var(--q-surface-variant, #F2F2F7);

  td {
    padding: 16px;
    border-top: 2px solid var(--q-primary, #6750A4);
    font-weight: 500;
  }
}

.no-data-container {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  margin: 0 auto;
  padding: 100px 24px;
  text-align: center;
}

@media (max-width: $breakpoint-sm-max) {
  .table-wrapper {
    overflow-x: auto;
  }

  .md3-table {
    min-width: 800px;
  }
}
</style>