<template>
  <q-dialog ref="dialog" persistent>
    <TemplateDialog minWidth="800px">
      <template #DialogIcon>
        <q-icon name="person_add" size="24px" />
      </template>
      <template #DialogTitle>
        <div>Import Employee</div>
      </template>
        <template #DialogContent>
          <section>
            <!-- Stage Indicator -->
            <div v-if="currentStage !== 'initial'" class="q-mb-lg">
              <q-stepper v-model="currentStage" ref="stepper" color="primary" animated flat>
                <q-step :name="'uploaded'" title="Upload" icon="upload_file" :done="completedStages.includes('uploaded')" />
                <q-step :name="'validated'" title="Validate" icon="fact_check" :done="completedStages.includes('validated')" />
                <q-step :name="'approved'" title="Review" icon="assignment_turned_in" :done="completedStages.includes('approved')" :disable="!hasWarnings" />
                <q-step :name="'processed'" title="Import" icon="save" :done="completedStages.includes('processed')" />
              </q-stepper>
            </div>

            <!-- Initial Upload Stage -->
            <div v-if="currentStage === 'initial'" class="column">
              <div class="q-pa-md bgColor q-mb-md rounded-borders">
                <p class="text-title-medium text-center ">
                  Import Employee
                </p>

                <!-- Info Banner for Default Password -->
                <q-banner class="bg-info text-white q-mb-md" rounded>
                  <template v-slot:avatar>
                    <q-icon name="info" color="white" />
                  </template>
                  <div class="text-body-medium">
                    <strong>Important:</strong> Imported employees will have their birthdate as the default password in MMDDYYYY format (e.g., 05151990 for May 15, 1990). 
                    <br />
                    Users can change their password after logging in. If birthdate is not provided, the default password will be "TempPass123!".
                  </div>
                </q-banner>

                <div
                  class="upload-zone q-pa-md flex flex-center column items-center"
                  style="height: 260px;"
                  @dragover.prevent="onDragOver"
                  @dragleave.prevent="onDragLeave"
                  @drop.prevent="onDrop"
                  @click="triggerFileInput"
                  :class="{ 'disabled': isProcessing }"
                >
                  <q-icon name="cloud_upload" size="3rem" color="grey-6" />
                  <div class="text-grey-7 text-label-medium q-mt-sm">
                    Drag & drop a file or click
                  </div>
                  <input
                    type="file"
                    ref="hiddenInput"
                    accept=".xlsx,.xls"
                    style="display: none"
                    @change="onFileSelected"
                    :disabled="isProcessing"
                  />
                </div>

                <div v-if="excelDataFile" class="q-mt-md q-px-md">
                  <q-chip
                    removable
                    @remove="excelDataFile = null"
                    color="primary"
                    text-color="white"
                    class="text-label-large"
                  >
                    {{
                      typeof excelDataFile === 'object'
                        ? excelDataFile.name
                        : excelDataFile
                    }}
                  </q-chip>
                </div>

                <div class="text-right q-mt-md q-gutter-x-sm">
                  <q-btn
                    outline
                    color="primary"
                    label="Import History"
                    icon="history"
                    class="text-label-large"
                    @click="showImportHistory"
                    :disable="isProcessing"
                  />
                  <q-btn
                    outline
                    color="primary"
                    label="Download Template"
                    icon="download"
                    class="text-label-large"
                    @click="downloadTemplate"
                    :disable="isProcessing"
                  />
                  <q-btn
                    color="primary"
                    label="Upload file"
                    icon="upload"
                    class="text-label-large"
                    @click="uploadFile"
                    :disable="!excelDataFile || isProcessing"
                    :loading="isProcessing"
                  />
                </div>
              </div>
            </div>

            <!-- Progress Stage -->
            <div v-else-if="['uploading', 'validating', 'processing'].includes(currentStage)" class="column items-center">
              <q-circular-progress
                :value="progressPercentage"
                size="120px"
                :thickness="0.22"
                color="primary"
                track-color="grey-3"
                class="q-mb-md"
                show-value
              >
                {{ progressPercentage }}%
              </q-circular-progress>

              <div class="text-title-large-f-[20px] q-mb-sm">{{ stageText }}</div>
              <div class="text-body-medium text-grey-7">{{ progressMessage }}</div>

              <div v-if="progressStats" class="q-mt-lg full-width">
                <div class="row q-gutter-md justify-center">
                  <div v-if="progressStats.validRows !== undefined" class="text-center">
                    <div class="text-headline-small text-positive">{{ progressStats.validRows }}</div>
                    <div class="text-body-small">Valid</div>
                  </div>
                  <div v-if="progressStats.warningRows !== undefined" class="text-center">
                    <div class="text-headline-small text-warning">{{ progressStats.warningRows }}</div>
                    <div class="text-body-small">Warnings</div>
                  </div>
                  <div v-if="progressStats.errorRows !== undefined" class="text-center">
                    <div class="text-headline-small text-negative">{{ progressStats.errorRows }}</div>
                    <div class="text-body-small">Errors</div>
                  </div>
                  <div v-if="progressStats.processedRows !== undefined" class="text-center">
                    <div class="text-headline-small text-info">{{ progressStats.processedRows }}</div>
                    <div class="text-body-small">Processed</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Validation Results Stage -->
            <div v-else-if="currentStage === 'validated'" class="column q-pa-md">
              <div class="text-title-medium q-mb-md">Validation Results</div>

              <div class="row q-gutter-md q-mb-lg">
                <q-card class="col">
                  <q-card-section class="text-center">
                    <div class="text-headline-small text-positive">{{ validationResults.validRows }}</div>
                    <div class="text-body-small">Valid Records</div>
                  </q-card-section>
                </q-card>
                <q-card class="col">
                  <q-card-section class="text-center">
                    <div class="text-headline-small text-warning">{{ validationResults.warningRows }}</div>
                    <div class="text-body-small">Records with Warnings</div>
                  </q-card-section>
                </q-card>
                <q-card class="col">
                  <q-card-section class="text-center">
                    <div class="text-headline-small text-negative">{{ validationResults.errorRows }}</div>
                    <div class="text-body-small">Records with Errors</div>
                  </q-card-section>
                </q-card>
              </div>

              <div v-if="validationResults.errorRows > 0" class="q-mb-md">
                <q-banner class="bg-negative text-white">
                  <template v-slot:avatar>
                    <q-icon name="error" color="white" />
                  </template>
                  {{ validationResults.errorRows }} records have errors and cannot be imported.
                  <template v-slot:action>
                    <q-btn flat color="white" label="View Errors" @click="viewErrors" class="text-label-large"/>
                  </template>
                </q-banner>
              </div>

              <div v-if="validationResults.warningRows > 0" class="q-mb-md">
                <q-banner class="bg-warning">
                  <template v-slot:avatar>
                    <q-icon name="warning" color="white" />
                  </template>
                  {{ validationResults.warningRows }} records have warnings and require approval.
                </q-banner>
              </div>

              <div class="text-right q-gutter-x-sm">
                <q-btn outline color="negative" label="Cancel Import" @click="cancelImport" />
                <q-btn
                  v-if="validationResults.warningRows > 0"
                  color="warning"
                  label="Review Warnings"
                  @click="reviewWarnings"
                  :disable="validationResults.errorRows > 0"
                />
                <q-btn
                  v-else-if="validationResults.validRows > 0 && validationResults.errorRows === 0"
                  color="primary"
                  label="Process Import"
                  @click="processImport"
                />
              </div>
            </div>

            <!-- Warning Review Stage -->
            <div v-else-if="currentStage === 'approved'" class="column q-pa-md">
              <div class="row items-center justify-between q-mb-md">
                <div class="text-title-medium">Review Warnings</div>
                <div>
                  <q-checkbox v-model="selectAllWarnings" class="text-label-large" label="Select All" @update:model-value="toggleAllWarnings" />
                </div>
              </div>

              <q-scroll-area style="height: 400px" class="q-mb-md">
                <q-list bordered separator>
                  <q-item v-for="record in warningRecords" :key="record.id">
                    <q-item-section side>
                      <q-checkbox v-model="selectedWarnings" :val="record.id" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-label-large">
                        Row {{ record.rowNumber }}: {{ record.firstName }} {{ record.lastName }} ({{ record.employeeCode }})
                      </q-item-label>
                      <q-item-label caption lines="3">
                        <div v-for="(warning, idx) in record.validationWarnings" :key="idx" class="text-warning text-body-small">
                          <q-icon name="warning" size="xs" /> {{ warning.field }}: {{ warning.message }}
                        </div>
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-scroll-area>

              <div class="text-right q-gutter-x-sm">
                <q-btn outline color="grey" label="Back" @click="currentStage = 'validated'"  class="text-label-large"/>
                <q-btn
                  color="primary"
                  label="Approve Selected & Process"
                  @click="approveAndProcess"
                  :disable="selectedWarnings.length === 0"
                  class="text-label-large"
                />
              </div>
            </div>

            <!-- Completion Stage -->
            <div v-else-if="currentStage === 'complete'" class="column items-center">
              <q-icon name="check_circle" size="80px" color="positive" class="q-mb-md" />
              <div class="text-title-large q-mb-sm">Import Completed!</div>

              <div class="row q-gutter-md q-mt-md">
                <q-card>
                  <q-card-section class="text-center">
                    <div class="text-headline-medium text-positive">{{ finalResults.processedRows }}</div>
                    <div class="text-body-small">Successfully Imported</div>
                  </q-card-section>
                </q-card>
                <q-card v-if="finalResults.failedRows > 0">
                  <q-card-section class="text-center">
                    <div class="text-headline-medium text-negative">{{ finalResults.failedRows }}</div>
                    <div class="text-body-small">Failed</div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="q-mt-lg">
                <q-btn color="primary" label="Done" @click="closeDialog" />
              </div>
            </div>
          </section>
      </template>
    </TemplateDialog>
  </q-dialog>

  <!-- Import History Dialog -->
  <ManpowerImportHistoryDialog ref="historyDialog" />

  <!-- Import Errors Dialog -->
  <ManpowerImportErrorsDialog ref="errorsDialog" @review-warnings="handleReviewWarnings" />
