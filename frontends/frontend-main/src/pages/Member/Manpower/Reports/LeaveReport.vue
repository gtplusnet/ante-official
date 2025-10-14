<template>
  <expanded-nav-page-container>
    <div class="report-container">
      <!-- MD3 Surface with elevation -->
      <div>
        <div class="row items-center">
          <div class="col">
            <div class="text-title-large">Leave Report</div>
            <q-breadcrumbs class="text-body-small">
              <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
              <q-breadcrumbs-el label="Reports" />
              <q-breadcrumbs-el label="Leave Report" />
            </q-breadcrumbs>
          </div>
        </div>
      </div>

      <!-- Filters Section with MD3 Card -->
      <div class="surface-container rounded-borders q-py-md q-mb-lg">
        <div class="q-px-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-3">
              <q-select
                v-model="filters.period"
                label="Period Covered"
                outlined
                dense
                :options="periodOptions"
                option-label="label"
                option-value="value"
              />
            </div>
            <div class="col-12 col-md-3">
              <q-select
                v-model="filters.department"
                label="Department"
                outlined
                dense
                :options="departmentOptions"
                clearable
                option-label="label"
                option-value="value"
              />
            </div>
            <div class="col-12 col-md-3">
              <q-select
                v-model="filters.leaveType"
                label="Leave Type"
                outlined
                dense
                :options="leaveTypeOptions"
                clearable
                option-label="label"
                option-value="value"
              />
            </div>
            <div class="col-12 col-md-3">
              <div class="row q-gutter-sm">
                <GButton
                  label="Generate"
                  variant="filled"
                  @click="fetchData"
                  :loading="loading"
                />
                <GButton
                  label="Clear"
                  variant="outlined"
                  @click="clearFilters"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Data Display with MD3 Surface -->
      <div class="surface-container rounded-borders" v-if="leaveData && leaveData.length > 0">
        <LeaveReportTable
          :data="leaveData"
          :loading="loading"
          :companyInfo="companyInfo"
          @export="handleExport"
        />
      </div>

      <!-- No Data State -->
      <div class="surface-container rounded-borders q-pa-xl text-center" v-else-if="!loading">
        <q-icon name="o_event_busy" size="64px" color="on-surface-variant" />
        <div class="text-h6 q-mt-md text-on-surface-variant">No Report Generated</div>
        <div class="text-body2 text-on-surface-variant">Select a period and click Generate to view the leave report</div>
      </div>
    </div>
  </expanded-nav-page-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import LeaveReportTable from './components/LeaveReportTable.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';

export interface LeaveData {
  employeeName: string;
  employeeId: string;
  department: string;
  leaveType: 'Vacation Leave' | 'Sick Leave' | 'Emergency Leave' | 'Maternity Leave' | 'Paternity Leave';
  leaveDates: string;
  leaveDays: number;
  leaveStatus: 'Approved' | 'Pending' | 'Rejected';
}

export interface CompanyInfo {
  companyName: string;
  reportTitle: string;
  periodCovered: string;
}

const $q = useQuasar();

const leaveData = ref<LeaveData[]>([]);
const loading = ref(false);
const companyInfo = ref<CompanyInfo>({
  companyName: 'ABC Corporation',
  reportTitle: 'Leave Report',
  periodCovered: ''
});

const filters = ref({
  period: { label: 'September 2025', value: '2025-09' },
  department: null as { label: string; value: string } | null,
  leaveType: null as { label: string; value: string } | null,
});

const periodOptions = ref([
  { label: 'September 2025', value: '2025-09' },
  { label: 'August 2025', value: '2025-08' },
  { label: 'July 2025', value: '2025-07' },
  { label: 'June 2025', value: '2025-06' },
  { label: 'May 2025', value: '2025-05' },
  { label: 'April 2025', value: '2025-04' },
  { label: 'March 2025', value: '2025-03' },
  { label: 'February 2025', value: '2025-02' },
  { label: 'January 2025', value: '2025-01' },
]);

const departmentOptions = ref([
  { label: 'All Departments', value: 'all' },
  { label: 'HR', value: 'hr' },
  { label: 'Finance', value: 'finance' },
  { label: 'IT', value: 'it' },
  { label: 'Operations', value: 'operations' },
  { label: 'Sales', value: 'sales' },
]);

const leaveTypeOptions = ref([
  { label: 'All Types', value: 'all' },
  { label: 'Vacation Leave', value: 'vacation' },
  { label: 'Sick Leave', value: 'sick' },
  { label: 'Emergency Leave', value: 'emergency' },
  { label: 'Maternity Leave', value: 'maternity' },
  { label: 'Paternity Leave', value: 'paternity' },
]);

