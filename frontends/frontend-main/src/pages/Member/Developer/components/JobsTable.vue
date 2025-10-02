<template>
  <div>
    <q-table
      :rows="jobs"
      :columns="columns"
      row-key="id"
      flat
      bordered
      dense
      :pagination="pagination"
      :loading="loading"
      no-data-label="No jobs found"
    >
      <!-- Employee Name -->
      <template v-slot:body-cell-employee="props">
        <q-td :props="props">
          <div class="text-body2">{{ props.row.employeeName }}</div>
          <div class="text-caption text-grey">{{ props.row.employeeId }}</div>
        </q-td>
      </template>

      <!-- Device -->
      <template v-slot:body-cell-device="props">
        <q-td :props="props">
          <div class="text-body2">{{ props.row.deviceName }}</div>
        </q-td>
      </template>

      <!-- Date -->
      <template v-slot:body-cell-date="props">
        <q-td :props="props">
          {{ props.row.date }}
        </q-td>
      </template>

      <!-- Status -->
      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-badge
            :color="getStatusColor(props.row.status)"
            :label="props.row.status"
            class="text-capitalize"
          />
        </q-td>
      </template>

      <!-- Attempts -->
      <template v-slot:body-cell-attempts="props">
        <q-td :props="props">
          {{ props.row.attempts }} / {{ props.row.maxAttempts }}
        </q-td>
      </template>

      <!-- Processing Time -->
      <template v-slot:body-cell-processingTime="props">
        <q-td :props="props">
          {{ formatProcessingTime(props.row.processingTime) }}
        </q-td>
      </template>

      <!-- Created At -->
      <template v-slot:body-cell-createdAt="props">
        <q-td :props="props">
          {{ formatDateTime(props.row.createdAt) }}
        </q-td>
      </template>

      <!-- Actions -->
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            dense
            icon="visibility"
            color="primary"
            @click="viewDetails(props.row)"
          >
            <q-tooltip>View Details</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Job Details Dialog -->
    <q-dialog v-model="showDetailsDialog">
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center">
          <div class="text-h6">Job Details</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showDetailsDialog = false" />
        </q-card-section>

        <q-separator />

        <q-card-section v-if="selectedJob" class="q-pa-md">
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <div class="text-caption text-grey-7">Job ID</div>
              <div class="text-body2">{{ selectedJob.id }}</div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey-7">Status</div>
              <q-badge
                :color="getStatusColor(selectedJob.status)"
                :label="selectedJob.status"
                class="text-capitalize"
              />
            </div>
            <div class="col-6">
              <div class="text-caption text-grey-7">Employee</div>
              <div class="text-body2">{{ selectedJob.employeeName }}</div>
              <div class="text-caption">{{ selectedJob.employeeId }}</div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey-7">Device</div>
              <div class="text-body2">{{ selectedJob.deviceName }}</div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey-7">Date</div>
              <div class="text-body2">{{ selectedJob.date }}</div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey-7">Attempts</div>
              <div class="text-body2">{{ selectedJob.attempts }} / {{ selectedJob.maxAttempts }}</div>
            </div>
            <div class="col-12" v-if="selectedJob.processingTime">
              <div class="text-caption text-grey-7">Processing Time</div>
              <div class="text-body2">{{ formatProcessingTime(selectedJob.processingTime) }}</div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey-7">Created</div>
              <div class="text-body2">{{ formatDateTime(selectedJob.createdAt) }}</div>
            </div>
            <div class="col-6" v-if="selectedJob.processingStartedAt">
              <div class="text-caption text-grey-7">Started</div>
              <div class="text-body2">{{ formatDateTime(selectedJob.processingStartedAt) }}</div>
            </div>
            <div class="col-6" v-if="selectedJob.completedAt">
              <div class="text-caption text-grey-7">Completed</div>
              <div class="text-body2">{{ formatDateTime(selectedJob.completedAt) }}</div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" @click="showDetailsDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, PropType } from 'vue';
import { ManpowerComputeJob } from 'src/stores/manpowerQueue';

const props = defineProps({
  jobs: {
    type: Array as PropType<ManpowerComputeJob[]>,
    required: true,
  },
  status: {
    type: String as PropType<'pending' | 'processing' | 'completed' | 'failed'>,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const showDetailsDialog = ref(false);
const selectedJob = ref<ManpowerComputeJob | null>(null);

const pagination = ref({
  sortBy: 'createdAt',
  descending: true,
  page: 1,
  rowsPerPage: 10,
});

const columns = computed(() => {
  const baseColumns = [
    {
      name: 'employee',
      label: 'Employee',
      field: 'employeeName',
      align: 'left' as const,
      sortable: true,
    },
    {
      name: 'device',
      label: 'Device',
      field: 'deviceName',
      align: 'left' as const,
      sortable: true,
    },
    {
      name: 'date',
      label: 'Date',
      field: 'date',
      align: 'left' as const,
      sortable: true,
    },
    {
      name: 'status',
      label: 'Status',
      field: 'status',
      align: 'center' as const,
      sortable: true,
    },
  ];

  if (props.status === 'pending' || props.status === 'processing') {
    baseColumns.push({
      name: 'attempts',
      label: 'Attempts',
      field: 'attempts',
      align: 'center' as const,
      sortable: true,
    });
  }

  if (props.status === 'completed' || props.status === 'processing') {
    baseColumns.push({
      name: 'processingTime',
      label: 'Processing Time',
      field: 'processingTime',
      align: 'center' as const,
      sortable: true,
    });
  }

  baseColumns.push(
    {
      name: 'createdAt',
      label: 'Created At',
      field: 'createdAt',
      align: 'left' as const,
      sortable: true,
    },
    {
      name: 'actions',
      label: 'Actions',
      field: 'actions',
      align: 'center' as const,
      sortable: false,
    }
  );

  return baseColumns;
});

function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return 'orange';
    case 'processing': return 'blue';
    case 'completed': return 'green';
    case 'failed': return 'red';
    default: return 'grey';
  }
}

function formatProcessingTime(ms?: number) {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatDateTime(date?: string) {
  if (!date) return '-';
  return new Date(date).toLocaleString();
}

function viewDetails(job: ManpowerComputeJob) {
  selectedJob.value = job;
  showDetailsDialog.value = true;
}
</script>