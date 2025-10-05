<template>
  <q-dialog ref="dialog" @show="fetchImportHistory">
    <TemplateDialog minWidth="1200px">
      <template #DialogIcon>
        <q-icon name="history" size="24px" />
      </template>
      <template #DialogTitle>
        Timekeeping Import History
      </template>
      <template #DialogContent>
        <section>
          <!-- Upload Section -->
          <div class="q-mb-lg">
            <div class="row items-center justify-between q-mb-md">
              <div class="text-title-medium">Upload New File</div>
              <q-btn
                flat
                color="primary"
                label="Download Template"
                icon="download"
                @click="downloadTemplate"
              />
            </div>
            <div class="row q-gutter-md items-center">
              <q-file
                v-model="uploadFile"
                accept=".xlsx,.xls"
                label="Select Excel file"
                outlined
                dense
                clearable
                class="col"
                @update:model-value="onFileSelected"
              >
                <template v-slot:prepend>
                  <q-icon name="upload_file" />
                </template>
              </q-file>
              <q-btn
                color="primary"
                label="Upload & Validate"
                icon="upload"
                :disable="!uploadFile || uploading"
                :loading="uploading"
                @click="uploadAndValidate"
              />
            </div>

            <!-- Upload Progress Bar -->
            <div v-if="uploading" class="q-mt-md">
              <div class="row items-center q-gutter-md">
                <div class="col">
                  <q-linear-progress
                    :value="uploadProgress / 100"
                    color="primary"
                    track-color="grey-3"
                    size="8px"
                    rounded
                  />
                </div>
                <div class="col-auto text-caption">
                  {{ uploadProgress }}%
                </div>
              </div>
              <div class="text-caption text-grey q-mt-xs">
                {{ uploadStatusText }}
              </div>
            </div>
          </div>

          <q-separator class="q-mb-lg" />

          <!-- Filter Section -->
          <div class="row q-gutter-md q-mb-md">
            <div class="col">
              <q-select
                v-model="filterStatus"
                :options="statusOptions"
                label="Status"
                clearable
                outlined
                dense
                @update:model-value="fetchImportHistory"
              />
            </div>
            <div class="col">
              <q-input
                v-model="searchQuery"
                label="Search by filename"
                outlined
                dense
                clearable
                @update:model-value="fetchImportHistory"
              >
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
          </div>

          <!-- History Table -->
          <q-table
            :rows="importHistory"
            :columns="columns"
            row-key="id"
            :pagination="pagination"
            :loading="loading"
            @request="onRequest"
            binary-state-sort
            flat
            bordered
          >
            <template v-slot:body-cell-fileName="props">
              <q-td :props="props">
                <div class="text-label-large">{{ props.row.fileName }}</div>
                <div class="text-body-small text-grey">
                  Uploaded by {{ props.row.account?.firstName }} {{ props.row.account?.lastName }}
                </div>
              </q-td>
            </template>

            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-badge :color="getStatusColor(props.row.status)" :label="getStatusLabel(props.row.status)"/>
              </q-td>
            </template>

            <template v-slot:body-cell-stats="props">
              <q-td :props="props">
                <div class="row q-gutter-xs">
                  <q-chip size="sm" color="positive" text-color="white" dense class="text-label-medium">
                    <q-icon name="check_circle" size="16px" class="q-mr-xs" />
                    {{ props.row.validRows || 0 }}
                  </q-chip>
                  <q-chip v-if="props.row.errorRows > 0" size="sm" color="negative" text-color="white" dense class="text-label-medium">
                    <q-icon name="error" size="16px" class="q-mr-xs" />
                    {{ props.row.errorRows }}
                  </q-chip>
                  <q-chip v-if="props.row.overlappingRows > 0" size="sm" color="warning" text-color="white" dense class="text-label-medium">
                    <q-icon name="warning" size="16px" class="q-mr-xs" />
                    {{ props.row.overlappingRows }} overlaps
                  </q-chip>
                </div>
              </q-td>
            </template>

            <template v-slot:body-cell-employees="props">
              <q-td :props="props">
                <div v-if="props.row.status === 'completed' && props.row.uniqueEmployees" class="text-center">
                  <q-chip color="info" text-color="white" dense class="text-label-medium">
                    <q-icon name="group" size="16px" class="q-mr-xs" />
                    {{ props.row.uniqueEmployees }}
                  </q-chip>
                </div>
                <div v-else class="text-center text-grey">-</div>
              </q-td>
            </template>

            <template v-slot:body-cell-uploadedAt="props">
              <q-td :props="props">
                {{ formatDate(props.row.startedAt) }}
              </q-td>
            </template>

            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <q-btn
                  v-if="props.row.errorRows > 0 || props.row.overlappingRows > 0"
                  flat
                  round
                  dense
                  color="primary"
                  icon="download"
                  @click="downloadErrorReport(props.row.id)"
                >
                  <q-tooltip class="text-label-small">Download Error Report</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  color="primary"
                  icon="visibility"
                  @click="viewDetails(props.row)"
                >
                  <q-tooltip class="text-label-small">View Details</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="(props.row.status === 'overlaps_found' || props.row.status === 'approved' || props.row.status === 'validated') && props.row.status !== 'completed'"
                  flat
                  round
                  dense
                  color="positive"
                  icon="play_arrow"
                  @click="processBatch(props.row.id)"
                >
                  <q-tooltip class="text-label-small">Process Import</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="props.row.status === 'completed'"
                  flat
                  round
                  dense
                  color="primary"
                  icon="group"
                  @click="viewImportedEmployees(props.row.id)"
                >
                  <q-tooltip class="text-label-small">View Employees</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="props.row.status === 'completed'"
                  flat
                  round
                  dense
                  color="primary"
                  icon="list_alt"
                  @click="viewImportedLogs(props.row.id)"
                >
                  <q-tooltip class="text-label-small">View Imported Logs</q-tooltip>
                </q-btn>
              </q-td>
            </template>

            <template v-slot:no-data>
              <div class="full-width row flex-center q-py-lg text-grey">
                <q-icon size="2em" name="history" class="q-mr-sm" />
                <span class="text-label-small">No import history found</span>
              </div>
            </template>
          </q-table>
        </section>
      </template>
    </TemplateDialog>
  </q-dialog>

  <!-- Import Errors Dialog -->
  <TimekeepingImportErrorsDialog ref="errorsDialog" @overlap-approved="onOverlapApproved" />

  <!-- Import Success Dialog -->
  <TimekeepingImportSuccessDialog ref="successDialog" />

  <!-- Import Employees Dialog -->
  <TimekeepingImportEmployeesDialog ref="employeesDialog" />
