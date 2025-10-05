<template>
  <q-dialog ref="dialog" @show="loadEmployeeData">
    <TemplateDialog minWidth="800px">
      <template #DialogIcon>
        <q-icon name="group" size="24px" />
      </template>
      <template #DialogTitle>
        Import Employees Summary
      </template>
      <template #DialogContent>
        <div v-if="loading" class="text-center q-pa-xl">
          <q-spinner size="50px" color="primary" />
          <div class="text-body-medium q-mt-md">Loading employee data...</div>
        </div>

        <div v-else-if="error" class="text-center q-pa-xl">
          <q-icon name="error_outline" size="64px" color="negative" class="q-mb-md" />
          <div class="text-h6 q-mb-sm">Failed to Load Employee Data</div>
          <div class="text-body-medium text-grey q-mb-lg">{{ error }}</div>
          <q-btn
            color="primary"
            label="Retry"
            icon="refresh"
            @click="loadEmployeeData"
          />
        </div>

        <div v-else-if="employeeData">
          <!-- Summary Header -->
          <div class="q-mb-md">
            <div class="text-subtitle1">{{ employeeData.fileName }}</div>
            <div class="text-body-small text-grey">
              {{ employeeData.totalEmployees }} employees | {{ employeeData.totalLogs }} total logs
            </div>
          </div>

          <!-- Employee Table -->
          <q-table
            :rows="employeeData.employees"
            :columns="columns"
            row-key="accountId"
            :pagination="pagination"
            :loading="tableLoading"
            flat
            bordered
            dense
          >
            <template v-slot:loading>
              <q-inner-loading showing color="primary" />
            </template>
            <template v-slot:body-cell-fullName="props">
              <q-td :props="props">
                <div class="text-label-large">{{ props.row.fullName }}</div>
                <div class="text-body-small text-grey">{{ props.row.employeeCode }}</div>
              </q-td>
            </template>

            <template v-slot:body-cell-department="props">
              <q-td :props="props">
                <div>{{ props.row.department || '-' }}</div>
                <div class="text-caption text-grey">{{ props.row.position || '-' }}</div>
              </q-td>
            </template>

            <template v-slot:body-cell-dateRange="props">
              <q-td :props="props">
                <div v-if="props.row.dateRange.from && props.row.dateRange.to">
                  {{ formatDate(props.row.dateRange.from) }} - {{ formatDate(props.row.dateRange.to) }}
                </div>
                <div v-else class="text-grey">-</div>
              </q-td>
            </template>

            <template v-slot:body-cell-totalHours="props">
              <q-td :props="props">
                <q-badge color="primary" :label="`${props.row.totalHours} hrs`" />
              </q-td>
            </template>

            <template v-slot:no-data>
              <div class="full-width column flex-center q-py-xl text-grey">
                <q-icon size="4em" name="people_outline" class="q-mb-md" />
                <div class="text-h6 q-mb-sm">No Employees Found</div>
                <div class="text-body-medium">This import batch contains no employee data.</div>
              </div>
            </template>
          </q-table>

          <!-- Actions -->
          <div class="row q-gutter-sm justify-end q-mt-md">
            <q-btn
              flat
              color="primary"
              label="Export Summary"
              icon="download"
              :loading="exportLoading"
              :disable="!employeeData.employees || employeeData.employees.length === 0"
              @click="exportEmployeeSummary"
            />
            <q-btn
              color="primary"
              label="Close"
              @click="hide"
            />
          </div>
        </div>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import { date } from 'quasar';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: 'TimekeepingImportEmployeesDialog',
  components: {
    TemplateDialog,
  },
  data() {
    return {
      batchId: null,
      employeeData: null,
      loading: false,
      tableLoading: false,
      exportLoading: false,
      error: null,
      pagination: {
        sortBy: 'fullName',
        descending: false,
        page: 1,
        rowsPerPage: 10,
      },
      columns: [
        {
          name: 'fullName',
          label: 'Employee',
          field: 'fullName',
          align: 'left',
          sortable: true,
        },
        {
          name: 'department',
          label: 'Department',
          field: 'department',
          align: 'left',
          sortable: true,
        },
        {
          name: 'totalLogs',
          label: 'Logs',
          field: 'totalLogs',
          align: 'center',
          sortable: true,
        },
        {
          name: 'dateRange',
          label: 'Date Range',
          align: 'center',
        },
        {
          name: 'totalHours',
          label: 'Total Hours',
          field: 'totalHours',
          align: 'center',
          sortable: true,
        },
      ],
    };
  },

  methods: {
    async show(batchId) {
      this.batchId = batchId;
      this.employeeData = null;
      this.error = null;
      this.loading = true; // Set to true immediately to prevent lorem ipsum
      this.tableLoading = false;
      this.exportLoading = false;
      this.$refs.dialog.show();
    },

    hide() {
      this.$refs.dialog.hide();
    },

    async loadEmployeeData() {
      if (!this.batchId) return;

      this.loading = true;
      this.error = null;

      try {
        const response = await this.$api.get(`/hris/timekeeping/import/${this.batchId}/employees`);
        this.employeeData = response.data;

        // Show success message if data loaded successfully
        if (this.employeeData && this.employeeData.employees.length > 0) {
          this.$q.notify({
            type: 'positive',
            message: `Loaded ${this.employeeData.totalEmployees} employees successfully`,
            timeout: 2000,
          });
        }
      } catch (error) {
        console.error('Failed to load employee data:', error);
        this.error = error.response?.data?.message || 'Failed to load employee data. Please try again.';

        // Only show notification if not showing error state
        this.$q.notify({
          type: 'negative',
          message: 'Failed to load employee data',
          timeout: 3000,
        });
      } finally {
        this.loading = false;
      }
    },

    formatDate(dateStr) {
      if (!dateStr) return 'N/A';
      return date.formatDate(dateStr, 'YYYY-MM-DD');
    },

    async exportEmployeeSummary() {
      if (!this.employeeData || !this.employeeData.employees || this.employeeData.employees.length === 0) {
        this.$q.notify({
          type: 'warning',
          message: 'No employee data to export',
        });
        return;
      }

      this.exportLoading = true;

      try {
        // Create CSV content
        const headers = ['Employee Code', 'Employee Name', 'Department', 'Position', 'Total Logs', 'Total Hours', 'First Log', 'Last Log'];
        const rows = this.employeeData.employees.map(emp => [
          emp.employeeCode,
          emp.fullName,
          emp.department || '',
          emp.position || '',
          emp.totalLogs,
          emp.totalHours,
          emp.dateRange.from ? date.formatDate(emp.dateRange.from, 'YYYY-MM-DD') : '',
          emp.dateRange.to ? date.formatDate(emp.dateRange.to, 'YYYY-MM-DD') : '',
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
        link.download = `employee_summary_${this.batchId}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.$q.notify({
          type: 'positive',
          message: `Employee summary exported successfully (${this.employeeData.totalEmployees} employees)`,
          timeout: 3000,
        });
      } catch (error) {
        console.error('Failed to export employee summary:', error);
        this.$q.notify({
          type: 'negative',
          message: 'Failed to export employee summary',
          timeout: 3000,
        });
      } finally {
        this.exportLoading = false;
      }
    },
  },
};
</script>

<style scoped>
</style>
