<template>
  <q-page class="migration-monitor">
    <!-- Header Section -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <q-icon name="sync_alt" size="32px" class="header-icon" />
          <div>
            <h1 class="text-headline-small">System Migrations</h1>
            <p class="text-body-medium text-grey-7">Monitor and manage data migrations</p>
          </div>
        </div>
        <div class="header-actions">
          <q-btn
            flat
            round
            icon="refresh"
            @click="fetchMigrations"
            :loading="loading"
            class="action-button"
          >
            <q-tooltip>Refresh</q-tooltip>
          </q-btn>
          <q-btn
            unelevated
            color="primary"
            icon="play_arrow"
            label="Run Migrations"
            @click="showRunDialog = true"
            :disable="loading || pendingMigrations.length === 0"
            class="run-button"
          />
        </div>
      </div>
    </div>

    <!-- Status Cards -->
    <div class="status-cards q-mb-lg">
      <q-card class="status-card">
        <q-card-section>
          <div class="status-card-content">
            <q-icon name="pending_actions" size="24px" color="orange" />
            <div class="status-info">
              <div class="text-body-small text-grey-7">Pending</div>
              <div class="text-headline-medium">{{ pendingCount }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card class="status-card">
        <q-card-section>
          <div class="status-card-content">
            <q-icon name="check_circle" size="24px" color="positive" />
            <div class="status-info">
              <div class="text-body-small text-grey-7">Completed</div>
              <div class="text-headline-medium">{{ completedCount }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card class="status-card">
        <q-card-section>
          <div class="status-card-content">
            <q-icon name="error" size="24px" color="negative" />
            <div class="status-info">
              <div class="text-body-small text-grey-7">Failed</div>
              <div class="text-headline-medium">{{ failedCount }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card class="status-card">
        <q-card-section>
          <div class="status-card-content">
            <q-icon name="autorenew" size="24px" color="info" />
            <div class="status-info">
              <div class="text-body-small text-grey-7">Running</div>
              <div class="text-headline-medium">{{ runningCount }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Migration Tabs -->
    <q-card class="migrations-card">
      <q-tabs
        v-model="tab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="left"
        narrow-indicator
      >
        <q-tab name="all" label="All Migrations" />
        <q-tab name="pending" label="Pending" :badge="pendingCount > 0 ? pendingCount : null" />
        <q-tab name="history" label="History" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <!-- All Migrations Panel -->
        <q-tab-panel name="all">
          <q-table
            :rows="allMigrations"
            :columns="columns"
            row-key="name"
            flat
            :loading="loading"
            :pagination="{ rowsPerPage: 10 }"
          >
            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-chip
                  :color="getStatusColor(props.value)"
                  text-color="white"
                  size="sm"
                  dense
                >
                  {{ props.value }}
                </q-chip>
              </q-td>
            </template>

            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <q-btn
                  flat
                  round
                  dense
                  icon="info"
                  size="sm"
                  @click="showMigrationDetails(props.row)"
                >
                  <q-tooltip>View Details</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  icon="description"
                  size="sm"
                  color="secondary"
                  @click="viewMigrationLogs(props.row)"
                >
                  <q-tooltip>View Logs</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="props.row.status === 'PENDING'"
                  flat
                  round
                  dense
                  icon="play_arrow"
                  size="sm"
                  color="primary"
                  @click="runSingleMigration(props.row)"
                >
                  <q-tooltip>Run Migration</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="props.row.status === 'FAILED'"
                  flat
                  round
                  dense
                  icon="refresh"
                  size="sm"
                  color="warning"
                  @click="retryMigration(props.row)"
                >
                  <q-tooltip>Retry Migration</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <!-- Pending Migrations Panel -->
        <q-tab-panel name="pending">
          <div v-if="pendingMigrations.length === 0" class="empty-state">
            <q-icon name="check_circle" size="64px" color="positive" />
            <div class="text-h6 q-mt-md">No Pending Migrations</div>
            <div class="text-body-medium text-grey-7">All migrations have been executed</div>
          </div>
          
          <q-list v-else separator>
            <q-item v-for="migration in pendingMigrations" :key="migration.name">
              <q-item-section avatar>
                <q-icon name="pending_actions" color="orange" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-label-large">{{ migration.name }}</q-item-label>
                <q-item-label caption>{{ migration.description }}</q-item-label>
                <q-item-label caption class="text-grey-6">Version: {{ migration.version }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  unelevated
                  color="primary"
                  size="sm"
                  label="Run"
                  @click="runSingleMigration(migration)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-tab-panel>

        <!-- History Panel -->
        <q-tab-panel name="history">
          <q-timeline color="primary">
            <q-timeline-entry
              v-for="migration in migrationHistory"
              :key="migration.id"
              :title="migration.name"
              :subtitle="formatDate(migration.executedAt)"
              :icon="getHistoryIcon(migration.status)"
              :color="getStatusColor(migration.status)"
            >
              <div class="text-body-medium">{{ migration.description }}</div>
              <div v-if="migration.executedBy" class="text-caption text-grey-6 q-mt-sm">
                Executed by: {{ migration.executedBy }}
              </div>
              <div v-if="migration.recordsProcessed" class="text-caption text-grey-6">
                Records processed: {{ migration.recordsProcessed }}
              </div>
              <div v-if="migration.errorMessage" class="text-caption text-negative q-mt-sm">
                Error: {{ migration.errorMessage }}
              </div>
            </q-timeline-entry>
          </q-timeline>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <!-- Run Migrations Dialog -->
    <q-dialog v-model="showRunDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center">
          <q-icon name="play_arrow" size="24px" color="primary" class="q-mr-sm" />
          <div class="text-h6">Run Migrations</div>
        </q-card-section>

        <q-card-section>
          <div class="text-body-medium q-mb-md">
            This will run {{ pendingMigrations.length }} pending migration(s).
          </div>
          
          <q-checkbox
            v-model="dryRun"
            label="Dry Run (simulate without making changes)"
            class="q-mb-md"
          />

          <q-list dense bordered separator class="rounded-borders">
            <q-item v-for="migration in pendingMigrations" :key="migration.name">
              <q-item-section>
                <q-item-label>{{ migration.name }}</q-item-label>
                <q-item-label caption>{{ migration.description }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showRunDialog = false" />
          <q-btn
            unelevated
            :label="dryRun ? 'Run Dry Run' : 'Run Migrations'"
            color="primary"
            @click="runAllMigrations"
            :loading="runningMigration"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Migration Details Dialog -->
    <q-dialog v-model="showDetailsDialog">
      <q-card style="min-width: 500px; max-width: 800px">
        <q-card-section class="row items-center">
          <q-icon name="info" size="24px" color="primary" class="q-mr-sm" />
          <div class="text-h6">Migration Details</div>
        </q-card-section>

        <q-card-section v-if="selectedMigration">
          <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">{{ selectedMigration.name }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Version:</span>
            <span class="detail-value">{{ selectedMigration.version }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <q-chip
              :color="getStatusColor(selectedMigration.status)"
              text-color="white"
              size="sm"
              dense
            >
              {{ selectedMigration.status }}
            </q-chip>
          </div>
          <div class="detail-row">
            <span class="detail-label">Description:</span>
            <span class="detail-value">{{ selectedMigration.description }}</span>
          </div>
          <div v-if="selectedMigration.executedAt" class="detail-row">
            <span class="detail-label">Executed At:</span>
            <span class="detail-value">{{ formatDate(selectedMigration.executedAt) }}</span>
          </div>
          <div v-if="selectedMigration.executedBy" class="detail-row">
            <span class="detail-label">Executed By:</span>
            <span class="detail-value">{{ selectedMigration.executedBy }}</span>
          </div>
          <div v-if="selectedMigration.environment" class="detail-row">
            <span class="detail-label">Environment:</span>
            <span class="detail-value">{{ selectedMigration.environment }}</span>
          </div>
          <div v-if="selectedMigration.recordsProcessed !== undefined" class="detail-row">
            <span class="detail-label">Records Processed:</span>
            <span class="detail-value">{{ selectedMigration.recordsProcessed }}</span>
          </div>
          <div v-if="selectedMigration.metadata" class="detail-row">
            <span class="detail-label">Metadata:</span>
            <pre class="detail-value metadata">{{ JSON.stringify(selectedMigration.metadata, null, 2) }}</pre>
          </div>
          <div v-if="selectedMigration.errorMessage" class="detail-row">
            <span class="detail-label">Error:</span>
            <span class="detail-value text-negative">{{ selectedMigration.errorMessage }}</span>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" @click="showDetailsDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Migration Logs Dialog -->
    <q-dialog v-model="showLogsDialog" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            <q-icon name="description" class="q-mr-sm" />
            Migration Logs: {{ selectedMigration?.name }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showLogsDialog = false" />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div v-if="loadingLogs" class="text-center q-pa-lg">
            <q-spinner size="50px" color="primary" />
            <div class="q-mt-md">Loading logs...</div>
          </div>
          
          <div v-else-if="!migrationLogContent" class="text-center q-pa-lg">
            <q-icon name="description" size="64px" color="grey-5" />
            <div class="text-h6 q-mt-md text-grey-7">No logs available</div>
            <div class="text-body-medium text-grey-6">This migration hasn't generated any logs yet</div>
          </div>
          
          <div v-else class="log-viewer">
            <div class="log-controls q-mb-md">
              <q-btn
                flat
                icon="content_copy"
                label="Copy"
                @click="copyLogsToClipboard"
                size="sm"
                class="q-mr-sm"
              />
              <q-btn
                flat
                icon="download"
                label="Download"
                @click="downloadLogs"
                size="sm"
                class="q-mr-sm"
              />
              <q-btn
                flat
                icon="refresh"
                label="Refresh"
                @click="refreshLogs"
                size="sm"
              />
              <q-space />
              <q-chip>
                <q-avatar icon="notes" color="primary" text-color="white" />
                {{ logLines }} lines
              </q-chip>
            </div>
            
            <q-card class="log-content-card">
              <pre class="log-content">{{ migrationLogContent }}</pre>
            </q-card>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';
import { date } from 'quasar';

interface Migration {
  id?: string;
  name: string;
  version: string;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'ROLLED_BACK';
  executedAt?: string;
  executedBy?: string;
  environment?: string;
  rollbackable?: boolean;
  recordsProcessed?: number;
  metadata?: any;
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default defineComponent({
  name: 'MigrationMonitor',

  setup() {
    const $q = useQuasar();
    const instance = getCurrentInstance();
    const $api = instance?.appContext.config.globalProperties.$api;

    // State
    const loading = ref(false);
    const runningMigration = ref(false);
    const tab = ref('all');
    const showRunDialog = ref(false);
    const showDetailsDialog = ref(false);
    const showLogsDialog = ref(false);
    const dryRun = ref(false);
    const selectedMigration = ref<Migration | null>(null);
    const allMigrations = ref<Migration[]>([]);
    const pendingMigrations = ref<Migration[]>([]);
    const loadingLogs = ref(false);
    const migrationLogContent = ref<string | null>(null);
    const logLines = ref(0);

    // Computed
    const pendingCount = computed(() => 
      allMigrations.value.filter(m => m.status === 'PENDING').length
    );
    
    const completedCount = computed(() => 
      allMigrations.value.filter(m => m.status === 'COMPLETED').length
    );
    
    const failedCount = computed(() => 
      allMigrations.value.filter(m => m.status === 'FAILED').length
    );
    
    const runningCount = computed(() => 
      allMigrations.value.filter(m => m.status === 'RUNNING').length
    );

    const migrationHistory = computed(() => 
      allMigrations.value
        .filter(m => m.status !== 'PENDING')
        .sort((a, b) => {
          const dateA = new Date(a.executedAt || a.createdAt || '').getTime();
          const dateB = new Date(b.executedAt || b.createdAt || '').getTime();
          return dateB - dateA;
        })
    );

    // Table columns
    const columns = [
      { 
        name: 'name', 
        label: 'Name', 
        field: 'name', 
        align: 'left' as const,
        sortable: true 
      },
      { 
        name: 'version', 
        label: 'Version', 
        field: 'version', 
        align: 'left' as const 
      },
      { 
        name: 'description', 
        label: 'Description', 
        field: 'description', 
        align: 'left' as const 
      },
      { 
        name: 'status', 
        label: 'Status', 
        field: 'status', 
        align: 'center' as const 
      },
      { 
        name: 'executedAt', 
        label: 'Executed', 
        field: (row: Migration) => row.executedAt ? formatDate(row.executedAt) : '-',
        align: 'left' as const,
        sortable: true 
      },
      { 
        name: 'actions', 
        label: 'Actions', 
        field: 'actions', 
        align: 'center' as const 
      }
    ];

    // Methods
    const fetchMigrations = async () => {
      if (!$api) {
        console.error('API not available');
        return;
      }
      
      loading.value = true;
      try {
        // Get migration status
        const statusResponse = await $api.get('/migration/status', {
          headers: { 'developer-key': 'M7UTdtxpG7gdUfH' }
        });

        // Get detailed migration list
        const listResponse = await $api.get('/migration/list', {
          headers: { 'developer-key': 'M7UTdtxpG7gdUfH' }
        });

        if (statusResponse.data) {
          // Process executed migrations from list
          const executedMigrations = listResponse.data || [];
          
          // Create pending migration objects from status response
          const pendingNames = statusResponse.data.pendingNames || [];
          const pendingMigs = pendingNames.map((name: string) => ({
            name,
            status: 'PENDING',
            version: '1.0.0',
            description: 'Pending migration',
            rollbackable: false
          }));
          
          // Combine all migrations
          allMigrations.value = [...executedMigrations, ...pendingMigs];
          pendingMigrations.value = pendingMigs;
        }
      } catch (error: any) {
        console.error('Failed to fetch migrations:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to fetch migrations',
          caption: error.response?.data?.message || error.message
        });
      } finally {
        loading.value = false;
      }
    };

    const runAllMigrations = async () => {
      if (!$api) {
        console.error('API not available');
        return;
      }
      
      runningMigration.value = true;
      try {
        const response = await $api.post('/migration/run', null, {
          params: { dryRun: dryRun.value },
          headers: { 'developer-key': 'M7UTdtxpG7gdUfH' }
        });

        if (response.data) {
          const success = response.data.success !== false;
          $q.notify({
            type: success ? 'positive' : 'warning',
            message: dryRun.value ? 'Dry run completed' : 'Migrations executed',
            caption: `Processed ${response.data.migrations?.length || 0} migration(s)`
          });
          
          if (!dryRun.value) {
            await fetchMigrations();
          }
        }
      } catch (error: any) {
        console.error('Failed to run migrations:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to run migrations',
          caption: error.response?.data?.message || error.message
        });
      } finally {
        runningMigration.value = false;
        showRunDialog.value = false;
        dryRun.value = false;
      }
    };

    const runSingleMigration = async (migration: Migration) => {
      if (!$api) {
        console.error('API not available');
        return;
      }
      
      const confirmRun = await new Promise((resolve) => {
        $q.dialog({
          title: 'Run Migration',
          message: `Are you sure you want to run migration "${migration.name}"?`,
          cancel: true,
          persistent: true
        }).onOk(() => resolve(true))
          .onCancel(() => resolve(false));
      });

      if (!confirmRun) return;

      loading.value = true;
      try {
        const response = await $api.post(`/migration/run/${migration.name}`, null, {
          headers: { 'developer-key': 'M7UTdtxpG7gdUfH' }
        });

        if (response.data) {
          const success = response.data.success !== false;
          $q.notify({
            type: success ? 'positive' : 'warning',
            message: success ? 'Migration executed successfully' : 'Migration completed with issues',
            caption: migration.name
          });
          await fetchMigrations();
        }
      } catch (error: any) {
        console.error('Failed to run migration:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to run migration',
          caption: error.response?.data?.message || error.message
        });
      } finally {
        loading.value = false;
      }
    };

    const retryMigration = async (migration: Migration) => {
      // For retry, we need to reset the migration status first
      // This would require a backend endpoint to reset migration status
      // For now, just run it again
      await runSingleMigration(migration);
    };

    const showMigrationDetails = (migration: Migration) => {
      selectedMigration.value = migration;
      showDetailsDialog.value = true;
    };

    const viewMigrationLogs = async (migration: Migration) => {
      if (!$api) {
        console.error('API not available');
        return;
      }
      
      selectedMigration.value = migration;
      showLogsDialog.value = true;
      loadingLogs.value = true;
      migrationLogContent.value = null;
      
      try {
        const response = await $api.get(`/migration/logs/${migration.name}/latest`, {
          headers: { 'developer-key': 'M7UTdtxpG7gdUfH' }
        });
        
        if (response.data && response.data.content) {
          migrationLogContent.value = response.data.content;
          logLines.value = response.data.lines || 0;
        } else {
          migrationLogContent.value = null;
        }
      } catch (error: any) {
        console.error('Failed to fetch migration logs:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to fetch logs',
          caption: error.response?.data?.message || error.message
        });
      } finally {
        loadingLogs.value = false;
      }
    };

    const refreshLogs = async () => {
      if (selectedMigration.value) {
        await viewMigrationLogs(selectedMigration.value);
      }
    };

    const copyLogsToClipboard = async () => {
      if (!migrationLogContent.value) return;
      
      try {
        await navigator.clipboard.writeText(migrationLogContent.value);
        $q.notify({
          type: 'positive',
          message: 'Logs copied to clipboard',
          timeout: 2000
        });
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Failed to copy logs'
        });
      }
    };

    const downloadLogs = () => {
      if (!migrationLogContent.value || !selectedMigration.value) return;
      
      const blob = new Blob([migrationLogContent.value], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedMigration.value.name}_${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      $q.notify({
        type: 'positive',
        message: 'Log file downloaded',
        timeout: 2000
      });
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'COMPLETED': return 'positive';
        case 'PENDING': return 'orange';
        case 'RUNNING': return 'info';
        case 'FAILED': return 'negative';
        case 'SKIPPED': return 'grey';
        case 'ROLLED_BACK': return 'warning';
        default: return 'grey';
      }
    };

    const getHistoryIcon = (status: string) => {
      switch (status) {
        case 'COMPLETED': return 'check_circle';
        case 'FAILED': return 'error';
        case 'SKIPPED': return 'skip_next';
        case 'ROLLED_BACK': return 'undo';
        default: return 'circle';
      }
    };

    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return '-';
      return date.formatDate(dateString, 'YYYY-MM-DD HH:mm:ss');
    };

    // Lifecycle
    onMounted(() => {
      fetchMigrations();
    });

    return {
      // State
      loading,
      runningMigration,
      tab,
      showRunDialog,
      showDetailsDialog,
      showLogsDialog,
      dryRun,
      selectedMigration,
      allMigrations,
      pendingMigrations,
      loadingLogs,
      migrationLogContent,
      logLines,
      
      // Computed
      pendingCount,
      completedCount,
      failedCount,
      runningCount,
      migrationHistory,
      columns,
      
      // Methods
      fetchMigrations,
      runAllMigrations,
      runSingleMigration,
      retryMigration,
      showMigrationDetails,
      viewMigrationLogs,
      refreshLogs,
      copyLogsToClipboard,
      downloadLogs,
      getStatusColor,
      getHistoryIcon,
      formatDate
    };
  }
});
</script>

<style lang="scss" scoped>
.migration-monitor {
  padding: 24px;
  background: var(--q-grey-1);
  min-height: calc(100vh - 64px);
}

// Material Design 3 Typography
.text-headline-small {
  font-size: 24px;
  font-weight: 400;
  line-height: 32px;
  margin: 0;
}

.text-headline-medium {
  font-size: 28px;
  font-weight: 400;
  line-height: 36px;
}

.text-body-medium {
  font-size: 14px;
  line-height: 20px;
}

.text-body-small {
  font-size: 12px;
  line-height: 16px;
}

.text-label-large {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

// Header Section
.page-header {
  margin-bottom: 24px;
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .header-title {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .header-icon {
      color: var(--q-primary);
    }
  }
  
  .header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    
    .action-button {
      &:hover {
        background: rgba(0, 0, 0, 0.04);
      }
    }
    
    .run-button {
      border-radius: 20px;
      padding: 8px 24px;
      font-weight: 500;
    }
  }
}

// Status Cards
.status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  
  .status-card {
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }
    
    .status-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .status-info {
        flex: 1;
      }
    }
  }
}

