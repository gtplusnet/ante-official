<template>
  <q-dialog v-model="dialogModel">
    <q-card class="pending-approvals-dialog">
      <!-- MD3 Header -->
      <q-card-section class="dialog-header">
        <div class="row items-center">
          <div class="text-headline-small text-on-surface">
            Pending Approvals
            <q-chip
              v-if="!loading"
              size="sm"
              color="red"
              text-color="white"
              class="q-ml-sm"
            >
              {{ totalPendingCount }} pending
            </q-chip>
          </div>
          <q-space />
          <q-btn
            icon="close"
            flat
            round
            dense
            v-close-popup
            class="text-on-surface-variant"
          />
        </div>
      </q-card-section>

      <!-- MD3 Tabs and Filter -->
      <q-card-section class="q-pt-none">
        <div class="row items-center">
          <div class="col">
            <q-tabs
              v-model="statusTab"
              active-color="primary"
              indicator-color="primary"
              align="left"
              class="text-on-surface-variant md3-tabs"
            >
              <q-tab name="all" label="All" class="text-label-medium" />
              <q-tab name="pending" label="Pending" class="text-label-medium" />
              <q-tab
                name="approved"
                label="Approved"
                class="text-label-medium"
              />
              <q-tab
                name="rejected"
                label="Rejected"
                class="text-label-medium"
              />
            </q-tabs>
          </div>
          <div class="col-auto">
            <q-select
              v-model="selectedCutoffDateRangeId"
              :options="cutoffOptions"
              label="Filter by Cutoff Date Range"
              filled
              dense
              emit-value
              map-options
              :loading="!isDateRangeLoaded"
              class="text-body-medium md3-select"
              style="min-width: 300px"
            >
              <template v-slot:prepend>
                <q-icon name="date_range" class="text-on-surface-variant" />
              </template>
            </q-select>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Content -->
      <q-card-section class="dialog-content q-pa-none">
        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
          <div class="loading-content">
            <q-circular-progress
              indeterminate
              size="56px"
              :thickness="0.08"
              color="primary"
              track-color="transparent"
              class="q-mb-md"
            />
            <div class="text-body-medium text-on-surface-variant">
              Loading filings...
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center q-pa-xl">
          <q-icon name="error_outline" size="64px" color="error" />
          <div class="text-body-medium text-on-surface q-mt-md">
            {{ error }}
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="filings.length === 0" class="empty-state-container">
          <div class="empty-state">
            <q-icon name="folder_open" size="64px" color="on-surface-variant" />
            <div class="text-title-medium text-on-surface-variant q-mt-lg">
              No filings found
            </div>
            <div class="text-body-medium text-on-surface-variant q-mt-sm">
              <template v-if="statusTab === 'pending'">
                No pending approvals to display
              </template>
              <template v-else-if="statusTab === 'all'">
                No filings available for review
              </template>
              <template v-else>
                No {{ statusTab }} filings to display
              </template>
            </div>
          </div>
        </div>

        <!-- Table -->
        <q-table
          v-else
          :rows="filings"
          :columns="columns"
          row-key="id"
          flat
          v-model:pagination="pagination"
          :loading="loading"
          @row-click="onRowClick"
          @request="loadFilings"
          class="filings-table"
          :rows-per-page-options="[10, 20, 50, 100]"
          binary-state-sort
        >
          <!-- Custom cell for employee name -->
          <template v-slot:body-cell-employee="props">
            <q-td :props="props">
              <div class="employee-cell">
                <q-avatar
                  size="28px"
                  color="primary-container"
                  text-color="on-primary-container"
                >
                  {{ getInitials(props.row.account) }}
                </q-avatar>
                <div class="q-ml-sm">
                  <div class="text-body-small text-on-surface">
                    {{ formatFullName(props.row.account) }}
                  </div>
                  <div class="text-caption text-on-surface-variant">
                    {{ props.row.account?.email }}
                  </div>
                </div>
              </div>
            </q-td>
          </template>

          <!-- Custom cell for cutoff code -->
          <template v-slot:body-cell-cutoffCode="props">
            <q-td :props="props">
              <q-chip
                :color="
                  props.row.account?.EmployeeData?.payrollGroup?.cutoff
                    ?.cutoffCode
                    ? 'blue-grey'
                    : 'grey'
                "
                text-color="white"
                size="sm"
                class="text-body-small"
              >
                {{
                  props.row.account?.EmployeeData?.payrollGroup?.cutoff
                    ?.cutoffCode || "—"
                }}
              </q-chip>
            </q-td>
          </template>

          <!-- Custom cell for filing type -->
          <template v-slot:body-cell-type="props">
            <q-td :props="props">
              <q-chip
                :color="getTypeColor(props.row.filingType)"
                text-color="white"
                size="sm"
                class="text-body-small"
              >
                {{ props.row.filingTypeLabel }}
              </q-chip>
            </q-td>
          </template>

          <!-- Custom cell for status -->
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-chip
                :color="getStatusColor(props.row.status)"
                text-color="white"
                size="sm"
                class="text-body-small"
              >
                {{ getStatusLabel(props.row.status) }}
              </q-chip>
            </q-td>
          </template>

          <!-- Custom cell for date -->
          <template v-slot:body-cell-date="props">
            <q-td :props="props">
              <div>
                <div class="text-body-small">
                  {{ formatDate(props.row.date || props.row.dateFrom) }}
                </div>
                <div
                  v-if="
                    props.row.dateFrom &&
                    props.row.dateTo &&
                    props.row.dateFrom !== props.row.dateTo
                  "
                  class="text-caption text-on-surface-variant"
                >
                  to {{ formatDate(props.row.dateTo) }}
                </div>
              </div>
            </q-td>
          </template>

          <!-- Custom cell for approver -->
          <template v-slot:body-cell-approver="props">
            <q-td :props="props">
              <div class="text-body-small text-on-surface">
                {{
                  props.row.account?.parent
                    ? formatFullName(props.row.account.parent)
                    : "—"
                }}
              </div>
            </q-td>
          </template>

          <!-- Custom cell for approved by -->
          <template v-slot:body-cell-approvedBy="props">
            <q-td :props="props">
              <div class="text-body-small text-on-surface">
                {{
                  props.row.approvedBy
                    ? formatFullName(props.row.approvedBy)
                    : "—"
                }}
              </div>
            </q-td>
          </template>

          <!-- Custom cell for rejected by -->
          <template v-slot:body-cell-rejectedBy="props">
            <q-td :props="props">
              <div class="text-body-small text-on-surface">
                {{
                  props.row.approvedBy
                    ? formatFullName(props.row.approvedBy)
                    : "—"
                }}
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-dialog>

  <!-- Filing Approval Dialog -->
  <FilingApprovalDialog
    v-model="showApprovalDialog"
    :filing="selectedFiling"
    @approved="onFilingApproved"
    @rejected="onFilingRejected"
    @cancelled="onFilingCancelled"
  />
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted } from "vue";
import { defineAsyncComponent } from 'vue';
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { date } from "quasar";
import { useTimekeepingStore } from "src/stores/timekeeping.store";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const FilingApprovalDialog = defineAsyncComponent(() =>
  import('../../../../components/dialog/FilingApprovalDialog/FilingApprovalDialog.vue')
);

