<template>
  <expanded-nav-page-container>
    <div class="report-container">
      <!-- MD3 Surface with elevation -->
      <div>
        <div class="row items-center">
          <div class="col">
            <div class="text-title-large">Payroll Cost Allocation</div>
            <q-breadcrumbs class="text-body-small">
              <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
              <q-breadcrumbs-el label="Reports" />
              <q-breadcrumbs-el label="Payroll Cost Allocation" />
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
              <q-input
                v-model="filters.employeeSearch"
                label="Employee Search"
                outlined
                dense
                clearable
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
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
      <div class="surface-container rounded-borders" v-if="payrollData && payrollData.length > 0">
        <PayrollCostAllocationTable
          :data="payrollData"
          :loading="loading"
          :companyInfo="companyInfo"
          @export="handleExport"
        />
      </div>

      <!-- No Data State -->
      <div class="surface-container rounded-borders q-pa-xl text-center" v-else-if="!loading">
        <q-icon name="o_attach_money" size="64px" color="on-surface-variant" />
        <div class="text-h6 q-mt-md text-on-surface-variant">No Report Generated</div>
        <div class="text-body2 text-on-surface-variant">Select a period and click Generate to view the payroll cost allocation report</div>
      </div>
    </div>
  </expanded-nav-page-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import PayrollCostAllocationTable from './components/PayrollCostAllocationTable.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';

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

const $q = useQuasar();

const payrollData = ref<PayrollData[]>([]);
const loading = ref(false);
const companyInfo = ref<CompanyInfo>({
  companyName: 'ABC Corporation',
  reportTitle: 'Payroll Cost Allocation',
  periodCovered: ''
});

const filters = ref({
  period: { label: 'September 2025', value: '2025-09' },
  department: null as { label: string; value: string } | null,
  employeeSearch: ''
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
  { label: 'HR', value: 'HR' },
  { label: 'Finance', value: 'Finance' },
  { label: 'IT', value: 'IT' },
  { label: 'Operations', value: 'Operations' },
  { label: 'Sales', value: 'Sales' },
]);

