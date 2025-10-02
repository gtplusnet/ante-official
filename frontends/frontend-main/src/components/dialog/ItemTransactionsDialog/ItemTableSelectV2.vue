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
      <tbody v-if="!isInitialItemLoading && itemData.length === 0">
        <tr>
          <td class="q-pa-md text-grey" :colspan="$refs.thead ? ($refs.thead as any).rows[0].cells.length : 7">No items added</td>
        </tr>
      </tbody>
      <tbody v-else-if="!isInitialItemLoading">
        <tr v-for="item in itemData" :key="item.itemId" :class="(item.itemName) ? 'active' : 'inactive'">
          <!-- item select -->
          <td>
            {{ item.itemName }}
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
            <q-input @keydown="numberOnly" @update:model-value="itemChange(item)" class="input description text-body-medium" v-model="item.rate" type="text"
              borderless dense></q-input>
          </td>

          <!-- amount -->
          <td>
            <span class="amount text-body-medium">{{ formatCurrency(item.amount) }}</span>
          </td>

          <!-- delete button -->
          <td @click="deleteItem(item)" class="delete">
            <q-icon class="text-red text-body-medium" size="20px" name="close"></q-icon>
          </td>
        </tr>
      </tbody>
      <tbody class="full-width text-center" v-else>
        <tr>
          <td class="q-pa-lg text-body-medium" :colspan="$refs.thead ? ($refs.thead as any).rows[0].cells.length : 7">
            <global-loader></global-loader>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="row justify-end q-mt-sm">
      <q-btn color="red" rounded outline @click="clearAll">
        <q-icon class="q-pr-xs" size="16px" name="close" />
        Clear All
      </q-btn>

      <q-btn color="primary" rounded outline @click="addItem">
        <q-icon class="q-pr-xs" size="16px" name="add" />
        Add Item
      </q-btn>
    </div>

    <!-- choose item dialog -->
    <choose-item-dialog @choose-item="chooseItem" v-model="isChooseItemDialogOpen" />
  </div>
</template>

<style src="./ItemTableSelect.scss" scoped></style>

<script lang="ts">
import GlobalLoader from "../../../components/shared/common/GlobalLoader.vue";
import ChooseItemDialog from "../../../components/dialog/ChooseItemDialog.vue";
import { ItemAdvanceDataResponse } from '@shared/response/item.response';
import { formatCurrency } from "../../../utility/formatter";
import { ref, Ref, PropType } from 'vue';
import { ItemTableSelectRequest } from '@shared/request/item.request';

interface InitialData {
  id: string;
  quantity: number;
  description: string;
  cost: number;
  boqKey?: number;
}

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
      type: Array as PropType<InitialData[]>,
      default: () => [],
    },
  },
  emits: ['update:modelValue', 'totalAmount'],
  setup(props, { emit }) {
    const itemData: Ref<ItemTableSelectRequest[]> = ref([]);
    const isInitialItemLoading: Ref<boolean> = ref(false);
    const isChooseItemDialogOpen: Ref<boolean> = ref(false);

    const numberOnly = (event: KeyboardEvent) => {
      if (!/^\d*\.?\d*$/.test(event.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)) {
        event.preventDefault();
      }
    };

    const itemChange = (item: ItemTableSelectRequest) => {
      setTimeout(() => {
        item.amount = item.rate * item.quantity;
        emitModelValue();
      }, 100);
    };

    const deleteItem = (item: ItemTableSelectRequest) => {
      itemData.value = itemData.value.filter((i) => i.itemId !== item.itemId);
      emitModelValue();
    };

    const addItem = () => {
      isChooseItemDialogOpen.value = true;
    };

    const clearAll = () => {
      itemData.value = [];
      emitModelValue();
    };

    const chooseItem = (item: ItemAdvanceDataResponse) => {
      const existingItem = itemData.value.find((i) => i.itemId === item.id);

      if (existingItem) {
        existingItem.quantity += 1;
        existingItem.amount = existingItem.rate * existingItem.quantity;
      } else {
        const rate = item.formattedEstimatedBuyingPrice.raw;
        const itemData: ItemTableSelectRequest = {
          itemId: item.id,
          itemName: item.name,
          quantity: 1,
          description: item.description,
          rate: rate,
          amount: rate * 1,
        }

        addItemToTable(itemData);
      }
    };

    const checkInitialData = () => {
      if (props.initialData.length > 0) {
        props.initialData.forEach((item: InitialData) => {
          const itemData: ItemTableSelectRequest = {
            itemId: item.id,
            itemName: item.description,
            quantity: item.quantity,
            description: item.description,
            rate: item.cost,
            amount: item.cost * item.quantity,
          }

          if (item.boqKey) {
            itemData.boqKey = item.boqKey;
          }

          addItemToTable(itemData);
        });
      }
    };

    const addItemToTable = (item: ItemTableSelectRequest) => {
      itemData.value.push(item);
      emitModelValue();
    };

    const emitModelValue = () => {
      // clear if quantity is 0 or lesser
      itemData.value = itemData.value.filter((item) => item.quantity > 0);

      emit('update:modelValue', itemData.value);
      emit('totalAmount', itemData.value.reduce((acc, item) => acc + item.amount, 0));
    };

    checkInitialData();

    return {
      itemData,
      isInitialItemLoading,
      isChooseItemDialogOpen,
      itemChange,
      deleteItem,
      addItem,
      clearAll,
      chooseItem,
      formatCurrency,
      numberOnly,
    };
  },
};
</script>
