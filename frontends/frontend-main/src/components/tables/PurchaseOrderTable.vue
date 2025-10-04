<template>
  <g-table
    :is-row-action-enabled="true"
    tableKey="itemReceiptPurchaseOrderTreasury"
    apiUrl="/item-receipts"
    :query="{ format: 'itemReceiptPurchaseOrderTreasury' }"
    :apiFilters="[{ type: ['PURCHASE_ORDER'] }]"
    ref="table"
  >
    <!-- slot - row actions -->
    <template v-slot:row-actions="props">
      <q-btn
        @click="openPurchaseOrderDialogPayment(props.data)"
        rounded
        color="primary"
        :key="props.data.id"
        unelevated
        no-caps
      >
        <q-icon class="q-mr-sm" size="16px" name="check"></q-icon>
        Create Payment</q-btn
      >
    </template>

    <!-- slot - delivery status -->
    <template v-slot:code="props">
      <span @click="openReceipt(props.data)" class="clickable-code">{{
        props.data.code
      }}</span>
    </template>

    <!-- slot - delivery status -->
    <template v-slot:delivery-status="props">
      <q-chip
        size="12px"
        v-if="props.data.delivery"
        :text-color="props.data.delivery.status.textColor"
        :label="`${props.data.delivery.status.label}`"
        :color="props.data.delivery.status.color"
      ></q-chip>
      <q-chip v-else>-</q-chip>
    </template>
  </g-table>

  <!-- Item Receipt Dialog -->
  <item-receipt
    v-model="isItemReceiptDialogVisible"
    v-if="itemReceiptId"
    :itemReceiptId="itemReceiptId"
  />

  <!-- Purchase Order Dialog -->
  <purchase-order-dialog
    @saveDone="$refs.table.refetch()"
    v-model="isPurchaseOrderDialogOpen"
  />

  <!-- Purchase Order Payment Dialog -->
  <purchase-order-payment-dialog
    @saveDone="$refs.table.refetch()"
    v-if="purchaseOrderId"
    :purchaseOrderId="purchaseOrderId"
    :balance="balance"
    v-model="isPurchaseOrderPaymentDialogOpen"
  />
</template>

<script>
import { defineAsyncComponent } from 'vue';
import GTable from "../../components/shared/display/GTable.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const PurchaseOrderDialog = defineAsyncComponent(() =>
  import("../../components/dialog/ItemTransactionsDialog/PurchaseOrderDialog.vue")
);
const ItemReceipt = defineAsyncComponent(() =>
  import("../../components/dialog/ItemReceipt/ItemReceipt.vue")
);
const PurchaseOrderPaymentDialog = defineAsyncComponent(() =>
  import("../../pages/Member/Treasury/dialogs/TreasuryPurchaseOrderPaymentDialog.vue")
);

export default {
  name: 'PurchaseOrderTable',
  components: {
    GTable,
    ItemReceipt,
    PurchaseOrderDialog,
    PurchaseOrderPaymentDialog,
  },
  props: {},
  data: () => ({
    balance: 0,
    itemReceiptId: null,
    isItemReceiptDialogVisible: false,
    purchaseOrderId: null,
    isPurchaseOrderPaymentDialogOpen: false,
    isPurchaseOrderDialogOpen: false,
  }),
  methods: {
    openPurchaseOrderDialogPayment(data) {
      this.purchaseOrderId = data.purchaseOrder.id;
      this.balance = data.purchaseOrder.balance.raw;
      this.isPurchaseOrderPaymentDialogOpen = true;
    },
    openReceipt(data) {
      this.itemReceiptId = data.id;
      this.isItemReceiptDialogVisible = true;
    },
    openPurchaseOrderDialog() {
      this.isPurchaseOrderDialogOpen = true;
    },
  },
};
</script>
