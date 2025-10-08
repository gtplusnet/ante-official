<template>
  <div>
    <!-- Action Button -->
    <div class="row justify-end q-mb-md" v-if="!readonly">
      <GButton icon="add" label="Create Logs" @click="showAddDialog" />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="row justify-center q-py-xl">
      <q-spinner color="primary" size="3em" />
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && rawLogs.length === 0" class="text-center q-py-xl">
      <q-icon name="event_busy" size="4em" color="grey-5" />
      <div class="text-h6 text-grey-7 q-mt-md">No timekeeping logs found</div>
      <div class="text-caption text-grey-6">Logs will appear here once recorded</div>
    </div>

    <!-- Modern Card-Based Layout -->
    <div v-else class="logs-container">
      <div
        v-for="log in rawLogs"
        :key="log.id"
        class="log-card"
      >
        <!-- Card Header: Date & Hours -->
        <div class="card-header">
          <div class="date-section">
            <q-icon name="event" size="18px" color="primary" />
            <div class="date-info">
              <div class="date-main">{{ log.timeIn?.date || 'No Date' }}</div>
              <div class="date-day">{{ log.timeIn?.day || '-' }}</div>
            </div>
          </div>
          <div class="hours-section">
            <div class="hours-label">Duration</div>
            <div class="hours-value">{{ log.timeSpan?.formatted || '00:00' }}</div>
          </div>
          <div class="actions-section" v-if="!readonly">
            <q-btn color="grey-7" dense round flat icon="more_vert" size="sm">
              <q-menu auto-close>
                <q-list dense>
                  <q-item @click="editLogs(log)" clickable v-close-popup>
                    <q-item-section avatar>
                      <q-icon name="edit" size="xs" />
                    </q-item-section>
                    <q-item-section>Edit</q-item-section>
                  </q-item>
                  <q-item @click="deleteLogs(log)" clickable v-close-popup>
                    <q-item-section avatar>
                      <q-icon name="delete" size="xs" />
                    </q-item-section>
                    <q-item-section>Delete</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>

        <!-- Card Body: Time In/Out & Location -->
        <div class="card-body">
          <!-- Time In Column -->
          <div class="time-column in-column">
            <div class="time-header">
              <q-icon name="login" size="16px" color="positive" />
              <span>TIME IN</span>
            </div>
            <div class="time-content" v-if="log.timeIn">
              <div class="time-main">{{ log.timeIn.time }}</div>
              <div class="location-info" v-if="log.timeInLocation || log.timeInIpAddress">
                <div class="location-item" v-if="log.timeInLocation">
                  <q-icon name="place" size="14px" />
                  <span>{{ log.timeInLocation }}</span>
                </div>
                <div class="location-item" v-if="log.timeInIpAddress">
                  <q-icon name="computer" size="14px" />
                  <span>{{ log.timeInIpAddress }}</span>
                </div>
              </div>
              <div class="no-location" v-else>No location data</div>
            </div>
            <div class="no-data" v-else>No time in recorded</div>
          </div>

          <!-- Divider -->
          <div class="vertical-divider"></div>

          <!-- Time Out Column -->
          <div class="time-column out-column">
            <div class="time-header">
              <q-icon name="logout" size="16px" color="negative" />
              <span>TIME OUT</span>
            </div>
            <div class="time-content" v-if="log.timeOut">
              <div class="time-main">{{ log.timeOut.time }}</div>
              <div class="location-info" v-if="log.timeOutLocation || log.timeOutIpAddress">
                <div class="location-item" v-if="log.timeOutLocation">
                  <q-icon name="place" size="14px" />
                  <span>{{ log.timeOutLocation }}</span>
                </div>
                <div class="location-item" v-if="log.timeOutIpAddress">
                  <q-icon name="computer" size="14px" />
                  <span>{{ log.timeOutIpAddress }}</span>
                </div>
              </div>
              <div class="no-location" v-else>No location data</div>
            </div>
            <div class="no-data" v-else>No time out recorded</div>
          </div>
        </div>

        <!-- Card Footer: Source -->
        <div class="card-footer" v-if="log.source">
          <div class="source-label">Source:</div>
          <q-badge
            :color="getSourceColor(log.source.key)"
            :label="log.source.label"
            class="source-badge"
          />
        </div>
      </div>
    </div>

    <!-- Create Logs Dialog -->
    <PayrollTimeKeepingRawLogsCreateDialog
      :editData="editData as any"
      @simulation-completed="simulationCompleted"
      v-model="isRawLogsCreateDialogOpen"
      :employeeAccountId="employeeAccountId"
      :cutoffDateRange="cutoffDateRange"
    />
  </div>