// Static payroll data based on screenshot
const staticPayrollData: PayrollData[] = [
  // HR Department
  { department: 'HR', employeeCode: 'E001', lastName: 'Santos', firstName: 'Maria', position: 'HR Manager', basicSalary: 50000, allowances: 5000, overtimePay: 2000, thirteenthMonth: 4166.67, sss: 1000, philhealth: 500, pagIbig: 100, totalCompensation: 62766.67 },
  { department: 'HR', employeeCode: 'E002', lastName: 'Reyes', firstName: 'Juan', position: 'HR Staff', basicSalary: 30000, allowances: 3000, overtimePay: 1500, thirteenthMonth: 2500, sss: 800, philhealth: 400, pagIbig: 100, totalCompensation: 38300 },
  { department: 'HR', employeeCode: 'E003', lastName: 'Dela Cruz', firstName: 'Ana', position: 'HR Staff', basicSalary: 30000, allowances: 3000, overtimePay: 1500, thirteenthMonth: 2500, sss: 800, philhealth: 400, pagIbig: 100, totalCompensation: 38300 },
  { department: 'HR', employeeCode: 'E004', lastName: 'Lopez', firstName: 'Carla', position: 'HR Assistant', basicSalary: 20000, allowances: 2000, overtimePay: 1000, thirteenthMonth: 1666.67, sss: 600, philhealth: 300, pagIbig: 100, totalCompensation: 25666.67 },
  { department: 'HR', employeeCode: 'E005', lastName: 'Villanueva', firstName: 'Mark', position: 'HR Assistant', basicSalary: 20000, allowances: 2000, overtimePay: 1000, thirteenthMonth: 1666.67, sss: 600, philhealth: 300, pagIbig: 100, totalCompensation: 25666.67 },

  // Finance Department
  { department: 'Finance', employeeCode: 'E006', lastName: 'Cruz', firstName: 'Paolo', position: 'Finance Manager', basicSalary: 60000, allowances: 6000, overtimePay: 2500, thirteenthMonth: 5000, sss: 1200, philhealth: 600, pagIbig: 100, totalCompensation: 75400 },
  { department: 'Finance', employeeCode: 'E007', lastName: 'Gomez', firstName: 'Lea', position: 'Accountant', basicSalary: 40000, allowances: 4000, overtimePay: 2000, thirteenthMonth: 3333.33, sss: 1000, philhealth: 500, pagIbig: 100, totalCompensation: 50933.33 },
  { department: 'Finance', employeeCode: 'E008', lastName: 'Tan', firstName: 'Grace', position: 'Accountant', basicSalary: 40000, allowances: 4000, overtimePay: 2000, thirteenthMonth: 3333.33, sss: 1000, philhealth: 500, pagIbig: 100, totalCompensation: 50933.33 },
  { department: 'Finance', employeeCode: 'E009', lastName: 'Lim', firstName: 'Eric', position: 'Finance Staff', basicSalary: 30000, allowances: 3000, overtimePay: 1500, thirteenthMonth: 2500, sss: 800, philhealth: 400, pagIbig: 100, totalCompensation: 38300 },

  // IT Department
  { department: 'IT', employeeCode: 'E010', lastName: 'Fernandez', firstName: 'Joel', position: 'IT Manager', basicSalary: 70000, allowances: 7000, overtimePay: 3000, thirteenthMonth: 5833.33, sss: 1400, philhealth: 800, pagIbig: 200, totalCompensation: 88233.33 },
  { department: 'IT', employeeCode: 'E011', lastName: 'Garcia', firstName: 'Nina', position: 'Developer', basicSalary: 50000, allowances: 5000, overtimePay: 2500, thirteenthMonth: 4166.67, sss: 1200, philhealth: 600, pagIbig: 200, totalCompensation: 63666.67 },
  { department: 'IT', employeeCode: 'E012', lastName: 'Bautista', firstName: 'Karl', position: 'Developer', basicSalary: 50000, allowances: 5000, overtimePay: 2500, thirteenthMonth: 4166.67, sss: 1200, philhealth: 600, pagIbig: 200, totalCompensation: 63666.67 },
  { department: 'IT', employeeCode: 'E013', lastName: 'Diaz', firstName: 'Ella', position: 'Support Staff', basicSalary: 30000, allowances: 3000, overtimePay: 1500, thirteenthMonth: 2500, sss: 800, philhealth: 400, pagIbig: 200, totalCompensation: 38400 },
  { department: 'IT', employeeCode: 'E014', lastName: 'Flores', firstName: 'Ben', position: 'Support Staff', basicSalary: 30000, allowances: 3000, overtimePay: 1500, thirteenthMonth: 2500, sss: 800, philhealth: 400, pagIbig: 200, totalCompensation: 38400 },

  // Sales Department
  { department: 'Sales', employeeCode: 'E015', lastName: 'Santiago', firstName: 'Ivy', position: 'Sales Manager', basicSalary: 80000, allowances: 8000, overtimePay: 4000, thirteenthMonth: 6666.67, sss: 1600, philhealth: 800, pagIbig: 200, totalCompensation: 101266.67 },
  { department: 'Sales', employeeCode: 'E016', lastName: 'Torres', firstName: 'Miguel', position: 'Sales Executive', basicSalary: 50000, allowances: 5000, overtimePay: 2500, thirteenthMonth: 4166.67, sss: 1200, philhealth: 600, pagIbig: 200, totalCompensation: 63666.67 },
  { department: 'Sales', employeeCode: 'E017', lastName: 'Ramos', firstName: 'Jenny', position: 'Sales Executive', basicSalary: 50000, allowances: 5000, overtimePay: 2500, thirteenthMonth: 4166.67, sss: 1200, philhealth: 600, pagIbig: 200, totalCompensation: 63666.67 },
  { department: 'Sales', employeeCode: 'E018', lastName: 'Navarro', firstName: 'Chris', position: 'Sales Staff', basicSalary: 30000, allowances: 3000, overtimePay: 1500, thirteenthMonth: 2500, sss: 800, philhealth: 400, pagIbig: 200, totalCompensation: 38400 },
  { department: 'Sales', employeeCode: 'E019', lastName: 'Castro', firstName: 'Faith', position: 'Sales Staff', basicSalary: 30000, allowances: 3000, overtimePay: 1500, thirteenthMonth: 2500, sss: 800, philhealth: 400, pagIbig: 200, totalCompensation: 38400 },

  // Operations Department
  { department: 'Operations', employeeCode: 'E020', lastName: 'Martinez', firstName: 'Leo', position: 'Ops Manager', basicSalary: 90000, allowances: 9000, overtimePay: 4000, thirteenthMonth: 7500, sss: 1800, philhealth: 900, pagIbig: 300, totalCompensation: 113500 },
  { department: 'Operations', employeeCode: 'E021', lastName: 'Domingo', firstName: 'Allan', position: 'Ops Supervisor', basicSalary: 60000, allowances: 6000, overtimePay: 3000, thirteenthMonth: 5000, sss: 1200, philhealth: 600, pagIbig: 300, totalCompensation: 76100 },
  { department: 'Operations', employeeCode: 'E022', lastName: 'Serrano', firstName: 'Kim', position: 'Ops Staff', basicSalary: 40000, allowances: 4000, overtimePay: 2000, thirteenthMonth: 3333.33, sss: 1000, philhealth: 500, pagIbig: 300, totalCompensation: 51133.33 },
  { department: 'Operations', employeeCode: 'E023', lastName: 'Chavez', firstName: 'Olga', position: 'Ops Staff', basicSalary: 40000, allowances: 4000, overtimePay: 2000, thirteenthMonth: 3333.33, sss: 1000, philhealth: 500, pagIbig: 300, totalCompensation: 51133.33 },
  { department: 'Operations', employeeCode: 'E024', lastName: 'Mendoza', firstName: 'Ryan', position: 'Ops Assistant', basicSalary: 30000, allowances: 3000, overtimePay: 1500, thirteenthMonth: 2500, sss: 800, philhealth: 400, pagIbig: 300, totalCompensation: 38500 },
  { department: 'Operations', employeeCode: 'E025', lastName: 'Padilla', firstName: 'Sofia', position: 'Ops Assistant', basicSalary: 30000, allowances: 3000, overtimePay: 1500, thirteenthMonth: 2500, sss: 800, philhealth: 400, pagIbig: 300, totalCompensation: 38500 }
];

