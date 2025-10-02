<template>
  <expanded-nav-page-container>
    <div class="page-head">
      <div class="title text-headline-small">Purchase Order</div>
    </div>
    <div class="bread-crumbs text-body-small">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_dashboard' }" />
        <q-breadcrumbs-el label="Asset Management" />
        <q-breadcrumbs-el label="Purchasing" />
        <q-breadcrumbs-el label="Purchase Order" />
      </q-breadcrumbs>
    </div>
    <div class="page-content">
      <div class="page-content-actions row justify-between">
        <div class="left"></div>
        <div class="right">
          <q-btn
            no-caps
            color="primary"
            rounded
            unelevated
            @click="openPurchaseOrderDialog"
            class="text-label-large"
          >
            <q-icon size="16px" name="add"></q-icon>
            Create Purchase Order
          </q-btn>
        </div>
      </div>
      <g-card class="q-pa-md q-mt-sm">
        <!-- purchase order table -->
        <g-table
          tableKey="itemReceiptPurchaseOrder"
          apiUrl="/item-receipts"
          :apiFilters="[{ type: ['PURCHASE_ORDER'] }]"
          class="text-body-small"
          ref="table"
        >
          <template v-slot:code="props">
            <span @click="openReceipt(props.data)" class="clickable-code">{{
              props.data.code
            }}</span>
          </template>
        </g-table>
      </g-card>
    </div>

    <!-- purchase order dialog -->
    <item-receipt
      v-model="isItemReceiptDialogOpen"
      v-if="itemReceiptId"
      :itemReceiptId="itemReceiptId"
      @close="this.$refs.table.refetch()"
    />
    
    <!-- Purchase Order Dialog -->
    <purchase-order-dialog
      v-if="isPurchaseOrderDialogOpen"
      @saveDone="$refs.table.refetch()"
      v-model="isPurchaseOrderDialogOpen"
    />
  </expanded-nav-page-container>
</template>

<script>
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import GTable from "../../../../components/shared/display/GTable.vue";
import GCard from "../../../../components/shared/display/GCard.vue";
import ItemReceipt from "../../../../components/dialog/ItemReceipt/ItemReceipt.vue";
import PurchaseOrderDialog from "../../../../components/dialog/ItemTransactionsDialog/PurchaseOrderDialog.vue";

export default {
  name: 'MemberAssetPurchaseOrder',
  components: {
    ExpandedNavPageContainer,
    ItemReceipt,
    PurchaseOrderDialog,
    GTable,
    GCard,
  },
  data: () => ({
    itemReceiptId: null,
    isItemReceiptDialogOpen: false,
    isPurchaseOrderDialogOpen: false,
  }),
  methods: {
    openPurchaseOrderDialog() {
      this.isPurchaseOrderDialogOpen = true;
    },
    openReceipt(data) {
      this.itemReceiptId = data.id;
      this.isItemReceiptDialogOpen = true;
    },
  },
};
</script>