</template>

<script lang="ts">
import { TimekeepingLogResponse } from '@shared/response';
import { ref, Ref, defineAsyncComponent, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import GButton from 'src/components/shared/buttons/GButton.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const PayrollTimeKeepingRawLogsCreateDialog = defineAsyncComponent(() =>
  import('./PayrollTimeKeepingRawLogsCreateDialog.vue')
);

export default {
  name: 'PayrollTimeKeepingRawLogs',
  components: {
    PayrollTimeKeepingRawLogsCreateDialog,
    GButton,
  },
  props: {
    readonly: {
      type: Boolean,
      default: false,
    },
    employeeAccountId: {
      type: String,
      required: true,
    },
    cutoffDateRange: {
      type: Object,
      required: true,
    },
  },
  emits: ['simulation-completed'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const loading = ref(false);
    const rawLogs: Ref<TimekeepingLogResponse[]> = ref([]);
    const editData: Ref<TimekeepingLogResponse | null> = ref(null);
    const isRawLogsCreateDialogOpen: Ref<boolean> = ref(false);

    // Table columns configuration
    const columns = [
      {
        name: 'timeInOut',
        label: 'Time In / Time Out',
        field: 'timeInOut',
        align: 'left' as const,
        sortable: false,
      },
      {
        name: 'hours',
        label: 'Hours',
        field: 'timeSpan',
        align: 'center' as const,
        sortable: true,
      },
      {
        name: 'source',
        label: 'Source',
        field: 'source',
        align: 'center' as const,
        sortable: true,
      },
      {
        name: 'geolocation',
        label: 'Location & IP',
        field: 'geolocation',
        align: 'left' as const,
        sortable: false,
      },
      ...(props.readonly
        ? []
        : [
            {
              name: 'actions',
              label: 'Actions',
              field: 'actions',
              align: 'center' as const,
              sortable: false,
            },
          ]),
    ];

    // Fetch raw logs data
    const fetchRawLogs = async () => {
      loading.value = true;
      try {
        const response = await api.put(
          `/hris/timekeeping/raw-logs/table?page=1&perPage=1000&employeeAccountId=${props.employeeAccountId}&cutoffDateRangeId=${props.cutoffDateRange.key}`,
          {
            filters: [],
            settings: {},
          }
        );

        rawLogs.value = response.data.list || [];
      } catch (error: any) {
        $q.notify({
          type: 'negative',
          message: `Error loading logs: ${error.message}`,
        });
        rawLogs.value = [];
      } finally {
        loading.value = false;
      }
    };

    // Get color for source badge
    const getSourceColor = (sourceKey: string) => {
      const colorMap: Record<string, string> = {
        MANUAL: 'blue',
        FACIAL_RECOGNITION: 'purple',
        MOBILE_APP: 'teal',
        TASK_TRACKER: 'orange',
        IMPORT: 'grey',
      };
      return colorMap[sourceKey] || 'grey';
    };

    // Delete log handler
    const deleteLogs = (data: TimekeepingLogResponse) => {
      $q.dialog({
        title: 'Delete Log',
        message: 'Are you sure you want to delete this log?',
        cancel: true,
        persistent: true,
      }).onOk(() => {
        callDeleteAPI(data.id);
      });
    };

    const callDeleteAPI = (id: number) => {
      $q.loading.show({ message: 'Deleting log...' });

      api
        .delete(`/hris/timekeeping/raw-logs/delete?id=${id}`)
        .then(() => {
          $q.notify({
            type: 'positive',
            message: 'Log deleted successfully',
          });

          emit('simulation-completed');
          fetchRawLogs(); // Refresh data
        })
        .catch((error) => {
          $q.notify({
            type: 'negative',
            message: `Error deleting log: ${error.message}`,
          });
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const editLogs = (data: TimekeepingLogResponse) => {
      editData.value = data;
      isRawLogsCreateDialogOpen.value = true;
    };

    const showAddDialog = () => {
      editData.value = null;
      isRawLogsCreateDialogOpen.value = true;
    };

    const simulationCompleted = () => {
      fetchRawLogs(); // Refresh data
      emit('simulation-completed');
    };

    // Watch for changes in props and refetch
    watch(
      () => [props.employeeAccountId, props.cutoffDateRange.key],
      () => {
        fetchRawLogs();
      }
    );

    // Initial load
    onMounted(() => {
      fetchRawLogs();
    });

    return {
      loading,
      rawLogs,
      columns,
      deleteLogs,
      editLogs,
      callDeleteAPI,
      simulationCompleted,
      showAddDialog,
      editData,
      isRawLogsCreateDialogOpen,
      getSourceColor,
    };
  },
};
</script>

<style scoped lang="scss">
/* Material Design 3 - Flat, Dense, No Shadows */

/* Card Container */
.logs-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Individual Card */
.log-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  overflow: hidden;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: #bdbdbd;
  }
}

/* Card Header */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.date-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.date-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date-main {
  font-size: 0.875rem;
  font-weight: 600;
  color: #212121;
  line-height: 1.2;
}

.date-day {
  font-size: 0.75rem;
  color: #757575;
  line-height: 1;
}

.hours-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  margin-right: 16px;
}

