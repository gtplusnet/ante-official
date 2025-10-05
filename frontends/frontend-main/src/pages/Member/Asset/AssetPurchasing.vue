<template>
  <asset-navigation>
    <q-page class="assets">
      <div class="page-head">
        <div class="title text-headline-small">Purchasing Management</div>
      </div>
      <div class="page-content">
      <div class="page-content-actions row justify-between">
        <div class="left">
          <div class="item-tab">
            <div
              v-for="tab in tabList"
              :key="tab.column"
              class="tab text-label-medium"
              :class="tab.key == activeTab ? 'active' : ''"
              @click="changeTab(tab.key)"
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
            @click="openPurchaseOrderDialog"
            class="text-label-large"
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
            @click="$refs.supplierTable.editSupplier()"
          >
            <q-icon size="16px" name="add"></q-icon>
            Add Supplier
          </q-btn>
        </div>
      </div>
      <g-card class="q-pa-md q-mt-sm">
        <!-- purchase request table -->
        <g-table
          :is-row-action-enabled="true"
          v-if="activeTab == 'purchase_request'"
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

        <!-- purchase order table -->
        <g-table
          v-if="activeTab == 'purchase_order'"
          tableKey="itemReceiptPurchaseOrder"
          apiUrl="/item-receipts"
          :query="{ format: 'itemReceiptPurchaseOrder' }"
          :apiFilters="[{ type: ['PURCHASE_ORDER'] }]"
          ref="table"
          class="text-body-small"
        >
          <template v-slot:code="props">
            <span @click="openReceipt(props.data)" class="clickable-code">{{
              props.data.code
            }}</span>
          </template>

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

        <!-- suppliers table -->
        <supplier-table
          ref="supplierTable"
          v-if="activeTab == 'suppliers'"
        ></supplier-table>
      </g-card>
    </div>
    <!-- Purchase Request Dialog -->
    <purchase-request-dialog
      @saveDone="$refs.table.refetch()"
      v-model="isPurchaseRequestDialogOpen"
    />

    <!-- Purchase Order Dialog -->
    <purchase-order-dialog
      @saveDone="$refs.table.refetch()"
      v-model="isPurchaseOrderDialogOpen"
    />

    <!-- Item Receipt Dialog -->
    <item-receipt
      v-model="isItemReceiptDialogVisible"
      v-if="itemReceiptId"
      :itemReceiptId="itemReceiptId"
    />

    <!-- Canvass Dialog -->
    <canvass-dialog
      @saveDone="$refs.table.refetch()"
      v-if="purchaseRequestId"
      :purchaseRequestId="purchaseRequestId"
      v-model="isCanvassDialogOpen"
    />

    <!-- Supplier Information Dialog -->
    <supplier-information-dialog
      v-if="supplierId"
      :supplierId="supplierId"
      v-model="isSupplierInformationDialogOpen"
    />

    <!-- Supplier Selection Dialog -->
    <supplier-selection-dialog
      @saveDone="$refs.table.refetch()"
      v-if="purchaseRequestId"
      :purchaseRequestId="purchaseRequestId"
      v-model="isSupplierSelectionDialogOpen"
    />
    </q-page>
  </asset-navigation>
</template>

<style scoped src="./AssetItem.scss"></style>

<script>
import { defineAsyncComponent } from 'vue';
import AssetNavigation from './AssetNavigation.vue';
import GTable from "../../../components/shared/display/GTable.vue";
import GCard from "../../../components/shared/display/GCard.vue";
import SupplierTable from "../../../components/tables/SupplierTable.vue";
import { api } from 'src/boot/axios';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const PurchaseRequestDialog = defineAsyncComponent(() =>
  import("../../../components/dialog/ItemTransactionsDialog/PurchaseRequestDialog.vue")
);
const PurchaseOrderDialog = defineAsyncComponent(() =>
  import("../../../components/dialog/ItemTransactionsDialog/PurchaseOrderDialog.vue")
);
const ItemReceipt = defineAsyncComponent(() =>
  import("../../../components/dialog/ItemReceipt/ItemReceipt.vue")
);
const CanvassDialog = defineAsyncComponent(() =>
  import('./dialogs/AssetCanvassDialog.vue')
);
const SupplierSelectionDialog = defineAsyncComponent(() =>
  import("../../../components/dialog/SupplierSelectionDialog.vue")
);
const SupplierInformationDialog = defineAsyncComponent(() =>
  import("./dialogs/AssetSupplierInformationDialog/SupplierInformationDialog.vue")
);

export default {
  name: 'MemberAssetPurchasing',
  components: {
    AssetNavigation,
    GTable,
    GCard,
    PurchaseRequestDialog,
    PurchaseOrderDialog,
    ItemReceipt,
    CanvassDialog,
    SupplierSelectionDialog,
    SupplierTable,
    SupplierInformationDialog,
  },
  props: {},
  data: () => ({
    form: {},
    itemReceiptId: null,
    isItemReceiptDialogVisible: false,
    isAddEditSupplierDialogOpen: false,
    purchaseRequestId: null,
    supplierId: null,
    tabList: [
      {
        key: 'purchase_request',
        name: 'Purchase Request',
        icon: 'shopping_cart',
      },
      { key: 'purchase_order', name: 'Purchase Order', icon: 'check' },
      { key: 'suppliers', name: 'Suppliers', icon: 'storefront' },
    ],
    isPurchaseRequestDialogOpen: false,
    isPurchaseOrderDialogOpen: false,
    isCanvassDialogOpen: false,
    isSupplierInformationDialogOpen: false,
    isSupplierSelectionDialogOpen: false,
  }),
  computed: {
    activeTab() {
      return this.$route.query.tab || 'purchase_request';
    }
  },
  watch: {
    '$route.query.tab'() {
      // Handle tab change if needed
      if (this.$refs.table) {
        this.$refs.table.refetch();
      }
      if (this.$refs.supplierTable) {
        this.$refs.supplierTable.refetch();
      }
    }
  },
  mounted() {},
  methods: {
    changeTab(tab) {
      this.$router.push({ 
        name: this.$route.name,
        query: { ...this.$route.query, tab }
      });
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
    openReceipt(data) {
      this.itemReceiptId = data.id;
      this.isItemReceiptDialogVisible = true;
    },
    openPurchaseRequestDialog() {
      this.isPurchaseRequestDialogOpen = true;
    },
    openPurchaseOrderDialog() {
      this.isPurchaseOrderDialogOpen = true;
    },
    async deleteSupplierRequest(data) {
      this.$q.loading.show();
      try {
        await api.delete(`supplier/${data.id}`);
        this.$refs.table.refetch();
      } catch (error) {}
      this.$q.loading.hide();
    },
  },
  computed: {},
};
</script>
