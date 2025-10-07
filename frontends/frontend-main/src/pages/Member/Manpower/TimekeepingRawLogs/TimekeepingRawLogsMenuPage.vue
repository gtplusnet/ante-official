<template>
  <expanded-nav-page-container>
    <div class="page-head q-pb-md">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="text-title-large">Raw Logs Browse</div>
          <div>
            <q-breadcrumbs class="text-body-small">
              <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
              <q-breadcrumbs-el label="Timekeeping Logs" />
              <q-breadcrumbs-el label="Raw Logs Browse" />
            </q-breadcrumbs>
          </div>
        </div>
        <div>
          <q-btn
            color="primary"
            icon="download"
            label="Export"
            :disable="loading"
            @click="exportToExcel"
          />
        </div>
      </div>
    </div>

    <!-- Import Batch Filter Notification -->
    <q-banner v-if="importBatchId" class="bg-info text-white q-mb-md" rounded>
      <template v-slot:avatar>
        <q-icon name="filter_list" />
      </template>
      <div class="row items-center">
        <div class="col">
          Showing logs from import batch: <strong>{{ importBatchInfo?.fileName || importBatchId }}</strong>
          <div v-if="importBatchInfo" class="text-caption">
            Imported by {{ importBatchInfo.uploadedBy }} on {{ formatDateTime(importBatchInfo.completedAt) }}
          </div>
        </div>
        <div class="col-auto">
          <q-btn
            flat
            round
            dense
            icon="close"
            @click="clearImportBatchFilter"
          />
        </div>
      </div>
    </q-banner>

    <!-- Filters Section -->
    <div class="filters-section q-mb-md">
      <div class="row q-gutter-md">
        <div class="col-12 col-md-3">
          <q-input
            v-model="dateRange"
            label="Date Range"
            outlined
            dense
            readonly
            :disable="!!importBatchId"
            @click="!importBatchId && (showDateRangePicker = true)"
          >
            <template v-slot:append>
              <q-icon name="event" :class="importBatchId ? 'text-grey' : 'cursor-pointer'" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-md-4">
          <q-input
            v-model="searchQuery"
            label="Search Employee"
            outlined
            dense
            clearable
            @update:model-value="debouncedSearch"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-md-3">
          <q-select
            v-model="sourceFilter"
            :options="sourceOptions"
            label="Source"
            outlined
            dense
            clearable
            emit-value
            map-options
            @update:model-value="debouncedFetchData"
          />
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <q-table
      :rows="rows"
      :columns="columns"
      row-key="id"
      :pagination="pagination"
      :loading="loading"
      @request="onRequest"
      binary-state-sort
      flat
      bordered
    >
      <template v-slot:body-cell-employeeName="props">
        <q-td :props="props">
          <div class="text-label-large">{{ props.row.employeeName }}</div>
          <div class="text-body-small text-grey">{{ props.row.employeeCode }}</div>
        </q-td>
      </template>

      <template v-slot:body-cell-timeIn="props">
        <q-td :props="props">
          {{ formatDateTime(props.row.timeIn) }}
        </q-td>
      </template>

      <template v-slot:body-cell-timeOut="props">
        <q-td :props="props">
          {{ formatDateTime(props.row.timeOut) }}
        </q-td>
      </template>

      <template v-slot:body-cell-source="props">
        <q-td :props="props">
          <q-badge :color="getSourceColor(props.row.source.key)" :label="props.row.source.label"/>
          <div v-if="props.row.importBatchId" class="text-caption text-grey q-mt-xs">
            {{ props.row.importBatch?.fileName || 'Import Batch' }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-timeInLocation="props">
        <q-td :props="props">
          <div class="row items-center q-gutter-xs">
            <q-icon name="place" color="positive" size="sm" />
            <span>{{ props.row.timeInLocation || 'N/A' }}</span>
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-timeInIpAddress="props">
        <q-td :props="props">
          <span class="text-grey">{{ props.row.timeInIpAddress || 'N/A' }}</span>
        </q-td>
      </template>

      <template v-slot:body-cell-timeOutLocation="props">
        <q-td :props="props">
          <div class="row items-center q-gutter-xs">
            <q-icon name="place" color="negative" size="sm" />
            <span>{{ props.row.timeOutLocation || 'N/A' }}</span>
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-timeOutIpAddress="props">
        <q-td :props="props">
          <span class="text-grey">{{ props.row.timeOutIpAddress || 'N/A' }}</span>
        </q-td>
      </template>

      <template v-slot:no-data>
        <div class="full-width row flex-center text-grey q-gutter-sm q-pa-lg">
          <q-icon size="2em" name="sentiment_dissatisfied" />
          <span>No data available</span>
        </div>
      </template>
    </q-table>

    <!-- Date Range Dialog -->
    <q-dialog v-model="showDateRangePicker">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Select Date Range</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-date
            v-model="tempDateRange"
            range
            color="primary"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="cancelDateRange" />
          <q-btn flat label="Apply" color="primary" @click="applyDateRange" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { ref, onMounted, getCurrentInstance } from 'vue';
import { useQuasar, QTableColumn, date, debounce } from 'quasar';
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';

interface TimekeepingRawLog {
  id: number;
  employeeCode: string;
  employeeName: string;
  timeIn: string;
  timeOut: string;
  timeSpan: string;
  source: {
    key: string;
    label: string;
  };
  // TIME-IN GEOLOCATION
  timeInLocation: string | null;
  timeInIpAddress: string | null;
  // TIME-OUT GEOLOCATION
  timeOutLocation: string | null;
  timeOutIpAddress: string | null;
  importBatchId: string | null;
  importBatch: {
    id: string;
    fileName: string;
  } | null;
  createdAt: string;
}

interface ImportBatchInfo {
  fileName: string;
  uploadedBy: string;
  completedAt: string;
}

export default {
  name: 'TimekeepingRawLogsMenuPage',
  components: {
    ExpandedNavPageContainer,
  },
  setup() {
    const $q = useQuasar();
    const instance = getCurrentInstance();
    const $api = instance?.appContext.config.globalProperties.$api;
    const $route = instance?.proxy?.$route;
    const $router = instance?.proxy?.$router;

    // Data
    const rows = ref<TimekeepingRawLog[]>([]);
    const loading = ref(false);
    const searchQuery = ref('');
    const sourceFilter = ref(null);
    const showDateRangePicker = ref(false);
    const importBatchId = ref($route?.query?.importBatchId || null);
    const importBatchInfo = ref<ImportBatchInfo | null>(null);
    
    // Date range - default to current month
    const now = new Date();
    const startOfMonth = date.startOfDate(now, 'month');
    const endOfMonth = date.endOfDate(now, 'month');
    const currentMonth = {
      from: date.formatDate(startOfMonth, 'YYYY/MM/DD'),
      to: date.formatDate(endOfMonth, 'YYYY/MM/DD'),
    };
    const tempDateRange = ref(currentMonth);
    const dateRange = ref(`${date.formatDate(startOfMonth, 'MMM DD, YYYY')} - ${date.formatDate(endOfMonth, 'MMM DD, YYYY')}`);

    // Pagination
    const pagination = ref({
      sortBy: 'timeIn',
      descending: true,
      page: 1,
      rowsPerPage: 50,
      rowsNumber: 0,
    });

    // Table columns
    const columns: QTableColumn[] = [
      {
        name: 'employeeName',
        label: 'Employee',
        align: 'left' as const,
        field: 'employeeName',
        sortable: true,
      },
      {
        name: 'timeIn',
        label: 'Time In',
        align: 'left' as const,
        field: 'timeIn',
        sortable: true,
      },
      {
        name: 'timeOut',
        label: 'Time Out',
        align: 'left' as const,
        field: 'timeOut',
        sortable: true,
      },
      {
        name: 'timeSpan',
        label: 'Time Span',
        align: 'center' as const,
        field: 'timeSpan',
        sortable: true,
      },
      {
        name: 'source',
        label: 'Source',
        align: 'center' as const,
        field: 'source',
        sortable: true,
      },
      {
        name: 'timeInLocation',
        label: 'Time In Location',
        align: 'left' as const,
        field: 'timeInLocation',
        sortable: false,
      },
      {
        name: 'timeInIpAddress',
        label: 'Time In IP',
        align: 'left' as const,
        field: 'timeInIpAddress',
        sortable: false,
      },
      {
        name: 'timeOutLocation',
        label: 'Time Out Location',
        align: 'left' as const,
        field: 'timeOutLocation',
        sortable: false,
      },
      {
        name: 'timeOutIpAddress',
        label: 'Time Out IP',
        align: 'left' as const,
        field: 'timeOutIpAddress',
        sortable: false,
      },
      {
        name: 'createdAt',
        label: 'Created At',
        align: 'left' as const,
        field: 'createdAt',
        sortable: true,
      },
    ];

    // Source options
    const sourceOptions = [
      { label: 'Manual', value: 'MANUAL' },
      { label: 'Biometrics', value: 'BIOMETRICS' },
      { label: 'API', value: 'API' },
    ];

    // Methods
    const fetchData = async (props: any = {}) => {
      const { page = pagination.value.page, rowsPerPage = pagination.value.rowsPerPage } = props.pagination || {};
      
      loading.value = true;
      try {
        const params: any = {
          page,
          limit: rowsPerPage,
          search: searchQuery.value || undefined,
          source: sourceFilter.value || undefined,
          importBatchId: importBatchId.value || undefined,
        };

        // Add date range if set (but not when filtering by import batch)
        if (!importBatchId.value) {
          if (tempDateRange.value.from) {
            params.startDate = date.formatDate(tempDateRange.value.from, 'YYYY-MM-DD');
          }
          if (tempDateRange.value.to) {
            params.endDate = date.formatDate(tempDateRange.value.to, 'YYYY-MM-DD');
          }
        }

        if (!$api) {
          throw new Error('API not available');
        }

        const response = await $api.get('/hris/timekeeping/raw-logs', { params });
        
        rows.value = response.data.list;
        pagination.value.rowsNumber = response.data.pagination.total;
        pagination.value.page = response.data.pagination.page;
        pagination.value.rowsPerPage = response.data.pagination.limit;
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Failed to fetch timekeeping raw logs',
        });
      } finally {
        loading.value = false;
      }
    };

    const onRequest = (props: any) => {
      pagination.value = props.pagination;
      fetchData(props);
    };

    const debouncedSearch = debounce(() => {
      fetchData();
    }, 500);

    const debouncedFetchData = debounce(() => {
      fetchData();
    }, 300);

    const formatDateTime = (dateString: string) => {
      return date.formatDate(dateString, 'MMM DD, YYYY hh:mm A');
    };

    const getSourceColor = (source: string) => {
      const colors: Record<string, string> = {
        MANUAL: 'blue',
        BIOMETRICS: 'green',
        API: 'orange',
      };
      return colors[source] || 'grey';
    };

    const getSourceIcon = (log: TimekeepingRawLog): string => {
      if (log.importBatchId) {
        return 'upload_file';
      }
      switch (log.source.key) {
        case 'MANUAL':
          return 'edit';
        case 'BIOMETRICS':
          return 'fingerprint';
        case 'API':
          return 'api';
        default:
          return 'help_outline';
      }
    };

    const clearImportBatchFilter = () => {
      importBatchId.value = null;
      importBatchInfo.value = null;
      // Remove from URL query
      if ($router) {
        $router.replace({ query: {} });
      }
      fetchData();
    };

    const loadImportBatchInfo = async () => {
      if (!importBatchId.value || !$api) return;
      
      try {
        const response = await $api.get(`/hris/timekeeping/import/${importBatchId.value}/success-summary`);
        importBatchInfo.value = response.data;
      } catch (error) {
        console.error('Failed to load import batch info:', error);
      }
    };

    const applyDateRange = () => {
      if (tempDateRange.value.from && tempDateRange.value.to) {
        dateRange.value = `${date.formatDate(tempDateRange.value.from, 'MMM DD, YYYY')} - ${date.formatDate(tempDateRange.value.to, 'MMM DD, YYYY')}`;
      } else if (tempDateRange.value.from) {
        dateRange.value = date.formatDate(tempDateRange.value.from, 'MMM DD, YYYY');
      }
      showDateRangePicker.value = false;
      fetchData();
    };

    const cancelDateRange = () => {
      // Reset temp date range to current selection
      if (dateRange.value.includes(' - ')) {
        const dates = dateRange.value.split(' - ');
        tempDateRange.value = {
          from: date.formatDate(dates[0], 'YYYY/MM/DD'),
          to: date.formatDate(dates[1], 'YYYY/MM/DD'),
        };
      }
      showDateRangePicker.value = false;
    };

    const exportToExcel = async () => {
      try {
        loading.value = true;
        const params: any = {
          search: searchQuery.value || undefined,
          source: sourceFilter.value || undefined,
        };

        if (tempDateRange.value.from) {
          params.startDate = date.formatDate(tempDateRange.value.from, 'YYYY-MM-DD');
        }
        if (tempDateRange.value.to) {
          params.endDate = date.formatDate(tempDateRange.value.to, 'YYYY-MM-DD');
        }

        if (!$api) {
          throw new Error('API not available');
        }

        const response = await $api.get('/hris/timekeeping/raw-logs/export', { 
          params,
          responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `timekeeping-raw-logs-${date.formatDate(new Date(), 'YYYY-MM-DD')}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        $q.notify({
          type: 'positive',
          message: 'Export successful',
        });
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Export feature not yet implemented',
        });
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      if (importBatchId.value) {
        loadImportBatchInfo();
      }
      fetchData();
    });

    return {
      rows,
      columns,
      loading,
      pagination,
      searchQuery,
      sourceFilter,
      sourceOptions,
      dateRange,
      tempDateRange,
      showDateRangePicker,
      importBatchId,
      importBatchInfo,
      fetchData,
      onRequest,
      debouncedSearch,
      debouncedFetchData,
      formatDateTime,
      getSourceColor,
      getSourceIcon,
      clearImportBatchFilter,
      applyDateRange,
      cancelDateRange,
      exportToExcel,
    };
  },
};
</script>

<style scoped>
.filters-section {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
}
</style>