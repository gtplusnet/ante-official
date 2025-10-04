<template>
  <expanded-nav-page-container>
    <div>
      <div class="page-head" style="padding-bottom: 24px">
        <div>
          <div class="text-title-large">Payroll Timekeeping</div>
          <div>
            <q-breadcrumbs class="text-body-small">
              <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
              <q-breadcrumbs-el label="Payroll" />
              <q-breadcrumbs-el label="Payroll Timekeeping" />
            </q-breadcrumbs>
          </div>
        </div>
      </div>

      <!-- Filter Section -->
      <div class="row q-mb-lg q-col-gutter-md">
        <div class="col-12 col-md-4">
          <q-select
            v-model="selectedCutoffCode"
            :options="cutoffCodeOptions"
            label="Filter by Cutoff Code"
            outlined
            dense
            emit-value
            map-options
          >
            <template v-slot:prepend>
              <q-icon name="filter_list" />
            </template>
          </q-select>
        </div>
        <div class="col-12 col-md-4">
          <q-select
            v-model="selectedPeriodType"
            :options="periodTypeOptions"
            label="Filter by Period Type"
            outlined
            dense
            emit-value
            map-options
          >
            <template v-slot:prepend>
              <q-icon name="date_range" />
            </template>
          </q-select>
        </div>
      </div>

      <!-- Table Section -->
      <div class="q-mt-md">
        <q-table
          :rows="filteredDateRanges"
          :columns="columns"
          row-key="key"
          :loading="!isDateRangeLoaded"
          :pagination="{ rowsPerPage: 10 }"
          flat
          bordered
          :row-class="(row: CutoffDateRangeResponse) => row.dateRangeStatus === 'Current' ? 'bg-green-1' : ''"
        >
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge
                :color="getStatusColor(props.row.dateRangeStatus)"
                :label="props.row.dateRangeStatus"
              />
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <GButton
                variant="text"
                label="View Timesheet"
                @click="viewTimesheet(props.row)"
              />
            </q-td>
          </template>

          <template v-slot:no-data>
            <div class="full-width text-center q-py-md text-grey-6">
              No cutoff date ranges available
            </div>
          </template>
        </q-table>
      </div>
    </div>

    <!-- Payroll Timesheet Dialog -->
    <PayrollTimesheetDialog
      v-if="selectedRowForTimesheet"
      v-model="isTimesheetDialogOpen"
      :selectedCutoffRange="selectedRowForTimesheet"
      @reload="handleTimesheetDialogReload"
    />
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent, ref, computed, onMounted, Ref } from 'vue';
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import { useTimekeepingStore } from '../../../../stores/timekeeping.store';
import { CutoffDateRangeResponse } from '@shared/response';
import { QTableColumn } from 'quasar';
import GButton from 'src/components/shared/buttons/GButton.vue';

// Lazy-loaded heavy dialog (TASK-008: Extended - Reduce initial bundle)
const PayrollTimesheetDialog = defineAsyncComponent(() =>
  import('../dialogs/payroll/PayrollTimesheetDialog.vue')
);

