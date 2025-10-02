<template>
  <q-page class="q-pa-md">
    <!-- Header with Stats -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12">
        <div class="text-h5 q-mb-md">Manpower Queue Monitor</div>
      </div>

      <!-- Health Status Card -->
      <div class="col-12 col-md-3">
        <q-card flat bordered class="full-height">
          <q-card-section>
            <div class="text-caption text-grey-7 q-mb-xs">System Health</div>
            <div class="row items-center">
              <q-icon
                :name="getHealthIcon()"
                :color="getHealthColor()"
                size="24px"
                class="q-mr-sm"
              />
              <div class="text-h6">{{ getHealthText() }}</div>
            </div>
            <div v-if="health?.recommendations" class="q-mt-sm">
              <div v-for="rec in health.recommendations" :key="rec" class="text-caption text-red">
                • {{ rec }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Stats Cards -->
      <div class="col-12 col-md-9">
        <div class="row q-col-gutter-sm">
          <div class="col-6 col-md-3">
            <q-card flat bordered>
              <q-card-section class="q-pa-sm">
                <div class="text-caption text-grey-7">Total Today</div>
                <div class="text-h6">{{ stats.totalToday }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-md-3">
            <q-card flat bordered>
              <q-card-section class="q-pa-sm">
                <div class="text-caption text-grey-7">Completed</div>
                <div class="text-h6 text-green">{{ stats.completed }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-md-3">
            <q-card flat bordered>
              <q-card-section class="q-pa-sm">
                <div class="text-caption text-grey-7">Failed</div>
                <div class="text-h6 text-red">{{ stats.failed }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-md-3">
            <q-card flat bordered>
              <q-card-section class="q-pa-sm">
                <div class="text-caption text-grey-7">Success Rate</div>
                <div class="text-h6">{{ stats.successRate.toFixed(1) }}%</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-md-3">
            <q-card flat bordered>
              <q-card-section class="q-pa-sm">
                <div class="text-caption text-grey-7">Pending</div>
                <div class="text-h6 text-orange">{{ stats.pending }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-md-3">
            <q-card flat bordered>
              <q-card-section class="q-pa-sm">
                <div class="text-caption text-grey-7">Processing</div>
                <div class="text-h6 text-blue">{{ stats.processing }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-md-3">
            <q-card flat bordered>
              <q-card-section class="q-pa-sm">
                <div class="text-caption text-grey-7">Avg Time</div>
                <div class="text-h6">{{ formatProcessingTime(stats.avgProcessingTime) }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-md-3">
            <q-card flat bordered>
              <q-card-section class="q-pa-sm">
                <div class="text-caption text-grey-7">Last Processed</div>
                <div class="text-body2">{{ formatLastProcessed(stats.lastProcessedAt) }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>

    <!-- Jobs Tabs -->
    <q-card flat bordered>
      <q-tabs
        v-model="tab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="left"
      >
        <q-tab name="pending" label="Pending" :badge="stats.pending" />
        <q-tab name="processing" label="Processing" :badge="stats.processing" />
        <q-tab name="completed" label="Completed" />
        <q-tab name="failed" label="Failed" :badge="stats.failed" badge-color="red" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated class="bg-white">
        <!-- Pending Tab -->
        <q-tab-panel name="pending">
          <div class="row items-center q-mb-md">
            <div class="text-h6">Pending Jobs</div>
            <q-space />
            <q-btn
              flat
              dense
              icon="refresh"
              @click="refreshPending"
              :loading="isLoading"
            >
              <q-tooltip>Refresh</q-tooltip>
            </q-btn>
          </div>
          <JobsTable :jobs="pendingJobs" :status="'pending'" />
        </q-tab-panel>

        <!-- Processing Tab -->
        <q-tab-panel name="processing">
          <div class="row items-center q-mb-md">
            <div class="text-h6">Processing Jobs</div>
            <q-space />
            <q-btn
              flat
              dense
              icon="refresh"
              @click="refreshProcessing"
              :loading="isLoading"
            >
              <q-tooltip>Refresh</q-tooltip>
            </q-btn>
          </div>
          <JobsTable :jobs="processingJobs" :status="'processing'" />
        </q-tab-panel>

        <!-- Completed Tab -->
        <q-tab-panel name="completed">
          <div class="row items-center q-mb-md">
            <div class="text-h6">Completed Jobs (Last 24 Hours)</div>
            <q-space />
            <q-btn
              flat
              dense
              icon="refresh"
              @click="refreshCompleted"
              :loading="isLoading"
            >
              <q-tooltip>Refresh</q-tooltip>
            </q-btn>
          </div>
          <JobsTable :jobs="completedJobs" :status="'completed'" />
        </q-tab-panel>

        <!-- Failed Tab -->
        <q-tab-panel name="failed">
          <div class="row items-center q-mb-md">
            <div class="text-h6">Failed Jobs</div>
            <q-space />
            <q-btn
              flat
              dense
              color="red"
              label="Clear All"
              @click="confirmClearAll"
              v-if="failedJobs.length > 0"
            />
            <q-btn
              flat
              dense
              icon="refresh"
              @click="refreshFailed"
              :loading="isLoading"
              class="q-ml-sm"
            >
              <q-tooltip>Refresh</q-tooltip>
            </q-btn>
          </div>
          <FailedJobsTable
            :jobs="failedJobs"
            @retry="handleRetry"
            @delete="handleDelete"
            @view-error="viewError"
          />
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <!-- Error Dialog -->
    <q-dialog v-model="showErrorDialog" maximized>
      <q-card style="max-width: 800px">
        <q-card-section class="row items-center">
          <div class="text-h6">Error Details</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showErrorDialog = false" />
        </q-card-section>

        <q-separator />

        <q-card-section v-if="selectedError">
          <div class="q-mb-md">
            <div class="text-subtitle2">Employee</div>
            <div>{{ selectedError.employeeName }}</div>
          </div>

          <div class="q-mb-md">
            <div class="text-subtitle2">Device</div>
            <div>{{ selectedError.deviceName }}</div>
          </div>

          <div class="q-mb-md">
            <div class="text-subtitle2">Date</div>
            <div>{{ selectedError.date }}</div>
          </div>

          <div class="q-mb-md">
            <div class="text-subtitle2">Error Message</div>
            <div class="text-red">{{ selectedError.error }}</div>
          </div>

          <div v-if="selectedError.errorStack">
            <div class="text-subtitle2">Stack Trace</div>
            <pre class="q-pa-sm bg-grey-2" style="overflow: auto; max-height: 400px">{{ selectedError.errorStack }}</pre>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" @click="showErrorDialog = false" />
          <q-btn
            flat
            label="Retry Job"
            color="primary"
            @click="retryFromDialog"
            v-if="selectedError"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useManpowerQueueStore, ManpowerComputeJob } from 'src/stores/manpowerQueue';
import { useQuasar } from 'quasar';
import JobsTable from './components/JobsTable.vue';
import FailedJobsTable from './components/FailedJobsTable.vue';

const $q = useQuasar();
const queueStore = useManpowerQueueStore();

// Data
const tab = ref('pending');
const showErrorDialog = ref(false);
const selectedError = ref<ManpowerComputeJob | null>(null);

// Computed
const stats = computed(() => queueStore.stats);
const health = computed(() => queueStore.health);
const pendingJobs = computed(() => queueStore.pendingJobs);
const processingJobs = computed(() => queueStore.processingJobs);
const completedJobs = computed(() => queueStore.completedJobs);
const failedJobs = computed(() => queueStore.failedJobs);
const isLoading = computed(() => queueStore.isLoading);

// Methods
function getHealthIcon() {
  if (!health.value) return 'help_outline';
  switch (health.value.status) {
    case 'healthy': return 'check_circle';
    case 'warning': return 'warning';
    case 'critical': return 'error';
    default: return 'help_outline';
  }
}

function getHealthColor() {
  if (!health.value) return 'grey';
  switch (health.value.status) {
    case 'healthy': return 'green';
    case 'warning': return 'orange';
    case 'critical': return 'red';
    default: return 'grey';
  }
}

function getHealthText() {
  if (!health.value) return 'Unknown';
  return health.value.status.charAt(0).toUpperCase() + health.value.status.slice(1);
}

function formatProcessingTime(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatLastProcessed(date?: string) {
  if (!date) return 'Never';
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(date).toLocaleString();
}

async function refreshPending() {
  await queueStore.fetchJobsByStatus('pending');
  await queueStore.fetchStats();
}

async function refreshProcessing() {
  await queueStore.fetchJobsByStatus('processing');
  await queueStore.fetchStats();
}

async function refreshCompleted() {
  await queueStore.fetchJobsByStatus('completed');
  await queueStore.fetchStats();
}

async function refreshFailed() {
  await queueStore.fetchJobsByStatus('failed');
  await queueStore.fetchStats();
}

async function handleRetry(job: ManpowerComputeJob) {
  try {
    await queueStore.retryJob(job.id);
    $q.notify({
      type: 'positive',
      message: 'Job queued for retry',
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to retry job',
    });
  }
}

async function handleDelete(job: ManpowerComputeJob) {
  $q.dialog({
    title: 'Confirm Deletion',
    message: `Are you sure you want to delete this failed job for ${job.employeeName}?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await queueStore.deleteFailedJob(job.id);
      $q.notify({
        type: 'positive',
        message: 'Failed job deleted',
      });
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Failed to delete job',
      });
    }
  });
}

function viewError(job: ManpowerComputeJob) {
  selectedError.value = job;
  showErrorDialog.value = true;
}

async function retryFromDialog() {
  if (selectedError.value) {
    await handleRetry(selectedError.value);
    showErrorDialog.value = false;
  }
}

function confirmClearAll() {
  $q.dialog({
    title: 'Clear All Failed Jobs',
    message: `Are you sure you want to delete ALL ${failedJobs.value.length} failed jobs? This action cannot be undone.`,
    cancel: true,
    persistent: true,
    ok: {
      label: 'Clear All',
      color: 'red',
    },
  }).onOk(async () => {
    try {
      const result = await queueStore.clearAllFailedJobs();
      $q.notify({
        type: 'positive',
        message: `Cleared ${result.count} failed jobs`,
      });
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Failed to clear all jobs',
      });
    }
  });
}

// Lifecycle
onMounted(async () => {
  await queueStore.refreshAll();
  // Auto-refresh disabled - use manual refresh buttons
});

onUnmounted(() => {
  // Cleanup if needed
});
</script>