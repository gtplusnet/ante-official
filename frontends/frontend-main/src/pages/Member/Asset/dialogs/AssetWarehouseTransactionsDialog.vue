<template>
  <q-dialog @before-show="fetchData">
    <q-card class="inventory-dialog-card" v-if="isWarehouseInformationLoaded">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div>Transactions ({{ warehouseInformation.name }})</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <div class="actions text-right q-mb-md"
          v-if="['PROJECT_WAREHOUSE', 'COMPANY_WAREHOUSE'].includes(warehouseInformation.warehouseType)">
          <q-btn @click="openTransferStocksDialog" dense no-caps class="q-mr-sm" size="12px" flat rounded
            color="primary">
            <q-icon class="q-mr-xs" size="16px" name="local_shipping"></q-icon> Transfer Stocks
          </q-btn>
          <q-btn @click="openRefillWriteOffInventoryDialog('refill')" dense no-caps class="q-mr-sm" size="12px" flat
            rounded color="primary">
            <q-icon class="q-mr-xs" size="16px" name="add_circle_outline"></q-icon> Refill Inventory
          </q-btn>
          <q-btn @click="openRefillWriteOffInventoryDialog('writeoff')" dense no-caps class="q-mr-sm" size="12px" flat
            rounded color="primary">
            <q-icon class="q-mr-xs" size="16px" name="remove_circle_outline"></q-icon> Writeoff Inventory
          </q-btn>
        </div>
        <g-table @row-click="openItemReceiptDialog" ref="gTable" :isClickableRow="true" tableKey="itemReceipt"
          apiUrl="/item-receipts" :apiFilters="[{ warehouseId: warehouseInformation.id }]">
          <template v-slot:amount="props">
            <span :class="props.data.type.itemImpact.includes(['deducting']) ? 'text-red' : ''">{{
              props.data.totalPayableAmount.formatCurrency
            }}</span>
          </template>
        </g-table>
      </q-card-section>
    </q-card>

    <!-- Warehouse Iventory Transactions Dialog -->
    <warehouse-inventory-transactions-dialog v-if="itemId" v-model="isWarehouseInventoryTransactionsDialogVisible"
      :itemId="itemId" :warehouseId="warehouseInformation.id" />

    <!-- Refill Writeoff Inventory Dialog -->
    <refill-write-off-inventory-dialog @saveDone="reloadTable" v-if="isRefillWriteOffInventoryDialogVisible"
      :warehouseId="warehouseInformation.id" :dialogType="refillWriteOffInventoryDialogType"
      v-model="isRefillWriteOffInventoryDialogVisible" />

    <!-- Transfer Stocks Dialog -->
    <transfer-stocks-dialog @saveDone="reloadTable" v-if="isTransferStocksDialogVisible"
      :warehouseId="warehouseInformation.id" v-model="isTransferStocksDialogVisible" />

    <!-- Item Receipt Dialog -->
    <item-receipt v-if="isItemReceiptDialogVisible" v-model="isItemReceiptDialogVisible"
      :itemReceiptId="itemReceiptId" />
  </q-dialog>
</template>

<style scoped>
.inventory-dialog-card {
  width: 80vw;
  max-width: 800px;
}
</style>

<script>
import { api } from 'src/boot/axios';
import GTable from "../../../../components/shared/display/GTable.vue";
import WarehouseInventoryTransactionsDialog from './AssetWarehouseInventoryTransactionsDialog.vue';
import RefillWriteOffInventoryDialog from "../../../../components/dialog/ItemTransactionsDialog/RefillWriteOffInventoryDialog.vue";
import TransferStocksDialog from "../../../../components/dialog/ItemTransactionsDialog/TransferStocksDialog.vue";
import ItemReceipt from "../../../../components/dialog/ItemReceipt/ItemReceipt.vue";

export default {
  name: 'WarehouseTransactionsDialog',
  components: {
    GTable,
    WarehouseInventoryTransactionsDialog,
    RefillWriteOffInventoryDialog,
    TransferStocksDialog,
    ItemReceipt,
  },
  props: {
    warehouseId: {
      type: [String, undefined],
      required: true,
    },
  },
  data: () => ({
    warehouseInformation: {},
    refillWriteOffInventoryDialogType: 'refill',
    isRefillWriteOffInventoryDialogVisible: false,
    isTransferStocksDialogVisible: false,
    isWarehouseInformationLoaded: false,
    isWarehouseInventoryTransactionsDialogVisible: false,
    isItemReceiptDialogVisible: false,
    inventoryItems: [],
    isInventoryItemsLoaded: false,
    itemId: null,
    itemReceiptId: null,
  }),
  mounted() {
  },
  watch: {
  },
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
    viewHistory(data) {
      this.itemId = data.item.id;
      this.isWarehouseInventoryTransactionsDialogVisible = true;
    },
    async reloadTable() {
      this.$refs.gTable.refetch();
      this.$emit('refetch');
    },
    async fetchData() {
      try {
        const response = await api.get(`/warehouse/${this.warehouseId}`);
        this.warehouseInformation = response.data.data;
        this.isWarehouseInformationLoaded = true;
      } catch (error) {
        console.error(error);
      }
    },
  },
};
</script>
