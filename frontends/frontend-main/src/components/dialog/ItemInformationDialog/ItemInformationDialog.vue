<template>
  <q-dialog @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="inventory" />
        <div v-if="itemInformation" class="text-label-medium">{{ itemInformation.name }}</div>
        <div v-else>Item Information</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section v-if="itemInformation">
        <div class="row">
          <div class="item-tab">
            <div v-for="tab in tabList" :key="tab.column" class="tab" :class="tab.key == activeTab ? 'active' : ''"
              @click="activeTab = tab.key">
              <q-icon class="icon" :name="tab.icon"></q-icon>
              {{ tab.name }}
            </div>
          </div>
        </div>
        <g-card class="dialog-card q-pa-md">
          <!-- tab - item information -->
          <div v-if="activeTab == 'item_information'">
            <div class="row">
              <div class="col-8 left">
                <div class="information-card">
                  <div class="info-group">
                    <div class="info-label">Item Name</div>
                    <div class="info-value">
                      {{ itemInformation.name }}
                      <span @click="isEditDialogOpen = true" class="hyperlink"><q-icon size="16px"
                          name="edit"></q-icon></span>
                    </div>
                  </div>
                  <div class="info-group">
                    <div class="info-label">Item SKU</div>
                    <div class="info-value">{{ itemInformation.sku }}</div>
                  </div>

                  <div class="info-group">
                    <div class="info-label">Price Estimate</div>
                    <div class="info-value">
                      {{ itemInformation.estimatedBuyingPrice.formatCurrency }}
                    </div>
                  </div>

                  <div class="info-group">
                    <div class="info-label">Size</div>
                    <div class="info-value">
                      {{ itemInformation.size }} unit(s)
                    </div>
                  </div>

                  <div class="info-group">
                    <div class="info-label">Description</div>
                    <div class="info-value">
                      {{
                        itemInformation.estimatedBuyingPrice.description || '-'
                      }}
                    </div>
                  </div>

                  <div class="info-group">
                    <div class="info-label">Brand</div>
                    <div class="info-value">
                      {{ itemInformation.brand ? itemInformation.brand.name : 'No Brand' }}
                    </div>
                  </div>

                  <div class="info-group">
                    <div class="info-label">Category</div>
                    <div class="info-value">
                      {{ itemInformation.category ? itemInformation.category.name : 'No Category' }}
                    </div>
                  </div>

                  <div class="info-group">
                    <div class="info-label">Branch</div>
                    <div class="info-value">
                      {{ itemInformation.branch ? itemInformation.branch.name : 'No Branch' }}
                    </div>
                  </div>

                  <div class="info-group">
                    <div class="info-label">Last Update</div>
                    <div class="info-value">
                      {{ itemInformation.updatedAt.dateFull }} ({{
                        itemInformation.updatedAt.timeAgo
                      }})
                    </div>
                  </div>
                  <div class="info-group">
                    <div class="info-label">Creation Date</div>
                    <div class="info-value">
                      {{ itemInformation.createdAt.dateFull }} ({{
                        itemInformation.updatedAt.timeAgo
                      }})
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-4 right">



                <div class="label text-center">QR Image</div>
                <div class="qr text-center q-mt-md">
                  <q-img width="150px" height="150px"
                    :src="`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${itemInformation.sku}`">
                  </q-img>
                </div>
              </div>
            </div>
          </div>

          <!-- tab - warehouse inventories -->
          <div v-if="activeTab == 'warehouse_inventories'">
            <g-table ref="gTable" :isClickableRow="true" tableKey="inventoryPerWarehouse" apiUrl="/inventory"
              :apiFilters="[{ itemId }]">
            </g-table>
          </div>

          <!-- tab - supplier price -->
          <div v-if="activeTab == 'supplier_price'">
            <g-table :isRowActionEnabled="true" tableKey="supplierItems" apiUrl="/supplier/items-table"
              :apiFilters="[{ itemId: this.itemId }]" ref="table">
              <template v-slot:row-actions="props">
                <q-btn rounded class="q-mr-sm" @click="checkItemPriceChangeHistory(props.data)" no-caps color="primary"
                  flat>
                  <q-icon name="history" size="18px" class="q-mr-xs"></q-icon>
                </q-btn>
              </template>
            </g-table>
          </div>

          <!-- tab - purchase history -->
          <div v-if="activeTab == 'purchase_history'">
            <g-table ref="gTable" tableKey="purchaseHistory" apiUrl="/inventory/transactions" :apiFilters="[
              {
                itemId: itemId,
                type: 'PURCHASE_ORDER',
              },
            ]">
              <template v-slot:quantity="props">
                <span :class="props.data.itemReceipt.type.itemImpact == 'deducting'
                  ? 'text-red'
                  : ''
                  ">{{
                    (props.data.itemReceipt.type.itemImpact == 'deducting'
                      ? '-'
                      : '') + props.data.quantity
                  }}</span>
              </template>

              <template v-slot:code="props">
                <span @click="openItemReceipt(props.data.itemReceipt.id)" class="clickable-code">{{
                  props.data.itemReceipt.code }}</span>
              </template>

              <template v-slot:partnerCode="props">
                <span v-if="props.data.itemReceipt.partnerReceipt" @click="
                  openItemReceipt(props.data.itemReceipt.partnerReceipt.id)
                  " class="clickable-code">{{ props.data.itemReceipt.partnerReceipt.code }}</span>
                <span v-else>-</span>
              </template>
            </g-table>
          </div>
        </g-card>
      </q-card-section>
    </q-card>

    <!-- price update history dialog -->
    <supplier-price-update-history-dialog v-if="isPriceChangeHistoryDialogOpen" v-model="isPriceChangeHistoryDialogOpen"
      ref="priceUpdateHistoryDialog" :itemId="itemId" :supplierId="supplierId"></supplier-price-update-history-dialog>

    <!-- item receipt dialog -->
    <item-receipt v-if="isItemReceiptDialogVisible" v-model="isItemReceiptDialogVisible"
      :itemReceiptId="itemReceiptId"></item-receipt>

    <!-- item information dialog -->
    <item-create-edit-dialog @close="itemInformationUpdated" v-model="isEditDialogOpen"
      :itemInformation="itemInformation"></item-create-edit-dialog>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 900px;
  min-height: 500px;
}
</style>

