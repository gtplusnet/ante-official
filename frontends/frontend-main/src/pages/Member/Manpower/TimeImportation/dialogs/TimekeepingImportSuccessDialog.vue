<template>
  <q-dialog ref="dialog">
    <TemplateDialog minWidth="600px">
      <template #DialogIcon>
        <q-icon name="check_circle" size="24px" color="positive" />
      </template>
      <template #DialogTitle>
        Import Completed Successfully
      </template>
      <template #DialogContent>
        <section v-if="loading" class="text-center q-pa-xl">
          <q-spinner size="50px" color="primary" />
          <div class="text-body-medium q-mt-md">Loading import summary...</div>
        </section>

        <section v-else-if="successData">
          <!-- Success Banner -->
          <div class="success-banner q-pa-md q-mb-lg rounded-borders">
            <div class="row items-center q-gutter-md">
              <q-icon name="check_circle" size="48px" color="positive" />
              <div>
                <div class="text-h6">Import Completed!</div>
                <div class="text-body-medium text-grey-7">
                  Successfully imported {{ successData.summary.totalLogsImported }} time logs
                </div>
              </div>
            </div>
          </div>

          <!-- Summary Cards -->
          <div class="row q-gutter-md q-mb-lg">
            <div class="col">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <div class="text-h4 text-primary">{{ successData.summary.totalLogsImported }}</div>
                  <div class="text-body-medium text-grey">Total Logs Imported</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <div class="text-h4 text-secondary">{{ successData.summary.uniqueEmployees }}</div>
                  <div class="text-body-medium text-grey">Employees Updated</div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Details Section -->
          <q-card flat bordered class="q-mb-lg">
            <q-card-section>
              <div class="text-subtitle1 q-mb-sm">Import Details</div>
              <q-list dense>
                <q-item>
                  <q-item-section avatar>
                    <q-icon name="insert_drive_file" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>File Name</q-item-label>
                    <q-item-label caption>{{ successData.fileName }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="person" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Uploaded By</q-item-label>
                    <q-item-label caption>{{ successData.uploadedBy }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="date_range" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Date Range</q-item-label>
                    <q-item-label caption>
                      {{ formatDate(successData.summary.dateRange.from) }} -
                      {{ formatDate(successData.summary.dateRange.to) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="successData.summary.processingTime">
                  <q-item-section avatar>
                    <q-icon name="timer" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Processing Time</q-item-label>
                    <q-item-label caption>{{ successData.summary.processingTime }} seconds</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>

          <!-- Statistics -->
          <q-card flat bordered class="q-mb-lg">
            <q-card-section>
              <div class="text-subtitle1 q-mb-sm">Processing Statistics</div>
              <div class="row q-gutter-sm">
                <q-chip square>
                  <q-avatar color="primary" text-color="white">{{ successData.statistics.totalRows }}</q-avatar>
                  Total Rows
                </q-chip>
                <q-chip square>
                  <q-avatar color="positive" text-color="white">{{ successData.statistics.processedRows }}</q-avatar>
                  Processed
                </q-chip>
                <q-chip square v-if="successData.statistics.overlappingRows > 0">
                  <q-avatar color="warning" text-color="white">{{ successData.statistics.overlappingRows }}</q-avatar>
                  Overlaps Resolved
                </q-chip>
                <q-chip square v-if="successData.statistics.errorRows > 0">
                  <q-avatar color="negative" text-color="white">{{ successData.statistics.errorRows }}</q-avatar>
                  Errors
                </q-chip>
              </div>
            </q-card-section>
          </q-card>

          <!-- Actions -->
          <div class="row q-gutter-sm justify-end">
            <q-btn
              flat
              color="primary"
              label="View Imported Logs"
              icon="visibility"
              @click="viewImportedLogs"
            />
            <q-btn
              flat
              color="primary"
              label="Export Logs"
              icon="download"
              @click="exportImportedLogs"
            />
            <q-btn
              color="primary"
              label="Done"
              @click="hide"
            />
          </div>
        </section>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script>
import { date } from 'quasar';
import TemplateDialog from 'src/components/dialog/TemplateDialog.vue';

export default {
  name: 'TimekeepingImportSuccessDialog',
  components: {
    TemplateDialog,
  },
  data() {
    return {
      batchId: null,
      successData: null,
      loading: false,
    };
  },

  methods: {
    async show(batchId) {
      this.batchId = batchId;
      this.successData = null;
      this.$refs.dialog.show();
      await this.loadSuccessData();
    },

    hide() {
      this.$refs.dialog.hide();
    },

    async loadSuccessData() {
      this.loading = true;
      try {
        const response = await this.$api.get(`/hris/timekeeping/import/${this.batchId}/success-summary`);
        this.successData = response.data;
      } catch (error) {
        console.error('Failed to load success data:', error);
        this.$q.notify({
          type: 'negative',
          message: 'Failed to load import summary',
        });
      } finally {
        this.loading = false;
      }
    },

    formatDate(dateStr) {
      if (!dateStr) return 'N/A';
      return date.formatDate(dateStr, 'YYYY-MM-DD');
    },

    viewImportedLogs() {
      // Navigate to Raw Logs Browse with filter for this import batch
      this.$router.push({
        name: 'member_manpower_timekeeping_raw_logs',
        query: {
          importBatchId: this.batchId,
        },
      });
      this.hide();
    },

    async exportImportedLogs() {
      try {
        this.$q.loading.show({ message: 'Exporting logs...' });

        const response = await this.$api.get(`/hris/timekeeping/import/${this.batchId}/logs`);
        const logs = response.data;

        // Convert to CSV
        const headers = ['Employee Code', 'Employee Name', 'Date', 'Time In', 'Time Out', 'Hours', 'Remarks'];
        const rows = logs.map(log => [
          log.employeeCode,
          log.employeeName,
          date.formatDate(log.timeIn, 'YYYY-MM-DD'),
          date.formatDate(log.timeIn, 'hh:mm A'),
          date.formatDate(log.timeOut, 'hh:mm A'),
          log.timeSpan.toFixed(2),
          log.remarks || '',
        ]);

        // Create CSV content
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `imported_logs_${this.batchId}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.$q.notify({
          type: 'positive',
          message: 'Logs exported successfully',
        });
      } catch (error) {
        console.error('Failed to export logs:', error);
        this.$q.notify({
          type: 'negative',
          message: 'Failed to export logs',
        });
      } finally {
        this.$q.loading.hide();
      }
    },
  },
};
</script>

<style scoped>
.success-banner {
  background-color: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
}
</style>