</template>

<script>
import { defineAsyncComponent } from 'vue';
import { api } from 'src/boot/axios';
import { useSocketStore } from 'src/stores/socketStore';
import bus from 'src/bus';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ManpowerImportHistoryDialog = defineAsyncComponent(() =>
  import('./ManpowerImportHistoryDialog.vue')
);
const ManpowerImportErrorsDialog = defineAsyncComponent(() =>
  import('./ManpowerImportErrorsDialog.vue')
);
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: 'ImportEmployee',
  components: {
    ManpowerImportHistoryDialog,
    ManpowerImportErrorsDialog,
    TemplateDialog,
  },
  props: {},
  emits: ['imported'],
  data: () => ({
    excelDataFile: null,
    currentStage: 'initial', // initial, uploading, uploaded, validating, validated, approved, processing, processed, complete
    completedStages: [],
    isProcessing: false,
    batchId: null,
    progressPercentage: 0,
    progressMessage: '',
    progressStats: null,
    validationResults: {
      validRows: 0,
      warningRows: 0,
      errorRows: 0,
    },
    warningRecords: [],
    selectedWarnings: [],
    selectAllWarnings: false,
    hasWarnings: false,
    finalResults: {
      processedRows: 0,
      failedRows: 0,
    },
  }),

  computed: {
    socketStore() {
      return useSocketStore();
    },
    stageText() {
      const stages = {
        uploading: 'Uploading File...',
        validating: 'Validating Data...',
        processing: 'Importing Records...',
      };
      return stages[this.currentStage] || '';
    },
  },

  mounted() {
    // Listen for import progress updates
    bus.on('import-progress', this.handleImportProgress);
  },

  beforeUnmount() {
    bus.off('import-progress', this.handleImportProgress);
  },

  methods: {
    show() {
      this.resetDialog();
      this.$refs.dialog.show();
    },

    hide() {
      if (!this.isProcessing) {
        this.$refs.dialog.hide();
      }
    },

    resetDialog() {
      this.excelDataFile = null;
      this.currentStage = 'initial';
      this.completedStages = [];
      this.isProcessing = false;
      this.batchId = null;
      this.progressPercentage = 0;
      this.progressMessage = '';
      this.progressStats = null;
      this.validationResults = {
        validRows: 0,
        warningRows: 0,
        errorRows: 0,
      };
      this.warningRecords = [];
      this.selectedWarnings = [];
      this.selectAllWarnings = false;
      this.hasWarnings = false;
      this.finalResults = {
        processedRows: 0,
        failedRows: 0,
      };
    },

    onDragOver(e) {
      e.currentTarget.classList.add('dragging');
    },

    onDragLeave(e) {
      e.currentTarget.classList.remove('dragging');
    },

    triggerFileInput() {
      this.$refs.hiddenInput.click();
    },

    onDrop(e) {
      const files = e.dataTransfer.files;
      if (files && files.length) {
        this.excelDataFile = files[0];
      }
      e.currentTarget.classList.remove('dragging');
    },

    onFileSelected(e) {
      const files = e.target.files;
      if (files && files.length) {
        this.excelDataFile = files[0];
      }
    },

    async uploadFile() {
      if (!this.excelDataFile) return;

      this.isProcessing = true;
      this.currentStage = 'uploading';
      this.progressPercentage = 0;
      this.progressMessage = 'Uploading file...';

      const formData = new FormData();
      formData.append('file', this.excelDataFile);

      try {
        const response = await api.post('/hris/employee/import/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        this.batchId = response.data.batchId;
        this.completedStages.push('uploaded');
        this.currentStage = 'uploaded';

        // Automatically start validation
        await this.validateData();
      } catch (error) {
        this.handleError(error, 'Failed to upload file');
        this.currentStage = 'initial';
        this.isProcessing = false;
      }
    },

    async validateData() {
      if (!this.batchId) return;

      this.currentStage = 'validating';
      this.progressPercentage = 0;
      this.progressMessage = 'Validating records...';

      try {
        await api.post(`/hris/employee/import/${this.batchId}/validate`);
        // Validation completion will be handled by WebSocket
      } catch (error) {
        this.handleError(error, 'Failed to validate data');
        this.isProcessing = false;
      }
    },

    async reviewWarnings() {
      this.currentStage = 'approved';
      // Fetch warning records
      try {
        const response = await api.get(`/hris/employee/import/${this.batchId}/status`);
        this.warningRecords = response.data.errors.filter(e => e.validationWarnings && e.validationWarnings.length > 0);
        this.hasWarnings = true;
      } catch (error) {
        this.handleError(error, 'Failed to fetch warnings');
      }
    },

    toggleAllWarnings(value) {
      if (value) {
        this.selectedWarnings = this.warningRecords.map(r => r.id);
      } else {
        this.selectedWarnings = [];
      }
    },

    async approveAndProcess() {
      if (this.selectedWarnings.length === 0) return;

      try {
        // Approve selected warnings
        await api.post(`/hris/employee/import/${this.batchId}/approve`, {
          approvedIds: this.selectedWarnings,
        });

        this.completedStages.push('approved');

        // Process the import
        await this.processImport();
      } catch (error) {
        this.handleError(error, 'Failed to approve warnings');
      }
    },

    async processImport() {
      this.currentStage = 'processing';
      this.progressPercentage = 0;
      this.progressMessage = 'Importing records...';

      try {
        await api.post(`/hris/employee/import/${this.batchId}/process`);
        // Processing completion will be handled by WebSocket
      } catch (error) {
        this.handleError(error, 'Failed to process import');
        this.isProcessing = false;
      }
    },

    viewErrors() {
      this.$refs.errorsDialog?.show(this.batchId);
    },

    handleReviewWarnings() {
      // When user clicks "Review & Approve Warnings" from the errors dialog
      this.currentStage = 'validated';
      this.reviewWarnings();
    },

    async cancelImport() {
      this.$q.dialog({
        title: 'Cancel Import',
        message: 'Are you sure you want to cancel this import? All progress will be lost.',
        cancel: true,
        persistent: true,
      }).onOk(() => {
        this.resetDialog();
      });
    },

    showImportHistory() {
      this.$refs.historyDialog?.show();
    },

    handleImportProgress(data) {
      if (data.batchId !== this.batchId) return;

      if (data.percentage !== undefined) {
        this.progressPercentage = data.percentage;
      }

      if (data.stage) {
        switch (data.stage) {
          case 'validated':
            this.completedStages.push('validated');
            this.currentStage = 'validated';
            this.validationResults = {
              validRows: data.stats.validRows || 0,
              warningRows: data.stats.warningRows || 0,
              errorRows: data.stats.errorRows || 0,
            };
            this.isProcessing = false;
            break;

          case 'complete':
            this.completedStages.push('processed');
            this.currentStage = 'complete';
            this.finalResults = {
              processedRows: data.stats.processedRows || 0,
              failedRows: data.stats.failedRows || 0,
            };
            this.isProcessing = false;
            this.$emit('imported');
            break;

          default:
            if (data.stats) {
              this.progressStats = data.stats;
            }
            if (data.current && data.total) {
              this.progressMessage = `Processing ${data.current} of ${data.total} records`;
            }
        }
      }
    },

    handleError(error, defaultMessage) {
      console.error(error);
      const message = error.response?.data?.message || defaultMessage;
      this.$q.notify({
        type: 'negative',
        message: message,
        position: 'top',
      });
    },

    closeDialog() {
      this.hide();
      this.$emit('imported');
    },

    showErrors(batchId) {
      this.$refs.errorsDialog?.show(batchId);
    },

    async downloadTemplate() {
      try {
        this.$q.loading.show({
          message: 'Downloading template...',
        });

        const response = await api.get('/hris/employee/template', {
          responseType: 'blob',
        });

        // Create a blob URL and download the file
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'employee_import_template.xlsx';
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
  },
};
</script>

<style scoped>
.upload-zone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 120px;
}

.upload-zone:hover:not(.disabled) {
  border-color: #1976d2;
  background: rgba(25, 118, 210, 0.05);
}

.upload-zone.dragging {
  border-color: #1976d2;
  background: rgba(25, 118, 210, 0.1);
}

.upload-zone.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.dialog-card {
  min-height: 500px;
}
</style>
