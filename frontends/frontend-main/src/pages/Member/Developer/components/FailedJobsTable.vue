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
      no-data-label="No failed jobs"
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

      <!-- Error -->
      <template v-slot:body-cell-error="props">
        <q-td :props="props">
          <div class="text-red text-caption" style="max-width: 300px; overflow: hidden; text-overflow: ellipsis">
            {{ props.row.error || 'Unknown error' }}
          </div>
        </q-td>
      </template>

      <!-- Attempts -->
      <template v-slot:body-cell-attempts="props">
        <q-td :props="props">
          <q-badge
            :color="props.row.attempts >= props.row.maxAttempts ? 'red' : 'orange'"
            :label="`${props.row.attempts} / ${props.row.maxAttempts}`"
          />
        </q-td>
      </template>

      <!-- Failed At -->
      <template v-slot:body-cell-failedAt="props">
        <q-td :props="props">
          {{ formatDateTime(props.row.completedAt) }}
        </q-td>
      </template>

      <!-- Actions -->
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            dense
            icon="info"
            color="primary"
            @click="$emit('view-error', props.row)"
            class="q-mr-xs"
          >
            <q-tooltip>View Error Details</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            icon="refresh"
            color="green"
            @click="$emit('retry', props.row)"
            class="q-mr-xs"
          >
            <q-tooltip>Retry Job</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            icon="delete"
            color="red"
            @click="$emit('delete', props.row)"
          >
            <q-tooltip>Delete Job</q-tooltip>
          </q-btn>
        </q-td>
      </template>

      <!-- No data slot -->
      <template v-slot:no-data>
        <div class="full-width row flex-center text-grey-7 q-py-lg">
          <q-icon name="check_circle" size="48px" color="green" class="q-mr-md" />
          <div>
            <div class="text-h6">No Failed Jobs</div>
            <div class="text-body2">All jobs processed successfully</div>
          </div>
        </div>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { ref, PropType } from 'vue';
import { ManpowerComputeJob } from 'src/stores/manpowerQueue';

defineProps({
  jobs: {
    type: Array as PropType<ManpowerComputeJob[]>,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits<{
  'retry': [job: ManpowerComputeJob];
  'delete': [job: ManpowerComputeJob];
  'view-error': [job: ManpowerComputeJob];
}>();

const pagination = ref({
  sortBy: 'completedAt',
  descending: true,
  page: 1,
  rowsPerPage: 10,
});

const columns = [
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
    name: 'error',
    label: 'Error',
    field: 'error',
    align: 'left' as const,
    sortable: false,
  },
  {
    name: 'attempts',
    label: 'Attempts',
    field: 'attempts',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'failedAt',
    label: 'Failed At',
    field: 'completedAt',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'actions',
    label: 'Actions',
    field: 'actions',
    align: 'center' as const,
    sortable: false,
  },
];

function formatDateTime(date?: string) {
  if (!date) return '-';
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(date).toLocaleString();
}
</script>