<template>
  <q-dialog @before-show="fetchData">
    <q-card class="inventory-dialog-card" v-if="isWarehouseInformationLoaded">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div class="text-title-medium">Inventory ({{ warehouseInformation.name }})</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <div
          class="actions text-right q-mb-md text-label-medium"
          v-if="
            ['PROJECT_WAREHOUSE', 'COMPANY_WAREHOUSE'].includes(
              warehouseInformation.warehouseType.key
            )
          "
        >
          <q-btn
            @click="openEditWarehouseDialog"
            dense
            no-caps
            class="q-mr-sm text-label-medium"
            size="12px"
            flat
            rounded
            color="primary"
          >
            <q-icon class="q-mr-xs" size="16px" name="edit"></q-icon>
            Edit Warehouse
          </q-btn>
          <q-btn
            @click="openTransferStocksDialog"
            dense
            no-caps
            class="q-mr-sm text-label-medium"
            size="12px"
            flat
            rounded
            color="primary"
          >
            <q-icon class="q-mr-xs" size="16px" name="local_shipping"></q-icon>
            Transfer Stocks
          </q-btn>
          <q-btn
            @click="openRefillWriteOffInventoryDialog('refill')"
            dense
            no-caps
            class="q-mr-sm text-label-medium"
            size="12px"
            flat
            rounded
            color="primary"
          >
            <q-icon
              class="q-mr-xs"
              size="16px"
              name="add_circle_outline"
            ></q-icon>
            Refill Inventory
          </q-btn>
          <q-btn
            @click="openRefillWriteOffInventoryDialog('writeoff')"
            dense
            no-caps
            class="q-mr-sm text-label-medium"
            size="12px"
            flat
            rounded
            color="primary"
          >
            <q-icon
              class="q-mr-xs"
              size="16px"
              name="remove_circle_outline"
            ></q-icon>
            Writeoff Inventory
          </q-btn>
        </div>

        <div class="row">
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

        <g-card class="dialog-card q-pa-md">
          <!-- Warehouse Information Tab -->
          <warehouse-information-tab
            v-if="activeTab == 'warehouse_information'"
            :warehouseInformation="warehouseInformation"
          />

          <!-- Inventory Tab -->
          <g-table
            v-if="activeTab == 'inventory'"
            class="text-body-small"
            @row-click="viewHistory"
            ref="gTable"
            :isClickableRow="true"
            tableKey="inventory"
            apiUrl="/inventory"
            :apiFilters="[{ warehouseId: warehouseInformation.id }]"
          >
          </g-table>

          <!-- Transactions Tab -->
          <g-table
            v-if="activeTab == 'transactions'"
            @row-click="openItemReceiptDialog"
            class="text-body-small"
            ref="gTable"
            :isClickableRow="true"
            tableKey="itemReceipt"
            apiUrl="/item-receipts"
            :apiFilters="[{ warehouseId: warehouseInformation.id }]"
          >
            <template v-slot:amount="props">
              <span
                :class="
                  props.data.type.itemImpact.includes(['deducting'])
                    ? 'text-red'
                    : ''
                "
                >{{ props.data.totalPayableAmount.formatCurrency }}</span
              >
            </template>
          </g-table>
        </g-card>
      </q-card-section>
    </q-card>

    <!-- Warehouse Iventory Transactions Dialog -->
    <warehouse-inventory-transactions-dialog
      v-if="itemId"
      v-model="isWarehouseInventoryTransactionsDialogVisible"
      :itemId="itemId"
      :warehouseId="warehouseInformation.id"
    />

    <!-- Refill Writeoff Inventory Dialog -->
    <refill-write-off-inventory-dialog
      @saveDone="reloadTable"
      v-if="isRefillWriteOffInventoryDialogVisible"
      :warehouseId="warehouseInformation.id"
      :dialogType="refillWriteOffInventoryDialogType"
      v-model="isRefillWriteOffInventoryDialogVisible"
    />

    <!-- Transfer Stocks Dialog -->
    <transfer-stocks-dialog
      @saveDone="reloadTable"
      v-if="isTransferStocksDialogVisible"
      :warehouseId="warehouseInformation.id"
      v-model="isTransferStocksDialogVisible"
    />

    <!-- Item Receipt Dialog -->
    <item-receipt
      v-if="isItemReceiptDialogVisible"
      v-model="isItemReceiptDialogVisible"
      :itemReceiptId="itemReceiptId"
    />

    <!-- Edit Warehouse Dialog -->
    <add-edit-warehouse-dialog
      v-if="isEditWarehouseDialogVisible"
      v-model="isEditWarehouseDialogVisible"
      :warehouseData="warehouseInformation"
      :warehouseType="warehouseInformation.warehouseType.key"
      @saveDone="onWarehouseUpdated"
    />
  </q-dialog>
