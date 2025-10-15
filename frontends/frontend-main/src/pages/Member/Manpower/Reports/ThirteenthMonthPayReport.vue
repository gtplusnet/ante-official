<template>
  <expanded-nav-page-container>
    <div class="report-container">
      <!-- MD3 Surface with elevation -->
      <div>
        <div class="row items-center">
          <div class="col">
            <div class="text-title-large">13th Month Pay Report</div>
            <q-breadcrumbs class="text-body-small">
              <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
              <q-breadcrumbs-el label="Reports" />
              <q-breadcrumbs-el label="13th Month Pay" />
            </q-breadcrumbs>
          </div>
        </div>
      </div>

      <!-- Filters Section with MD3 Card -->
      <div class="surface-container rounded-borders q-py-md q-mb-lg">
        <div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-input
                v-model="filters.year"
                label="Year"
                outlined
                dense
                type="number"
                :min="2020"
                :max="new Date().getFullYear()"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-select
                v-model="filters.branch"
                label="Branch"
                outlined
                dense
                :options="branchOptions"
                clearable
                option-label="label"
                option-value="value"
              />
            </div>
            <div class="col-12 col-md-4">
              <div class="row q-gutter-sm">
                <GButton
                  label="Search"
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

      <!-- Data Table with MD3 Surface -->
      <div class="surface-container rounded-borders">
        <ThirteenthMonthPayTable
          title="13th Month Pay Computation"
          :rows="thirteenthMonthData"
          :pagination="pagination"
          @request="onTableRequest"
        />
      </div>
    </div>
  </expanded-nav-page-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import ThirteenthMonthPayTable from './components/ThirteenthMonthPayTable.vue';
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

const $q = useQuasar();

const thirteenthMonthData = ref<ThirteenthMonthPayData[]>([]);
const loading = ref(false);
const filters = ref({
  year: new Date().getFullYear(),
  branch: null as { label: string; value: string } | null
});

const branchOptions = ref([
  { label: 'All Branches', value: 'all' },
  { label: 'Main Office', value: 'main' },
  { label: 'Branch 1', value: 'branch1' },
  { label: 'Branch 2', value: 'branch2' }
]);

const pagination = ref({
  sortBy: null as string | null,
  descending: true,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0
});

const fetchData = async () => {
  loading.value = true;
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Static data based on the screenshot
    thirteenthMonthData.value = [
      {
        id: 1,
        employeeNo: '001',
        employeeName: 'Juan Dela Cruz',
        department: 'Accounting',
        basicSalary: 20000,
        monthsWorked: 12,
        totalBasicPayEarned: 240000,
        thirteenthMonthPay: 20000
      },
      {
        id: 2,
        employeeNo: '002',
        employeeName: 'Maria Santos',
        department: 'HR',
        basicSalary: 18000,
        monthsWorked: 12,
        totalBasicPayEarned: 216000,
        thirteenthMonthPay: 18000
      },
      {
        id: 3,
        employeeNo: '003',
        employeeName: 'Pedro Reyes',
        department: 'IT',
        basicSalary: 22000,
        monthsWorked: 10,
        totalBasicPayEarned: 220000,
        thirteenthMonthPay: 18333.33
      },
      {
        id: 4,
        employeeNo: '004',
        employeeName: 'Ana Mendoza',
        department: 'Admin',
        basicSalary: 15000,
        monthsWorked: 8,
        totalBasicPayEarned: 120000,
        thirteenthMonthPay: 10000
      },
      {
        id: 5,
        employeeNo: '005',
        employeeName: 'Jose Ramirez',
        department: 'Operations',
        basicSalary: 25000,
        monthsWorked: 6,
        totalBasicPayEarned: 150000,
        thirteenthMonthPay: 12500
      }
    ];

    pagination.value.rowsNumber = thirteenthMonthData.value.length;
  } catch (error) {
    console.error('Error fetching 13th month pay data:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to load 13th month pay records',
      position: 'top'
    });
  } finally {
    loading.value = false;
  }
};

const clearFilters = () => {
  filters.value.year = new Date().getFullYear();
  filters.value.branch = null;
  fetchData();
};

const onTableRequest = (props: { pagination: { page: number; rowsPerPage: number; sortBy: string; descending: boolean } }) => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
};

onMounted(() => {
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