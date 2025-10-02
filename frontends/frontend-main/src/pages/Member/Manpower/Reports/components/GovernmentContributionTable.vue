<template>
  <div class="government-contribution-table">
    <q-table
      :rows="rows"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :pagination="pagination"
      @request="onRequest"
      :rows-per-page-options="[10, 20, 50, 100]"
      :no-data-label="''"
      class="md3-table"
      flat
      square
    >
      <template v-slot:top>
        <div class="table-header q-pa-md">
          <div class="row items-center">
            <div class="col">
              <h2 class="text-h6 text-weight-medium q-ma-none">{{ title }}</h2>
              <div class="text-body-medium text-on-surface-variant q-mt-xs">
                {{ rows.length }} records found
              </div>
            </div>
            <q-space />
            <q-btn
              flat
              round
              icon="download"
              color="primary"
              size="md"
              @click="exportToCSV"
              :disable="!rows.length"
              class="md3-icon-button"
            >
              <q-tooltip class="text-body-small">Export to CSV</q-tooltip>
            </q-btn>
          </div>
        </div>
      </template>

      <template v-slot:header="props">
        <q-tr :props="props" class="table-header-row">
          <q-th 
            v-for="col in props.cols" 
            :key="col.name" 
            :props="props" 
            class="text-body-medium text-weight-medium header-cell"
            :class="{ 
              'sortable-header': col.sortable,
              'sorted': getSortInfo(col.name).index !== -1
            }"
            @click="col.sortable && handleSort(col.name)"
          >
            <div class="header-content">
              <span class="header-label">{{ col.label }}</span>
              <div v-if="col.sortable && getSortInfo(col.name).index !== -1" class="sort-indicator-wrapper">
                <q-icon
                  :name="getSortIcon(col.name)"
                  size="16px"
                  class="sort-icon"
                />
                <span 
                  v-if="sortColumns.length > 1"
                  class="sort-order"
                >
                  {{ getSortInfo(col.name).index + 1 }}
                </span>
              </div>
            </div>
          </q-th>
        </q-tr>
      </template>

      <template v-slot:body="props">
        <q-tr :props="props" class="table-body-row">
          <q-td key="employeeCode" :props="props" class="text-body-medium">
            <span class="text-weight-medium">{{ props.row.employeeCode }}</span>
          </q-td>
          <q-td key="employeeName" :props="props" class="text-body-medium">
            {{ props.row.employeeName }}
          </q-td>
          <q-td key="branch" :props="props" class="text-body-medium">
            <q-chip size="sm" color="surface-variant" text-color="on-surface-variant" square>
              {{ props.row.branch }}
            </q-chip>
          </q-td>
          <q-td key="period" :props="props" class="text-body-medium">
            <div class="text-caption text-on-surface-variant">{{ props.row.periodStart.dateFull }}</div>
            <div class="text-caption text-on-surface-variant">{{ props.row.periodEnd.dateFull }}</div>
          </q-td>
          <q-td key="basis" :props="props" class="text-right text-body-medium">
            {{ props.row.basis.formatCurrency }}
          </q-td>
          <q-td key="employeeShare" :props="props" class="text-right text-body-medium">
            <span class="text-primary">{{ props.row.employeeShare.formatCurrency }}</span>
          </q-td>
          <q-td key="employerShare" :props="props" class="text-right text-body-medium">
            <span class="text-secondary">{{ props.row.employerShare.formatCurrency }}</span>
          </q-td>
          <q-td key="total" :props="props" class="text-right text-body-medium">
            <span class="text-weight-medium">{{ props.row.amount.formatCurrency }}</span>
          </q-td>
          <q-td key="datePosted" :props="props" class="text-body-medium">
            {{ props.row.datePosted.dateFull }}
          </q-td>
        </q-tr>
      </template>

      <template v-slot:bottom-row v-if="rows.length > 0">
        <q-tr class="totals-row">
          <q-td colspan="4" class="text-right text-body-large text-weight-medium">
            Total
          </q-td>
          <q-td class="text-right text-body-large text-weight-medium">
            {{ totals.basis }}
          </q-td>
          <q-td class="text-right text-body-large text-weight-medium text-primary">
            {{ totals.employeeShare }}
          </q-td>
          <q-td class="text-right text-body-large text-weight-medium text-secondary">
            {{ totals.employerShare }}
          </q-td>
          <q-td class="text-right text-body-large text-weight-bold">
            {{ totals.total }}
          </q-td>
          <q-td></q-td>
        </q-tr>
      </template>

      <template v-slot:no-data>
        <div class="no-data-container">
          <div class="column items-center">
            <q-icon name="folder_open" size="64px" color="on-surface-variant" />
            <div class="text-h6 text-on-surface-variant q-mt-md">No contribution records found</div>
            <div class="text-body-medium text-on-surface-variant q-mt-sm">
              Try adjusting your filters or date range
            </div>
          </div>
        </div>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue';
import { exportFile } from 'quasar';

interface ContributionRow {
  id: number;
  employeeCode: string;
  employeeName: string;
  branch: string;
  periodStart: { dateFull: string; dateStandard: string; raw: string };
  periodEnd: { dateFull: string; dateStandard: string; raw: string };
  basis: { raw: number; formatCurrency: string; formatNumber: string };
  employeeShare: { raw: number; formatCurrency: string; formatNumber: string };
  employerShare: { raw: number; formatCurrency: string; formatNumber: string };
  amount: { raw: number; formatCurrency: string; formatNumber: string };
  datePosted: { dateFull: string; dateStandard: string; raw: string };
}