.hours-label {
  font-size: 0.688rem;
  color: #757575;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hours-value {
  font-size: 1rem;
  font-weight: 700;
  color: #1976d2;
  line-height: 1;
}

.actions-section {
  flex-shrink: 0;
}

/* Card Body */
.card-body {
  display: flex;
  padding: 16px;
  gap: 24px;
}

.time-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #424242;
  margin-bottom: 4px;
}

.time-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-main {
  font-size: 1.125rem;
  font-weight: 600;
  color: #212121;
  line-height: 1.2;
}

.location-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 4px;
}

.location-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.813rem;
  color: #616161;
  line-height: 1.3;

  span {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .q-icon {
    color: #9e9e9e;
    flex-shrink: 0;
  }
}

.no-location {
  font-size: 0.75rem;
  color: #bdbdbd;
  font-style: italic;
  padding-left: 4px;
}

.vertical-divider {
  width: 1px;
  background: #e0e0e0;
  margin: 0 8px;
}

/* Card Footer */
.card-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: #fafafa;
  border-top: 1px solid #e0e0e0;
}

.source-label {
  font-size: 0.75rem;
  color: #757575;
  font-weight: 500;
}

.source-badge {
  font-size: 0.75rem !important;
  padding: 4px 10px !important;
  border-radius: 12px !important;
  font-weight: 500;
}

/* No Data State */
.no-data {
  font-size: 0.813rem;
  color: #9e9e9e;
  font-style: italic;
}

/* Empty State */
:deep(.q-icon) {
  &[name='event_busy'] {
    opacity: 0.5;
  }
}

/* Remove default shadows from Material Design components */
:deep(.q-chip),
:deep(.q-badge),
:deep(.q-btn) {
  box-shadow: none !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .card-body {
    flex-direction: column;
    gap: 16px;
  }

  .vertical-divider {
    display: none;
  }

  .hours-section {
    margin-right: 12px;
  }
}
</style>
