<template>
  <div class="leave-report-table">
    <!-- Header with Company Info -->
    <div class="report-header q-pa-md">
      <div class="text-h6 text-center">{{ companyInfo.companyName }}</div>
      <div class="text-subtitle1 text-center text-grey-7">{{ companyInfo.reportTitle }}</div>
      <div class="text-body2 text-center text-grey-6">Period Covered: {{ companyInfo.periodCovered }}</div>
    </div>

    <!-- Export Actions -->
    <div class="q-pa-md row justify-end q-gutter-sm">
      <GButton
        label="Export to Excel"
        variant="tonal"
        icon="o_table_view"
        @click="$emit('export', 'excel')"
      />
      <GButton
        label="Export to PDF"
        variant="tonal"
        icon="o_picture_as_pdf"
        @click="$emit('export', 'pdf')"
      />
    </div>

    <!-- Summary Section -->
    <div class="q-px-md q-pb-md">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-4">
          <div class="summary-card surface-variant rounded-borders q-pa-md">
            <div class="text-caption text-grey-7">Total Leave Days</div>
            <div class="text-h5 text-primary">{{ totalLeaveDays }}</div>
          </div>
        </div>
        <div class="col-12 col-sm-4">
          <div class="summary-card surface-variant rounded-borders q-pa-md">
            <div class="text-caption text-grey-7">Total Employees</div>
            <div class="text-h5 text-primary">{{ data.length }}</div>
          </div>
        </div>
        <div class="col-12 col-sm-4">
          <div class="summary-card surface-variant rounded-borders q-pa-md">
            <div class="text-caption text-grey-7">Pending Approvals</div>
            <div class="text-h5 text-orange">{{ pendingCount }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="q-px-md q-pb-md">
      <q-table
        :rows="data"
        :columns="columns"
        row-key="employeeId"
        :pagination="pagination"
        :loading="loading"
        flat
        bordered
        class="leave-table"
      >
        <!-- Custom header -->
        <template v-slot:header="props">
          <q-tr :props="props">
            <q-th
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
              class="text-weight-bold"
            >
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

        <!-- Custom body -->
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="employeeName" :props="props">
              {{ props.row.employeeName }}
            </q-td>
            <q-td key="employeeId" :props="props">
              {{ props.row.employeeId }}
            </q-td>
            <q-td key="department" :props="props">
              {{ props.row.department }}
            </q-td>
            <q-td key="leaveType" :props="props">
              {{ props.row.leaveType }}
            </q-td>
            <q-td key="leaveDates" :props="props">
              {{ props.row.leaveDates }}
            </q-td>
            <q-td key="leaveDays" :props="props" class="text-center">
              {{ props.row.leaveDays }}
            </q-td>
            <q-td key="leaveStatus" :props="props">
              <q-chip
                :color="getStatusColor(props.row.leaveStatus)"
                text-color="white"
                size="sm"
                dense
                class="q-px-sm"
              >
                {{ props.row.leaveStatus }}
              </q-chip>
            </q-td>
          </q-tr>
        </template>

        <!-- No data -->
        <template v-slot:no-data>
          <div class="full-width row flex-center text-grey-6 q-gutter-sm q-pa-lg">
            <q-icon size="2em" name="o_event_busy" />
            <span>No leave records found</span>
          </div>
        </template>
      </q-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { QTableColumn } from 'quasar';
import GButton from 'src/components/shared/buttons/GButton.vue';

export interface LeaveData {
  employeeName: string;
  employeeId: string;
  department: string;
  leaveType: string;
  leaveDates: string;
  leaveDays: number;
  leaveStatus: 'Approved' | 'Pending' | 'Rejected';
}

export interface CompanyInfo {
  companyName: string;
  reportTitle: string;
  periodCovered: string;
}

interface Props {
  data: LeaveData[];
  loading?: boolean;
  companyInfo: CompanyInfo;
}

const props = defineProps<Props>();

defineEmits<{
  export: [format: 'excel' | 'pdf'];
}>();

const columns: QTableColumn<LeaveData>[] = [
  {
    name: 'employeeName',
    label: 'Employee Name',
    field: 'employeeName',
    align: 'left',
    sortable: true
  },
  {
    name: 'employeeId',
    label: 'Employee ID',
    field: 'employeeId',
    align: 'left',
    sortable: true
  },
  {
    name: 'department',
    label: 'Department',
    field: 'department',
    align: 'left',
    sortable: true
  },
  {
    name: 'leaveType',
    label: 'Leave Type',
    field: 'leaveType',
    align: 'left',
    sortable: true
  },
  {
    name: 'leaveDates',
    label: 'Leave Dates',
    field: 'leaveDates',
    align: 'left',
    sortable: false
  },
  {
    name: 'leaveDays',
    label: 'Leave Days',
    field: 'leaveDays',
    align: 'center',
    sortable: true
  },
  {
    name: 'leaveStatus',
    label: 'Leave Status',
    field: 'leaveStatus',
    align: 'left',
    sortable: true
  }
];

const pagination = ref({
  sortBy: 'employeeName',
  descending: false,
  page: 1,
  rowsPerPage: 10
});

const totalLeaveDays = computed(() => {
  return props.data.reduce((sum, item) => sum + item.leaveDays, 0);
});

const pendingCount = computed(() => {
  return props.data.filter(item => item.leaveStatus === 'Pending').length;
});

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Approved':
      return 'green';
    case 'Pending':
      return 'orange';
    case 'Rejected':
      return 'red';
    default:
      return 'grey';
  }
};
</script>

<style scoped lang="scss">
.leave-report-table {
  width: 100%;
}

.report-header {
  border-bottom: 1px solid var(--q-border);
}

.summary-card {
  text-align: center;

  &.surface-variant {
    background-color: var(--q-surface-variant, #f5f5f5);
    border: 1px solid var(--q-border);
  }
}

.rounded-borders {
  border-radius: 8px;
}

.leave-table {
  :deep(.q-table__top),
  :deep(.q-table__bottom) {
    background-color: var(--q-surface);
  }

  :deep(thead) {
    background-color: var(--q-surface-variant, #f5f5f5);
  }

  :deep(tbody tr) {
    &:hover {
      background-color: var(--q-hover, rgba(0, 0, 0, 0.04));
    }
  }

  :deep(.q-chip) {
    font-weight: 500;
  }
}

@media (max-width: $breakpoint-sm-max) {
  .leave-table {
    :deep(.q-table__card) {
      box-shadow: none;
    }
  }
}
</style>