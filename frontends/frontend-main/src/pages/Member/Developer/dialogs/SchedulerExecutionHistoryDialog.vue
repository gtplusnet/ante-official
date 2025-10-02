<template>
  <q-dialog v-model="isOpen" maximized>
    <q-card class="history-card">
      <q-card-section class="dialog-header">
        <div class="header-content">
          <h1 class="dialog-title">Execution History</h1>
          <div class="dialog-subtitle">{{ scheduler?.name || 'Scheduler' }}</div>
        </div>
        <q-btn icon="close" flat round dense v-close-popup class="close-button" />
      </q-card-section>

      <q-card-section>
        <!-- Stats Summary -->
        <div class="row q-col-gutter-md q-mb-lg" v-if="stats">
          <div class="col-12 col-md-3">
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalExecutions }}</div>
              <div class="stat-label">Total Executions</div>
            </div>
          </div>
          <div class="col-12 col-md-3">
            <div class="stat-card stat-success">
              <div class="stat-value">{{ stats.successCount }}</div>
              <div class="stat-label">Successful</div>
            </div>
          </div>
          <div class="col-12 col-md-3">
            <div class="stat-card stat-error">
              <div class="stat-value">{{ stats.failureCount }}</div>
              <div class="stat-label">Failed</div>
            </div>
          </div>
          <div class="col-12 col-md-3">
            <div class="stat-card stat-info">
              <div class="stat-value">{{ stats.successRate }}%</div>
              <div class="stat-label">Success Rate</div>
            </div>
          </div>
        </div>

        <!-- Execution History Table -->
        <q-table
          :rows="executions"
          :columns="columns"
          row-key="id"
          v-model:pagination="pagination"
          @request="onRequest"
          :loading="loading"
          flat
          class="history-table"
          :table-header-style="{ backgroundColor: '#fafafa' }"
        >
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="status" :props="props">
                <span :class="['status-badge', `status-${props.row.status.toLowerCase()}`]">
                  {{ props.row.status }}
                </span>
              </q-td>
              <q-td key="startedAt" :props="props">
                {{ formatDate(props.row.startedAt) }}
              </q-td>
              <q-td key="completedAt" :props="props">
                {{ props.row.completedAt ? formatDate(props.row.completedAt) : '-' }}
              </q-td>
              <q-td key="duration" :props="props">
                {{ formatDuration(props.row.duration) }}
              </q-td>
              <q-td key="output" :props="props">
                <div v-if="props.row.output || props.row.error" class="execution-output">
                  <q-btn
                    label="View Details"
                    size="sm"
                    flat
                    color="primary"
                    class="view-details-btn"
                    @click="viewExecutionDetails(props.row)"
                  />
                </div>
                <div v-else class="text-grey">-</div>
              </q-td>
            </q-tr>
          </template>

          <!-- No data slot -->
          <template v-slot:no-data>
            <div class="empty-state">
              <q-icon name="history" class="empty-icon" />
              <div class="empty-text">No execution history found</div>
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Execution Details Dialog -->
    <q-dialog v-model="showDetailsDialog" maximized>
      <q-card class="details-card">
        <q-card-section class="details-header">
          <div class="details-title">Execution Details</div>
          <q-btn icon="close" flat round dense v-close-popup class="close-button" />
        </q-card-section>

        <q-card-section v-if="selectedExecution" class="details-body">
          <!-- Basic Info -->
          <div class="info-cards-container">
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-12 col-sm-6 col-md-3">
                <div class="info-card">
                  <q-icon name="info" size="24px" color="primary" />
                  <div class="info-content">
                    <div class="info-label">Status</div>
                    <span :class="['status-badge', `status-${selectedExecution.status.toLowerCase()}`]">
                      {{ selectedExecution.status }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <div class="info-card">
                  <q-icon name="timer" size="24px" color="primary" />
                  <div class="info-content">
                    <div class="info-label">Duration</div>
                    <div class="info-value">{{ formatDuration(selectedExecution.duration) }}</div>
                  </div>
                </div>
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <div class="info-card">
                  <q-icon name="play_arrow" size="24px" color="primary" />
                  <div class="info-content">
                    <div class="info-label">Started At</div>
                    <div class="info-value">{{ formatDate(selectedExecution.startedAt) }}</div>
                  </div>
                </div>
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <div class="info-card">
                  <q-icon name="stop" size="24px" color="primary" />
                  <div class="info-content">
                    <div class="info-label">Completed At</div>
                    <div class="info-value">{{ selectedExecution.completedAt ? formatDate(selectedExecution.completedAt) : '-' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Execution Details -->
          <div v-if="parsedExecutionDetails" class="execution-details-section">
            <h3 class="section-title">Execution Timeline</h3>
            
            <!-- Summary Card -->
            <div v-if="executionSummary" class="summary-card q-mb-md">
              <h4 class="summary-title">Summary</h4>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-3">
                  <div class="summary-stat">
                    <div class="summary-value">{{ executionSummary.totalCutoffs }}</div>
                    <div class="summary-label">Total Cutoffs</div>
                  </div>
                </div>
                <div class="col-12 col-md-3">
                  <div class="summary-stat stat-success">
                    <div class="summary-value">{{ executionSummary.processedCount }}</div>
                    <div class="summary-label">Processed</div>
                  </div>
                </div>
                <div class="col-12 col-md-3">
                  <div class="summary-stat stat-warning">
                    <div class="summary-value">{{ executionSummary.skippedCount }}</div>
                    <div class="summary-label">Skipped</div>
                  </div>
                </div>
                <div class="col-12 col-md-3">
                  <div class="summary-stat">
                    <div class="summary-value">{{ formatDuration(executionSummary.duration) }}</div>
                    <div class="summary-label">Total Duration</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Timeline -->
            <q-timeline color="primary" class="execution-timeline">
              <q-timeline-entry
                v-for="(detail, index) in parsedExecutionDetails"
                :key="index"
                :title="detail.phase"
                :subtitle="formatDate(detail.timestamp)"
                :icon="getPhaseIcon(detail.phase)"
                :color="getPhaseColor(detail.phase)"
              >
                <div class="timeline-content">
                  <div class="timeline-message">{{ detail.message }}</div>
                  
                  <!-- Phase-specific content -->
                  <div v-if="detail.data" class="timeline-data">
                    <!-- Initialization -->
                    <div v-if="detail.phase === 'INITIALIZATION'" class="data-section">
                      <div v-if="detail.data.config" class="config-info">
                        <strong>Configuration:</strong>
                        <pre class="config-data">{{ JSON.stringify(detail.data.config, null, 2) }}</pre>
                      </div>
                    </div>

                    <!-- Fetch Cutoffs -->
                    <div v-else-if="detail.phase === 'FETCH_CUTOFFS'" class="data-section">
                      <div v-if="detail.data.performanceMetrics" class="performance-metrics q-mb-md">
                        <q-card flat bordered>
                          <q-card-section>
                            <div class="text-weight-medium q-mb-sm">Query Optimization</div>
                            <div class="row q-col-gutter-sm text-caption">
                              <div class="col-6">
                                <q-icon name="storage" size="16px" color="primary" class="q-mr-xs" />
                                Total Cutoffs: {{ detail.data.performanceMetrics.totalCutoffsInSystem }}
                              </div>
                              <div class="col-6">
                                <q-icon name="filter_alt" size="16px" color="positive" class="q-mr-xs" />
                                Relevant: {{ detail.data.performanceMetrics.relevantCutoffs }}
                              </div>
                              <div class="col-6">
                                <q-icon name="block" size="16px" color="orange" class="q-mr-xs" />
                                Filtered Out: {{ detail.data.performanceMetrics.filteredOut }}
                              </div>
                              <div class="col-6">
                                <q-icon name="speed" size="16px" color="info" class="q-mr-xs" />
                                {{ detail.data.performanceMetrics.queryOptimization }}
                              </div>
                            </div>
                            <q-chip dense color="primary" text-color="white" class="q-mt-sm">
                              {{ detail.data.performanceMetrics.dateFilter }}
                            </q-chip>
                          </q-card-section>
                        </q-card>
                      </div>
                      <div v-if="detail.data.cutoffsByCompany" class="company-breakdown">
                        <strong>Relevant Cutoffs by Company:</strong>
                        <q-list dense class="q-mt-sm">
                          <q-item v-for="(count, company) in detail.data.cutoffsByCompany" :key="company">
                            <q-item-section avatar>
                              <q-icon name="business" size="20px" />
                            </q-item-section>
                            <q-item-section>{{ company }}</q-item-section>
                            <q-item-section side>
                              <q-badge color="primary">{{ count }}</q-badge>
                            </q-item-section>
                          </q-item>
                        </q-list>
                      </div>
                    </div>

                    <!-- Check Unprocessed -->
                    <div v-else-if="detail.phase === 'CHECK_UNPROCESSED'" class="data-section">
                      <div class="cutoff-check-info">
                        <div class="row q-col-gutter-sm">
                          <div class="col-6">
                            <strong>Company:</strong> {{ detail.data.company }}
                          </div>
                          <div class="col-6">
                            <strong>Cutoff Code:</strong> {{ detail.data.cutoffCode }}
                          </div>
                          <div class="col-6">
                            <strong>Date Range:</strong> {{ detail.data.startDate }} to {{ detail.data.endDate }}
                          </div>
                          <div class="col-6">
                            <strong>Employees:</strong> {{ detail.data.employeeCount }}
                          </div>
                          <div class="col-12">
                            <q-linear-progress 
                              :value="detail.data.computedRecords / detail.data.expectedRecords" 
                              size="25px"
                              :color="detail.data.hasUnprocessedDates ? 'warning' : 'positive'"
                              class="q-mt-sm"
                            >
                              <div class="absolute-full flex flex-center">
                                <q-badge 
                                  color="white" 
                                  text-color="black" 
                                  :label="`${detail.data.computedRecords} / ${detail.data.expectedRecords} records`"
                                />
                              </div>
                            </q-linear-progress>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Queue Decision -->
                    <div v-else-if="detail.phase === 'QUEUE_DECISION'" class="data-section">
                      <q-card flat bordered class="queue-decision-card">
                        <q-card-section>
                          <div class="text-h6 q-mb-md">
                            <q-icon name="gavel" color="primary" size="24px" class="q-mr-sm" />
                            Queue Creation Decision
                          </div>
                          
                          <!-- Decision Factors -->
                          <div class="decision-factors q-mb-md">
                            <div class="text-weight-medium q-mb-sm">Decision Factors:</div>
                            <q-list dense separator>
                              <q-item v-if="detail.data.decisionFactors">
                                <q-item-section avatar>
                                  <q-icon name="date_range" color="primary" />
                                </q-item-section>
                                <q-item-section>
                                  <q-item-label>Date Range</q-item-label>
                                  <q-item-label caption>{{ detail.data.decisionFactors.dateRangeReason }}</q-item-label>
                                </q-item-section>
                              </q-item>
                              
                              <q-item v-if="detail.data.decisionFactors">
                                <q-item-section avatar>
                                  <q-icon name="people" color="info" />
                                </q-item-section>
                                <q-item-section>
                                  <q-item-label>Employees</q-item-label>
                                  <q-item-label caption>{{ detail.data.decisionFactors.employeeReason }}</q-item-label>
                                </q-item-section>
                              </q-item>
                              
                              <q-item v-if="detail.data.decisionFactors">
                                <q-item-section avatar>
                                  <q-icon name="description" color="positive" />
                                </q-item-section>
                                <q-item-section>
                                  <q-item-label>Records</q-item-label>
                                  <q-item-label caption>{{ detail.data.decisionFactors.recordsReason }}</q-item-label>
                                </q-item-section>
                              </q-item>
                              
                              <q-item v-if="detail.data.decisionFactors">
                                <q-item-section avatar>
                                  <q-icon name="warning" color="warning" />
                                </q-item-section>
                                <q-item-section>
                                  <q-item-label>Conflict Detection</q-item-label>
                                  <q-item-label caption>{{ detail.data.decisionFactors.conflictDetectionReason }}</q-item-label>
                                </q-item-section>
                              </q-item>
                              
                              <q-item v-if="detail.data.decisionFactors">
                                <q-item-section avatar>
                                  <q-icon name="settings" color="secondary" />
                                </q-item-section>
                                <q-item-section>
                                  <q-item-label>Processing Strategy</q-item-label>
                                  <q-item-label caption>{{ detail.data.decisionFactors.processingStrategy }}</q-item-label>
                                </q-item-section>
                              </q-item>
                            </q-list>
                          </div>
                          
                          <!-- Business Justification -->
                          <div v-if="detail.data.businessJustification" class="business-justification">
                            <q-expansion-item
                              icon="business_center"
                              label="Business Justification"
                              header-class="text-primary"
                              dense
                            >
                              <q-card>
                                <q-card-section>
                                  <q-list dense>
                                    <q-item v-for="(justification, idx) in detail.data.businessJustification" :key="idx">
                                      <q-item-section avatar>
                                        <q-icon name="check_circle" color="positive" size="20px" />
                                      </q-item-section>
                                      <q-item-section>
                                        {{ justification }}
                                      </q-item-section>
                                    </q-item>
                                  </q-list>
                                </q-card-section>
                              </q-card>
                            </q-expansion-item>
                          </div>
                          
                          <!-- Queue Priority -->
                          <div v-if="detail.data.queuePriority" class="queue-priority q-mt-md">
                            <q-chip color="primary" text-color="white">
                              <q-icon name="priority_high" class="q-mr-xs" />
                              {{ detail.data.queuePriority.urgency }}
                            </q-chip>
                            <span class="text-caption text-grey-7 q-ml-sm">{{ detail.data.queuePriority.reason }}</span>
                          </div>
                        </q-card-section>
                      </q-card>
                    </div>

                    <!-- Skip Cutoff -->
                    <div v-else-if="detail.phase === 'SKIP_CUTOFF'" class="data-section">
                      <q-banner class="bg-orange-1 text-orange-9" rounded>
                        <template v-slot:avatar>
                          <q-icon name="info" color="orange" />
                        </template>
                        <div>
                          <strong>{{ detail.data.company }} - {{ detail.data.cutoffCode }}</strong><br>
                          <span class="text-caption">{{ detail.data.reason }}</span>
                        </div>
                      </q-banner>
                    </div>

                    <!-- Create Queue -->
                    <div v-else-if="detail.phase === 'CREATE_QUEUE'" class="data-section">
                      <q-banner class="bg-green-1 text-green-9" rounded>
                        <template v-slot:avatar>
                          <q-icon name="check_circle" color="green" />
                        </template>
                        <div>
                          <strong>{{ detail.data.queueName }}</strong><br>
                          <div class="text-caption q-mt-xs">
                            <div>Queue ID: {{ detail.data.queueId }}</div>
                            <div>Processing: {{ detail.data.processFromDate }} to {{ detail.data.processUpToDate }}</div>
                            <div v-if="detail.data.queueReason" class="text-weight-medium q-mt-xs">
                              <q-icon name="info" size="16px" class="q-mr-xs" />
                              {{ detail.data.queueReason }}
                            </div>
                          </div>
                        </div>
                      </q-banner>
                    </div>

                    <!-- Summary -->
                    <div v-else-if="detail.phase === 'SUMMARY'" class="data-section">
                      <!-- Processed Cutoffs -->
                      <div v-if="detail.data.processedCutoffs && detail.data.processedCutoffs.length > 0" class="q-mb-md">
                        <h5 class="subsection-title">Processed Cutoffs</h5>
                        <q-list bordered separator class="rounded-borders">
                          <q-item v-for="(cutoff, idx) in detail.data.processedCutoffs" :key="idx">
                            <q-item-section avatar>
                              <q-icon name="check_circle" color="positive" />
                            </q-item-section>
                            <q-item-section>
                              <q-item-label>{{ cutoff.company }} - {{ cutoff.cutoffCode }}</q-item-label>
                              <q-item-label caption>
                                {{ cutoff.dateRange }} | {{ cutoff.employeeCount }} employees | {{ cutoff.recordsToProcess }} records
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                        </q-list>
                      </div>

                      <!-- Skipped Cutoffs -->
                      <div v-if="detail.data.skippedCutoffs && detail.data.skippedCutoffs.length > 0">
                        <h5 class="subsection-title">Skipped Cutoffs</h5>
                        <q-list bordered separator class="rounded-borders">
                          <q-item v-for="(cutoff, idx) in detail.data.skippedCutoffs" :key="idx">
                            <q-item-section avatar>
                              <q-icon name="skip_next" color="warning" />
                            </q-item-section>
                            <q-item-section>
                              <q-item-label>{{ cutoff.company }} - {{ cutoff.cutoffCode }}</q-item-label>
                              <q-item-label caption>{{ cutoff.reason }}</q-item-label>
                            </q-item-section>
                          </q-item>
                        </q-list>
                      </div>
                    </div>

                    <!-- Error -->
                    <div v-else-if="detail.phase === 'ERROR' || detail.phase === 'FATAL_ERROR'" class="data-section">
                      <q-banner class="bg-red-1 text-red-9" rounded>
                        <template v-slot:avatar>
                          <q-icon name="error" color="red" />
                        </template>
                        <div>
                          <strong>Error:</strong> {{ detail.data.error }}<br>
                          <div v-if="detail.data.stack" class="text-caption q-mt-xs">
                            <pre class="error-stack">{{ detail.data.stack }}</pre>
                          </div>
                        </div>
                      </q-banner>
                    </div>

                    <!-- Generic data display -->
                    <div v-else class="data-section">
                      <pre class="timeline-data-raw">{{ JSON.stringify(detail.data, null, 2) }}</pre>
                    </div>
                  </div>
                </div>
              </q-timeline-entry>
            </q-timeline>
          </div>

          <!-- Raw Output (fallback) -->
          <div v-else-if="selectedExecution.output" class="q-mt-md">
            <h3 class="section-title">Raw Output</h3>
            <div class="log-container">
              <pre class="execution-log">{{ selectedExecution.output }}</pre>
            </div>
          </div>

          <!-- Error Output -->
          <div v-if="selectedExecution.error" class="q-mt-md">
            <h3 class="section-title">Error Details</h3>
            <div class="log-container error-log">
              <pre class="execution-log">{{ selectedExecution.error }}</pre>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { date } from 'quasar';

export default defineComponent({
  name: 'SchedulerExecutionHistoryDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    scheduler: {
      type: Object,
      default: null,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const loading = ref(false);
    const executions = ref([]);
    const stats = ref(null);
    const selectedExecution = ref(null);
    const showDetailsDialog = ref(false);

    const pagination = ref({
      sortBy: 'startedAt',
      descending: true,
      page: 1,
      rowsPerPage: 10,
      rowsNumber: 0,
    });

    const columns = [
      {
        name: 'status',
        label: 'Status',
        align: 'center',
        field: 'status',
      },
      {
        name: 'startedAt',
        label: 'Started At',
        align: 'center',
        field: 'startedAt',
        sortable: true,
      },
      {
        name: 'completedAt',
        label: 'Completed At',
        align: 'center',
        field: 'completedAt',
        sortable: true,
      },
      {
        name: 'duration',
        label: 'Duration',
        align: 'center',
        field: 'duration',
      },
      {
        name: 'output',
        label: 'Output/Error',
        align: 'center',
      },
    ];

    const isOpen = computed({
      get: () => props.modelValue,
      set: (val) => emit('update:modelValue', val),
    });

    watch(() => props.scheduler, (newVal) => {
      if (newVal && isOpen.value) {
        loadExecutionHistory();
        loadStats();
      }
    });

    watch(isOpen, (newVal) => {
      if (newVal && props.scheduler) {
        loadExecutionHistory();
        loadStats();
      }
    });

    const loadExecutionHistory = async (page = 1, limit = 10) => {
      if (!props.scheduler) return;

      loading.value = true;
      try {
        const response = await api.get(`/scheduler/${props.scheduler.id}/history`, {
          params: { page, limit },
        });
        executions.value = response.data.data || [];
        pagination.value.page = response.data.page || 1;
        pagination.value.rowsNumber = response.data.total || 0;
        pagination.value.rowsPerPage = limit;
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Failed to load execution history',
          position: 'top',
        });
      } finally {
        loading.value = false;
      }
    };

    const loadStats = async () => {
      if (!props.scheduler) return;

      try {
        const response = await api.get(`/scheduler/${props.scheduler.id}/stats`);
        stats.value = response.data;
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };

    const onRequest = (props) => {
      const { page, rowsPerPage } = props.pagination;
      pagination.value.page = page;
      pagination.value.rowsPerPage = rowsPerPage;
      loadExecutionHistory(page, rowsPerPage);
    };

    const formatDate = (dateValue) => {
      if (!dateValue) return '';
      return date.formatDate(dateValue, 'MMM DD, YYYY HH:mm:ss');
    };

    const formatDuration = (duration) => {
      if (!duration) return '-';
      if (duration < 1000) return `${duration}ms`;
      if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
      return `${(duration / 60000).toFixed(1)}m`;
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'SUCCESS':
          return 'green';
        case 'FAILED':
          return 'red';
        case 'RUNNING':
          return 'orange';
        default:
          return 'grey';
      }
    };

    const viewExecutionDetails = (execution) => {
      selectedExecution.value = execution;
      showDetailsDialog.value = true;
    };

    const parsedExecutionDetails = computed(() => {
      if (!selectedExecution.value?.output) return null;
      
      try {
        const parsed = JSON.parse(selectedExecution.value.output);
        return Array.isArray(parsed) ? parsed : null;
      } catch {
        return null;
      }
    });

    const executionSummary = computed(() => {
      if (!parsedExecutionDetails.value) return null;
      
      const summaryDetail = parsedExecutionDetails.value.find(d => d.phase === 'SUMMARY');
      return summaryDetail?.data || null;
    });

    const getPhaseIcon = (phase) => {
      const iconMap = {
        'INITIALIZATION': 'start',
        'FETCH_CUTOFFS': 'search',
        'CHECK_UNPROCESSED': 'fact_check',
        'QUEUE_DECISION': 'gavel',
        'SKIP_CUTOFF': 'skip_next',
        'CREATE_QUEUE': 'add_to_queue',
        'SUMMARY': 'summarize',
        'ERROR': 'error',
        'FATAL_ERROR': 'error_outline',
      };
      return iconMap[phase] || 'circle';
    };

    const getPhaseColor = (phase) => {
      const colorMap = {
        'INITIALIZATION': 'primary',
        'FETCH_CUTOFFS': 'info',
        'CHECK_UNPROCESSED': 'secondary',
        'QUEUE_DECISION': 'deep-purple',
        'SKIP_CUTOFF': 'warning',
        'CREATE_QUEUE': 'positive',
        'SUMMARY': 'primary',
        'ERROR': 'negative',
        'FATAL_ERROR': 'negative',
      };
      return colorMap[phase] || 'grey';
    };

    return {
      isOpen,
      loading,
      executions,
      stats,
      selectedExecution,
      showDetailsDialog,
      pagination,
      columns,
      onRequest,
      formatDate,
      formatDuration,
      getStatusColor,
      viewExecutionDetails,
      parsedExecutionDetails,
      executionSummary,
      getPhaseIcon,
      getPhaseColor,
    };
  },
});
</script>

