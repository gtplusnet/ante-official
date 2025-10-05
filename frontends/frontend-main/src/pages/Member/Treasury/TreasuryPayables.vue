<template>
  <expanded-nav-page-container>
    <treasury-header></treasury-header>
    <div class="page-content">
      <div class="page-content-actions row justify-between">
        <div class="left">
          <div class="item-tab">
            <div
              v-for="tab in tabList"
              :key="tab.column"
              class="tab text-label-medium"
              :class="tab.key == activeTab ? 'active' : ''"
              @click="activeTab = tab.key"
            >
              <q-icon class="icon" :name="tab.icon"></q-icon>
              {{ tab.name }}
            </div>
          </div>
        </div>
        <div class="right">
          <q-btn
            v-if="activeTab == 'purchase_request'"
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

          <q-btn
            v-if="activeTab == 'purchase_order'"
            no-caps
            color="primary"
            rounded
            unelevated
            class="text-label-large"
            @click="this.$refs.purchaseOrderTable.openPurchaseOrderDialog()"
          >
            <q-icon size="16px" name="add"></q-icon>
            Create Purchase Order
          </q-btn>

          <q-btn
            v-if="activeTab == 'suppliers'"
            no-caps
            color="primary"
            rounded
            unelevated
            class="text-label-large"
            @click="this.$refs.supplierTable.editSupplier(null)"
          >
            <q-icon size="16px" name="add"></q-icon>
            Add Supplier
          </q-btn>

          <q-btn
            v-if="activeTab == 'request_for_payment'"
            no-caps
            color="primary"
            rounded
            unelevated
            class="text-label-large"
            @click="
              this.$refs.requestPaymentTable.openCreateRequestPaymentDialog()
            "
          >
            <q-icon size="16px" name="add"></q-icon>
            Request Payment
          </q-btn>
        </div>
      </div>
      <g-card class="q-pa-md q-mt-sm">
        <!-- purchase order table -->
        <PurchaseOrderTable
          ref="purchaseOrderTable"
          v-if="activeTab == 'purchase_order'"
        ></PurchaseOrderTable>

        <!-- suppliers table -->
        <supplier-table
          ref="supplierTable"
          v-if="activeTab == 'suppliers'"
        ></supplier-table>

        <!-- Request for Payment Table -->
        <RequestPaymentTable
          ref="requestPaymentTable"
          v-if="activeTab == 'request_for_payment'"
        >
        </RequestPaymentTable>
      </g-card>
    </div>
    <!-- Purchase Request Dialog -->
    <purchase-request-dialog
      @saveDone="$refs.table.refetch()"
      v-model="isPurchaseRequestDialogOpen"
    />

    <!-- Canvass Dialog -->
    <canvass-dialog
      @saveDone="$refs.table.refetch()"
      v-if="purchaseRequestId"
      :purchaseRequestId="purchaseRequestId"
      v-model="isCanvassDialogOpen"
    />
    <!-- Supplier Selection Dialog -->
    <supplier-selection-dialog
      @saveDone="$refs.table.refetch()"
      v-if="purchaseRequestId"
      :purchaseRequestId="purchaseRequestId"
      v-model="isSupplierSelectionDialogOpen"
    />
  </expanded-nav-page-container>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import TreasuryHeader from './TreasuryHeader.vue';
import GCard from "../../../components/shared/display/GCard.vue";
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';
import PurchaseOrderTable from "../../../components/tables/PurchaseOrderTable.vue";
import SupplierTable from "../../../components/tables/SupplierTable.vue";
import RequestPaymentTable from "../../../pages/Member/Treasury/components/tables/TreasuryRequestPaymentTable.vue";
import { api } from 'src/boot/axios';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const PurchaseRequestDialog = defineAsyncComponent(() =>
  import("../../../components/dialog/ItemTransactionsDialog/PurchaseRequestDialog.vue")
);
const CanvassDialog = defineAsyncComponent(() =>
  import("../../../pages/Member/Asset/dialogs/AssetCanvassDialog.vue")
);
const SupplierSelectionDialog = defineAsyncComponent(() =>
  import("../../../components/dialog/SupplierSelectionDialog.vue")
);

export default {
  name: 'MemberAssetPurchasing',
  components: {
    ExpandedNavPageContainer,
    TreasuryHeader,
    GCard,
    PurchaseRequestDialog,
    CanvassDialog,
    SupplierSelectionDialog,
    PurchaseOrderTable,
    SupplierTable,
    RequestPaymentTable,
  },
  props: {},
  data: () => ({
    form: {},
    activeTab: 'purchase_order',
    itemReceiptId: null,
    balance: 0,
    isItemReceiptDialogVisible: false,
    isAddEditSupplierDialogOpen: false,
    isPurchaseOrderPaymentDialogOpen: false,
    purchaseRequestId: null,
    purchaseOrderId: null,
    supplierId: null,
    tabList: [
      { key: 'purchase_order', name: 'Purchase Order', icon: 'check' },
      { key: 'suppliers', name: 'Suppliers', icon: 'storefront' },
      {
        key: 'request_for_payment',
        name: 'Request for Payment',
        icon: 'storefront',
      },
    ],
    isPurchaseRequestDialogOpen: false,
    isPurchaseOrderDialogOpen: false,
    isCanvassDialogOpen: false,
    isSupplierInformationDialogOpen: false,
    isSupplierSelectionDialogOpen: false,
  }),
  mounted() {},
  methods: {
    openSupplierInformation(data) {
      this.supplierId = data.id;
      this.isSupplierInformationDialogOpen = true;
    },
    confirmUpdatePurchaseRequestStatus(data) {
      if (data.purchaseRequest.status.key == 'SUPPLIER_SELECTION') {
        this.purchaseRequestId = data.purchaseRequest.id;
        this.isSupplierSelectionDialogOpen = true;
      } else if (data.purchaseRequest.status.key == 'CANVASSING') {
        this.purchaseRequestId = data.purchaseRequest.id;
        this.isCanvassDialogOpen = true;
      } else {
        this.$q
          .dialog({
            title: 'Confirm',
            message: `Are you sure you want to set delivery of <b>${data.code}</b> to ${data.purchaseRequest.status.nextStageLabel}?`,
            ok: 'Yes',
            cancel: 'No',
            html: true,
          })
          .onOk(() => {
            this.updatePurchaseRequestStatus(data);
          });
      }
    },
    async updatePurchaseRequestStatus(data) {
      try {
        const params = {
          purchaseRequestId: data.purchaseRequest.id,
          status: data.purchaseRequest.status.nextStage,
        };

        await api.post('purchase-order/request-update', params);
        this.$refs.table.refetch();
      } catch (error) {}
    },
    openPurchaseRequestDialog() {
      this.isPurchaseRequestDialogOpen = true;
    },
  },
  computed: {},
};
</script>
