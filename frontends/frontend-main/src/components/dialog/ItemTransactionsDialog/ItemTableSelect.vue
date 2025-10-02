<template>
  <div class="item-table-select">
    <table>
      <thead ref="thead" class="text-title-small">
        <tr>
          <th width="400px">Item</th>
          <th width="80px">Qty</th>
          <th width="80px" v-if="warehouseId">Stock</th>
          <th>Description</th>
          <th width="250px">Rate</th>
          <th width="250px">Amount</th>
          <th width="40px"></th>

        </tr>
      </thead>
      <tbody v-if="!isInitialItemLoading">
        <tr v-for="item in itemData" :key="item.rowId"
          :class="(item.selectedItem || item.itemName) ? 'active' : 'inactive'">
          <!-- item select -->
          <td>
            <q-select v-if="!itemReceiptId" v-model="item.selectedItem" @update:model-value="itemChange(item, true)"
              :options="item.itemOptions" class="select-item text-body-medium" dense borderless flat use-input></q-select>
            <span v-else class="amount">{{ item.itemName }} ({{ item.itemSku }})</span>
          </td>

          <!-- quantity -->
          <td>
            <q-input @update:model-value="itemChange(item)" class="input quantity text-body-medium" v-model="item.quantity" type="number"
              borderless dense></q-input>
          </td>

          <!-- stock count -->
          <td v-if="warehouseId">
            <span class="stock text-body-medium">{{ item.stockCount || '0' }}</span>
          </td>

          <!-- description -->
          <td>
            <q-input @update:model-value="itemChange(item)" class="input description text-body-medium" v-model="item.description"
              type="text" borderless dense></q-input>
          </td>

          <!-- rate -->
          <td>
            <q-input @update:model-value="itemChange(item)" class="input description text-body-medium" v-model="item.rate" type="text"
              borderless dense></q-input>
          </td>

          <!-- amount -->
          <td>
            <span class="amount text-body-medium">{{ item.amountFormatted }}</span>
          </td>

          <!-- delete button -->
          <td @click="deleteItem(item)" class="delete">
            <q-icon class="text-red  text-body-medium" size="20px" name="close"></q-icon>
          </td>
        </tr>
      </tbody>
      <tbody class="full-width text-center" v-else>
        <tr>
          <td class="q-pa-lg" :colspan="$refs.thead ? $refs.thead.rows[0].cells.length : 7">
            <global-loader></global-loader>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="row justify-end q-mt-sm">
      <q-btn class="q-mr-sm text-label-large" color="red" rounded outline @click="addItem">
        <q-icon class="q-mb-xs q-mr-xs" size="16px" name="close" />
        Clear All
      </q-btn>

      <q-btn class="text-label-large" color="primary" rounded outline @click="addItem">
        <q-icon class="q-mb-xs q-mr-xs" size="16px" name="add" />
        Add Item
      </q-btn>
    </div>

    <!-- choose item dialog -->
    <choose-item-dialog @choose-item="chooseItem" v-model="isChooseItemDialogOpen" />
  </div>
</template>

<style src="./ItemTableSelect.scss" scoped></style>

<script>
import { api } from 'src/boot/axios';
import GlobalLoader from "../../../components/shared/common/GlobalLoader.vue";
import ChooseItemDialog from "../../../components/dialog/ChooseItemDialog.vue";

