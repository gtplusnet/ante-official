<template>
  <div class="scheduler-management-page">
    <div class="page-head q-mb-lg">
      <div class="row items-center justify-between">
        <div class="title text-title-large">Scheduler Management</div>
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
        </div>
      </div>
    </div>

    <div class="page-content">
      <!-- Loading State -->
      <div v-if="loading && !schedulers.length" class="loading-state">
        <q-spinner-dots color="primary" size="50px" />
        <div class="loading-text">Loading schedulers...</div>
      </div>

      <!-- Scheduler Table -->
      <q-table
        v-else
        :rows="schedulers"
        :columns="columns"
        row-key="id"
        v-model:pagination="pagination"
        @request="onRequest"
        :loading="loading"
        flat
        class="scheduler-table"
        :table-header-style="{ backgroundColor: '#fafafa' }"
      >
        <template v-slot:body="props">
          <q-tr :props="props" class="scheduler-row">
            <q-td key="name" :props="props">
              <div class="scheduler-name">
                <span class="text-body-medium font-medium">{{ props.row.name }}</span>
              </div>
            </q-td>
            <q-td key="cronExpression" :props="props">
              <div class="schedule-info">
                <div class="schedule-description">{{ getCronDescription(props.row.cronExpression) }}</div>
                <code class="cron-expression">{{ props.row.cronExpression }}</code>
              </div>
            </q-td>
            <q-td key="status" :props="props">
              <div class="status-cell">
                <span :class="['status-badge', `status-${props.row.status.toLowerCase()}`]">
                  {{ props.row.status }}
                </span>
                <q-toggle
                  v-model="props.row.isActive"
                  @update:model-value="toggleScheduler(props.row.id)"
                  color="primary"
                  size="sm"
                  :keep-color="true"
                />
              </div>
            </q-td>
            <q-td key="lastRun" :props="props">
              <div v-if="props.row.lastRunAt" class="time-info">
                <q-icon name="history" size="16px" class="q-mr-xs" />
                {{ formatDate(props.row.lastRunAt) }}
                <span :class="['execution-status', `status-${props.row.lastStatus?.toLowerCase() || 'none'}`]">
                  {{ props.row.lastStatus }}
                </span>
              </div>
              <div v-else class="text-grey">Never run</div>
            </q-td>
            <q-td key="nextRun" :props="props">
              <div v-if="props.row.nextRunAt && props.row.isActive" class="time-info">
                <q-icon name="schedule" size="16px" class="q-mr-xs" />
                {{ formatDate(props.row.nextRunAt) }}
              </div>
              <div v-else class="text-grey">{{ props.row.isActive ? 'Calculating...' : 'Inactive' }}</div>
            </q-td>
            <q-td key="actions" :props="props">
              <div class="action-buttons">
                <q-btn
                  flat
                  round
                  icon="play_arrow"
                  size="sm"
                  color="green"
                  @click="runNow(props.row)"
                  :disable="props.row.status === 'RUNNING'"
                >
                  <q-tooltip>Run Now</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  icon="history"
                  size="sm"
                  color="blue"
                  @click="viewHistory(props.row)"
                >
                  <q-tooltip>View History</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  icon="edit"
                  size="sm"
                  color="primary"
                  @click="openEditDialog(props.row)"
                >
                  <q-tooltip>Edit Settings</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </q-tr>
        </template>

        <!-- No data slot -->
        <template v-slot:no-data>
          <div class="empty-state">
            <q-icon name="event_busy" class="empty-icon" />
            <div class="empty-text">No schedulers found</div>
            <div class="text-caption text-grey q-mt-sm">
              Schedulers will appear here once they are configured in the system.
            </div>
          </div>
        </template>
      </q-table>
    </div>

    <!-- Add/Edit Dialog -->
    <SchedulerAddEditDialog
      v-model="isAddEditDialogOpen"
      :scheduler="selectedScheduler"
      :available-tasks="availableTasks"
      @saved="onSchedulerSaved"
    />

    <!-- History Dialog -->
    <SchedulerExecutionHistoryDialog
      v-model="isHistoryDialogOpen"
      :scheduler="selectedScheduler"
    />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { date } from 'quasar';
