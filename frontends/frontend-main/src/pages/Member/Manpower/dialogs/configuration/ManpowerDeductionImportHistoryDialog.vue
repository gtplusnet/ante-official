<template>
  <q-dialog ref="dialog" @show="fetchImportHistory">
    <TemplateDialog minWidth="1200px">
      <template #DialogIcon>
        <q-icon name="history" size="24px" />
      </template>
      <template #DialogTitle>
        Import History
      </template>
      <template #DialogContent>
        <section class="q-pa-md">
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
                    {{ props.row.processedRows || 0 }}
                  </q-chip>
                  <q-chip v-if="props.row.failedRows > 0" size="sm" color="negative" text-color="white" dense class="text-label-medium">
                    <q-icon name="error" size="16px" class="q-mr-xs" />
                    {{ props.row.failedRows }}
                  </q-chip>
                </div>
              </q-td>
            </template>

            <template v-slot:body-cell-uploadedAt="props">
              <q-td :props="props">
                {{ formatDate(props.row.startedAt) }}
              </q-td>
            </template>

            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <GButton
                  v-if="props.row.failedRows > 0 || props.row.status === 'validated'"
                  variant="icon"
                  size="small"
                  color="primary"
                  icon="download"
                  @click="downloadErrorReport(props.row.id)"
                  tooltip="Download Error Report"
                />
                <GButton
                  variant="icon"
                  size="small"
                  color="primary"
                  icon="visibility"
                  @click="viewDetails(props.row)"
                  tooltip="View Details"
                />
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
  <ManpowerDeductionImportErrorsDialog ref="errorsDialog" />
</template>

<script>
import { defineAsyncComponent } from 'vue';
import { date } from 'quasar';
import GButton from 'src/components/shared/buttons/GButton.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ManpowerDeductionImportErrorsDialog = defineAsyncComponent(() =>
  import('./ManpowerDeductionImportErrorsDialog.vue')
);
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: 'ManpowerDeductionImportHistoryDialog',
  components: {
    ManpowerDeductionImportErrorsDialog,
    TemplateDialog,
    GButton,
  },
  data() {
    return {
      importHistory: [],
      loading: false,
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
        { label: 'Uploaded', value: 'uploaded' },
        { label: 'Validating', value: 'validating' },
        { label: 'Validated', value: 'validated' },
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

        const response = await this.$api.put('/hr-configuration/deduction/import/history', body, {
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
        uploaded: 'info',
        validating: 'warning',
        validated: 'warning',
        processing: 'info',
        completed: 'positive',
        failed: 'negative',
      };
      return colors[status] || 'grey';
    },

    getStatusLabel(status) {
      return status.charAt(0).toUpperCase() + status.slice(1);
    },

    formatDate(dateStr) {
      return date.formatDate(dateStr, 'YYYY-MM-DD HH:mm');
    },

    async downloadErrorReport(batchId) {
      try {
        this.$q.loading.show({ message: 'Downloading error report...' });

        const response = await this.$api.get(`/hr-configuration/deduction/import/history/${batchId}/download-errors`, {
          responseType: 'blob',
        });

        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `deduction_import_errors_${batchId}.xlsx`;
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
  },
};
</script>

<style scoped>
.dialog-card {
  min-height: 600px;
}
</style>
