<template>
  <q-dialog @before-show="fetchData" transition-show="none">
    <q-card v-if="isWarehouseInformationLoaded" class="inventory-transaction-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div>Item Inventory Transactions ({{ warehouseInformation.name }} - {{ itemInformation.name }})</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <g-table ref="gTable" tableKey="inventoryHistory" apiUrl="/inventory/transactions"
          :apiFilters="[{ warehouseId: warehouseInformation.id, itemId: itemInformation.id }]">
          <template v-slot:quantity="props">
            <span :class="props.data.itemReceipt.type.itemImpact == 'deducting' ? 'text-red' : ''">{{
              (props.data.itemReceipt.type.itemImpact == 'deducting' ? '-' : '') + props.data.quantity
              }}</span>
          </template>

          <template v-slot:code="props">
            <span @click="openItemReceipt(props.data.itemReceipt.id)" class="clickable-code">{{
              props.data.itemReceipt.code }}</span>
          </template>

          <template v-slot:partnerCode="props">
            <span v-if="props.data.itemReceipt.partnerReceipt"
              @click="openItemReceipt(props.data.itemReceipt.partnerReceipt.id)" class="clickable-code">{{
                props.data.itemReceipt.partnerReceipt.code }}</span>
            <span v-else>-</span>
          </template>
        </g-table>
      </q-card-section>
    </q-card>
    <q-card style="padding: 30px" v-else>
      <global-loader />
    </q-card>

    <!-- Item Receipt Dialog -->
    <item-receipt v-model="isItemReceiptDialogVisible" v-if="itemReceiptId" :itemReceiptId="itemReceiptId" />
  </q-dialog>
</template>

<style scoped>
.inventory-transaction-card {
  width: 80vw;
  max-width: 950px;
}
</style>

<script>
import { api } from 'src/boot/axios';
import GTable from "../../../../components/shared/display/GTable.vue";
import GlobalLoader from "../../../../components/shared/common/GlobalLoader.vue";
import ItemReceipt from "../../../../components/dialog/ItemReceipt/ItemReceipt.vue";

export default {
  name: 'WarehouseInventoryTransactionsDialog',
  components: {
    GTable,
    GlobalLoader,
    ItemReceipt
  },
  props: {
    itemId: {
      type: String,
      required: true,
    },
    warehouseId: {
      type: String,
      required: true,
    },
  },
  data: () => ({
    itemReceiptId: null,
    warehouseInformation: null,
    itemInformation: null,
    isItemReceiptDialogVisible: false,
    isWarehouseInformationLoaded: false,
  }),
  watch: {
  },
  methods: {
    openItemReceipt(id) {
      this.itemReceiptId = id;
      this.isItemReceiptDialogVisible = true;
    },
    async fetchData() {
      this.isWarehouseInformationLoaded = false;
      const response = await Promise.all([
        api.get(`/warehouse/${this.warehouseId}`),
        api.get(`/items/${this.itemId}`),
      ]);
      this.warehouseInformation = response[0].data.data;
      this.itemInformation = response[1].data.data;
      this.isWarehouseInformationLoaded = true;
    },
  },
};
</script>