export default {
  name: 'ItemTableSelect',
  components: {
    GlobalLoader,
    ChooseItemDialog,
  },
  props: {
    warehouseId: {
      type: String,
      default: null,
    },
    itemReceiptId: {
      type: Number,
      default: null,
    },
    initialData: {
      type: Array,
      default: () => [],
    },
  },
  data: () => ({
    lastRowId: 0,
    totalAmount: 0,
    itemList: [],
    itemData: [],
    isInitialItemLoading: true,
    isChooseItemDialogOpen: false,
    receiptInformation: null,
  }),
  watch: {
    warehouseId: {
      immediate: true,
      handler() {
        if (this.warehouseId) {
          this.fetchItems();
        }
      },
    },
  },
  async mounted() {
    await this.fetchItems();

    if (this.itemReceiptId) {
      this.fetchInitialItems();
    }
    else {
      this.isInitialItemLoading = false;
    }

    if (this.initialData.length > 0) {
      this.itemData = this.initialData.map((item) => {
        return {
          rowId: this.lastRowId++,
          selectedItem: this.itemList.find((i) => i.id == item.id),
          quantity: item.quantity,
          itemOptions: JSON.parse(JSON.stringify(this.itemList)),
          description: item.description,
          rate: item.cost,
          amount: item.quantity * item.cost,
          amountFormatted: this.currencyFormat(item.quantity * item.cost),
          boqKey: item.boqKey,
        };
      });

      this.computeTotalAmount();
      this.emitModelValue();
    }

    this.addBlankItem();
  },
  methods: {
    addItem() {
      this.isChooseItemDialogOpen = true;
    },
    chooseItem(item) {
      // if item already exist, add quantity
      const existingItem = this.itemData.find((i) => i.selectedItem &&  i.selectedItem.id == item.id);

      if (existingItem) {
        existingItem.quantity += 1;
      }
      else {
        const selectedItem = this.itemList.find((i) => i.id == item.id);
        this.addNewItem(selectedItem);
      }
    },
    async fetchInitialItems() {
      // Fetch data here
      try {
        const response = await api.get('/item-receipts?id=' + this.itemReceiptId);
        this.receiptInformation = response.data;
        this.populateItems(this.receiptInformation.itemReceiptItemList);
      } catch (error) {
        this.handleAxiosError(error);
      } finally {
        this.isInitialItemLoading = false;
      }
    },
    populateItems(itemList) {
      this.itemData = itemList.map((item) => {
        return {
          rowId: this.lastRowId++,
          itemId: item.itemId,
          itemName: item.itemName,
          itemSku: item.itemSku,
          quantity: item.remainingQuantity,
          itemOptions: JSON.parse(JSON.stringify(this.itemList)),
          description: item.itemDescription,
          rate: item.itemRate.raw,
          amount: item.total.raw,
          amountFormatted: this.currencyFormat(item.total.raw),
        };
      });

      this.computeTotalAmount();
      this.emitModelValue();
    },
    async fetchItems() {
      const queryParams = {};

      // If warehouseId is provided, filter the items
      if (this.warehouseId) {
        queryParams.warehouseId = this.warehouseId;
      }

      const { data } = await api.get('/select-box/item-list', { params: queryParams });
      this.itemList = data.list;

      this.itemData.forEach((item) => {
        item.itemOptions = JSON.parse(JSON.stringify(this.itemList));

        if (item.selectedItem) {
          item.selectedItem = this.itemList.find((i) => i.id == item.selectedItem.id);
          this.itemChange(item);
        }
      });
    },
    itemChange(item, updateDescription = false) {
      setTimeout(() => {
        if (updateDescription) {
          item.description = item.selectedItem.description;
        }

        if (item.rate == 0) {
          item.rate = item.selectedItem.estimatedBuyingPrice;
        }

        item.amount = item.quantity * item.rate;

        if (item.selectedItem?.stockCount) {
          item.stockCount = item.selectedItem.stockCount.toLocaleString() || 0;
        }

        item.amountFormatted = this.currencyFormat(item.amount);

        if (this.lastRowId == item.rowId && item.selectedItem) {
          this.addBlankItem();
        }

        this.computeTotalAmount();

        this.emitModelValue()
      });
    },
    fillData() {
      if (!this.itemReceiptId) {
        this.itemData.pop();
        this.itemList.forEach((item) => {
          this.itemData.push(this.createItemData(item));
        })

        this.itemData.forEach((item) => {
          this.itemChange(item);
        });

        this.addBlankItem();
        this.computeTotalAmount();
        this.emitModelValue();
      }
    },
    emitModelValue() {
      let emitData = this.itemData.map((item) => {
        return {
          itemId: item.itemId || (item.selectedItem ? item.selectedItem.id : null),
          quantity: Number(item.quantity),
          description: item.description,
          rate: Number(item.rate),
          boqKey: item.boqKey,
        };
      });

      // Remove the last item if it is empty
      if (this.itemData[this.itemData.length - 1].selectedItem == null) {
        if (this.itemReceiptId == null) {
          emitData.pop();
        }
      }

      this.$emit('update:modelValue', emitData);
    },
    addNewItem(item) {
      this.itemData = this.itemData.filter((i) => i.rowId != this.lastRowId);

      this.itemData.push(this.createItemData(item));

      this.itemData.forEach((item) => {
        this.itemChange(item);
      });

      this.addBlankItem();
    },
    createItemData(item) {
      return {
        rowId: this.lastRowId++,
        selectedItem: item,
        quantity: 1,
        itemOptions: JSON.parse(JSON.stringify(this.itemList)),
        description: item.description,
        rate: item.estimatedBuyingPrice,
        amount: item.estimatedBuyingPrice,
        amountFormatted: this.currencyFormat(item.estimatedBuyingPrice),
      };
    },
    deleteItem(item) {
      if (this.lastRowId != item.rowId) {
        this.itemData = this.itemData.filter((i) => i.rowId != item.rowId);
        this.computeTotalAmount();

        if (this.itemData.length == 0) {
          this.addBlankItem();
        }
      }

      this.emitModelValue();
    },
    computeTotalAmount() {
      this.totalAmount = this.itemData.reduce((acc, item) => {
        return acc + (item.amount);
      }, 0);

      this.$emit('totalAmount', this.totalAmount);
    },
    addBlankItem() {
      this.lastRowId++;
      this.itemData.push({
        rowId: this.lastRowId,
        selectedItem: null,
        quantity: 1,
        itemOptions: JSON.parse(JSON.stringify(this.itemList)),
        description: '',
        rate: 0,
        amount: 0,
        amountFormatted: this.currencyFormat(0),
      });
    },
  },
};
</script>
