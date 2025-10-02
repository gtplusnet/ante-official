<template>
  <expanded-nav-page-container>
    <div class="report-container">
      <!-- MD3 Surface with elevation -->
      <div>
        <div class="row items-center">
          <div class="col">
            <div class="text-title-large">PhilHealth Contributions Report</div>
            <q-breadcrumbs class="text-body-small">
              <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
              <q-breadcrumbs-el label="Reports" />
              <q-breadcrumbs-el label="PhilHealth Contributions" />
            </q-breadcrumbs>
          </div>
        </div>
      </div>

      <!-- Filters Section with MD3 Card -->
      <div class="surface-container rounded-borders q-py-md q-mb-lg">
        <GovernmentContributionFilters
          v-model="filters"
          :loading="loading"
          @search="fetchData"
        />
      </div>

      <!-- Data Table with MD3 Surface -->
      <div class="surface-container rounded-borders">
        <PhilhealthContributionTable
          title="PhilHealth Contributions"
          :rows="sortedContributions"
          :loading="loading"
          :pagination="pagination"
          :sortColumns="sortColumns"
          @request="onTableRequest"
          @sort="onSort"
        />
      </div>
    </div>
  </expanded-nav-page-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import GovernmentContributionFilters from './components/GovernmentContributionFilters.vue';
import PhilhealthContributionTable from './components/PhilhealthContributionTable.vue';
import { getGovernmentPaymentHistoryPhilhealth } from '../../../../utility/api.handler';

interface ContributionData {
  id: number;
  employeeCode: string;
  employeeName: string;
  branch: string;
  covered: string;
  periodStart: { dateFull: string; dateStandard: string; raw: string };
  periodEnd: { dateFull: string; dateStandard: string; raw: string };
  basis: { raw: number; formatCurrency: string; formatNumber: string };
  employeeShare: { raw: number; formatCurrency: string; formatNumber: string };
  employerShare: { raw: number; formatCurrency: string; formatNumber: string };
  amount: { raw: number; formatCurrency: string; formatNumber: string };
  datePosted: { dateFull: string; dateStandard: string; raw: string };
}

const $q = useQuasar();

const contributions = ref<ContributionData[]>([]);
const loading = ref(false);
const filters = ref({
  startDate: null as string | null,
  endDate: null as string | null,
  accountId: null as string | null
});

const pagination = ref({
  sortBy: null as string | null,
  descending: true,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0
});

// Track multiple column sorts
interface SortColumn {
  column: string;
  order: 'asc' | 'desc';
}
const sortColumns = ref<SortColumn[]>([]);

const fetchData = async () => {
  loading.value = true;
  try {
    const params: Record<string, string> = {};

    if (filters.value.startDate) {
      params.startDate = filters.value.startDate;
    }
    if (filters.value.endDate) {
      params.endDate = filters.value.endDate;
    }
    if (filters.value.accountId && filters.value.accountId !== null) {
      params.accountId = filters.value.accountId;
    }

    const response = await getGovernmentPaymentHistoryPhilhealth($q, params);
    contributions.value = (response as unknown as ContributionData[]) || [];
    pagination.value.rowsNumber = contributions.value.length;
  } catch (error) {
    console.error('Error fetching PhilHealth contributions:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to load PhilHealth contributions',
      position: 'top'
    });
  } finally {
    loading.value = false;
  }
};

const sortedContributions = computed(() => {
  let sorted = [...contributions.value];
  
  // Apply multiple column sorting
  if (sortColumns.value.length > 0) {
    sorted.sort((a, b) => {
      for (const sortCol of sortColumns.value) {
        const { column, order } = sortCol;
        let aVal: any;
        let bVal: any;
        
        // Handle nested properties
        if (column === 'basis' || column === 'employeeShare' || column === 'employerShare' || column === 'amount') {
          const aField = a[column as keyof ContributionData];
          const bField = b[column as keyof ContributionData];
          aVal = (aField && typeof aField === 'object' && 'raw' in aField) ? aField.raw : 0;
          bVal = (bField && typeof bField === 'object' && 'raw' in bField) ? bField.raw : 0;
        } else if (column === 'datePosted') {
          aVal = new Date(a.datePosted.raw).getTime();
          bVal = new Date(b.datePosted.raw).getTime();
        } else {
          aVal = a[column as keyof ContributionData] || '';
          bVal = b[column as keyof ContributionData] || '';
        }
        
        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        else if (aVal > bVal) comparison = 1;
        
        if (comparison !== 0) {
          return order === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }
  
  // Apply pagination
  const start = (pagination.value.page - 1) * pagination.value.rowsPerPage;
  const end = start + pagination.value.rowsPerPage;
  return sorted.slice(start, end);
});

const onTableRequest = (props: { pagination: { page: number; rowsPerPage: number; sortBy: string; descending: boolean } }) => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
};

const onSort = (column: string) => {
  const existingIndex = sortColumns.value.findIndex(col => col.column === column);
  
  if (existingIndex !== -1) {
    const existing = sortColumns.value[existingIndex];
    if (existing.order === 'asc') {
      // Change to descending
      sortColumns.value[existingIndex].order = 'desc';
    } else {
      // Remove from sort
      sortColumns.value.splice(existingIndex, 1);
    }
  } else {
    // Add new sort column as ascending
    sortColumns.value.push({ column, order: 'asc' });
  }
};

onMounted(() => {
  // Set default date range to current month
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  filters.value.startDate = firstDay.toISOString().split('T')[0];
  filters.value.endDate = lastDay.toISOString().split('T')[0];

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

.surface-container-low {
  background-color: var(--q-surface);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
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
  
  .surface-container,
  .surface-container-low {
    border-radius: 0;
    margin-left: -16px;
    margin-right: -16px;
    width: calc(100% + 32px);
  }
}
</style>