import SchedulerAddEditDialog from './dialogs/SchedulerAddEditDialog.vue';
import SchedulerExecutionHistoryDialog from './dialogs/SchedulerExecutionHistoryDialog.vue';
import { getCronDescription } from 'src/utils/cronHelper';

export default defineComponent({
  name: 'SchedulerManagement',
  components: {
    SchedulerAddEditDialog,
    SchedulerExecutionHistoryDialog,
  },
  setup() {
    const $q = useQuasar();
    const loading = ref(false);
    const schedulers = ref([]);
    const availableTasks = ref([]);
    const selectedScheduler = ref(null);
    const isAddEditDialogOpen = ref(false);
    const isHistoryDialogOpen = ref(false);

    const pagination = ref({
      sortBy: 'createdAt',
      descending: true,
      page: 1,
      rowsPerPage: 10,
      rowsNumber: 0,
    });

    const columns = [
      {
        name: 'name',
        label: 'Scheduler Name',
        align: 'left',
        field: 'name',
        sortable: true,
      },
      {
        name: 'cronExpression',
        label: 'Schedule',
        align: 'center',
        field: 'cronExpression',
      },
      {
        name: 'status',
        label: 'Status',
        align: 'center',
        field: 'status',
      },
      {
        name: 'lastRun',
        label: 'Last Run',
        align: 'center',
        field: 'lastRunAt',
        sortable: true,
      },
      {
        name: 'nextRun',
        label: 'Next Run',
        align: 'center',
        field: 'nextRunAt',
        sortable: true,
      },
      {
        name: 'actions',
        label: 'Actions',
        align: 'center',
      },
    ];

    const loadSchedulers = async (page = 1, limit = 10) => {
      loading.value = true;
      try {
        const response = await api.get('/scheduler', {
          params: { page, limit },
        });
        schedulers.value = response.data.data || [];
        pagination.value.page = response.data.page || 1;
        pagination.value.rowsNumber = response.data.total || 0;
        pagination.value.rowsPerPage = limit;
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Failed to load schedulers',
          position: 'top',
        });
      } finally {
        loading.value = false;
      }
    };

    const loadAvailableTasks = async () => {
      try {
        const response = await api.get('/scheduler/available-tasks');
        availableTasks.value = response.data || [];
      } catch (error) {
        console.error('Failed to load available tasks:', error);
      }
    };

    const onRequest = (props) => {
      const { page, rowsPerPage } = props.pagination;
      pagination.value.page = page;
      pagination.value.rowsPerPage = rowsPerPage;
      loadSchedulers(page, rowsPerPage);
    };

    const refreshData = () => {
      loadSchedulers(pagination.value.page, pagination.value.rowsPerPage);
    };

    const openEditDialog = (scheduler) => {
      selectedScheduler.value = scheduler;
      isAddEditDialogOpen.value = true;
    };

    const onSchedulerSaved = () => {
      refreshData();
    };

    const toggleScheduler = async (id) => {
      try {
        await api.post(`/scheduler/${id}/toggle`);
        $q.notify({
          type: 'positive',
          message: 'Scheduler status updated',
          position: 'top',
        });
        refreshData();
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Failed to toggle scheduler',
          position: 'top',
        });
        refreshData();
      }
    };

    const runNow = async (scheduler) => {
      $q.dialog({
        title: 'Run Scheduler Now',
        message: `Are you sure you want to run "${scheduler.name}" now?`,
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          await api.post(`/scheduler/${scheduler.id}/run`);
          $q.notify({
            type: 'positive',
            message: 'Scheduler execution started',
            position: 'top',
          });
          refreshData();
        } catch (error) {
          $q.notify({
            type: 'negative',
            message: 'Failed to run scheduler',
            position: 'top',
          });
        }
      });
    };

    const viewHistory = (scheduler) => {
      selectedScheduler.value = scheduler;
      isHistoryDialogOpen.value = true;
    };


    const formatDate = (dateValue) => {
      if (!dateValue) return '';
      return date.formatDate(dateValue, 'MMM DD, YYYY HH:mm');
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'IDLE':
          return 'grey';
        case 'RUNNING':
          return 'orange';
        case 'ERROR':
          return 'red';
        default:
          return 'grey';
      }
    };

    onMounted(() => {
      loadSchedulers();
      loadAvailableTasks();
    });

    return {
      loading,
      schedulers,
      availableTasks,
      selectedScheduler,
      isAddEditDialogOpen,
      isHistoryDialogOpen,
      pagination,
      columns,
      onRequest,
      refreshData,
      openEditDialog,
      onSchedulerSaved,
      toggleScheduler,
      runNow,
      viewHistory,
      formatDate,
      getStatusColor,
      getCronDescription,
    };
  },
});
</script>