</template>

<style scoped>
.inventory-dialog-card {
  width: 80vw;
  min-height: 60vh;
  max-width: 100vw;
}
</style>

<script>
import { api } from 'src/boot/axios';
import GTable from "../../../../components/shared/display/GTable.vue";
import GCard from "../../../../components/shared/display/GCard.vue";
import WarehouseInventoryTransactionsDialog from './AssetWarehouseInventoryTransactionsDialog.vue';
import RefillWriteOffInventoryDialog from "../../../../components/dialog/ItemTransactionsDialog/RefillWriteOffInventoryDialog.vue";
import TransferStocksDialog from "../../../../components/dialog/ItemTransactionsDialog/TransferStocksDialog.vue";
import WarehouseInformationTab from './AssetWarehouseInformationTab.vue';
import ItemReceipt from "../../../../components/dialog/ItemReceipt/ItemReceipt.vue";
import AddEditWarehouseDialog from './AssetAddEditWarehouseDialog.vue';

export default {
  name: 'WarehouseInformationDialog',
  components: {
    GTable,
    GCard,
    WarehouseInventoryTransactionsDialog,
    RefillWriteOffInventoryDialog,
    TransferStocksDialog,
    WarehouseInformationTab,
    ItemReceipt,
    AddEditWarehouseDialog,
  },
  props: {
    warehouseId: {
      type: [String, undefined],
      required: true,
    },
    initialActiveTab: {
      type: String,
      default: 'warehouse_information',
    },
  },
  data: () => ({
    warehouseInformation: {},
    refillWriteOffInventoryDialogType: 'refill',
    isRefillWriteOffInventoryDialogVisible: false,
    isTransferStocksDialogVisible: false,
    isWarehouseInformationLoaded: false,
    isWarehouseInventoryTransactionsDialogVisible: false,
    inventoryItems: [],
    itemReceiptId: null,
    isInventoryItemsLoaded: false,
    isItemReceiptDialogVisible: false,
    isEditWarehouseDialogVisible: false,
    itemId: null,
    activeTab: 'warehouse_information',
    tabList: [
      {
        key: 'warehouse_information',
        name: 'Warehouse Information',
        icon: 'info',
      },
      { key: 'inventory', name: 'Inventory', icon: 'inventory' },
      { key: 'transactions', name: 'Transactions', icon: 'receipt_long' },
    ],
  }),
  mounted() {},
  watch: {},
  methods: {
    openItemReceiptDialog(data) {
      this.itemReceiptId = data.id;
      this.isItemReceiptDialogVisible = true;
    },
    openTransferStocksDialog() {
      this.isTransferStocksDialogVisible = true;
    },
    openRefillWriteOffInventoryDialog(type) {
      this.refillWriteOffInventoryDialogType = type;
      this.isRefillWriteOffInventoryDialogVisible = true;
    },
    openEditWarehouseDialog() {
      this.isEditWarehouseDialogVisible = true;
    },
    async onWarehouseUpdated() {
      // Refresh warehouse information after update
      await this.fetchData();
      this.$emit('refetch');
    },
    viewHistory(data) {
      this.itemId = data.item.id;
      this.isWarehouseInventoryTransactionsDialogVisible = true;
    },
    async reloadTable() {
      this.$refs.gTable.refetch();
      this.$emit('refetch');
    },
    async fetchData() {
      this.activeTab = this.initialActiveTab;

      try {
        const response = await api.get(`/warehouse/${this.warehouseId}`);
        this.warehouseInformation = response.data;
        this.isWarehouseInformationLoaded = true;
      } catch (error) {
        console.error(error);
      }
    },
  },
};
</script>
