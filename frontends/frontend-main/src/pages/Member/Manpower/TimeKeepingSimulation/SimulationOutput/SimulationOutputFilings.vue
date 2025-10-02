<template>
  <div class="filings-container">
    <div v-if="loading" class="text-center q-pa-md">
      <q-spinner color="primary" size="40px" />
    </div>

    <div v-else-if="!hasFilings" class="text-center text-grey q-pa-md text-label-medium">
      No filings found for this date
    </div>

    <div v-else>
      <!-- Overtime Filings -->
      <div v-if="overtimeFilings.length > 0" class="filing-section">
        <div class="filing-type-header text-title-medium">Overtime Filings</div>
        <q-table
          :rows="overtimeFilings"
          :columns="overtimeColumns"
          row-key="id"
          flat
          dense
          :pagination="{ rowsPerPage: 0 }"
          hide-bottom
          @row-click="showFilingDetails"
        >
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="getStatusColor(props.value)" :label="props.value" />
            </q-td>
          </template>
        </q-table>
      </div>

      <!-- Leave Filings -->
      <div v-if="leaveFilings.length > 0" class="filing-section">
        <div class="filing-type-header text-title-medium">Leave Filings</div>
        <q-table
          :rows="leaveFilings"
          :columns="leaveColumns"
          row-key="id"
          flat
          dense
          :pagination="{ rowsPerPage: 0 }"
          hide-bottom
          @row-click="showFilingDetails"
        >
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="getStatusColor(props.value)" :label="props.value" />
            </q-td>
          </template>
        </q-table>
      </div>

      <!-- Schedule Adjustment Filings -->
      <div v-if="scheduleAdjustmentFilings.length > 0" class="filing-section">
        <div class="filing-type-header text-title-medium">Schedule Adjustment Filings</div>
        <q-table
          :rows="scheduleAdjustmentFilings"
          :columns="scheduleAdjustmentColumns"
          row-key="id"
          flat
          dense
          :pagination="{ rowsPerPage: 0 }"
          hide-bottom
          @row-click="showFilingDetails"
        >
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="getStatusColor(props.value)" :label="props.value" />
            </q-td>
          </template>
        </q-table>
      </div>

      <!-- Official Business Filings -->
      <div v-if="officialBusinessFilings.length > 0" class="filing-section">
        <div class="filing-type-header text-title-medium">Official Business Filings</div>
        <q-table
          :rows="officialBusinessFilings"
          :columns="attendanceColumns"
          row-key="id"
          flat
          dense
          :pagination="{ rowsPerPage: 0 }"
          hide-bottom
          @row-click="showFilingDetails"
        >
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="getStatusColor(props.value)" :label="props.value" />
            </q-td>
          </template>
        </q-table>
      </div>

      <!-- Certificate of Attendance Filings -->
      <div v-if="certificateOfAttendanceFilings.length > 0" class="filing-section">
        <div class="filing-type-header text-title-medium">Certificate of Attendance Filings</div>
        <q-table
          :rows="certificateOfAttendanceFilings"
          :columns="attendanceColumns"
          row-key="id"
          flat
          dense
          :pagination="{ rowsPerPage: 0 }"
          hide-bottom
          @row-click="showFilingDetails"
        >
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="getStatusColor(props.value)" :label="props.value" />
            </q-td>
          </template>
        </q-table>
      </div>
    </div>

    <!-- Filing Details Dialog -->
    <FilingDetailsDialog
      v-model="isFilingDetailsDialogOpen"
      :filing="selectedFiling"
      @cancelled="onFilingCancelled"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { api } from 'src/boot/axios';
import FilingDetailsDialog from './FilingDetailsDialog.vue';
import { date } from 'quasar';
import { FilingResponse } from 'src/types/filing.types';

