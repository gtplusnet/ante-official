<template>
  <div class="list-table-wrapper">
    <div v-if="loading" class="row justify-center q-pa-lg">
      <q-spinner color="primary" size="3em" />
    </div>
    <div v-else-if="filteredData.length === 0" class="text-center q-pa-lg text-grey">No action items found</div>
    <table v-else class="attendance-list">
      <thead>
        <tr>
          <th class="text-left">Date</th>
          <th class="text-left">Description</th>
          <th class="text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in filteredData" :key="row.id">
          <td class="text-grey text-label-large">{{ formatDate(row.date) }}</td>
          <td :class="row.hasConflict ? 'text-dark text-label-large' : 'text-grey text-label-large'">{{ row.description }}</td>
          <td>
            <div class="action-buttons">
              <GButton v-if="row.hasConflict" class="btn" label="Resolve" @click="handleResolveConflict(row)"/>
              <GButton v-else label="Timesheet" class="btn" variant="outline" @click="handleViewTimesheet(row)"/>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue';
import GButton from 'src/components/shared/buttons/GButton.vue';
import { useQuasar } from 'quasar';
import { AttendanceConflictsService, AttendanceConflictAction } from 'src/services/attendance-conflicts.service';

export default defineComponent({
  name: 'AttendanceListView',
  components: {
    GButton,
  },
  props: {
    attendanceData: {
      type: Array,
      default: () => [],
    },
    pagination: {
      type: Object,
      default: () => ({
        currentPage: 1,
        totalItems: 0,
        itemsPerPage: 10,
      }),
    },
  },
  emits: ['refresh'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const loading = ref(false);
    const resolveLoading = ref(false);

    const filteredData = computed(() => {
      // Use the paginated data passed from parent component
      return props.attendanceData;
    });

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    };

    const handleResolveConflict = async (row) => {
      try {
        resolveLoading.value = true;
        console.log('Resolving conflict for:', row);

        // Call the conflicts API to resolve the conflict
        await AttendanceConflictsService.ignoreConflict(row.id, AttendanceConflictAction.RESOLVED);
        
        $q.notify({
          type: 'positive',
          message: 'Conflict resolved successfully',
          position: 'top-right',
        });

        // Emit refresh event to parent to reload the data
        emit('refresh');
      } catch (error) {
        console.error('Failed to resolve conflict:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to resolve conflict',
          position: 'top-right',
        });
      } finally {
        resolveLoading.value = false;
      }
    };

    const handleViewTimesheet = (row) => {
      console.log('Viewing timesheet for:', row);
      // You can add navigation to timesheet view here
      // For example: router.push(`/timesheet/${row.id}`);
    };

    return {
      loading,
      resolveLoading,
      filteredData,
      formatDate,
      handleResolveConflict,
      handleViewTimesheet,
    };
  },
});
</script>

<style scoped>
.list-table-wrapper {
  height: 388px;
}

.attendance-list {
  width: 100%;
  border-collapse: collapse;
  overflow: hidden;

  thead {
    tr {
      th {
        font-weight: 500;
        color: var(--q-text-dark);
        border-bottom: 1px solid #e0e0e0;
        padding: 12px 10px;
      }
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid #f0f0f0;

      td {
        padding: 10px;
      }
    }
  }
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn {
  min-width: 100px;
}
</style>
