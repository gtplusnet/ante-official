<template>
  <q-dialog @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="inventory" />
        <div v-if="supplierInformation" class="text-title-medium">{{ supplierInformation.name }}</div>
        <div v-else class="text-title-medium">Supplier Information</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section v-if="supplierInformation">
        <div class="row">
          <div class="item-tab">
            <div v-for="tab in tabList" :key="tab.column" class="tab text-label-medium" :class="tab.key == activeTab ? 'active' : ''"
              @click="activeTab = tab.key">
              <q-icon class="icon" :name="tab.icon"></q-icon>
              {{ tab.name }}
            </div>
          </div>
        </div>
        <g-card class="dialog-card q-pa-md">
          <!-- tab - supplier information -->
          <div v-if="activeTab == 'supplier_information'">
            <div class="row">
              <div class="col-8 left">
                <div class="information-card">
                  <div class="text-label-medium text-center q-mb-sm text-weight-medium">
                    Contact Information
                  </div>

                  <!-- contact name -->
                  <div class="info-group">
                    <div class="info-label text-label-medium">Contact Name</div>
                    <div class="info-value text-body-small">{{ supplierInformation.name }}</div>
                  </div>

                  <!-- contact number -->
                  <div class="info-group">
                    <div class="info-label text-label-medium">Contact Name</div>
                    <div class="info-value text-body-small">
                      {{ supplierInformation.contactNumber }}
                    </div>
                  </div>

                  <!-- email -->
                  <div class="info-group">
                    <div class="info-label text-label-medium">Email</div>
                    <div class="info-value text-body-small">
                      {{ supplierInformation.email }}
                    </div>
                  </div>

                  <!-- creation date -->
                  <div class="info-group">
                    <div class="info-label text-label-medium">Last Update</div>
                    <div class="info-value text-body-small">
                      {{ supplierInformation.updatedAt.dateFull }} ({{
                        supplierInformation.updatedAt.timeAgo
                      }})
                    </div>
                  </div>

                  <!-- last update -->
                  <div class="info-group">
                    <div class="info-label text-label-medium">Creation Date</div>
                    <div class="info-value text-body-small">
                      {{ supplierInformation.createdAt.dateFull }} ({{
                        supplierInformation.updatedAt.timeAgo
                      }})
                    </div>
                  </div>

                  <!-- location information -->
                  <div class="text-title-small text-center q-mt-lg q-mb-sm text-weight-medium">
                    Location Information
                  </div>

                  <div class="info-group">
                    <div class="info-label text-label-medium">Region</div>
                    <div class="info-value text-body-small">
                      {{ supplierInformation.location.region.name }} ({{
                        supplierInformation.location.region.description
                      }})
                    </div>
                  </div>
                  <div class="info-group">
                    <div class="info-label text-label-medium">Province</div>
                    <div class="info-value text-body-small">
                      {{ supplierInformation.location.province.name }}
                    </div>
                  </div>
                  <div class="info-group">
                    <div class="info-label text-label-medium">Municipality</div>
                    <div class="info-value text-body-small">
                      {{ supplierInformation.location.province.name }}
                    </div>
                  </div>
                  <div class="info-group">
                    <div class="info-label text-label-medium">Barangay</div>
                    <div class="info-value text-body-small">
                      {{ supplierInformation.location.barangay.name }}
                    </div>
                  </div>
                  <div class="info-group">
                    <div class="info-label text-label-medium">Location Name</div>
                    <div class="info-value text-body-small">
                      {{ supplierInformation.location.name }}
                    </div>
                  </div>
                  <div class="info-group">
                    <div class="info-label text-label-medium">Zip Code</div>
                    <div class="info-value text-body-small">
                      {{ supplierInformation.location.zipCode || '-' }}
                    </div>
                  </div>
                  <div class="info-group">
                    <div class="info-label text-label-medium">Landmark</div>
                    <div class="info-value text-body-small">
                      {{ supplierInformation.location.landmark || '-' }}
                    </div>
                  </div>

                  <div class="text-title-small text-center q-mt-lg q-mb-sm text-weight-medium">
                    Other Info
                  </div>

                  <!-- payment terms -->
                  <div class="info-group">
                    <div class="info-label text-label-medium">Payment Terms</div>
                    <div class="info-value text-body-small">
                      {{ supplierInformation.paymentTerms.label }}
                    </div>
                  </div>

                  <!-- tax type -->
                  <div class="info-group">
                    <div class="info-label text-label-medium">Tax Type</div>
                    <div class="info-value text-body-small">
                      {{ supplierInformation.taxType.label }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-4 right">
                <div class="label text-title-small text-center">QR Image</div>
                <div class="qr text-center q-mt-md">
                  <q-img width="150px" height="150px"
                    :src="`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${supplierInformation.id}`">
                  </q-img>
                </div>
              </div>
            </div>
          </div>

          <!-- tab - item price -->
          <div v-if="activeTab == 'item_price'">

            <g-table :isRowActionEnabled="true" class="text-body-small" tableKey="supplierItems" apiUrl="/supplier/items-table"
              :apiFilters="[{ supplierId: this.supplierId }]" ref="table">
              <template v-slot:row-actions="props">
                <q-btn rounded class="q-mr-sm text-label-medium" @click="checkItemPriceChangeHistory(props.data)" no-caps color="primary"
                  unelevated dense round>
                  <q-icon name="history" size="18px"></q-icon>
                </q-btn>

                <q-btn rounded class="q-mr-sm text-label-medium" @click="openAddSupplierOnItemDialog(props.data.item.id)" no-caps
                  color="primary" unelevated round dense>
                  <q-icon name="edit" size="18px"></q-icon>
                </q-btn>
              </template>
              <template v-slot:actions>
                <q-btn @click="openAddSupplierOnItemDialog()" no-caps color="primary" unelevated class="text-label-medium">
                  <q-icon name="add" size="18px"></q-icon>
                  Add Item
                </q-btn>
              </template>
            </g-table>
          </div>

          <!-- tab - purchase history -->
          <div v-if="activeTab == 'purchase_history'">
            <g-table @row-click="openItemReceiptDialog" v-if="supplierInformation" ref="gTable" :isClickableRow="true"
              class="text-body-small" tableKey="itemReceipt" apiUrl="/item-receipts" :apiFilters="[
                {
                  supplierId: supplierInformation.id,
                  type: ['PURCHASE_ORDER'],
                },
              ]">
              <template v-slot:amount="props">
                <span class="text-body-small" :class="props.data.type.itemImpact.includes(['deducting'])
                  ? 'text-red'
                  : ''
                  ">{{ props.data.totalPayableAmount.formatCurrency }}</span>
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
    <item-receipt v-if="isItemReceiptDialogVisible" v-model="isItemReceiptDialogVisible" ref="itemReceiptDialog"
      :itemReceiptId="itemReceiptId"></item-receipt>

    <!-- supplier item dialog -->
    <supplier-item-dialog @saveDone="this.$refs.table.refetch()" v-if="isSupplierItemDialogOpen"
      v-model="isSupplierItemDialogOpen" ref="supplierItemDialog" :supplierId="supplierId"
      :itemId="itemId"></supplier-item-dialog>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 900px;
  min-height: 600px;
}
</style>