interface SortColumn {
  column: string;
  order: 'asc' | 'desc';
}

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  rows: {
    type: Array as PropType<ContributionRow[]>,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  pagination: {
    type: Object,
    default: () => ({
      sortBy: null,
      descending: true,
      page: 1,
      rowsPerPage: 20,
      rowsNumber: 0
    })
  },
  sortColumns: {
    type: Array as PropType<SortColumn[]>,
    default: () => []
  }
});

const emit = defineEmits(['request', 'sort']);

const columns = [
  {
    name: 'employeeCode',
    label: 'Employee Code',
    field: 'employeeCode',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'employeeName',
    label: 'Employee Name',
    field: 'employeeName',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'branch',
    label: 'Branch',
    field: 'branch',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'period',
    label: 'Period Covered',
    field: 'period',
    align: 'left' as const,
    sortable: false
  },
  {
    name: 'basis',
    label: 'Basis Amount',
    field: 'basis',
    align: 'right' as const,
    sortable: true
  },
  {
    name: 'employeeShare',
    label: 'Employee Share',
    field: 'employeeShare',
    align: 'right' as const,
    sortable: true
  },
  {
    name: 'employerShare',
    label: 'Employer Share',
    field: 'employerShare',
    align: 'right' as const,
    sortable: true
  },
  {
    name: 'total',
    label: 'Total',
    field: 'amount',
    align: 'right' as const,
    sortable: true
  },
  {
    name: 'datePosted',
    label: 'Date Posted',
    field: 'datePosted',
    align: 'left' as const,
    sortable: true
  }
];

const totals = computed(() => {
  let basis = 0;
  let employeeShare = 0;
  let employerShare = 0;
  let total = 0;

  props.rows.forEach(row => {
    basis += row.basis.raw || 0;
    employeeShare += row.employeeShare.raw || 0;
    employerShare += row.employerShare.raw || 0;
    total += row.amount.raw || 0;
  });

  return {
    basis: `₱ ${basis.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
    employeeShare: `₱ ${employeeShare.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
    employerShare: `₱ ${employerShare.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
    total: `₱ ${total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  };
});

const onRequest = (requestProp: { pagination: { page: number; rowsPerPage: number; sortBy: string; descending: boolean } }) => {
  emit('request', requestProp);
};

const exportToCSV = () => {
  const content = [
    columns.map(col => col.label).join(','),
    ...props.rows.map(row => [
      row.employeeCode,
      row.employeeName,
      row.branch,
      `${row.periodStart.dateFull} - ${row.periodEnd.dateFull}`,
      row.basis.raw,
      row.employeeShare.raw,
      row.employerShare.raw,
      row.amount.raw,
      row.datePosted.dateFull
    ].join(','))
  ].join('\r\n');

  const status = exportFile(
    `${props.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`,
    content,
    'text/csv'
  );

  if (status !== true) {
    console.error('Browser denied file download...');
  }
};
const getSortInfo = (column: string) => {
  const index = props.sortColumns.findIndex(col => col.column === column);
  if (index === -1) return { index: -1, order: null };
  return { index, order: props.sortColumns[index].order };
};

const getSortIcon = (column: string) => {
  const info = getSortInfo(column);
  return info.order === 'asc' ? 'arrow_upward' : 'arrow_downward';
};

const handleSort = (column: string) => {
  emit('sort', column);
};
</script>

<style scoped lang="scss">
.government-contribution-table {
  width: 100%;
}

.table-header {
  border-bottom: 1px solid var(--q-outline, #E7E0EC);
}

:deep(.md3-table) {
  .q-table__container {
    border-radius: 0;
    box-shadow: none;
  }
  
  .q-table__top {
    padding: 0;
  }
  
  th {
    font-weight: 500;
    color: var(--q-on-surface, #1C1B1F);
    border-bottom: 1px solid var(--q-outline-variant, #CAC4D0);
    
    // Hide Quasar's default sort icon
    .q-table__sort-icon {
      display: none !important;
    }
  }
  
  tbody tr {
    &:hover {
      background-color: var(--q-surface-variant, #F7F2FA);
    }
  }
  
  td {
    border-bottom: 1px solid var(--q-outline-variant, #E7E0EC);
    padding: 12px 16px;
  }
}

.table-header-row {
  background-color: var(--q-surface-container, #F3EDF7);
}

.table-body-row {
  transition: background-color 0.2s ease;
}

.totals-row {
  background-color: var(--q-primary-container, #EADDFF);
  
  td {
    border-bottom: none;
    padding: 16px;
  }
}

.md3-icon-button {
  &:hover {
    background-color: var(--q-primary-container, #EADDFF);
  }
}

.no-data-container {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  text-align: center;
}

.text-on-surface-variant {
  color: var(--q-on-surface-variant, #49454E);
}

.surface-variant {
  background-color: var(--q-surface-variant, #F7F2FA);
}

.header-cell {
  white-space: nowrap;
}

.sortable-header {
  cursor: pointer;
  user-select: none;
  
  &:hover {
    background-color: var(--q-grey-2);
  }
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.header-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sort-indicator-wrapper {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  width: 30px; // Fixed width to prevent layout shift
  justify-content: flex-end;
}

.sort-icon {
  color: var(--q-primary);
}

.sort-order {
  font-size: 10px;
  font-weight: 600;
  color: var(--q-primary);
  background-color: var(--q-primary-container, #EADDFF);
  padding: 1px 4px;
  border-radius: 8px;
  line-height: 1;
}

.sorted {
  color: var(--q-primary);
  font-weight: 600;
}

@media (max-width: $breakpoint-sm-max) {
  :deep(.md3-table) {
    .q-table__card {
      box-shadow: none;
    }
    
    td {
      padding: 8px 12px;
    }
  }
  
  .table-header h2 {
    font-size: 1.125rem;
  }
}
</style>