</template>

<script>
import { defineAsyncComponent } from 'vue';
import { date } from 'quasar';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TimekeepingImportErrorsDialog = defineAsyncComponent(() =>
  import('./TimekeepingImportErrorsDialog.vue')
);
const TimekeepingImportSuccessDialog = defineAsyncComponent(() =>
  import('./TimekeepingImportSuccessDialog.vue')
);
const TimekeepingImportEmployeesDialog = defineAsyncComponent(() =>
  import('./TimekeepingImportEmployeesDialog.vue')
);

export default {
  name: 'TimekeepingImportHistoryDialog',
  components: {
    TimekeepingImportErrorsDialog,
    TimekeepingImportSuccessDialog,
    TimekeepingImportEmployeesDialog,
    TemplateDialog,
  },
  data() {
    return {
      importHistory: [],
      loading: false,
      uploading: false,
      uploadFile: null,
      uploadProgress: 0,
      uploadStatusText: '',
      pagination: {
        sortBy: 'startedAt',
        descending: true,
        page: 1,
        rowsPerPage: 10,
        rowsNumber: 0,
      },
      filterStatus: null,
      searchQuery: '',
      statusOptions: [
        { label: 'All', value: null },
        { label: 'Uploading', value: 'uploading' },
        { label: 'Validated', value: 'validated' },
        { label: 'Validation Failed', value: 'validation_failed' },
        { label: 'Overlaps Found', value: 'overlaps_found' },
        { label: 'Approved', value: 'approved' },
        { label: 'Processing', value: 'processing' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
      ],
      columns: [
        {
          name: 'fileName',
          label: 'File Name',
          field: 'fileName',
          align: 'left',
          sortable: true,
        },
        {
          name: 'status',
          label: 'Status',
          field: 'status',
          align: 'center',
          sortable: true,
        },
        {
          name: 'totalRows',
          label: 'Total Rows',
          field: 'totalRows',
          align: 'center',
          sortable: true,
        },
        {
          name: 'stats',
          label: 'Results',
          align: 'center',
        },
        {
          name: 'employees',
          label: 'Employees',
          field: 'uniqueEmployees',
          align: 'center',
          sortable: true,
        },
        {
          name: 'uploadedAt',
          label: 'Uploaded At',
          field: 'startedAt',
          align: 'center',
          sortable: true,
        },
        {
          name: 'actions',
          label: 'Actions',
          align: 'center',
        },
      ],
    };
  },

  methods: {
    show() {
      this.$refs.dialog.show();
    },

    hide() {
      this.$refs.dialog.hide();
    },

    onFileSelected(file) {
      // File validation can be added here
      if (file && !file.name.match(/\.(xlsx|xls)$/i)) {
        this.$q.notify({
          type: 'negative',
          message: 'Please select an Excel file (.xlsx or .xls)',
        });
        this.uploadFile = null;
      }
    },

    async uploadAndValidate() {
      if (!this.uploadFile) return;

      this.uploading = true;
      this.uploadProgress = 0;
      this.uploadStatusText = 'Preparing upload...';

      try {
        const formData = new FormData();
        formData.append('file', this.uploadFile);

        const response = await this.$api.post('/hris/timekeeping/import/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              this.uploadProgress = Math.min(progress, 90); // Cap at 90% for upload, reserve 10% for processing

              if (progress < 100) {
                this.uploadStatusText = `Uploading file... (${this.formatFileSize(progressEvent.loaded)} / ${this.formatFileSize(progressEvent.total)})`;
              } else {
                this.uploadProgress = 95;
                this.uploadStatusText = 'Processing and validating file...';
              }
            }
          },
        });

        // Complete progress
        this.uploadProgress = 100;
        this.uploadStatusText = 'Upload completed successfully!';

        this.$q.notify({
          type: 'positive',
          message: 'File uploaded and validated successfully',
        });

        // Clear upload file
        this.uploadFile = null;

        // Refresh history
        await this.fetchImportHistory();

        // If there are errors or overlaps, show details dialog
        const batch = this.importHistory.find(h => h.id === response.data.batchId);
        if (batch && (batch.errorRows > 0 || batch.overlappingRows > 0)) {
          this.viewDetails(batch);
        }

      } catch (error) {
        console.error('Failed to upload file:', error);
        this.uploadStatusText = 'Upload failed';
        this.$q.notify({
          type: 'negative',
          message: 'Failed to upload file: ' + (error.response?.data?.message || error.message),
        });
      } finally {
        // Reset progress after a delay to show completion
        setTimeout(() => {
          this.uploading = false;
          this.uploadProgress = 0;
          this.uploadStatusText = '';
        }, 2000);
      }
    },

    async fetchImportHistory() {
      this.loading = true;
      try {
        const params = {
          perPage: this.pagination.rowsPerPage,
          page: this.pagination.page,
          sortBy: this.pagination.sortBy,
          sortOrder: this.pagination.descending ? 'desc' : 'asc',
        };

        const filters = [];

        if (this.filterStatus?.value) {
          filters.push({
            status: this.filterStatus.value
          });
        }

        if (this.searchQuery) {
          filters.push({
            fileName: {
              contains: this.searchQuery,
              mode: 'insensitive',
            }
          });
        }

        const body = {
          filters: filters,
          settings: {},
        };

        const response = await this.$api.put('/hris/timekeeping/import/history', body, {
          params,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        this.importHistory = response.data.list;
        this.pagination.rowsNumber = response.data.pagination.totalCount;
      } catch (error) {
        console.error('Failed to fetch import history:', error);
        this.$q.notify({
          type: 'negative',
          message: 'Failed to fetch import history',
        });
      } finally {
        this.loading = false;
      }
    },

    async onRequest(props) {
      const { page, rowsPerPage, sortBy, descending } = props.pagination;

      this.pagination.page = page;
      this.pagination.rowsPerPage = rowsPerPage;
      this.pagination.sortBy = sortBy;
      this.pagination.descending = descending;

      await this.fetchImportHistory();
    },

    getStatusColor(status) {
      const colors = {
        uploading: 'grey',
        validated: 'positive',
        validation_failed: 'negative',
        overlaps_found: 'warning',
        approved: 'info',
        processing: 'info',
        completed: 'positive',
        failed: 'negative',
      };
      return colors[status] || 'grey';
    },

    getStatusLabel(status) {
      const labels = {
        uploading: 'Uploading',
        validated: 'Validated',
        validation_failed: 'Validation Failed',
        overlaps_found: 'Overlaps Found',
        approved: 'Approved',
        processing: 'Processing',
        completed: 'Completed',
        failed: 'Failed',
      };
      return labels[status] || status;
    },

    formatDate(dateStr) {
      return date.formatDate(dateStr, 'YYYY-MM-DD HH:mm');
    },

    async downloadErrorReport(batchId) {
      try {
        this.$q.loading.show({ message: 'Downloading error report...' });

        const response = await this.$api.get(`/hris/timekeeping/import/history/${batchId}/download-errors`, {
          responseType: 'blob',
        });

        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `timekeeping_import_errors_${batchId}.xlsx`;
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

    viewDetails(batch) {
      this.$refs.errorsDialog?.show(batch.id);
    },

    async processBatch(batchId) {
      this.$q.dialog({
        title: 'Process Import',
        message: 'Are you sure you want to process this import batch? This will add the validated logs to the system.',
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          this.$q.loading.show({ message: 'Processing import...' });

          await this.$api.post(`/hris/timekeeping/import/${batchId}/process`);

          this.$q.notify({
            type: 'positive',
            message: 'Import processed successfully',
          });

          // Refresh history
          await this.fetchImportHistory();

          // Show success dialog
          this.$refs.successDialog?.show(batchId);

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

    onOverlapApproved() {
      // Refresh history when overlaps are approved
      this.fetchImportHistory();
    },

    async downloadTemplate() {
      try {
        this.$q.loading.show({ message: 'Downloading template...' });

        const response = await this.$api.get('/hris/timekeeping/import/template', {
          responseType: 'blob',
        });

        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'timekeeping_import_template.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.$q.notify({
          type: 'positive',
          message: 'Template downloaded successfully',
        });
      } catch (error) {
        console.error('Failed to download template:', error);
        this.$q.notify({
          type: 'negative',
          message: 'Failed to download template',
        });
      } finally {
        this.$q.loading.hide();
      }
    },

    viewImportedLogs(batchId) {
      // Navigate to Raw Logs Browse with filter for this import batch
      this.$router.push({
        name: 'member_manpower_timekeeping_raw_logs',
        query: {
          importBatchId: batchId,
        },
      });
      this.hide();
    },

    viewImportedEmployees(batchId) {
      this.$refs.employeesDialog?.show(batchId);
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';

      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));

      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
  },
};
</script>

<style scoped>
.dialog-card {
  min-height: 600px;
}
</style>