const staticLeaveData: LeaveData[] = [
  {
    employeeName: 'Juan Dela Cruz',
    employeeId: 'E001',
    department: 'HR',
    leaveType: 'Vacation Leave',
    leaveDates: 'Sept 2-3, 2025',
    leaveDays: 2,
    leaveStatus: 'Approved'
  },
  {
    employeeName: 'Maria Santos',
    employeeId: 'E002',
    department: 'Finance',
    leaveType: 'Sick Leave',
    leaveDates: 'Sept 5, 2025',
    leaveDays: 1,
    leaveStatus: 'Approved'
  },
  {
    employeeName: 'Pedro Ramirez',
    employeeId: 'E003',
    department: 'IT',
    leaveType: 'Emergency Leave',
    leaveDates: 'Sept 10, 2025',
    leaveDays: 1,
    leaveStatus: 'Pending'
  },
  {
    employeeName: 'Ana Cruz',
    employeeId: 'E004',
    department: 'Operations',
    leaveType: 'Vacation Leave',
    leaveDates: 'Sept 15-17, 2025',
    leaveDays: 3,
    leaveStatus: 'Approved'
  },
  {
    employeeName: 'Roberto Garcia',
    employeeId: 'E005',
    department: 'Sales',
    leaveType: 'Sick Leave',
    leaveDates: 'Sept 8, 2025',
    leaveDays: 1,
    leaveStatus: 'Approved'
  },
  {
    employeeName: 'Isabel Martinez',
    employeeId: 'E006',
    department: 'HR',
    leaveType: 'Vacation Leave',
    leaveDates: 'Sept 20-24, 2025',
    leaveDays: 5,
    leaveStatus: 'Approved'
  },
  {
    employeeName: 'Carlos Rodriguez',
    employeeId: 'E007',
    department: 'IT',
    leaveType: 'Emergency Leave',
    leaveDates: 'Sept 12, 2025',
    leaveDays: 1,
    leaveStatus: 'Approved'
  },
  {
    employeeName: 'Sofia Hernandez',
    employeeId: 'E008',
    department: 'Finance',
    leaveType: 'Vacation Leave',
    leaveDates: 'Sept 25-26, 2025',
    leaveDays: 2,
    leaveStatus: 'Pending'
  },
  {
    employeeName: 'Miguel Torres',
    employeeId: 'E009',
    department: 'Operations',
    leaveType: 'Sick Leave',
    leaveDates: 'Sept 18, 2025',
    leaveDays: 1,
    leaveStatus: 'Approved'
  },
  {
    employeeName: 'Laura Gonzalez',
    employeeId: 'E010',
    department: 'Sales',
    leaveType: 'Vacation Leave',
    leaveDates: 'Sept 27-30, 2025',
    leaveDays: 4,
    leaveStatus: 'Approved'
  },
  {
    employeeName: 'Jose Reyes',
    employeeId: 'E011',
    department: 'IT',
    leaveType: 'Paternity Leave',
    leaveDates: 'Sept 15-21, 2025',
    leaveDays: 7,
    leaveStatus: 'Approved'
  },
  {
    employeeName: 'Carmen Lopez',
    employeeId: 'E012',
    department: 'HR',
    leaveType: 'Maternity Leave',
    leaveDates: 'Sept 1-30, 2025',
    leaveDays: 30,
    leaveStatus: 'Approved'
  }
];

const fetchData = async () => {
  loading.value = true;
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update company info with selected period
    companyInfo.value.periodCovered = filters.value.period.label;

    // Filter data based on selected filters
    let filteredData = [...staticLeaveData];

    // Apply department filter
    if (filters.value.department && filters.value.department.value !== 'all') {
      filteredData = filteredData.filter(
        item => item.department.toLowerCase() === filters.value.department!.value
      );
    }

    // Apply leave type filter
    if (filters.value.leaveType && filters.value.leaveType.value !== 'all') {
      const typeMap: Record<string, string> = {
        vacation: 'Vacation Leave',
        sick: 'Sick Leave',
        emergency: 'Emergency Leave',
        maternity: 'Maternity Leave',
        paternity: 'Paternity Leave'
      };
      const leaveTypeFilter = typeMap[filters.value.leaveType.value];
      if (leaveTypeFilter) {
        filteredData = filteredData.filter(item => item.leaveType === leaveTypeFilter);
      }
    }

    leaveData.value = filteredData;

    $q.notify({
      type: 'positive',
      message: 'Leave report generated successfully',
      position: 'top'
    });
  } catch (error) {
    console.error('Error generating leave report:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to generate leave report',
      position: 'top'
    });
  } finally {
    loading.value = false;
  }
};

const clearFilters = () => {
  filters.value.period = { label: 'September 2025', value: '2025-09' };
  filters.value.department = null;
  filters.value.leaveType = null;
  leaveData.value = [];
  companyInfo.value.periodCovered = '';
};

const handleExport = (format: 'excel' | 'pdf') => {
  console.log('Export triggered:', format);
  $q.notify({
    type: 'positive',
    message: `Exporting to ${format.toUpperCase()}...`,
    position: 'top'
  });
};

onMounted(() => {
  // Auto-generate report on mount
  fetchData();
});
</script>

<style scoped lang="scss">
.report-container {
  width: 100%;
}

.surface-container {
  background-color: var(--q-surface);
  border: 1px solid var(--q-border);
  transition: box-shadow 0.2s ease-in-out;
}

.rounded-borders {
  border-radius: 12px;
}

.text-on-surface-variant {
  color: var(--q-on-surface-variant, #49454E);
}

@media (max-width: $breakpoint-sm-max) {
  .report-container {
    padding: 0;
  }

  .surface-container {
    border-radius: 0;
    margin-left: -16px;
    margin-right: -16px;
    width: calc(100% + 32px);
  }
}
</style>