<script>
import { api } from 'src/boot/axios';
import GCard from "../../../../../components/shared/display/GCard.vue";
import GTable from "../../../../../components/shared/display/GTable.vue";
import SupplierPriceUpdateHistoryDialog from "../../../../../components/dialog/SupplierPriceUpdateHistoryDialog.vue";
import ItemReceipt from "../../../../../components/dialog/ItemReceipt/ItemReceipt.vue";
import SupplierItemDialog from './SupplierItemDialog.vue';

export default {
  name: 'SupplierInformationDialog',
  components: {
    GCard,
    GTable,
    SupplierPriceUpdateHistoryDialog,
    SupplierItemDialog,
    ItemReceipt,
  },
  props: {
    supplierId: {
      type: Number,
      required: true,
    },
    initialActiveTab: {
      type: String,
      default: 'supplier_information',
    },
  },
  data: () => ({
    itemId: null,
    itemReceiptId: null,
    isItemReceiptDialogVisible: false,
    isPriceChangeHistoryDialogOpen: false,
    isSupplierItemDialogOpen: false,
    supplierInformation: null,
    activeTab: 'supplier_information',
    tabList: [
      {
        key: 'supplier_information',
        name: 'Supplier Information',
        icon: 'info',
      },
      { key: 'item_price', name: 'Item Price', icon: 'inventory' },
      {
        key: 'purchase_history',
        name: 'Purchase History',
        icon: 'receipt_long',
      },
    ],
  }),
  methods: {
    openAddSupplierOnItemDialog(itemId = null) {
      this.itemId = itemId;
      this.isSupplierItemDialogOpen = true;
    },
    openItemReceiptDialog(data) {
      this.itemReceiptId = data.id;
      this.isItemReceiptDialogVisible = true;
    },
    checkItemPriceChangeHistory(data) {
      this.itemId = data.item.id;
      this.isPriceChangeHistoryDialogOpen = true;
    },
    fetchData() {
      this.activeTab = 'supplier_information';

      api
        .get(`/supplier/${this.supplierId}`)
        .then((response) => {
          this.supplierInformation = response.data;
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });
    },
  },
};
</script>
