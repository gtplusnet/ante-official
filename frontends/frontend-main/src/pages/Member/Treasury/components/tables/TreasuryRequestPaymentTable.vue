<template>
  <g-table
      :is-row-action-enabled="true"
    tableKey="rfp"
    apiUrl="/rfp/table"
    ref="table"
  >
    <!-- slot - actions -->
    <template v-slot:row-actions="props">
      <div>
        <div>
          <q-btn
            v-if="props.data.status.approveButton"
            rounded
            class="q-mr-sm"
            @click="approvePayment(props.data)"
            no-caps
            color="primary"
            unelevated
          >
            {{ props.data.status.approveButton }}
          </q-btn>
          <q-btn
            v-if="props.data.status.rejectButton"
            rounded
            @click="rejectPayment(props.data)"
            no-caps
            color="red"
            outline
          >
            {{ props.data.status.rejectButton }}
          </q-btn>
        </div>
      </div>
    </template>
  </g-table>

  <!-- Create Request Payment Dialog -->
  <CreateRequestForPaymentDialog
    @saveDone="this.$refs.table.refetch()"
    v-model="isRequestForPaymentDialogOpen"
  />

  <!-- Approve Payment Dialog -->
  <ApprovePaymentDialog
    @saveDone="this.$refs.table.refetch()"
    :approvePaymentData="approvePaymentData"
    v-model="openApprovePaymentDialog"
  />

  <!-- Reject Payment Dialog -->
  <RejectPaymentDialog
    @saveDone="this.$refs.table.refetch()"
    :rejectPaymentData="rejectPaymentData"
    v-model="openRejectPaymentDialog"
  />
</template>

<script>
import GTable from "../../../../../components/shared/display/GTable.vue";
import CreateRequestForPaymentDialog from '../../dialogs/TreasuryCreateRequestForPaymentDialog.vue';
import ApprovePaymentDialog from '../../dialogs/TreasuryApprovePaymentDialog.vue';
import RejectPaymentDialog from '../../dialogs/TreasuryRejectPaymentDialog.vue';

export default {
  name: 'RequestPaymentTable',
  components: {
    GTable,
    CreateRequestForPaymentDialog,
    ApprovePaymentDialog,
    RejectPaymentDialog,
  },
  props: {},
  data: () => ({
    isRequestForPaymentDialogOpen: false,
    openApprovePaymentDialog: false,
    openRejectPaymentDialog: false,
    approvePaymentData: null,
    rejectPaymentData: null,
  }),
  watch: {},
  methods: {
    approvePayment(data) {
      this.approvePaymentData = data;
      console.log(data.id.memo);
      this.openApprovePaymentDialog = true;
    },
    rejectPayment(data) {
      this.rejectPaymentData = data;
      this.openRejectPaymentDialog = true;
    },
    openCreateRequestPaymentDialog() {
      this.isRequestForPaymentDialogOpen = true;
    },
  },
};
</script>
