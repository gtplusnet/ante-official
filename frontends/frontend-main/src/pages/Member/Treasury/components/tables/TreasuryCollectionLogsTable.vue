<template>
  <g-table
    :is-row-action-enabled="true"
    :apiFilters="[{ isForReview: false }]"
    tableKey="collectionLogsTable"
    apiUrl="collection/table"
    ref="table"
  >
    <template v-slot:row-actions="props">
      <q-btn
        rounded
        class="q-mr-sm text-label-medium"
        @click="receivePayment(props.data)"
        no-caps
        color="primary"
        outline
      >
        <q-icon class="q-mr-sm" size="20px" name="payments"></q-icon>
        Receive Payment
      </q-btn>
      <q-btn
        rounded
        class="q-mr-sm text-label-medium"
        @click="viewSummary(props.data)"
        no-caps
        color="primary"
        outline
      >
        <q-icon class="q-mr-sm" size="20px" name="details"></q-icon>
        View Details
      </q-btn>
    </template>
  </g-table>

  <!-- View Details Collection Project Dialog -->
  <ViewDetailsCollectionByProjectDialog
    :collectionData="collectionData"
    :projectInformation="projectInformation"
    v-model="openViewDetailCollectionProject"
    @close="openViewDetailCollectionProject = false"
  />

  <!-- Receive Payment Dialog -->
  <ReceivePaymentCollectionLogsTableDialog
    :collectionData="collectionData"
    @close="openReceivePaymentDialog = false"
    @saveDone="this.$refs.table.refetch()"
    v-model="openReceivePaymentDialog"
  />
</template>

<script>
import ViewDetailsCollectionByProjectDialog from '../../dialogs/TreasuryViewDetailsCollectionByProjectDialog.vue';
import GTable from "../../../../../components/shared/display/GTable.vue";
import ReceivePaymentCollectionLogsTableDialog from '../../dialogs/TreasuryReceivePaymentCollectionLogsTableDialog.vue';

export default {
  name: 'CollectionLogsTable',
  components: {
    GTable,
    ViewDetailsCollectionByProjectDialog,
    ReceivePaymentCollectionLogsTableDialog,
  },
  data: () => ({
    openReceivePaymentDialog: false,
    openViewDetailCollectionProject: false,
    projectInformation: null,
  }),
  methods: {
    receivePayment(data) {
      this.collectionData = data;
      this.openReceivePaymentDialog = true;
    },
    viewSummary(data) {
      this.openViewDetailCollectionProject = true;
      this.collectionData = data;
    },
  },
};
</script>