<script>
import { defineAsyncComponent } from 'vue';
import { api } from 'src/boot/axios';
import GCard from "../../../components/shared/display/GCard.vue";
import GTable from "../../../components/shared/display/GTable.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const SupplierPriceUpdateHistoryDialog = defineAsyncComponent(() =>
  import('../SupplierPriceUpdateHistoryDialog.vue')
);
const ItemReceipt = defineAsyncComponent(() =>
  import('../ItemReceipt/ItemReceipt.vue')
);
const ItemCreateEditDialog = defineAsyncComponent(() =>
  import('../ItemCreateEditDialog/ItemCreateEditDialog.vue')
);

export default {
  name: 'ItemInformationDialog',
  components: {
    GCard,
    GTable,
    SupplierPriceUpdateHistoryDialog,
    ItemReceipt,
    ItemCreateEditDialog,
  },
  props: {
    itemId: {
      type: String,
      required: true,
    },
    initialActiveTab: {
      type: String,
      default: 'item_information',
    },
  },
  data: () => ({
    itemInformation: null,
    itemReceiptId: null,
    isItemReceiptDialogVisible: false,
    isEditDialogOpen: false,
    isPriceChangeHistoryDialogOpen: false,
    supplierId: null,
    activeTab: 'item_information',
    tabList: [
      { key: 'item_information', name: 'Item Information', icon: 'info' },
      {
        key: 'warehouse_inventories',
        name: 'Inventory per Warehouse',
        icon: 'inventory',
      },
      { key: 'supplier_price', name: 'Price per Supplier', icon: 'sell' },
      {
        key: 'purchase_history',
        name: 'Purchase History',
        icon: 'receipt_long',
      },
    ],
  }),
  methods: {
    itemInformationUpdated() {
      this.$emit('itemInformationUpdated');
      this.fetchData();
    },
    openItemReceipt(id) {
      this.itemReceiptId = id;
      this.isItemReceiptDialogVisible = true;
    },
    checkItemPriceChangeHistory(data) {
      this.supplierId = data.supplier.id;
      this.isPriceChangeHistoryDialogOpen = true;
    },
    fetchData() {
      this.activeTab = 'item_information';

      api
        .get(`/items/${this.itemId}`)
        .then((response) => {
          this.itemInformation = response.data;
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });
    },
  },
};
</script>
