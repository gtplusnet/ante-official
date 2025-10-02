<template>
  <div>
    <g-table
      tableKey="attendanceConflicts"
      apiUrl="/hr/timekeeping/attendance-conflicts/employee-table"
      ref="table"
      no-filter
      :query="{
        employeeAccountId: employeeAccountId,
        cutoffDateRangeId: cutoffDateRange.key,
      }"
    >
      <!-- slot - badge for conflict type -->
      <template v-slot:badge="props">
        <q-badge
          :color="props.data.conflictType === 'MISSING_LOG' ? 'negative' : 'warning'"
          :label="formatConflictType(props.data.conflictType)"
        />
      </template>

      <!-- slot - status for resolution status -->
      <template v-slot:status="props">
        <q-badge
          :color="props.data.isResolved ? 'positive' : 'grey-6'"
          :label="props.data.isResolved ? 'Resolved' : 'Unresolved'"
        />
      </template>
    </g-table>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import GTable from "../../../../components/shared/display/GTable.vue";

export default {
  name: 'PayrollConflictsTab',
  components: {
    GTable,
  },
  props: {
    employeeAccountId: {
      type: String,
      required: true,
    },
    cutoffDateRange: {
      type: Object,
      required: true,
    },
  },
  setup() {
    const table = ref<{ refetch: () => void } | null>(null);

    const formatConflictType = (type: string) => {
      switch (type) {
        case 'MISSING_LOG':
          return 'Missing Log';
        case 'MISSING_TIME_OUT':
          return 'Missing Time Out';
        default:
          return type;
      }
    };

    return {
      table,
      formatConflictType,
    };
  },
};
</script>