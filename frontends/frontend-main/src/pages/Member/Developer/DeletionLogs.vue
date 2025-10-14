<template>
  <div class="page-head">
    <div class="title text-title-large">Account Deletion Logs</div>
  </div>
  <div class="q-pa-md">
    <q-card>
      <q-card-section>
        <g-table
          ref="table"
          tableKey="accountDeletionLog"
          apiUrl="developer-account/deletion-logs"
          :isRowActionEnabled="true"
          class="text-body-small"
        >
          <template #body-cell-deletionType="{ data }">
            <q-badge
              :color="data.deletionType === 'soft' ? 'orange' : 'red'"
              :label="data.deletionType.toUpperCase()"
            />
          </template>

          <template #row-actions="{ data }">
            <q-btn
              flat
              dense
              icon="info"
              color="primary"
              size="sm"
              @click.stop="viewMetadata(data)"
            >
              <q-tooltip>View Details</q-tooltip>
            </q-btn>
          </template>
        </g-table>
      </q-card-section>
    </q-card>

    <!-- Metadata Dialog -->
    <q-dialog v-model="showMetadataDialog">
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">Deletion Details</div>
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-sm">
            <div><strong>Deleted Account:</strong> {{ selectedLog?.deletedUsername }}</div>
            <div><strong>Email:</strong> {{ selectedLog?.deletedEmail }}</div>
            <div><strong>Deleted By:</strong> {{ selectedLog?.deletedByUsername }}</div>
            <div><strong>Reason:</strong> {{ selectedLog?.reason }}</div>
            <div><strong>Type:</strong> {{ selectedLog?.deletionType }}</div>
            <div><strong>Date:</strong> {{ selectedLog?.deletedAt }}</div>

            <q-separator class="q-my-md" />

            <div><strong>Additional Metadata:</strong></div>
            <pre class="q-pa-sm bg-grey-2" style="border-radius: 4px;">{{ JSON.stringify(selectedLog?.metadata, null, 2) }}</pre>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import GTable from '../../../components/shared/display/GTable.vue';

export default defineComponent({
  name: 'DeletionLogs',
  components: { GTable },
  setup() {
    const table = ref();
    const showMetadataDialog = ref(false);
    const selectedLog = ref(null);

    const viewMetadata = (log: any) => {
      selectedLog.value = log;
      showMetadataDialog.value = true;
    };

    return {
      table,
      showMetadataDialog,
      selectedLog,
      viewMetadata,
    };
  },
});
</script>