// Migrations Card
.migrations-card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  .q-tabs {
    padding: 0 16px;
  }
  
  .q-tab-panel {
    padding: 24px;
  }
}

// Empty State
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

// Timeline
.q-timeline {
  padding: 0;
}

// Detail Dialog
.detail-row {
  display: flex;
  margin-bottom: 12px;
  
  .detail-label {
    font-weight: 500;
    width: 140px;
    flex-shrink: 0;
    color: var(--q-grey-7);
  }
  
  .detail-value {
    flex: 1;
    word-break: break-word;
    
    &.metadata {
      background: var(--q-grey-2);
      padding: 8px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      max-height: 200px;
      overflow-y: auto;
    }
  }
}

// Log Viewer
.log-viewer {
  width: 100%;
  
  .log-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
  }
  
  .log-content-card {
    background: #1e1e1e;
    border-radius: 8px;
    max-height: calc(100vh - 250px);
    overflow: auto;
    
    .log-content {
      color: #d4d4d4;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.5;
      margin: 0;
      padding: 16px;
      white-space: pre-wrap;
      word-wrap: break-word;
      
      // Syntax highlighting for log levels
      &:deep() {
        // Timestamps
        [class*="timestamp"] {
          color: #808080;
        }
        
        // Error messages
        [class*="ERROR"], [class*="error"] {
          color: #f48771;
        }
        
        // Warning messages
        [class*="WARNING"], [class*="warn"] {
          color: #dcdcaa;
        }
        
        // Info messages
        [class*="INFO"], [class*="info"] {
          color: #4ec9b0;
        }
        
        // Success messages
        [class*="SUCCESS"], [class*="success"] {
          color: #4fc1ff;
        }
      }
    }
  }
}

// Responsive
@media (max-width: 600px) {
  .migration-monitor {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .status-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .log-content-card {
    max-height: calc(100vh - 200px);
  }
}
</style>