export default defineComponent({
  name: 'SimulationOutputFilings',
  components: {
    FilingDetailsDialog,
  },
  props: {
    employeeAccountId: {
      type: String,
      required: true,
    },
    date: {
      type: [Date, String],
      required: true,
    },
  },
  setup(props) {
    const loading = ref(true);
    const filings = ref<FilingResponse[]>([]);
    const selectedFiling = ref<FilingResponse | null>(null);
    const isFilingDetailsDialogOpen = ref(false);

    const overtimeColumns = [
      { name: 'id', label: 'ID', field: 'id', align: 'left' as const },
      { name: 'status', label: 'Status', field: (row: FilingResponse) => row.status.label, align: 'center' as const },
      { name: 'hours', label: 'Regular Hours', field: 'hours', align: 'center' as const },
      { name: 'nightDifferentialHours', label: 'ND Hours', field: 'nightDifferentialHours', align: 'center' as const },
      { name: 'timeIn', label: 'Time In', field: (row: FilingResponse) => row.timeIn ? date.formatDate(row.timeIn, 'hh:mm A') : '-', align: 'center' as const },
      { name: 'timeOut', label: 'Time Out', field: (row: FilingResponse) => row.timeOut ? date.formatDate(row.timeOut, 'hh:mm A') : '-', align: 'center' as const },
      { name: 'dateFiled', label: 'Date Filed', field: (row: FilingResponse) => date.formatDate(row.createdAt, 'MM/DD/YYYY'), align: 'center' as const },
    ];

    const leaveColumns = [
      { name: 'id', label: 'ID', field: 'id', align: 'left' as const },
      { name: 'status', label: 'Status', field: (row: FilingResponse) => row.status.label, align: 'center' as const },
      { name: 'hours', label: 'Hours', field: 'hours', align: 'center' as const },
      { name: 'remarks', label: 'Remarks', field: 'remarks', align: 'left' as const },
      { name: 'dateFiled', label: 'Date Filed', field: (row: FilingResponse) => date.formatDate(row.createdAt, 'MM/DD/YYYY'), align: 'center' as const },
    ];

    const scheduleAdjustmentColumns = [
      { name: 'id', label: 'ID', field: 'id', align: 'left' as const },
      { name: 'status', label: 'Status', field: (row: FilingResponse) => row.status.label, align: 'center' as const },
      { name: 'shiftType', label: 'Shift Type', field: (row: FilingResponse) => row.shiftData?.shiftType || '-', align: 'center' as const },
      { name: 'targetHours', label: 'Target Hours', field: (row: FilingResponse) => row.shiftData?.targetHours || '-', align: 'center' as const },
      { name: 'dateFiled', label: 'Date Filed', field: (row: FilingResponse) => date.formatDate(row.createdAt, 'MM/DD/YYYY'), align: 'center' as const },
    ];

    const attendanceColumns = [
      { name: 'id', label: 'ID', field: 'id', align: 'left' as const },
      { name: 'status', label: 'Status', field: (row: FilingResponse) => row.status.label, align: 'center' as const },
      { name: 'timeIn', label: 'Time In', field: (row: FilingResponse) => row.timeIn ? date.formatDate(row.timeIn, 'hh:mm A') : '-', align: 'center' as const },
      { name: 'timeOut', label: 'Time Out', field: (row: FilingResponse) => row.timeOut ? date.formatDate(row.timeOut, 'hh:mm A') : '-', align: 'center' as const },
      { name: 'remarks', label: 'Remarks', field: 'remarks', align: 'left' as const },
      { name: 'dateFiled', label: 'Date Filed', field: (row: FilingResponse) => date.formatDate(row.createdAt, 'MM/DD/YYYY'), align: 'center' as const },
    ];

    const overtimeFilings = computed(() => filings.value.filter(f => f.filingType.key === 'OVERTIME'));
    const leaveFilings = computed(() => filings.value.filter(f => f.filingType.key === 'LEAVE'));
    const scheduleAdjustmentFilings = computed(() => filings.value.filter(f => f.filingType.key === 'SCHEDULE_ADJUSTMENT'));
    const officialBusinessFilings = computed(() => filings.value.filter(f => f.filingType.key === 'OFFICIAL_BUSINESS_FORM'));
    const certificateOfAttendanceFilings = computed(() => filings.value.filter(f => f.filingType.key === 'CERTIFICATE_OF_ATTENDANCE'));

    const hasFilings = computed(() => filings.value.length > 0);

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Approved':
          return 'positive';
        case 'Rejected':
          return 'negative';
        case 'Cancelled':
          return 'grey';
        default:
          return 'warning';
      }
    };

    const loadFilings = async () => {
      try {
        loading.value = true;
        const response = await api.get('/hr-filing/filings', {
          params: {
            accountId: props.employeeAccountId,
            date: date.formatDate(props.date, 'YYYY-MM-DD'),
            limit: 100,
          },
        });
        filings.value = response.data.data || [];
      } catch (error) {
        console.error('Error loading filings:', error);
        filings.value = [];
      } finally {
        loading.value = false;
      }
    };

    const showFilingDetails = (evt: Event, row: FilingResponse) => {
      selectedFiling.value = row;
      isFilingDetailsDialogOpen.value = true;
    };

    const onFilingCancelled = () => {
      // Reload filings after cancellation
      loadFilings();
    };

    onMounted(() => {
      loadFilings();
    });

    return {
      loading,
      hasFilings,
      overtimeFilings,
      leaveFilings,
      scheduleAdjustmentFilings,
      officialBusinessFilings,
      certificateOfAttendanceFilings,
      overtimeColumns,
      leaveColumns,
      scheduleAdjustmentColumns,
      attendanceColumns,
      selectedFiling,
      isFilingDetailsDialogOpen,
      getStatusColor,
      showFilingDetails,
      onFilingCancelled,
    };
  },
});
</script>

<style scoped lang="scss">
.filings-container {
  padding: 16px 0;
}

.filing-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.filing-type-header {
  color: #1976d2;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 2px solid #1976d2;
}

:deep(.q-table tbody tr) {
  cursor: pointer;

  &:hover {
    background-color: #f5f5f5;
  }
}
</style>