<style lang="scss" scoped>
.history-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-content {
    flex: 1;
  }

  .dialog-title {
    font-size: 24px;
    font-weight: 500;
    color: #1a1a1a;
    margin: 0;
    line-height: 1.2;
  }

  .dialog-subtitle {
    font-size: 14px;
    color: #757575;
    margin-top: 4px;
  }

  .close-button {
    &:hover {
      background: #f5f5f5;
    }
  }
}

.stat-card {
  background: #fafafa;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .stat-value {
    font-size: 32px;
    font-weight: 600;
    color: #1a1a1a;
    line-height: 1;
  }

  .stat-label {
    font-size: 14px;
    color: #757575;
    margin-top: 8px;
    font-weight: 500;
  }

  &.stat-success {
    background: #e8f5e9;
    border-color: #c8e6c9;

    .stat-value {
      color: #2e7d32;
    }
  }

  &.stat-error {
    background: #ffebee;
    border-color: #ffcdd2;

    .stat-value {
      color: #c62828;
    }
  }

  &.stat-info {
    background: #e3f2fd;
    border-color: #bbdefb;

    .stat-value {
      color: #1565c0;
    }
  }
}

.history-table {
  border: none;
  
  :deep(.q-table__top),
  :deep(.q-table__bottom) {
    background: #fafafa;
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

  :deep(tbody tr) {
    &:hover {
      background-color: #f5f5f5;
    }

    td {
      padding: 16px;
      border-bottom: 1px solid #f0f0f0;
    }
  }
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.status-success {
    background: #e8f5e9;
    color: #2e7d32;
  }

  &.status-failed {
    background: #ffebee;
    color: #c62828;
  }

  &.status-running {
    background: #fff3e0;
    color: #f57c00;
  }

  &.status-pending {
    background: #f5f5f5;
    color: #757575;
  }
}

.view-details-btn {
  padding: 4px 12px;
  border-radius: 8px;
  
  &:hover {
    background: #e3f2fd;
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
}

.execution-output {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.details-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.details-header {
  background: #fafafa;
  border-bottom: 1px solid #e0e0e0;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;

  .details-title {
    font-size: 20px;
    font-weight: 500;
    color: #1a1a1a;
  }
}

.details-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f5f5f5;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c0c0c0;
    border-radius: 4px;
    
    &:hover {
      background: #a0a0a0;
    }
  }
}

.text-caption {
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #757575;
  margin-bottom: 8px;
}

.log-container {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;

  &.error-log {
    background: #ffebee;
    border-color: #ffcdd2;

    .execution-log {
      color: #c62828;
    }
  }
}

.execution-log {
  margin: 0;
  font-family: 'Roboto Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  color: #424242;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fafafa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;

  .info-content {
    flex: 1;
  }

  .info-label {
    font-size: 12px;
    color: #757575;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .info-value {
    font-size: 14px;
    font-weight: 500;
    color: #1a1a1a;
  }
}

.execution-details-section {
  .section-title {
    font-size: 18px;
    font-weight: 500;
    color: #1a1a1a;
    margin: 24px 0 16px;
  }

  .subsection-title {
    font-size: 16px;
    font-weight: 500;
    color: #424242;
    margin: 16px 0 12px;
  }
}

.summary-card {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 24px;

  .summary-title {
    font-size: 18px;
    font-weight: 500;
    color: #1a1a1a;
    margin: 0 0 16px;
  }

  .summary-stat {
    text-align: center;
    padding: 16px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;

    .summary-value {
      font-size: 28px;
      font-weight: 600;
      color: #1a1a1a;
      line-height: 1;
    }

    .summary-label {
      font-size: 12px;
      color: #757575;
      margin-top: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    &.stat-success {
      background: #e8f5e9;
      border-color: #c8e6c9;

      .summary-value {
        color: #2e7d32;
      }
    }

    &.stat-warning {
      background: #fff3e0;
      border-color: #ffe0b2;

      .summary-value {
        color: #f57c00;
      }
    }
  }
}

.execution-timeline {
  margin-top: 24px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;

  .timeline-content {
    background: #fafafa;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 16px;
    margin-top: 8px;

    .timeline-message {
      font-size: 14px;
      font-weight: 500;
      color: #424242;
      margin-bottom: 12px;
    }

    .timeline-data {
      .data-section {
        margin-top: 12px;
      }

      .config-data,
      .timeline-data-raw {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 12px;
        font-family: 'Roboto Mono', monospace;
        font-size: 12px;
        overflow-x: auto;
        margin: 8px 0;
      }

      .cutoff-check-info {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 16px;

        strong {
          color: #757575;
          font-weight: 500;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.5px;
        }
      }

      .error-stack {
        background: #ffebee;
        border: 1px solid #ffcdd2;
        border-radius: 4px;
        padding: 12px;
        font-family: 'Roboto Mono', monospace;
        font-size: 12px;
        overflow-x: auto;
        color: #c62828;
        margin: 8px 0;
      }
    }
  }
}

:deep(.q-timeline__entry) {
  padding-bottom: 32px;

  &:last-child {
    padding-bottom: 0;
  }
}

:deep(.q-timeline__subtitle) {
  font-size: 12px;
  color: #757575;
  margin-top: 4px;
}

:deep(.q-banner) {
  margin-top: 8px;
}

:deep(.q-linear-progress__model) {
  background: rgba(0, 0, 0, 0.05);
}

.rounded-borders {
  border-radius: 8px;
}

.info-cards-container {
  max-width: 1200px;
  margin: 0 auto;
}

.execution-details-section {
  max-width: 1400px;
  margin: 0 auto;
  
  .summary-card {
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
  }
}

// Make pre tags wrap properly
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  max-width: 100%;
}

// Queue Decision Card
.queue-decision-card {
  border: 2px solid #e3f2fd;
  background: #fafafa;
  
  .decision-factors {
    .q-item {
      background: white;
      margin-bottom: 8px;
      border-radius: 4px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
  
  .business-justification {
    :deep(.q-expansion-item__content) {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      margin-top: 8px;
    }
  }
}

.performance-metrics {
  .q-card {
    background: #f5f5f5;
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .details-body {
    padding: 16px;
  }
  
  .execution-timeline {
    margin-left: 0;
    margin-right: 0;
  }
}
</style>