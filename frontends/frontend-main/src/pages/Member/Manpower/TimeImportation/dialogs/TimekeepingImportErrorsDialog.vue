<template>
  <q-dialog ref="dialog" persistent>
    <TemplateDialog minWidth="1200px" maxWidth="90vw">
      <template #DialogIcon>
        <q-icon name="error" size="24px" />
      </template>
      <template #DialogTitle>
        <div>Import Issues - {{ batchInfo?.fileName || 'Unknown File' }}</div>
      </template>
      <template #DialogContent>
        <section>
          <!-- Summary Section -->
          <div class="row q-gutter-md q-mb-lg">
            <q-card class="col" flat bordered>
              <q-card-section class="text-center">
                <div class="text-title-large">{{ totalRows }}</div>
                <div class="text-body-medium text-grey">Total Rows</div>
              </q-card-section>
            </q-card>
            <q-card class="col" flat bordered>
              <q-card-section class="text-center">
                <div class="text-title-large text-negative">{{ errorCount }}</div>
                <div class="text-body-medium text-grey">Errors</div>
              </q-card-section>
            </q-card>
            <q-card class="col" flat bordered>
              <q-card-section class="text-center">
                <div class="text-title-large text-warning">{{ overlapCount }}</div>
                <div class="text-body-medium text-grey">Overlaps</div>
              </q-card-section>
            </q-card>
            <q-card class="col" flat bordered>
              <q-card-section class="text-center">
                <div class="text-title-large text-positive">{{ validCount }}</div>
                <div class="text-body-medium text-grey">Valid</div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Filter Tabs -->
          <q-tabs
            v-model="activeTab"
            dense
            class="text-grey"
            active-color="primary"
            indicator-color="primary"
            align="left"
            narrow-indicator
          >
            <q-tab name="all" label="All Issues" />
            <q-tab name="errors" :label="`Errors (${errorCount})`" />
            <q-tab name="overlaps" :label="`Overlaps (${overlapCount})`" />
          </q-tabs>

          <q-separator />

          <!-- Search Bar -->
          <div class="row q-my-md q-gutter-sm">
            <q-input
              v-model="searchQuery"
              dense
              outlined
              placeholder="Search by employee code or name..."
              class="col"
              clearable
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <!-- Issues List -->
          <q-scroll-area style="height: 500px">
            <q-list separator>
              <template v-for="record in filteredRecords" :key="record.id">
                <q-expansion-item
                  :icon="getRecordIcon(record)"
                  :header-class="getRecordHeaderClass(record)"
                  expand-separator
                >
                  <template v-slot:header>
                    <q-item-section avatar>
                      <q-icon :name="getRecordIcon(record)" :color="getRecordColor(record)" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>
                        <strong>Row {{ record.rowNumber }}</strong>:
                        {{ record.employeeName || record.employeeCode }}
                      </q-item-label>
                      <q-item-label caption>
                        {{ getRecordSummary(record) }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <div class="text-grey-7">
                        {{ formatDateTime(record.timeIn) }} - {{ formatDateTime(record.timeOut) }}
                      </div>
                    </q-item-section>
                  </template>

                  <q-card>
                    <q-card-section>
                      <!-- Employee Details -->
                      <div class="row q-mb-md">
                        <div class="col-12">
                          <div class="text-subtitle2 q-mb-sm">Log Details</div>
                          <div class="row q-gutter-md text-body2">
                            <div class="col-auto">
                              <strong>Employee Code:</strong> {{ record.employeeCode }}
                            </div>
                            <div class="col-auto">
                              <strong>Time In:</strong> {{ formatDateTime(record.timeIn) }}
                            </div>
                            <div class="col-auto">
                              <strong>Time Out:</strong> {{ formatDateTime(record.timeOut) }}
                            </div>
                            <div class="col-auto">
                              <strong>Remarks:</strong> {{ record.remarks || 'N/A' }}
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Validation Errors Section -->
                      <div v-if="record.validationErrors && record.validationErrors.length" class="q-mb-md">
                        <div class="text-subtitle2 text-negative q-mb-sm">
                          <q-icon name="error" size="xs" /> Validation Errors
                        </div>
                        <q-list dense bordered separator class="rounded-borders">
                          <q-item v-for="(error, idx) in record.validationErrors" :key="`error-${idx}`">
                            <q-item-section avatar>
                              <q-icon name="cancel" color="negative" size="sm" />
                            </q-item-section>
                            <q-item-section>
                              <q-item-label>{{ error.message }}</q-item-label>
                              <q-item-label caption>Field: {{ error.field }} | Type: {{ error.type }}</q-item-label>
                            </q-item-section>
                          </q-item>
                        </q-list>
                      </div>

                      <!-- Overlaps Section -->
                      <div v-if="record.hasOverlap && record.overlappingLogs" class="q-mb-md">
                        <div class="text-subtitle2 text-warning q-mb-sm">
                          <q-icon name="warning" size="xs" /> Overlapping Logs (Will be Deleted)
                        </div>

                        <div v-for="(existingLog, idx) in record.overlappingLogs" :key="`overlap-${idx}`" class="q-mb-sm">
                          <q-card flat bordered class="bg-orange-1">
                            <q-card-section class="q-pa-sm">
                              <div class="text-body2">
                                <div><strong>Existing Log:</strong></div>
                                <div>Time In: {{ formatDateTime(existingLog.timeIn) }}</div>
                                <div>Time Out: {{ formatDateTime(existingLog.timeOut) }}</div>
                                <div>Source: {{ existingLog.source }}</div>
                                <div v-if="existingLog.remarks">Remarks: {{ existingLog.remarks }}</div>
                              </div>
                            </q-card-section>
                          </q-card>
                        </div>

                        <div class="q-mt-sm">
                          <q-checkbox
                            v-model="approvedOverlaps[record.id]"
                            :label="`I understand the existing log(s) will be deleted and replaced`"
                            color="warning"
                          />
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </q-expansion-item>
              </template>
            </q-list>

            <div v-if="filteredRecords.length === 0" class="text-center q-pa-lg text-grey">
              <q-icon name="search_off" size="64px" />
              <div class="text-h6 q-mt-md">No issues found</div>
              <div>Try adjusting your filters</div>
            </div>
          </q-scroll-area>

          <!-- Actions -->
          <div class="row q-mt-md q-gutter-sm justify-end">
            <q-btn
              flat
              color="primary"
              label="Download Error Report"
              icon="download"
              @click="downloadErrorReport"
            />
            <q-btn
              v-if="hasOverlaps && canApproveOverlaps"
              color="warning"
              label="Approve Selected Overlaps"
              icon="check_circle"
              @click="approveOverlaps"
              :disable="!hasSelectedOverlaps"
            />
            <q-btn
              v-if="!hasErrors && canProcess"
              color="positive"
              label="Process Import"
              icon="play_arrow"
              @click="processImport"
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
  name: 'TimekeepingImportErrorsDialog',
  components: {
    TemplateDialog,
  },
  emits: ['overlap-approved'],
  data() {
    return {
      batchId: null,
      batchInfo: null,
      records: [],
      activeTab: 'all',
      searchQuery: '',
      approvedOverlaps: {},
    };
  },

  computed: {
    totalRows() {
      return this.batchInfo?.totalRows || 0;
    },

    errorRecords() {
      return this.records.filter(r => r.validationErrors && r.validationErrors.length > 0);
    },

    overlapRecords() {
      return this.records.filter(r => r.hasOverlap);
    },

    errorCount() {
      return this.errorRecords.length;
    },

    overlapCount() {
      return this.overlapRecords.length;
    },

    validCount() {
      return this.totalRows - this.errorCount - this.overlapCount;
    },

    hasErrors() {
      return this.errorCount > 0;
    },

    hasOverlaps() {
      return this.overlapCount > 0;
    },

    canApproveOverlaps() {
      return this.hasOverlaps && !this.hasErrors;
    },

    canProcess() {
      return !this.hasErrors && (!this.hasOverlaps || this.hasSelectedOverlaps);
    },

    hasSelectedOverlaps() {
      return Object.values(this.approvedOverlaps).some(approved => approved);
    },

    filteredRecords() {
      let records = this.records;

      // Filter by tab
      if (this.activeTab === 'errors') {
        records = this.errorRecords;
      } else if (this.activeTab === 'overlaps') {
        records = this.overlapRecords;
      }

      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        records = records.filter(r =>
          r.employeeCode?.toLowerCase().includes(query) ||
          r.employeeName?.toLowerCase().includes(query)
        );
      }

      return records;
    },
  },

  methods: {
    async show(batchId) {
      this.batchId = batchId;
      this.resetDialog();
      this.$refs.dialog.show();
      await this.loadData();
    },

    hide() {
      this.$refs.dialog.hide();
    },

    resetDialog() {
      this.batchInfo = null;
      this.records = [];
      this.activeTab = 'all';
      this.searchQuery = '';
      this.approvedOverlaps = {};
    },

    async loadData() {
      try {
        this.$q.loading.show({ message: 'Loading import details...' });

        // Get batch info
        const batchResponse = await this.$api.get(`/hris/timekeeping/import/history/${this.batchId}`);
        this.batchInfo = batchResponse.data;

        // Get error records
        const errorResponse = await this.$api.get(`/hris/timekeeping/import/history/${this.batchId}/errors`);
        this.records = errorResponse.data;

        // Initialize approval checkboxes for overlaps
        this.records.forEach(record => {
          if (record.hasOverlap) {
            this.approvedOverlaps[record.id] = false;
          }
        });

      } catch (error) {
        console.error('Failed to load import details:', error);
        this.$q.notify({
          type: 'negative',
          message: 'Failed to load import details',
        });
      } finally {
        this.$q.loading.hide();
      }
    },

    getRecordIcon(record) {
      if (record.validationErrors && record.validationErrors.length > 0) {
        return 'cancel';
      } else if (record.hasOverlap) {
        return 'warning';
      }
      return 'check_circle';
    },

    getRecordColor(record) {
      if (record.validationErrors && record.validationErrors.length > 0) {
        return 'negative';
      } else if (record.hasOverlap) {
        return 'warning';
      }
      return 'positive';
    },

    getRecordHeaderClass(record) {
      if (record.validationErrors && record.validationErrors.length > 0) {
        return 'bg-red-1';
      } else if (record.hasOverlap) {
        return 'bg-orange-1';
      }
      return '';
    },

    getRecordSummary(record) {
      if (record.validationErrors && record.validationErrors.length > 0) {
        return `${record.validationErrors.length} validation error(s)`;
      } else if (record.hasOverlap) {
        const overlapCount = Array.isArray(record.overlappingLogs) ? record.overlappingLogs.length : 1;
        return `${overlapCount} overlapping log(s) found`;
      }
      return 'No issues';
    },

    formatDateTime(dateTime) {
      if (!dateTime) return 'N/A';
      return date.formatDate(dateTime, 'YYYY-MM-DD hh:mm A');
    },

    async downloadErrorReport() {
      try {
        this.$q.loading.show({ message: 'Downloading error report...' });

        const response = await this.$api.get(`/hris/timekeeping/import/history/${this.batchId}/download-errors`, {
          responseType: 'blob',
        });

        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `timekeeping_import_errors_${this.batchId}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.$q.notify({
          type: 'positive',
          message: 'Error report downloaded successfully',
        });
      } catch (error) {
        console.error('Failed to download error report:', error);
        this.$q.notify({
          type: 'negative',
          message: 'Failed to download error report',
        });
      } finally {
        this.$q.loading.hide();
      }
    },

    async approveOverlaps() {
      const approvedIds = Object.keys(this.approvedOverlaps)
        .filter(id => this.approvedOverlaps[id])
        .map(id => parseInt(id));

      if (approvedIds.length === 0) {
        this.$q.notify({
          type: 'warning',
          message: 'Please select at least one overlap to approve',
        });
        return;
      }

      try {
        this.$q.loading.show({ message: 'Approving overlaps...' });

        await this.$api.post(`/hris/timekeeping/import/${this.batchId}/approve-overlaps`, {
          approvedTempIds: approvedIds,
        });

        this.$q.notify({
          type: 'positive',
          message: 'Overlaps approved successfully',
        });

        this.$emit('overlap-approved');
        this.hide();

      } catch (error) {
        console.error('Failed to approve overlaps:', error);
        this.$q.notify({
          type: 'negative',
          message: 'Failed to approve overlaps: ' + (error.response?.data?.message || error.message),
        });
      } finally {
        this.$q.loading.hide();
      }
    },

    async processImport() {
      this.$q.dialog({
        title: 'Process Import',
        message: 'Are you sure you want to process this import? This will add the logs to the system.',
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          this.$q.loading.show({ message: 'Processing import...' });

          await this.$api.post(`/hris/timekeeping/import/${this.batchId}/process`);

          this.$q.notify({
            type: 'positive',
            message: 'Import processed successfully',
          });

          this.$emit('overlap-approved');
          this.hide();

        } catch (error) {
          console.error('Failed to process import:', error);
          this.$q.notify({
            type: 'negative',
            message: 'Failed to process import: ' + (error.response?.data?.message || error.message),
          });
        } finally {
          this.$q.loading.hide();
        }
      });
    },
  },
};
</script>

<style scoped>
.dialog-card {
  min-height: 600px;
}

.q-expansion-item {
  border-radius: 4px;
  margin-bottom: 8px;
}

.bg-red-1 {
  background-color: #ffebee;
}

.bg-orange-1 {
  background-color: #fff3e0;
}
</style>