<style lang="scss" scoped>
.scheduler-management-page {
  .page-head {
    background: #ffffff;
    padding: 24px;
    border-radius: 12px;
    border: 1px solid #e0e0e0;

    .title {
      font-size: 24px;
      font-weight: 500;
      color: #1a1a1a;
      letter-spacing: -0.5px;
    }

    .page-actions {
      display: flex;
      gap: 8px;
    }
  }

  .page-content {
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #e0e0e0;
    padding: 0;
    overflow: hidden;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
    gap: 16px;

    .loading-text {
      color: var(--q-grey-7);
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 0;
    gap: 16px;

    .empty-icon {
      font-size: 72px;
      color: #e0e0e0;
    }

    .empty-text {
      font-size: 18px;
      font-weight: 500;
      color: #424242;
    }

    .text-caption {
      color: #757575;
      max-width: 400px;
      text-align: center;
      line-height: 1.5;
    }
  }

  .scheduler-table {
    border: none;
    
    :deep(.q-table__top),
    :deep(.q-table__bottom) {
      border-top: 1px solid #e0e0e0;
    }

    :deep(thead tr th) {
      font-weight: 600;
      color: #5f5f5f;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 16px;
      background: #fafafa;
      border-bottom: 1px solid #e0e0e0;
    }

    .scheduler-row {
      transition: background-color 0.2s ease;

      &:hover {
        background-color: #f5f5f5;
      }

      :deep(td) {
        padding: 16px;
        border-bottom: 1px solid #f0f0f0;
      }
    }

    .scheduler-name {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      
      .font-medium {
        font-weight: 500;
        color: #1a1a1a;
        font-size: 13px;
      }
    }

    .schedule-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: center;
      max-width: 250px;
      margin: 0 auto;
    }

    .schedule-description {
      font-size: 12px;
      font-weight: 500;
      color: #1a1a1a;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      max-width: 100%;
    }

    .cron-expression {
      font-family: 'Roboto Mono', monospace;
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 6px;
      font-size: 10px;
      color: #757575;
      border: 1px solid #e0e0e0;
      white-space: nowrap;
    }

    .status-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &.status-idle {
        background: #f5f5f5;
        color: #757575;
      }

      &.status-running {
        background: #fff3e0;
        color: #f57c00;
      }

      &.status-error {
        background: #ffebee;
        color: #d32f2f;
      }
    }

    .time-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #616161;

      .q-icon {
        color: #9e9e9e;
      }
    }

    .execution-status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      margin-left: 8px;
      text-transform: uppercase;
      letter-spacing: 0.3px;

      &.status-success {
        background: #e8f5e9;
        color: #2e7d32;
      }

      &.status-failed {
        background: #ffebee;
        color: #c62828;
      }

      &.status-none {
        background: #fafafa;
        color: #9e9e9e;
      }
    }

    .action-buttons {
      display: flex;
      gap: 4px;

      .q-btn {
        &:hover {
          background: #f5f5f5;
        }
      }
    }
  }
}
</style>