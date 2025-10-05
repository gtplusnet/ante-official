<template>
  <div class="actions text-right q-mb-md" v-if="!readonly">
    <GButton icon="add" label="Create Logs" @click="() => showAddDialog()" />
  </div>
  <div>
    <g-table
      :isRowActionEnabled="true"
      tableKey="timekeepingRawLogs"
      apiUrl="/hris/timekeeping/raw-logs/table"
      ref="table"
      no-filter
      :query="{
        employeeAccountId: employeeAccountId,
        cutoffDateRangeId: cutoffDateRange.key,
      }"
    >
      <!-- slot - actions -->
      <template v-slot:row-actions="props">
        <q-btn color="grey-7" dense round flat icon="more_horiz">
          <q-menu auto-close dense>
            <q-list dense>
              <q-item @click="editLogs(props.data)" clickable v-close-popup>
                <q-item-section thumbnail> <q-icon class="q-ml-md" name="edit" /></q-item-section>
                <q-item-section class="text-label-medium">Edit Log</q-item-section>
              </q-item>
              <q-item @click="deleteLogs(props.data)" clickable v-close-popup>
                <q-item-section thumbnail> <q-icon class="q-ml-md" name="delete" /></q-item-section>
                <q-item-section class="text-label-medium">Delete Log</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </template>
    </g-table>
    <!-- Create Logs Dialog -->
    <PayrollTimeKeepingRawLogsCreateDialog :editData="editData as any" @simulation-completed="simulationCompleted" v-model="isRawLogsCreateDialogOpen" :employeeAccountId="employeeAccountId" :cutoffDateRange="cutoffDateRange" />
  </div>
</template>

<script lang="ts">
import { TimekeepingLogResponse } from "@shared/response";
import GTable from "../../../../components/shared/display/GTable.vue";
import { ref, Ref, defineAsyncComponent } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import GButton from 'src/components/shared/buttons/GButton.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const PayrollTimeKeepingRawLogsCreateDialog = defineAsyncComponent(() =>
  import('./PayrollTimeKeepingRawLogsCreateDialog.vue')
);

export default {
  name: 'PayrollTimeKeepingRawLogs',
  components: {
    GTable,
    PayrollTimeKeepingRawLogsCreateDialog,
    GButton,
  },
  props: {
    readonly: {
      type: Boolean,
      default: false,
    },
    employeeAccountId: {
      type: String,
      required: true,
    },
    cutoffDateRange: {
      type: Object,
      required: true,
    },
  },
  emits: ['simulation-completed'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const table = ref<{ refetch: () => void } | null>(null);
    const editData: Ref<TimekeepingLogResponse | null> = ref(null);
    const isRawLogsCreateDialogOpen: Ref<boolean> = ref(false);
    const deleteLogs = (data: TimekeepingLogResponse) => {
      $q.dialog({
        title: 'Delete Log',
        message: 'Are you sure you want to delete this log?',
        cancel: true,
        persistent: true,
      }).onOk(() => {
        callDeleteAPI(data.id);
      });
    };

    const callDeleteAPI = (id: number) => {
      $q.loading.show({ message: 'Deleting log...' });

      api
        .delete(`/hris/timekeeping/raw-logs/delete?id=${id}`)
        .then(() => {
          $q.notify({
            type: 'positive',
            message: 'Log deleted successfully',
          });

          emit('simulation-completed');

          if (table.value) {
            table.value.refetch();
          }
        })
        .catch((error) => {
          $q.notify({
            type: 'negative',
            message: `Error deleting log: ${error.message}`,
          });
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const editLogs = (data: TimekeepingLogResponse) => {
      editData.value = data;
      isRawLogsCreateDialogOpen.value = true;
    };

    const showAddDialog = () => {
      editData.value = null;
      isRawLogsCreateDialogOpen.value = true;
    };

    const simulationCompleted = () => {
      if (table.value) {
        table.value.refetch();
      }

      emit('simulation-completed');
    };

    return {
      deleteLogs,
      editLogs,
      callDeleteAPI,
      simulationCompleted,
      showAddDialog,
      editData,
      table,
      isRawLogsCreateDialogOpen,
    };
  },
};
</script>
