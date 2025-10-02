<template>
  <div class="queue-process-page">
    <div class="page-head q-mb-lg">
      <div class="row items-center justify-between">
        <div class="title text-title-large">Queue Process List</div>
        <div class="page-actions">
          <q-btn
            flat
            round
            icon="refresh"
            color="primary"
            @click="refreshData"
            :loading="loading"
          >
            <q-tooltip>Refresh</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            icon="filter_list"
            color="primary"
            @click="showFilters = !showFilters"
          >
            <q-tooltip>Toggle Filters</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>

    <div class="page-content">
      <!-- Filters Section -->
      <q-slide-transition>
        <div v-show="showFilters" class="filters-section q-mb-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-select
                v-model="filters.type"
                label="Queue Type"
                :options="queueTypeOptions"
                clearable
                outlined
                dense
                emit-value
                map-options
                class="text-body-medium"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-select
                v-model="filters.status"
                label="Status"
                :options="statusOptions"
                clearable
                outlined
                dense
                emit-value
                map-options
                class="text-body-medium"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model="filters.search"
                label="Search by name"
                outlined
                dense
                clearable
                class="text-body-medium"
              >
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
          </div>
          <div class="row q-mt-sm">
            <q-space />
            <q-btn
              label="Apply Filters"
              color="primary"
              unelevated
              @click="applyFilters"
              class="text-label-medium"
            />
            <q-btn
              label="Clear"
              color="grey"
              flat
              @click="clearFilters"
              class="q-ml-sm text-label-medium"
            />
          </div>
        </div>
      </q-slide-transition>

      <!-- Loading State -->
      <div v-if="loading && !queueProcessList.length" class="loading-state">
        <q-spinner-dots color="primary" size="50px" />
        <div class="loading-text">Loading queue processes...</div>
      </div>

      <!-- Queue Table -->
      <q-table
        v-else
        :rows="queueProcessList"
        :columns="columns"
        row-key="id"
        v-model:pagination="pagination"
        @request="onRequest"
        :loading="loading"
        flat
        class="queue-table"
        :table-header-style="{ backgroundColor: '#fafafa' }"
      >
        <template v-slot:body="props">
          <q-tr
            :props="props"
            @click="openQueueDialog(props.row.id)"
            class="queue-row"
          >
            <q-td key="name" :props="props">
              <div class="queue-name-cell">
                <span class="text-body-small font-medium">{{ props.row.name }}</span>
              </div>
            </q-td>
            <q-td key="type" :props="props">
              <div class="queue-type-cell">
                <span :class="['type-badge', `type-${props.row.type}`]">
                  {{ props.row.type }}
                </span>
              </div>
            </q-td>
            <q-td key="processCount" :props="props">
              <div class="process-count-cell">
                <span class="count-number">{{ props.row.totalCount }}</span>
              </div>
            </q-td>
            <q-td key="createdAt" :props="props">
              <div class="time-info">
                <q-icon name="schedule" size="16px" class="q-mr-xs" />
                {{ props.row.createdAt.dateTime }}
              </div>
            </q-td>
            <q-td key="status" :props="props">
              <div class="status-cell">
                <queue-status-badge :queueReponse="props.row" />
              </div>
            </q-td>
          </q-tr>
        </template>

        <!-- No data slot -->
        <template v-slot:no-data>
          <div class="empty-state">
            <q-icon name="inbox" class="empty-icon" />
            <div class="empty-text">No queue processes found</div>
            <div class="text-caption text-grey q-mt-sm">
              Queue processes will appear here once they are created in the system.
            </div>
          </div>
        </template>
      </q-table>
    </div>

    <QueueDialog v-model="isQueueDialogOpen" :queueId="queueId" />
  </div>
</template>

<script>
import { api } from 'src/boot/axios';
import QueueDialog from "../../../components/dialog/QueueDialog/QueueDialog.vue";
import QueueStatusBadge from "../../../components/dialog/QueueDialog/QueueStatusBadge.vue";

export default {
  name: 'SettingsQueueProcess',
  components: {
    QueueStatusBadge,
    QueueDialog,
  },
  props: {
    variant: {
      type: String,
      default: 'create',
      validator: (value) => ['create', 'edit'].includes(value),
    },
  },
  computed: {
    hasData() {
      return this.queueProcessList.length > 0;
    },
  },
  data: () => ({
    queueProcessList: [],
    queueId: '',
    isQueueDialogOpen: false,
    loading: false,
    showFilters: false,
    filters: {
      type: null,
      status: null,
      search: '',
    },
    columns: [
      {
        name: 'name',
        label: 'Queue Name',
        align: 'left',
        field: 'name',
        sortable: true,
      },
      {
        name: 'type',
        label: 'Queue Type',
        align: 'center',
        field: 'type',
        sortable: true,
      },
      {
        name: 'processCount',
        label: 'Process Count',
        align: 'center',
        field: 'totalCount',
        sortable: true,
      },
      {
        name: 'createdAt',
        label: 'Creation Date',
        align: 'center',
        field: row => row.createdAt.dateTime,
        sortable: true,
      },
      {
        name: 'status',
        label: 'Status',
        align: 'center',
        field: 'status',
      },
    ],
    pagination: {
      sortBy: 'createdAt',
      descending: true,
      page: 1,
      rowsPerPage: 10,
      rowsNumber: 0,
    },
    queueTypeOptions: [
      { label: 'Email', value: 'email' },
      { label: 'SMS', value: 'sms' },
      { label: 'Notification', value: 'notification' },
      { label: 'Report', value: 'report' },
      { label: 'Export', value: 'export' },
    ],
    statusOptions: [
      { label: 'Pending', value: 'pending' },
      { label: 'Processing', value: 'processing' },
      { label: 'Completed', value: 'completed' },
      { label: 'Failed', value: 'failed' },
    ],
  }),
  mounted() {
    this.loadQueueTable();
  },
  methods: {
    openQueueDialog(queueId) {
      this.queueId = queueId;
      this.isQueueDialogOpen = true;
    },
    async loadQueueTable(page = 1, limit = 10) {
      this.loading = true;
      try {
        const params = {
          page,
          limit,
          ...this.getFilterParams(),
        };
        const urlString = new URLSearchParams(params).toString();
        const url = `/queue/table?${urlString}`;

        const response = await api.get(url);
        this.queueProcessList = response.data.data || [];
        this.pagination.page = response.data.page || 1;
        this.pagination.rowsNumber = response.data.total || 0;
        this.pagination.rowsPerPage = limit;
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: 'Failed to load queue processes',
          position: 'top',
        });
      } finally {
        this.loading = false;
      }
    },
    onRequest(props) {
      const { page, rowsPerPage, sortBy, descending } = props.pagination;
      this.pagination.page = page;
      this.pagination.rowsPerPage = rowsPerPage;
      this.pagination.sortBy = sortBy;
      this.pagination.descending = descending;
      this.loadQueueTable(page, rowsPerPage);
    },
    refreshData() {
      this.loadQueueTable(this.pagination.page, this.pagination.rowsPerPage);
    },
    getFilterParams() {
      const params = {};
      if (this.filters.type) params.type = this.filters.type;
      if (this.filters.status) params.status = this.filters.status;
      if (this.filters.search) params.search = this.filters.search;
      return params;
    },
    applyFilters() {
      this.pagination.page = 1;
      this.loadQueueTable(1, this.pagination.rowsPerPage);
    },
    clearFilters() {
      this.filters = {
        type: null,
        status: null,
        search: '',
      };
      this.applyFilters();
    },
  },
};
</script>

<style lang="scss" scoped>
@import './QueueProcess.scss';
</style>