const fetchData = async () => {
  loading.value = true;
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update company info with selected period
    companyInfo.value.periodCovered = filters.value.period.label;

    // Filter data based on selected filters
    let filteredData = [...staticPayrollData];

    // Apply department filter
    if (filters.value.department && filters.value.department.value !== 'all') {
      filteredData = filteredData.filter(
        item => item.department === filters.value.department!.value
      );
    }

    // Apply employee search filter
    if (filters.value.employeeSearch) {
      const search = filters.value.employeeSearch.toLowerCase();
      filteredData = filteredData.filter(item =>
        item.firstName.toLowerCase().includes(search) ||
        item.lastName.toLowerCase().includes(search) ||
        item.employeeCode.toLowerCase().includes(search) ||
        item.position.toLowerCase().includes(search)
      );
    }

    payrollData.value = filteredData;

    $q.notify({
      type: 'positive',
      message: 'Payroll cost allocation report generated successfully',
      position: 'top'
    });
  } catch (error) {
    console.error('Error generating payroll report:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to generate payroll report',
      position: 'top'
    });
  } finally {
    loading.value = false;
  }
};

const clearFilters = () => {
  filters.value.period = { label: 'September 2025', value: '2025-09' };
  filters.value.department = null;
  filters.value.employeeSearch = '';
  payrollData.value = [];
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