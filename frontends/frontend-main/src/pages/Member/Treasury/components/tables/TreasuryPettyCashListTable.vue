<template>
  <g-table
    :is-row-action-enabled="false"
    tableKey="pettyCash"
    apiUrl="/petty-cash/table"
    :query="{ format: 'itemReceiptPurchaseOrderTreasury' }"
    :apiFilters="[{ type: ['PURCHASE_ORDER'] }]"
    ref="table"
  >
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
        class="text-label-medium"
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
import GTable from "../../../../../components/shared/display/GTable.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const PurchaseOrderDialog = defineAsyncComponent(() =>
  import("../../../../../components/dialog/ItemTransactionsDialog/PurchaseOrderDialog.vue")
);
const ItemReceipt = defineAsyncComponent(() =>
  import("../../../../../components/dialog/ItemReceipt/ItemReceipt.vue")
);
const PurchaseOrderPaymentDialog = defineAsyncComponent(() =>
  import("../../../../../pages/Member/Treasury/dialogs/TreasuryPurchaseOrderPaymentDialog.vue")
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
  mounted() {
    this.$bus.on('newSaveLiquidation', () => {
      // Use nextTick to ensure component is fully rendered
      this.$nextTick(() => {
        if (this.$refs.table && typeof this.$refs.table.refetch === 'function') {
          try {
            this.$refs.table.refetch();
          } catch (error) {
            console.warn('Error refreshing petty cash list table:', error);
          }
        }
      });
    });
  },
  beforeUnmount() {
    this.$bus.off('newSaveLiquidation');
  },
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
