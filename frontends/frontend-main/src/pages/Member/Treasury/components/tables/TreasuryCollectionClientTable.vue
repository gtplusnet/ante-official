<template>
  <g-table
    :is-row-action-enabled="true"
    tableKey="collectionClient"
    apiUrl="client"
    ref="table"
  >
    <template v-slot:row-actions="props">
      <q-btn
        rounded
        class="q-mr-sm text-label-medium"
        @click="viewSummary(props.data)"
        no-caps
        color="primary"
        outline
      >
        <q-icon class="q-mr-sm" size="20px" name="visibility"></q-icon>
        View Project Breakdown
      </q-btn>
    </template>

    <template v-slot:totalCollectionBalance="props">
      <span class="text-body-small"
        >{{ props.data.totalCollected.formatCurrency }} /
        {{ props.data.totalCollectionBalance.formatCurrency }}</span
      >
    </template>
  </g-table>

  <!-- View Project Breakdown Dialog -->
  <ViewProjectBreakdownDialog
    :clientInformation="clientInformation"
    v-model="openViewProjectBreakdownDialog"
  />
</template>

<script>
import ViewProjectBreakdownDialog from "../../dialogs/TreasuryViewProjectBreakdownDialog.vue";
import GTable from "../../../../../components/shared/display/GTable.vue";

export default {
  name: 'CollectionLogsTable',
  components: {
    GTable,
    ViewProjectBreakdownDialog,
  },
  props: {},
  data: () => ({
    openViewProjectBreakdownDialog: false,
    clientInformation: null,
  }),
  methods: {
    viewSummary(data) {
      this.clientInformation = data;
      this.openViewProjectBreakdownDialog = true;
    },
  },
};
</script>
