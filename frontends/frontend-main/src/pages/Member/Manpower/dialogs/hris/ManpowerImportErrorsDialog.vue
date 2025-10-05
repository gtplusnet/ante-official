<template>
  <q-dialog ref="dialog" persistent>
    <TemplateDialog minWidth="1200px" maxWidth="90vw">
      <template #DialogIcon>
        <q-icon name="error" size="24px" />
      </template>
      <template #DialogTitle>
        <div>Import Errors - {{ batchInfo?.fileName || 'Unknown File' }}</div>
      </template>
      <template #DialogContent>
        <section class="q-pa-md">
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
              <div class="text-title-large text-warning">{{ warningCount }}</div>
              <div class="text-body-medium text-grey">Warnings</div>
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
          <q-tab name="warnings" :label="`Warnings (${warningCount})`" />
        </q-tabs>

        <q-separator />

        <!-- Search Bar -->
        <div class="row q-my-md q-gutter-sm">
          <q-input
            v-model="searchQuery"
            dense
            outlined
            placeholder="Search by employee name or code..."
            class="col"
            clearable
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
          <q-select
            v-model="filterField"
            :options="fieldOptions"
            label="Filter by field"
            dense
            outlined
            clearable
            style="min-width: 200px"
          />
        </div>

        <!-- Error List -->
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
                      {{ record.firstName }} {{ record.lastName }}
                      <span class="text-grey">({{ record.employeeCode }})</span>
                    </q-item-label>
                    <q-item-label caption>
                      <span v-if="record.validationErrors && record.validationErrors.length">
                        {{ record.validationErrors.length }} error{{ record.validationErrors.length > 1 ? 's' : '' }}
                      </span>
                      <span v-if="record.validationErrors && record.validationErrors.length && record.validationWarnings && record.validationWarnings.length">
                        &bull;
                      </span>
                      <span v-if="record.validationWarnings && record.validationWarnings.length">
                        {{ record.validationWarnings.length }} warning{{ record.validationWarnings.length > 1 ? 's' : '' }}
                      </span>
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <div class="text-grey-7">
                      {{ record.email }}
                    </div>
                  </q-item-section>
                </template>

                <q-card>
                  <q-card-section>
                    <!-- Employee Details -->
                    <div class="row q-mb-md">
                      <div class="col-12">
                        <div class="text-subtitle2 q-mb-sm">Employee Details</div>
                        <div class="row q-gutter-md text-body2">
                          <div class="col-auto">
                            <strong>Username:</strong> {{ record.username || 'N/A' }}
                          </div>
                          <div class="col-auto">
                            <strong>Contact:</strong> {{ record.contactNumber || 'N/A' }}
                          </div>
                          <div class="col-auto">
                            <strong>Role:</strong> {{ record.role || 'N/A' }}
                          </div>
                          <div class="col-auto">
                            <strong>Branch:</strong> {{ record.branch || 'N/A' }}
                          </div>
                          <div class="col-auto">
                            <strong>Status:</strong> {{ record.employeeStatus || 'N/A' }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Errors Section -->
                    <div v-if="record.validationErrors && record.validationErrors.length" class="q-mb-md">
                      <div class="text-subtitle2 text-negative q-mb-sm">
                        <q-icon name="error" size="xs" /> Errors (Must be fixed)
                      </div>
                      <q-list dense bordered separator class="rounded-borders">
                        <q-item v-for="(error, idx) in record.validationErrors" :key="`error-${idx}`">
                          <q-item-section avatar>
                            <q-icon name="cancel" color="negative" size="sm" />
                          </q-item-section>
                          <q-item-section>
                            <q-item-label>
                              <strong>{{ formatFieldName(error.field) }}:</strong> {{ error.message }}
                            </q-item-label>
                            <q-item-label caption>
                              Type: {{ formatErrorType(error.type) }}
                            </q-item-label>
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </div>

                    <!-- Warnings Section -->
                    <div v-if="record.validationWarnings && record.validationWarnings.length">
                      <div class="text-subtitle2 text-warning q-mb-sm">
                        <q-icon name="warning" size="xs" /> Warnings (Can be approved)
                      </div>
                      <q-list dense bordered separator class="rounded-borders">
                        <q-item v-for="(warning, idx) in record.validationWarnings" :key="`warning-${idx}`">
                          <q-item-section avatar>
                            <q-icon name="warning" color="warning" size="sm" />
                          </q-item-section>
                          <q-item-section>
                            <q-item-label>
                              <strong>{{ formatFieldName(warning.field) }}:</strong> {{ warning.message }}
                            </q-item-label>
                            <q-item-label caption>
                              Type: {{ formatErrorType(warning.type) }}
                            </q-item-label>
                          </q-item-section>
                        </q-item>
                      </q-list>
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
            v-if="hasOnlyWarnings"
            color="primary"
            label="Review & Approve Warnings"
            icon="check_circle"
            @click="reviewWarnings"
          />
        </div>
      </section>
    </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import { api } from 'src/boot/axios';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: 'ManpowerImportErrorsDialog',
  components: {
    TemplateDialog,
  },
  data() {
    return {
      batchId: null,
      batchInfo: null,
      records: [],
      activeTab: 'all',
      searchQuery: '',
      filterField: null,
      fieldOptions: [
        { label: 'Employee Code', value: 'employeeCode' },
        { label: 'Email', value: 'email' },
        { label: 'Username', value: 'username' },
        { label: 'Role', value: 'role' },
        { label: 'Branch', value: 'branch' },
        { label: 'Monthly Rate', value: 'monthlyRate' },
        { label: 'Start Date', value: 'startDate' },
        { label: 'End Date', value: 'endDate' },
        { label: 'Reports To', value: 'reportsTo' },
      ],
    };
  },

  computed: {
    totalRows() {
      return this.batchInfo?.totalRows || 0;
    },

    errorRecords() {
      return this.records.filter(r => r.validationErrors && r.validationErrors.length > 0);
    },

    warningRecords() {
      return this.records.filter(r =>
        (!r.validationErrors || r.validationErrors.length === 0) &&
        r.validationWarnings && r.validationWarnings.length > 0
      );
    },

    errorCount() {
      return this.errorRecords.length;
    },

    warningCount() {
      return this.warningRecords.length;
    },

    validCount() {
      return this.totalRows - this.errorCount - this.warningCount;
    },

    hasOnlyWarnings() {
      return this.errorCount === 0 && this.warningCount > 0;
    },

    filteredRecords() {
      let records = this.records;

      // Filter by tab
      if (this.activeTab === 'errors') {
        records = this.errorRecords;
      } else if (this.activeTab === 'warnings') {
        records = this.warningRecords;
      }

      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        records = records.filter(r =>
          r.firstName?.toLowerCase().includes(query) ||
          r.lastName?.toLowerCase().includes(query) ||
          r.employeeCode?.toLowerCase().includes(query) ||
          r.email?.toLowerCase().includes(query)
        );
      }

      // Filter by field with issues
      if (this.filterField) {
        records = records.filter(r => {
          const allIssues = [
            ...(r.validationErrors || []),
            ...(r.validationWarnings || [])
          ];
          return allIssues.some(issue => issue.field === this.filterField.value);
        });
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
      this.filterField = null;
    },

    async loadData() {
      try {
        this.$q.loading.show({ message: 'Loading error details...' });

        // Get batch info
        const batchResponse = await api.get(`/hris/employee/import/history/${this.batchId}`);
        this.batchInfo = batchResponse.data;

        // Get error records
        const errorResponse = await api.get(`/hris/employee/import/history/${this.batchId}/errors`);
        this.records = errorResponse.data;

      } catch (error) {
        console.error('Failed to load error data:', error);
        this.$q.notify({
          type: 'negative',
          message: 'Failed to load error details',
        });
      } finally {
        this.$q.loading.hide();
      }
    },

    getRecordIcon(record) {
      if (record.validationErrors && record.validationErrors.length > 0) {
        return 'cancel';
      } else if (record.validationWarnings && record.validationWarnings.length > 0) {
        return 'warning';
      }
      return 'check_circle';
    },

    getRecordColor(record) {
      if (record.validationErrors && record.validationErrors.length > 0) {
        return 'negative';
      } else if (record.validationWarnings && record.validationWarnings.length > 0) {
        return 'warning';
      }
      return 'positive';
    },

    getRecordHeaderClass(record) {
      if (record.validationErrors && record.validationErrors.length > 0) {
        return 'bg-red-1';
      } else if (record.validationWarnings && record.validationWarnings.length > 0) {
        return 'bg-orange-1';
      }
      return '';
    },

    formatFieldName(field) {
      // Convert camelCase to Title Case
      return field
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
    },

    formatErrorType(type) {
      const typeMap = {
        'required': 'Required Field',
        'format': 'Invalid Format',
        'unique': 'Duplicate Value',
        'reference': 'Invalid Reference',
        'business_rule': 'Business Rule',
        'data_quality': 'Data Quality',
      };
      return typeMap[type] || type;
    },

    async downloadErrorReport() {
      try {
        this.$q.loading.show({ message: 'Downloading error report...' });

        const response = await api.get(`/hris/employee/import/history/${this.batchId}/download-errors`, {
          responseType: 'blob',
        });

        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `import_errors_${this.batchId}.xlsx`;
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

    reviewWarnings() {
      this.$emit('review-warnings', this.batchId);
      this.hide();
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
