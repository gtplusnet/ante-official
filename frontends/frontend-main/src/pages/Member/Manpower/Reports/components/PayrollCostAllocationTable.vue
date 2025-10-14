<template>
  <div class="payroll-cost-allocation-table">
    <!-- Export Actions -->
    <div class="q-pa-md row justify-between q-gutter-sm">
      <!-- Header with Company Info -->
      <div class="report-header column items-left">
        <div class="text-title-medium text-dark">
          {{ companyInfo.reportTitle }}
        </div>
        <div class="text-body-medium text-dark q-mt-xs">
          Period Covered: {{ companyInfo.periodCovered }}
        </div>
      </div>

      <div>
        <GButton
          round
          variant="tonal"
          icon="o_table_view"
          icon-size="md"
          @click="$emit('export', 'excel')"
        />
      </div>
    </div>

    <!-- Summary Section -->
    <div class="q-pb-md">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-3">
          <div class="summary-card surface-variant rounded-borders q-pa-md">
            <div class="text-caption text-grey-7">Total Employees</div>
            <div class="text-h5 text-primary">{{ data.length }}</div>
          </div>
        </div>
        <div class="col-12 col-sm-3">
          <div class="summary-card surface-variant rounded-borders q-pa-md">
            <div class="text-caption text-grey-7">Total Basic Salary</div>
            <div class="text-h5 text-primary">
              {{ formatCurrency(totalBasicSalary) }}
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-3">
          <div class="summary-card surface-variant rounded-borders q-pa-md">
            <div class="text-caption text-grey-7">Total Deductions</div>
            <div class="text-h5 text-negative">
              {{ formatCurrency(totalDeductions) }}
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-3">
          <div class="summary-card surface-variant rounded-borders q-pa-md">
            <div class="text-caption text-grey-7">Total Compensation</div>
            <div class="text-h5 text-positive">
              {{ formatCurrency(grandTotal) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="q-pb-md">
      <q-table
        :rows="formattedData"
        :columns="columns"
        row-key="id"
        :pagination="pagination"
        :loading="loading"
        flat
        bordered
        dense
        class="payroll-table"
        :separator="separator"
      >
        <!-- Custom header -->
        <template v-slot:header="props">
          <q-tr :props="props">
            <q-th
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
              class="text-weight-bold bg-grey-2"
            >
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

        <!-- Custom body -->
        <template v-slot:body="props">
          <q-tr
            :props="props"
            :class="{
              'department-header': props.row.isDepartmentHeader,
              'department-total': props.row.isDepartmentTotal,
              'grand-total': props.row.isGrandTotal,
            }"
          >
            <template v-if="props.row.isDepartmentHeader">
              <q-td colspan="13" class="text-weight-bold">
                {{ props.row.department }}
              </q-td>
            </template>
            <template v-else-if="props.row.isDepartmentTotal">
              <q-td colspan="5" class="text-weight-bold text-right">
                {{ props.row.department }} Total:
              </q-td>
              <q-td class="text-weight-bold bg-grey-1">{{
                props.row.basicSalary
              }}</q-td>
              <q-td class="text-weight-bold bg-grey-1">{{
                props.row.allowances
              }}</q-td>
              <q-td class="text-weight-bold bg-grey-1">{{
                props.row.overtimePay
              }}</q-td>
              <q-td class="text-weight-bold bg-grey-1">{{
                props.row.thirteenthMonth
              }}</q-td>
              <q-td class="text-weight-bold bg-grey-1">{{
                props.row.sss
              }}</q-td>
              <q-td class="text-weight-bold bg-grey-1">{{
                props.row.philhealth
              }}</q-td>
              <q-td class="text-weight-bold bg-grey-1">{{
                props.row.pagIbig
              }}</q-td>
              <q-td class="text-weight-bold bg-grey-1 text-positive">{{
                props.row.totalCompensation
              }}</q-td>
            </template>
            <template v-else-if="props.row.isGrandTotal">
              <q-td
                colspan="5"
                class="text-weight-bold text-right bg-primary text-white"
              >
                GRAND TOTAL:
              </q-td>
              <q-td class="text-weight-bold text-right bg-primary text-white">{{
                props.row.basicSalary
              }}</q-td>
              <q-td class="text-weight-bold text-right bg-primary text-white">{{
                props.row.allowances
              }}</q-td>
              <q-td class="text-weight-bold text-right bg-primary text-white">{{
                props.row.overtimePay
              }}</q-td>
              <q-td class="text-weight-bold text-right bg-primary text-white">{{
                props.row.thirteenthMonth
              }}</q-td>
              <q-td class="text-weight-bold text-right bg-primary text-white">{{
                props.row.sss
              }}</q-td>
              <q-td class="text-weight-bold text-right bg-primary text-white">{{
                props.row.philhealth
              }}</q-td>
              <q-td class="text-weight-bold text-right bg-primary text-white">{{
                props.row.pagIbig
              }}</q-td>
              <q-td class="text-weight-bold text-right bg-primary text-white">{{
                props.row.totalCompensation
              }}</q-td>
            </template>
            <template v-else>
              <q-td key="department" :props="props">{{
                props.row.department
              }}</q-td>
              <q-td key="employeeCode" :props="props">{{
                props.row.employeeCode
              }}</q-td>
              <q-td key="lastName" :props="props">{{
                props.row.lastName
              }}</q-td>
              <q-td key="firstName" :props="props">{{
                props.row.firstName
              }}</q-td>
              <q-td key="position" :props="props">{{
                props.row.position
              }}</q-td>
              <q-td key="basicSalary" :props="props" class="text-right">{{
                props.row.basicSalary
              }}</q-td>
              <q-td key="allowances" :props="props" class="text-right">{{
                props.row.allowances
              }}</q-td>
              <q-td key="overtimePay" :props="props" class="text-right">{{
                props.row.overtimePay
              }}</q-td>
              <q-td key="thirteenthMonth" :props="props" class="text-right">{{
                props.row.thirteenthMonth
              }}</q-td>
              <q-td key="sss" :props="props" class="text-right">{{
                props.row.sss
              }}</q-td>
              <q-td key="philhealth" :props="props" class="text-right">{{
                props.row.philhealth
              }}</q-td>
              <q-td key="pagIbig" :props="props" class="text-right">{{
                props.row.pagIbig
              }}</q-td>
              <q-td
                key="totalCompensation"
                :props="props"
                class="text-right text-weight-bold"
                >{{ props.row.totalCompensation }}</q-td
              >
            </template>
          </q-tr>
        </template>

        <!-- No data -->
        <template v-slot:no-data>
          <div
            class="full-width row flex-center text-grey-6 q-gutter-sm q-pa-lg"
          >
            <q-icon size="2em" name="o_attach_money" />
            <span>No payroll data found</span>
          </div>
        </template>
      </q-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { QTableColumn } from "quasar";
import GButton from "src/components/shared/buttons/GButton.vue";

export interface PayrollData {
  department: string;
  employeeCode: string;
  lastName: string;
  firstName: string;
  position: string;
  basicSalary: number;
  allowances: number;
  overtimePay: number;
  thirteenthMonth: number;
  sss: number;
  philhealth: number;
  pagIbig: number;
  totalCompensation: number;
}

export interface CompanyInfo {
  companyName: string;
  reportTitle: string;
  periodCovered: string;
}

interface Props {
  data: PayrollData[];
  loading?: boolean;
  companyInfo: CompanyInfo;
}

const props = defineProps<Props>();

defineEmits<{
  export: [format: "excel" | "pdf"];
}>();

const columns: QTableColumn[] = [
  {
    name: "department",
    label: "Department",
    field: "department",
    align: "left",
    sortable: true,
  },
  {
    name: "employeeCode",
    label: "Code",
    field: "employeeCode",
    align: "left",
    sortable: true,
  },
  {
    name: "lastName",
    label: "Last Name",
    field: "lastName",
    align: "left",
    sortable: true,
  },
  {
    name: "firstName",
    label: "First Name",
    field: "firstName",
    align: "left",
    sortable: true,
  },
  {
    name: "position",
    label: "Position",
    field: "position",
    align: "left",
    sortable: true,
  },
  {
    name: "basicSalary",
    label: "Basic Salary",
    field: "basicSalary",
    align: "right",
    sortable: true,
    format: (val: number) => formatCurrency(val),
  },
  {
    name: "allowances",
    label: "Allowances",
    field: "allowances",
    align: "right",
    sortable: true,
    format: (val: number) => formatCurrency(val),
  },
  {
    name: "overtimePay",
    label: "OT Pay",
    field: "overtimePay",
    align: "right",
    sortable: true,
    format: (val: number) => formatCurrency(val),
  },
  {
    name: "thirteenthMonth",
    label: "13th Month",
    field: "thirteenthMonth",
    align: "right",
    sortable: true,
    format: (val: number) => formatCurrency(val),
  },
  {
    name: "sss",
    label: "SSS",
    field: "sss",
    align: "right",
    sortable: true,
    format: (val: number) => formatCurrency(val),
  },
  {
    name: "philhealth",
    label: "PhilHealth",
    field: "philhealth",
    align: "right",
    sortable: true,
    format: (val: number) => formatCurrency(val),
  },
  {
    name: "pagIbig",
    label: "Pag-IBIG",
    field: "pagIbig",
    align: "right",
    sortable: true,
    format: (val: number) => formatCurrency(val),
  },
  {
    name: "totalCompensation",
    label: "Total",
    field: "totalCompensation",
    align: "right",
    sortable: true,
    format: (val: number) => formatCurrency(val),
  },
];

const pagination = ref({
  sortBy: "department",
  descending: false,
  page: 1,
  rowsPerPage: 50,
});

const separator = ref<"horizontal" | "vertical" | "cell" | "none">(
  "horizontal"
);

const formatCurrency = (value: number): string => {
  return value.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

// Group data by department and add subtotals
const formattedData = computed(() => {
  const result: any[] = [];
  const departments = [
    ...new Set(props.data.map((item) => item.department)),
  ].sort();

  departments.forEach((dept) => {
    // Add department header
    result.push({
      id: `header-${dept}`,
      department: dept,
      isDepartmentHeader: true,
    });

    // Add department employees
    const deptEmployees = props.data
      .filter((item) => item.department === dept)
      .map((item, index) => ({
        ...item,
        id: `${dept}-${index}`,
        basicSalary: formatCurrency(item.basicSalary),
        allowances: formatCurrency(item.allowances),
        overtimePay: formatCurrency(item.overtimePay),
        thirteenthMonth: formatCurrency(item.thirteenthMonth),
        sss: formatCurrency(item.sss),
        philhealth: formatCurrency(item.philhealth),
        pagIbig: formatCurrency(item.pagIbig),
        totalCompensation: formatCurrency(item.totalCompensation),
      }));

    result.push(...deptEmployees);

    // Calculate department totals
    const deptData = props.data.filter((item) => item.department === dept);
    const deptTotal = {
      id: `total-${dept}`,
      department: dept,
      basicSalary: formatCurrency(
        deptData.reduce((sum, item) => sum + item.basicSalary, 0)
      ),
      allowances: formatCurrency(
        deptData.reduce((sum, item) => sum + item.allowances, 0)
      ),
      overtimePay: formatCurrency(
        deptData.reduce((sum, item) => sum + item.overtimePay, 0)
      ),
      thirteenthMonth: formatCurrency(
        deptData.reduce((sum, item) => sum + item.thirteenthMonth, 0)
      ),
      sss: formatCurrency(deptData.reduce((sum, item) => sum + item.sss, 0)),
      philhealth: formatCurrency(
        deptData.reduce((sum, item) => sum + item.philhealth, 0)
      ),
      pagIbig: formatCurrency(
        deptData.reduce((sum, item) => sum + item.pagIbig, 0)
      ),
      totalCompensation: formatCurrency(
        deptData.reduce((sum, item) => sum + item.totalCompensation, 0)
      ),
      isDepartmentTotal: true,
    };

    result.push(deptTotal);
  });

  // Add grand total if there's data
  if (props.data.length > 0) {
    result.push({
      id: "grand-total",
      basicSalary: formatCurrency(
        props.data.reduce((sum, item) => sum + item.basicSalary, 0)
      ),
      allowances: formatCurrency(
        props.data.reduce((sum, item) => sum + item.allowances, 0)
      ),
      overtimePay: formatCurrency(
        props.data.reduce((sum, item) => sum + item.overtimePay, 0)
      ),
      thirteenthMonth: formatCurrency(
        props.data.reduce((sum, item) => sum + item.thirteenthMonth, 0)
      ),
      sss: formatCurrency(props.data.reduce((sum, item) => sum + item.sss, 0)),
      philhealth: formatCurrency(
        props.data.reduce((sum, item) => sum + item.philhealth, 0)
      ),
      pagIbig: formatCurrency(
        props.data.reduce((sum, item) => sum + item.pagIbig, 0)
      ),
      totalCompensation: formatCurrency(
        props.data.reduce((sum, item) => sum + item.totalCompensation, 0)
      ),
      isGrandTotal: true,
    });
  }

  return result;
});

const totalBasicSalary = computed(() => {
  return props.data.reduce((sum, item) => sum + item.basicSalary, 0);
});

const totalDeductions = computed(() => {
  return props.data.reduce(
    (sum, item) => sum + item.sss + item.philhealth + item.pagIbig,
    0
  );
});

const grandTotal = computed(() => {
  return props.data.reduce((sum, item) => sum + item.totalCompensation, 0);
});
</script>

<style scoped lang="scss">
.summary-card {
  text-align: center;

  &.surface-variant {
    background-color: var(--q-surface-variant, #f5f5f5);
    border: 1px solid var(--q-border);
  }
}

.payroll-table {
  font-size: 12px;

  :deep(.q-table__top),
  :deep(.q-table__bottom) {
    background-color: var(--q-surface);
  }

  :deep(thead) {
    th {
      font-size: 11px;
      padding: 4px 8px;
      white-space: nowrap;
    }
  }

  :deep(tbody) {
    td {
      font-size: 11px;
      padding: 4px 6px;
      white-space: nowrap;
    }

    tr.department-header td {
      background-color: #e3f2fd !important;
      font-weight: 600;
      font-size: 12px;
    }

    tr.department-total td {
      background-color: #f5f5f5 !important;
      font-weight: 600;
      font-size: 11px;
      text-align: right;
    }

    tr.grand-total td {
      background-color: var(--q-primary) !important;
      color: white;
      font-weight: 700;
      font-size: 12px;
    }

    tr:hover:not(.department-header):not(.department-total):not(.grand-total) {
      background-color: var(--q-hover, rgba(0, 0, 0, 0.04));
    }
  }

  :deep(thead) {
    background-color: var(--q-surface-variant, #f5f5f5);
  }

  :deep(tbody tr) {
    &.department-header {
      td {
        background-color: #e3f2fd !important;
        font-weight: 600;
        font-size: 1.1em;
      }
    }

    &.department-total {
      td {
        background-color: #f5f5f5 !important;
        font-weight: 600;
      }
    }

    &.grand-total {
      td {
        background-color: var(--q-primary) !important;
        color: white;
        font-weight: 700;
        font-size: 1.1em;
      }
    }

    &:hover:not(.department-header):not(.department-total):not(.grand-total) {
      background-color: var(--q-hover, rgba(0, 0, 0, 0.04));
    }
  }
}

@media (max-width: $breakpoint-sm-max) {
  .payroll-table {
    :deep(.q-table__card) {
      box-shadow: none;
    }
  }
}
</style>
