<template>
  <expanded-nav-page-container>
    <div class="page-head">
      <div class="title text-headline-small">Purchase Request</div>
    </div>
    <div class="bread-crumbs text-body-small">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_dashboard' }" />
        <q-breadcrumbs-el label="Asset Management" />
        <q-breadcrumbs-el label="Purchasing" />
        <q-breadcrumbs-el label="Purchase Request" />
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
            class="text-label-large"
            @click="openPurchaseRequestDialog"
          >
            <q-icon size="16px" name="add"></q-icon>
            Create Purchase Request
          </q-btn>
        </div>
      </div>
      <g-card class="q-pa-md q-mt-sm">
        <!-- purchase request table -->
        <g-table
          :is-row-action-enabled="true"
          tableKey="itemReceiptPurchaseRequest"
          apiUrl="/item-receipts"
          :apiFilters="[{ type: ['PURCHASE_REQUEST'] }]"
          ref="table"
          class="text-body-small"
        >
          <template v-slot:code="props">
            <span @click="openReceipt(props.data)" class="clickable-code">{{
              props.data.code
            }}</span>
          </template>

          <!-- purchase request status -->
          <template v-slot:status="props">
            <template
              v-if="props.data.purchaseRequest.status.key != 'PURCHASE_ORDER'"
            >
              <q-chip
                size="12px"
                v-if="props.data.purchaseRequest"
                :text-color="props.data.purchaseRequest.status.textColor"
                :label="`${props.data.purchaseRequest.status.label}`"
                :color="props.data.purchaseRequest.status.color"
              ></q-chip>
              <q-chip v-else>-</q-chip>
            </template>
            <template v-else>
              <q-chip
                size="12px"
                v-if="props.data.purchaseRequest"
                text-color="white"
                :label="`${Number(
                  props.data.purchaseOrderStatus.paymentPercentage
                ).toFixed(2)}% Paid`"
                :color="
                  props.data.purchaseOrderStatus.paymentPercentage != 100
                    ? 'red'
                    : 'green'
                "
              ></q-chip>

              <q-chip
                size="12px"
                v-if="props.data.purchaseRequest"
                :text-color="
                  props.data.purchaseOrderStatus.deliveryStatus.textColor
                "
                :label="`${props.data.purchaseOrderStatus.deliveryStatus.label}`"
                :color="props.data.purchaseOrderStatus.deliveryStatus.color"
              ></q-chip>
            </template>
          </template>

          <template v-slot:purchase-request-status="props">
            <q-chip
              size="12px"
              v-if="props.data.delivery"
              :text-color="props.data.delivery.status.textColor"
              :color="props.data.delivery.status.color"
            ></q-chip>
            <q-chip v-else>-</q-chip>
          </template>

          <template v-slot:row-actions="props">
            <q-btn
              :disable="
                props.data.purchaseRequest.status.key == 'PURCHASE_ORDER'
              "
              rounded
              class="q-mr-sm"
              @click="confirmUpdatePurchaseRequestStatus(props.data)"
              no-caps
              color="primary"
              outline
            >
              <q-icon name="check" size="16px" class="q-mr-xs"></q-icon> Done
            </q-btn>
          </template>
        </g-table>
      </g-card>
    </div>

    <!-- purchase request dialog -->
    <item-receipt
      v-model="isItemReceiptDialogOpen"
      v-if="itemReceiptId"
      :itemReceiptId="itemReceiptId"
      @close="this.$refs.table.refetch()"
    />
    <supplier-selection-dialog
      v-if="isSupplierSelectionDialogOpen"
      @selection="confirmPurchaseSupplierSelection"
      :purchase-request-id="purchaseRequestId"
      v-model="isSupplierSelectionDialogOpen"
    />
    
    <!-- Purchase Request Dialog -->
    <purchase-request-dialog
      v-if="isPurchaseRequestDialogOpen"
      @saveDone="$refs.table.refetch()"
      v-model="isPurchaseRequestDialogOpen"
    />
  </expanded-nav-page-container>
</template>

<script>
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import GTable from "../../../../components/shared/display/GTable.vue";
import GCard from "../../../../components/shared/display/GCard.vue";
import ItemReceipt from "../../../../components/dialog/ItemReceipt/ItemReceipt.vue";
import SupplierSelectionDialog from "../../../../components/dialog/SupplierSelectionDialog.vue";
import PurchaseRequestDialog from "../../../../components/dialog/ItemTransactionsDialog/PurchaseRequestDialog.vue";

export default {
  name: 'MemberAssetPurchaseRequest',
  components: {
    ExpandedNavPageContainer,
    ItemReceipt,
    SupplierSelectionDialog,
    PurchaseRequestDialog,
    GTable,
    GCard,
  },
  data: () => ({
    itemReceiptId: null,
    isItemReceiptDialogOpen: false,
    purchaseRequestId: 0,
    isSupplierSelectionDialogOpen: false,
    isPurchaseRequestDialogOpen: false,
  }),
  methods: {
    confirmUpdatePurchaseRequestStatus(data) {
      if (data.purchaseRequest.status.key == 'SUPPLIER_SELECTION') {
        this.purchaseRequestId = data.purchaseRequest.id;
        this.isSupplierSelectionDialogOpen = true;
      } else {
        this.$q.dialog({
          title: 'Confirm update',
          message: `Move "${data.code}" to next stage`,
          cancel: true,
          persistent: true
        }).onOk(async () => {
          await this.$api.put(`/purchase-request/${data.purchaseRequest.id}/status`);
          this.$refs.table.refetch();
          this.$q.notify({
            type: 'positive',
            position: 'top',
            message: 'Purchase request status successfully updated',
          });
        });
      }
    },
    async confirmPurchaseSupplierSelection(suppliers) {
      await this.$api.put(`/purchase-request/${this.purchaseRequestId}/suppliers`, { suppliers });
      await this.$api.put(`/purchase-request/${this.purchaseRequestId}/status`);
      this.$refs.table.refetch();
      this.$q.notify({
        type: 'positive',
        position: 'top',
        message: 'Purchase request status successfully updated',
      });
    },
    openPurchaseRequestDialog() {
      this.isPurchaseRequestDialogOpen = true;
    },
    openReceipt(data) {
      this.itemReceiptId = data.id;
      this.isItemReceiptDialogOpen = true;
    },
  },
};
</script>