export default defineComponent({
  name: 'PayrollTimeKeepingMenuPageV2',
  components: {
    ExpandedNavPageContainer,
    PayrollTimesheetDialog,
    GButton,
  },
  setup() {
    const timekeepingStore = useTimekeepingStore();
    const selectedCutoffCode = ref('all');
    const selectedPeriodType = ref('all');

    // Dialog state
    const isTimesheetDialogOpen = ref(false);
    const selectedRowForTimesheet = ref<CutoffDateRangeResponse | null>(null);

    // Computed properties
    const isDateRangeLoaded: Ref<boolean> = computed(() => timekeepingStore.isTimekeepingDateRangeLoaded);
    const allDateRanges: Ref<CutoffDateRangeResponse[]> = computed(() => timekeepingStore.timekeepingDateRange);


    // Get unique cutoff codes for filter
    const cutoffCodeOptions = computed(() => {
      const uniqueCodes = new Set<string>();
      allDateRanges.value.forEach(range => {
        if (range.cutoffCode) {
          uniqueCodes.add(range.cutoffCode);
        }
      });

      const options = [{ value: 'all', label: 'All Cutoff Code' }];
      uniqueCodes.forEach(code => {
        options.push({ value: code, label: code });
      });

      return options;
    });

    // Period type options
    const periodTypeOptions = [
      { value: 'all', label: 'All Periods' },
      { value: 'first', label: 'First Period' },
      { value: 'middle', label: 'Middle Period' },
      { value: 'last', label: 'Last Period' },
    ];

    // Filter date ranges based on selected filters
    const filteredDateRanges = computed(() => {
      let filtered = allDateRanges.value;

      // Filter by cutoff code
      if (selectedCutoffCode.value !== 'all') {
        filtered = filtered.filter(range =>
          range.cutoffCode === selectedCutoffCode.value
        );
      }

      // Filter by period type
      if (selectedPeriodType.value !== 'all') {
        const periodTypeMap: Record<string, string> = {
          'first': 'FIRST_PERIOD',
          'middle': 'MIDDLE_PERIOD',
          'last': 'LAST_PERIOD'
        };

        const targetPeriodType = periodTypeMap[selectedPeriodType.value];
        if (targetPeriodType) {
          filtered = filtered.filter(range =>
            range.cutoffPeriodType?.key === targetPeriodType
          );
        }
      }

      return filtered;
    });

    // Table columns definition
    const columns: QTableColumn[] = [
      {
        name: 'status',
        required: true,
        label: 'Status',
        align: 'center',
        field: 'status',
        sortable: true,
      },
      {
        name: 'cutoffPeriod',
        required: true,
        label: 'Period',
        align: 'center',
        field: (row: CutoffDateRangeResponse) => {
          const periodType = row.cutoffPeriodType?.key;
          switch (periodType) {
            case 'FIRST_PERIOD':
              return '1st';
            case 'MIDDLE_PERIOD':
              return 'Middle';
            case 'LAST_PERIOD':
              return 'Last';
            default:
              return '-';
          }
        },
        sortable: true,
      },
      {
        name: 'startDate',
        required: true,
        label: 'Start Date',
        align: 'left',
        field: (row: CutoffDateRangeResponse) => row.startDate?.dateFull || '-',
        sortable: true,
      },
      {
        name: 'endDate',
        required: true,
        label: 'End Date',
        align: 'left',
        field: (row: CutoffDateRangeResponse) => row.endDate?.dateFull || '-',
        sortable: true,
      },
      {
        name: 'processDate',
        required: true,
        label: 'Process Date',
        align: 'left',
        field: (row: CutoffDateRangeResponse) => row.processingDate?.dateFull || '-',
        sortable: true,
      },
      {
        name: 'cutoffCode',
        required: true,
        label: 'Cutoff Code',
        align: 'left',
        field: (row: CutoffDateRangeResponse) => row.cutoffCode || '-',
        sortable: true,
      },
      {
        name: 'actions',
        label: 'Actions',
        align: 'center',
        field: 'actions',
      },
    ];

    // Methods
    const viewTimesheet = (row: CutoffDateRangeResponse) => {
      selectedRowForTimesheet.value = row;
      isTimesheetDialogOpen.value = true;
    };

    const handleTimesheetDialogReload = () => {
      // Reload data if needed when dialog actions complete
      if (!isDateRangeLoaded.value) {
        timekeepingStore.loadTimekeepingDateRange();
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Past Due':
          return 'grey';
        case 'Current':
          return 'green';
        case 'On Process':
          return 'red';
        default:
          return 'grey';
      }
    };

    // Load data on mount
    onMounted(async () => {
      if (!isDateRangeLoaded.value) {
        await timekeepingStore.loadTimekeepingDateRange();
      }
    });

    return {
      selectedCutoffCode,
      selectedPeriodType,
      isDateRangeLoaded,
      filteredDateRanges,
      cutoffCodeOptions,
      periodTypeOptions,
      columns,
      viewTimesheet,
      getStatusColor,
      // Dialog state
      isTimesheetDialogOpen,
      selectedRowForTimesheet,
      handleTimesheetDialogReload,
    };
  },
});
</script>