export default defineComponent({
  name: "PendingApprovalsDialog",
  components: {
    FilingApprovalDialog,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["update:modelValue", "filings-updated"],
  setup(props, { emit }) {
    const $q = useQuasar();
    const timekeepingStore = useTimekeepingStore();

    const dialogModel = computed({
      get: () => props.modelValue,
      set: (val) => emit("update:modelValue", val),
    });

    const statusTab = ref("pending");
    const loading = ref(false);
    const error = ref<string>("");
    const filings = ref<any[]>([]);
    const showApprovalDialog = ref(false);
    const selectedFiling = ref<any>(null);
    const selectedCutoffDateRangeId = ref("all");
    const meta = ref<any>({
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    const pagination = ref({
      page: 1,
      rowsPerPage: 20,
      rowsNumber: 0,
    });

    // Computed properties for cutoff date ranges
    const isDateRangeLoaded = computed(
      () => timekeepingStore.isTimekeepingDateRangeLoaded
    );
    const allDateRanges = computed(() => timekeepingStore.timekeepingDateRange);

    const cutoffOptions = computed(() => {
      const options = [{ value: "all", label: "All Cutoff Dates" }];

      allDateRanges.value.forEach((range) => {
        if (range.key && range.label) {
          options.push({
            value: range.key,
            label: range.label,
          });
        }
      });

      return options;
    });

    const columns = computed(() => {
      const baseColumns = [
        {
          name: "employee",
          label: "Requested By",
          field: (row: any) => formatFullName(row.account),
          align: "left" as const,
          sortable: true,
        },
        {
          name: "cutoffCode",
          label: "Cutoff",
          field: (row: any) =>
            row.account?.EmployeeData?.payrollGroup?.cutoff?.cutoffCode || "—",
          align: "center" as const,
          sortable: true,
        },
        {
          name: "type",
          label: "Type",
          field: "filingTypeLabel",
          align: "left" as const,
          sortable: true,
        },
        {
          name: "date",
          label: "Date",
          field: (row: any) => row.date || row.dateFrom || row.createdAt,
          align: "left" as const,
          sortable: true,
        },
        {
          name: "status",
          label: "Status",
          field: "status",
          align: "center" as const,
          sortable: true,
        },
        {
          name: "approver",
          label: "Approver",
          field: (row: any) =>
            row.account?.parent ? formatFullName(row.account.parent) : "",
          align: "left" as const,
          sortable: true,
        },
      ];

      // Add conditional columns based on status tab
      if (statusTab.value === "approved") {
        baseColumns.push({
          name: "approvedBy",
          label: "Approved By",
          field: (row: any) =>
            row.approvedBy ? formatFullName(row.approvedBy) : "",
          align: "left" as const,
          sortable: true,
        });
      } else if (statusTab.value === "rejected") {
        baseColumns.push({
          name: "rejectedBy",
          label: "Rejected By",
          field: (row: any) =>
            row.approvedBy ? formatFullName(row.approvedBy) : "",
          align: "left" as const,
          sortable: true,
        });
      }

      return baseColumns;
    });

    // Watch for tab changes to reset pagination and reload
    watch(statusTab, () => {
      pagination.value.page = 1;
      loadFilings();
    });

    // Watch for cutoff filter changes
    watch(selectedCutoffDateRangeId, () => {
      pagination.value.page = 1;
      loadFilings();
    });

    // Watch for dialog open/close
    watch(
      () => props.modelValue,
      async (newVal) => {
        if (newVal) {
          // Load cutoff date ranges if not loaded
          if (!isDateRangeLoaded.value) {
            await timekeepingStore.loadTimekeepingDateRange();
          }
          // Load filings when dialog opens
          loadFilings();
        }
      }
    );

    const totalPendingCount = computed(() => {
      // When viewing pending tab, use the total count from meta
      if (statusTab.value === "pending") {
        return meta.value.total;
      }
      // Otherwise, count pending items in current view
      return filings.value.filter((f) => {
        const statusKey = f.status?.toUpperCase() || "";
        return statusKey === "PENDING";
      }).length;
    });

    const loadFilings = async (props?: any) => {
      // Handle pagination request from q-table
      if (props && props.pagination) {
        pagination.value = props.pagination;
      }

      loading.value = true;
      error.value = "";

      try {
        const params: any = {
          page: pagination.value.page,
          limit: pagination.value.rowsPerPage,
        };

        // Add status filter
        if (statusTab.value !== "all") {
          params.status = statusTab.value;
        }

        // Add cutoff filter if not 'all'
        if (selectedCutoffDateRangeId.value !== "all") {
          params.cutoffDateRangeId = selectedCutoffDateRangeId.value;
        }

        const response = await api.get("/hr-filing/all-filings", {
          params,
        });

        if (response.data && response.data.data) {
          filings.value = response.data.data;
          meta.value = response.data.meta;

          // Update pagination with server response
          pagination.value.rowsNumber = response.data.meta.total;
        } else {
          filings.value = [];
          meta.value = {
            total: 0,
            page: 1,
            limit: pagination.value.rowsPerPage,
            totalPages: 0,
          };
        }
      } catch (err: any) {
        console.error("Error loading filings:", err);
        error.value = err.response?.data?.message || "Failed to load filings";
        $q.notify({
          type: "negative",
          message: error.value,
        });
      } finally {
        loading.value = false;
      }
    };

    const onRowClick = (_evt: Event, row: any) => {
      // Map the raw filing data to FilingDisplayData format
      const mappedFiling = {
        id: row.id,
        filingType: {
          label: row.filingTypeLabel || row.filingType || "",
        },
        account: row.account,
        accountId: row.accountId,
        date: row.date,
        timeIn: row.timeIn,
        timeOut: row.timeOut,
        hours: row.hours,
        remarks: row.remarks,
        rejectReason: row.rejectReason,
        file: row.file,
        fileId: row.fileId,
        status: row.status,
        createdAt: row.createdAt,
        shiftId: row.shiftId,
        // Leave specific
        leaveData: row.leaveData,
        // Schedule adjustment specific
        shiftData: row.shiftData,
        // Official business/COA specific
        purpose: row.purpose,
        destination: row.destination,
        // Approval info
        approvedBy: row.approvedBy,
        approvedAt: row.approvedAt,
      };

      selectedFiling.value = mappedFiling;
      showApprovalDialog.value = true;
    };

    const onFilingApproved = () => {
      loadFilings();
      $q.notify({
        type: "positive",
        message: "Filing approved successfully",
      });
      emit("filings-updated");
    };

    const onFilingRejected = () => {
      loadFilings();
      $q.notify({
        type: "positive",
        message: "Filing rejected",
      });
      emit("filings-updated");
    };

    const onFilingCancelled = () => {
      loadFilings();
      $q.notify({
        type: "positive",
        message: "Filing cancelled",
      });
      emit("filings-updated");
    };

    const formatDate = (dateStr: string) => {
      if (!dateStr) return "";
      return date.formatDate(dateStr, "MMM D, YYYY");
    };

    const formatTime = (timeStr: string) => {
      if (!timeStr) return "";
      return date.formatDate(timeStr, "h:mm A");
    };

    const formatFullName = (account: any) => {
      if (!account) return "";
      const lastName = account.lastName || "";
      const firstName = account.firstName || "";
      const middleName = account.middleName || "";

      if (!lastName && !firstName) return "";

      return middleName
        ? `${lastName}, ${firstName} ${middleName}`
        : `${lastName}, ${firstName}`;
    };

    const getInitials = (account: any) => {
      if (!account) return "?";
      const first = account.firstName?.[0] || "";
      const last = account.lastName?.[0] || "";
      return (first + last).toUpperCase() || "?";
    };

    const getTypeColor = (type: string) => {
      switch (type) {
        case "OVERTIME":
          return "primary";
        case "LEAVE":
          return "orange";
        case "SCHEDULE_ADJUSTMENT":
          return "teal";
        case "OFFICIAL_BUSINESS_FORM":
          return "blue";
        case "CERTIFICATE_OF_ATTENDANCE":
          return "green";
        default:
          return "grey";
      }
    };

    const getStatusColor = (status: any) => {
      const key = status?.toUpperCase() || "";
      switch (key) {
        case "PENDING":
          return "orange";
        case "APPROVED":
          return "positive";
        case "REJECTED":
          return "negative";
        default:
          return "grey";
      }
    };

    const getStatusLabel = (status: any) => {
      const key = status?.toUpperCase() || "";
      switch (key) {
        case "PENDING":
          return "Pending";
        case "APPROVED":
          return "Approved";
        case "REJECTED":
          return "Rejected";
        default:
          return status || "Unknown";
      }
    };

    // Initial load on mount if dialog is already open
    onMounted(async () => {
      if (props.modelValue) {
        // Load cutoff date ranges if not loaded
        if (!isDateRangeLoaded.value) {
          await timekeepingStore.loadTimekeepingDateRange();
        }
        // Load filings when dialog opens
        loadFilings();
      }
    });

    return {
      dialogModel,
      statusTab,
      loading,
      error,
      filings,
      totalPendingCount,
      columns,
      pagination,
      showApprovalDialog,
      selectedFiling,
      selectedCutoffDateRangeId,
      cutoffOptions,
      isDateRangeLoaded,
      loadFilings,
      onRowClick,
      onFilingApproved,
      onFilingRejected,
      onFilingCancelled,
      formatDate,
      formatTime,
      formatFullName,
      getInitials,
      getTypeColor,
      getStatusColor,
      getStatusLabel,
    };
  },
});
</script>

<style scoped lang="scss">
.pending-approvals-dialog {
  max-width: 1400px;
  width: 100%;
  margin: auto;
  height: 90vh;
  border-radius: 16px;
  background-color: var(--q-surface-container-high, #f6f2f6);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  background-color: var(--q-surface-container-high, #f6f2f6);
  padding: 16px 24px;
}

.dialog-content {
  flex: 1;
  overflow: hidden;
  background-color: var(--q-surface, #fffbff);
  display: flex;
  flex-direction: column;
}

// MD3 Tabs styling
.md3-tabs {
  :deep(.q-tab) {
    border-radius: 100px;
    margin: 0 4px;
    min-height: 40px;

    &.q-tab--active {
      background-color: var(--q-primary-container, #eaddff);
      color: var(--q-on-primary-container, #21005d);
    }
  }

  :deep(.q-tab__indicator) {
    display: none;
  }
}

.filings-table {
  height: 100%;

  :deep(.q-table__container) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  :deep(.q-table__middle) {
    flex: 1;
    overflow: auto;

    &::-webkit-scrollbar {
      height: 6px;
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: #d9d9d9;
      border-radius: 50px;
    }

    &::-webkit-scrollbar-track {
      background-color: #f4f4f4;
      border-radius: 50px;
    }
  }

  :deep(.q-table__bottom) {
    flex-shrink: 0;
    position: relative;
    z-index: 10;
  }

  :deep(thead tr th) {
    background-color: var(--q-surface-container, #f3edf7);
    color: var(--q-on-surface-variant, #49454e);
    font-weight: 500;
    border-bottom: 1px solid var(--q-outline, #e0e0e0);
  }

  :deep(tbody tr) {
    cursor: pointer;
    transition: background-color 200ms ease;

    &:hover {
      background-color: var(--q-surface-container-low, #f7f2fa);
    }
  }

  :deep(tbody tr td) {
    border-bottom: 1px solid var(--q-outline-variant, #f0f0f0);
    padding: 8px 16px;
  }

  :deep(thead tr th) {
    padding: 12px 16px;
    font-size: 0.875rem;
  }
}

.employee-cell {
  display: flex;
  align-items: center;
}

.empty-state-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

// Loading container
.loading-container {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--q-surface, #fffbff);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

// MD3 Select styling with rounded corners
.md3-select {
  :deep(.q-field__control) {
    background-color: var(--q-surface-container-highest, #e6e0e9);
    border-radius: 28px;
    padding-left: 20px;
    padding-right: 16px;

    &:hover {
      background-color: var(--q-surface-container-highest, #e6e0e9);
    }

    &:before {
      border: none;
    }

    &:after {
      display: none;
    }
  }

  :deep(.q-field__label) {
    color: var(--q-on-surface-variant, #49454e);
    padding-left: 0;
  }

  :deep(.q-field--focused .q-field__label) {
    color: var(--q-primary, #6750a4);
  }

  :deep(.q-field__native) {
    padding-left: 0;
  }

  :deep(.q-field__append) {
    padding-right: 8px;
  }
}

// MD3 Color classes
.surface-variant {
  background-color: var(--q-surface-variant, #e7e0ec);
}

.on-surface {
  color: var(--q-on-surface, #1c1b1f);
}

.on-surface-variant {
  color: var(--q-on-surface-variant, #49454e);
}

.primary-container {
  background-color: var(--q-primary-container, #eaddff);
}

.on-primary-container {
  color: var(--q-on-primary-container, #21005d);
}
</style>
