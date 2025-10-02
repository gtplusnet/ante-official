<template v-if="items">
  <template v-for="item in items" :key="item.id">
    <!-- Heading -->
    <tr @click.stop="showBillOfQuantityEditDialog(item)" v-if="item.type == 'HEADING'" :class="item.type">
      <td></td>
      <td></td>
      <td class="particulars" colspan="12">
        {{ item.numerals }}. {{ item.description }}
      </td>
      <q-menu touch-position context-menu>
        <q-list dense style="min-width: 100px">
          <q-item v-if="boqInformation.status != 'LOCKED'" clickable v-close-popup>
            <q-item-section @click="showBillOfQuantityAddDialog('inside', item)">Insert Breakdown Item</q-item-section>
          </q-item>
          <q-item v-if="boqInformation.status != 'LOCKED'" clickable v-close-popup>
            <q-item-section @click="showBillOfQuantityAddDialog('before', item)">Insert Item Above</q-item-section>
          </q-item>
          <q-item v-if="boqInformation.status != 'LOCKED'" clickable v-close-popup>
            <q-item-section @click="showBillOfQuantityAddDialog('after', item)">Insert Item Below</q-item-section>
          </q-item>
          <q-item v-if="boqInformation.status != 'LOCKED'" clickable v-close-popup>
            <q-item-section @click="deleteItem(item)">Delete Item</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </tr>

    <!-- Sub Heading -->
    <tr @click.stop="showBillOfQuantityEditDialog(item)" @dragleave="onDragLeave" @dragover="onDragOver"
      @dragenter="onDragEnter" @drop="onDrop(item)" v-if="item.type == 'SUBHEADING'" :class="item.type">
      <td :draggable="true" @dragstart="onDragStart(item)">{{ item.id }}</td>
      <td></td>
      <td colspan="12" class="particulars">
        <span v-for="count in item.generation - 1" :key="count" class="spacing">&nbsp;</span>
        {{ item.numerals }}. {{ item.description }}
      </td>
      <q-menu touch-position context-menu>
        <q-list dense style="min-width: 100px">
          <q-item v-if="boqInformation.status != 'LOCKED'" clickable v-close-popup>
            <q-item-section @click="showBillOfQuantityAddDialog('inside', item)">Insert Breakdown Item</q-item-section>
          </q-item>
          <q-item v-if="boqInformation.status != 'LOCKED'" clickable v-close-popup>
            <q-item-section @click="showBillOfQuantityAddDialog('before', item)">Insert Item Above</q-item-section>
          </q-item>
          <q-item v-if="boqInformation.status != 'LOCKED'" clickable v-close-popup>
            <q-item-section @click="showBillOfQuantityAddDialog('after', item)">Insert Item Below</q-item-section>
          </q-item>
          <q-item v-if="boqInformation.status != 'LOCKED'" clickable v-close-popup>
            <q-item-section @click="deleteItem(item)">Delete Item</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </tr>

    <!-- Item -->
    <tr @dragleave="onDragLeave" @dragover="onDragOver" @dragenter="onDragEnter" @drop="onDrop(item)"
      v-if="item.type == 'ITEM'" :class="(item.type) + ' ' + (item.isQuantityTakeOffItem ? 'qto-item' : '')">
      <td :draggable="true" @dragstart="onDragStart(item)">
        <input @click="addItemCheck(item)" v-model="item.checked" class="check q-ma-xs"
          v-if="item.itemId && boqInformation.status == 'LOCKED'" type="checkbox" />
      </td>
      <td>
        <div>
          <div class="mark" :style="`background-color: ${item.color}`"></div>
        </div>
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-color @change="changeColor(item)" v-model="item.color" default-view="palette" />
        </q-popup-proxy>
      </td>
      <td @click.stop="showBillOfQuantityEditDialog(item)" class="particulars">
        <span v-for="count in item.generation - 1" :key="count" class="spacing">&nbsp;</span>
        {{ item.numerals }}. {{ item.description }}
        <q-icon color="blue" v-if="item.itemId" name="star"></q-icon>
        <q-icon class="cursor-pointer" color="red" v-if="item.approvalStatus == 'PENDING'" name="warning"></q-icon>
      </td>
      <td v-if="item.type === 'ITEM' && boqInformation.status !== 'LOCKED'" class="text-center">
        <EditableCell
          :value="item.quantity"
          :item="item"
          field="quantity"
          align="text-center"
          @save="handleCellSave"
          @navigate="handleCellNavigate"
          @edit-start="handleEditStart"
        />
      </td>
      <td class="text-center" v-else>
        <span :class="item.quantityPurchased >= item.quantity ? 'text-green' : ''"  v-if="item.quantity && boqInformation.status == 'LOCKED' && item.itemId">{{ item.quantityPurchased }} of
          {{ item.quantity }}</span>
        <span v-else>{{ item.quantity }}</span>
      </td>
      <td class="text-center">
        {{ item.quantity ? item.materialUnit : null }}
      </td>
      <td v-if="item.type === 'ITEM' && boqInformation.status !== 'LOCKED'" class="text-right">
        <EditableCell
          :value="item.materialUnitCost"
          :item="item"
          field="materialUnitCost"
          :formatFn="(val) => numberFormat(val, false)"
          @save="handleCellSave"
          @navigate="handleCellNavigate"
          @edit-start="handleEditStart"
        />
      </td>
      <td class="text-right" v-else>
        {{ numberFormat(item.materialUnitCost, false) }}
      </td>
      <td class="text-right" :class="item.quantityTakeOffTotal > item.materialTotalCost ? 'text-red' : ''">
      {{ numberFormat(item.materialTotalCost)
        }}</td>
      <td class="text-center">
        <span v-if="item.children.length == 0 && !item.isQuantityTakeOffItem">{{ item.laborPercentageCost }}</span>
      </td>
      <td v-if="item.type === 'ITEM' && !item.isQuantityTakeOffItem && boqInformation.status !== 'LOCKED'" class="text-right">
        <EditableCell
          :value="item.laborUnitCost"
          :item="item"
          field="laborUnitCost"
          :isHighlighted="item.laborUnitCostDisplay == item.laborUnitCost"
          :formatFn="(val) => numberFormat(item.laborUnitCostDisplay, false)"
          @save="handleCellSave"
          @navigate="handleCellNavigate"
          @edit-start="handleEditStart"
        />
      </td>
      <td class="text-right" :class="item.laborUnitCostDisplay == item.laborUnitCost ? 'text-blue' : ''" v-else>
        <span v-if="!item.isQuantityTakeOffItem">{{ numberFormat(item.laborUnitCostDisplay, false) }}</span>
      </td>
      <td class="text-right" :class="item.laborUnitCostDisplay == item.laborUnitCost ? 'text-blue' : ''">
        <span v-if="!item.isQuantityTakeOffItem">{{ numberFormat(item.laborTotalCost) }}</span>
      </td>
      <td class="text-right">
        <span v-if="!item.isQuantityTakeOffItem">
          {{ numberFormat(item.directCost) }}
        </span>
      </td>
      <td v-if="item.type === 'ITEM' && !item.isQuantityTakeOffItem && boqInformation.status !== 'LOCKED'" class="text-center">
        <EditableCell
          :value="item.profitMarginPercentage"
          :item="item"
          field="profitMarginPercentage"
          align="text-center"
          @save="handleCellSave"
          @navigate="handleCellNavigate"
          @edit-start="handleEditStart"
        />
      </td>
      <td class="text-center" v-else>
        <!-- <span v-for="count in item.generation - 3" :key="count" class="spacing">&nbsp;</span> -->
        <span v-if="!item.isQuantityTakeOffItem">{{ item.profitMarginPercentage }}</span>
      </td>
      <td class="text-right">
        <!-- <span v-for="count in item.generation - 3" :key="count" class="spacing">&nbsp;</span> -->
        <span v-if="!item.isQuantityTakeOffItem">{{ numberFormat(item.profitMargin) }}</span>
      </td>

      <td class="text-right">
        <!-- <span v-for="count in item.generation - 3" :key="count" class="spacing">&nbsp;</span> -->
        <span v-if="!item.isQuantityTakeOffItem">{{ numberFormat(item.totalWithProfit) }}</span>
      </td>
      <q-menu touch-position context-menu>
        <q-list dense style="min-width: 100px">
          <q-item v-if="boqInformation.status != 'LOCKED'" clickable v-close-popup>
            <q-item-section @click="showBillOfQuantityEditDialog(item)">Edit Item</q-item-section>
          </q-item>
          <q-item v-if="boqInformation.status != 'LOCKED'" clickable v-close-popup>
            <q-item-section @click="showBillOfQuantityAddDialog('inside', item)">Insert Breakdown Item</q-item-section>
          </q-item>
          <q-item v-if="boqInformation.status != 'LOCKED'" clickable v-close-popup>
            <q-item-section @click="showBillOfQuantityAddDialog('before', item)">Insert Item Above</q-item-section>
          </q-item>
          <q-item v-if="boqInformation.status != 'LOCKED'" clickable v-close-popup>
            <q-item-section @click="showBillOfQuantityAddDialog('after', item)">Insert Item Below</q-item-section>
          </q-item>
          <q-item clickable v-close-popup v-if="showQuantityTakeOff(item)">
            <q-item-section @click="showQuantityTakeOffDialog(item)">Quantity Take Off</q-item-section>
          </q-item>
          <q-item v-if="boqInformation.status != 'LOCKED'" clickable v-close-popup>
            <q-item-section @click="deleteItem(item)">Delete Item</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </tr>

    <BillOfQuantityDialogItems :boqInformation="boqInformation" :boqId="boqId" v-if="item.children"
      :items="item.children" />

    <!-- Bill of Quantity Bottom Part - Heading -->
    <tr @click.stop="showBillOfQuantityEditDialog(item)" v-if="item.type == 'HEADING' && item.subTotalWithProfit"
      class="HEADING-BOTTOM" :class="item.type">
      <td></td>
      <td></td>
      <td class="particulars subtotal" colspan="11">Subtotal</td>
      <td class="text-right">{{ numberFormat(item.subTotalWithProfit) }}</td>
      <q-menu touch-position context-menu>
        <q-list dense style="min-width: 100px">
          <q-item v-if="boqInformation.status != 'LOCKED'" clickable v-close-popup>
            <q-item-section @click="showBillOfQuantityAddDialog('inside', item)">Insert Breakdown Item</q-item-section>
          </q-item>
          <q-item v-if="boqInformation.status != 'LOCKED'" clickable v-close-popup>
            <q-item-section @click="showBillOfQuantityAddDialog('before', item)">Insert Item Above</q-item-section>
          </q-item>
          <q-item v-if="boqInformation.status != 'LOCKED'" clickable v-close-popup>
            <q-item-section @click="showBillOfQuantityAddDialog('after', item)">Insert Item Below</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </tr>

    <!-- Bill of Quantity Bottom Part - Sub Heading -->
    <tr @click.stop="showBillOfQuantityEditDialog(item)" v-if="item.type == 'SUBHEADING' && item.subTotalWithProfit"
      :class="item.type">
      <td></td>
      <td></td>
      <td class="particulars subtotal" colspan="11"></td>
      <td class="text-right">{{ numberFormat(item.subTotalWithProfit) }}</td>
      <q-menu touch-position context-menu>
        <q-list dense style="min-width: 100px">
          <q-item clickable v-close-popup>
            <q-item-section v-if="boqInformation.status != 'LOCKED'"
              @click="showBillOfQuantityAddDialog('inside', item)">Insert Breakdown Item</q-item-section>
          </q-item>
          <q-item clickable v-close-popup>
            <q-item-section v-if="boqInformation.status != 'LOCKED'"
              @click="showBillOfQuantityAddDialog('before', item)">Insert Item Above</q-item-section>
          </q-item>
          <q-item clickable v-close-popup>
            <q-item-section v-if="boqInformation.status != 'LOCKED'"
              @click="showBillOfQuantityAddDialog('after', item)">Insert Item Below</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </tr>
  </template>
</template>
<style scoped src="./BillOfQuantityDialog.scss"></style>
<style scoped src="./BillOfQuantityDialogItems.scss"></style>
<script>
import { useUtilityStore } from "../../../stores/utility";
import { useSocketStore } from "../../../stores/socketStore";
import EditableCell from "../../../components/tables/EditableCell.vue";

export default {
  name: 'BillOfQuantityDialogItems',
  components: {
    EditableCell
  },
  data: () => ({
    utilityStore: useUtilityStore(),
    socketStore: useSocketStore(),
    editingItem: null,
    editingField: null,
    editValue: null,
  }),
  props: {
    items: Object,
    boqId: Number,
    boqInformation: Object,
  },
  methods: {
    editCell(item, field) {
      if (item.type === 'ITEM' && this.boqInformation.status !== 'LOCKED') {
        this.editingItem = item;
        this.editingField = field;
        this.editValue = item[field];
        this.$nextTick(() => {
          if (this.$refs.editInput) {
            this.$refs.editInput.focus();
            this.$refs.editInput.select();
          }
        });
      }
    },
    
    // Handler for the EditableCell component's save event
    handleCellSave({ item, field, value }) {
      // Create a copy of the current values
      const updateValue = {
        description: item.description,
        materialUnitCost: Number(item.materialUnitCost),
        laborUnitCost: Number(item.laborUnitCost),
        laborPercentageCost: Number(item.laborPercentageCost),
        quantity: Number(item.quantity),
        materialUnit: item.materialUnit,
        itemId: item.itemId ? item.itemId.id : 0, // Make sure to get the ID property if it exists
        profitMarginPercentage: Number(item.profitMarginPercentage),
      };
      
      // Update only the field being edited
      updateValue[field] = Number(value);
      
      const sendData = {
        message: 'BOQ_EDIT_ITEM',
        data: {
          boqId: this.boqInformation.id,
          params: {
            updateId: item.id,
            updateValue,
          },
        },
      };

      console.log('Sending BOQ update via socket:', sendData);
      // Use the socket store to emit the event directly
      this.socketStore.socket.emit('BOQ_EDIT_ITEM', sendData);
      
      // Also update the local item to reflect changes immediately
      item[field] = Number(value);
    },
    
    // Handler for the EditableCell component's edit-start event
    handleEditStart({ item, field }) {
      this.editingItem = item;
      this.editingField = field;
    },
    
    cancelEdit() {
      this.editingItem = null;
      this.editingField = null;
      this.editValue = null;
    },
    
    // Excel-like navigation methods
    // Handler for the EditableCell component's navigate event
    handleCellNavigate({ direction, item, field }) {
      this.findNextEditableCell(item, field, direction);
    },
    
    findNextEditableCell(currentItem, currentField, direction) {
      // Define the order of editable fields
      const editableFields = ['quantity', 'materialUnitCost', 'laborUnitCost', 'profitMarginPercentage'];
      
      // Find the index of the current field
      const currentFieldIndex = editableFields.indexOf(currentField);
      
      // Find all editable items (ITEM type and not locked)
      const allItems = this.getAllItems(this.items);
      const editableItems = allItems.filter(item => item.type === 'ITEM' && this.boqInformation.status !== 'LOCKED');
      
      // Find the index of the current item
      const currentItemIndex = editableItems.findIndex(item => item.id === currentItem.id);
      
      let nextItem, nextField;
      
      if (direction === 'right') {
        // Move to the next field in the same row
        if (currentFieldIndex < editableFields.length - 1) {
          nextItem = currentItem;
          nextField = editableFields[currentFieldIndex + 1];
        } else {
          // Move to the first field of the next row
          if (currentItemIndex < editableItems.length - 1) {
            nextItem = editableItems[currentItemIndex + 1];
            nextField = editableFields[0];
          }
        }
      } else if (direction === 'left') {
        // Move to the previous field in the same row
        if (currentFieldIndex > 0) {
          nextItem = currentItem;
          nextField = editableFields[currentFieldIndex - 1];
        } else {
          // Move to the last field of the previous row
          if (currentItemIndex > 0) {
            nextItem = editableItems[currentItemIndex - 1];
            nextField = editableFields[editableFields.length - 1];
          }
        }
      } else if (direction === 'down') {
        // Move to the same field in the next row
        if (currentItemIndex < editableItems.length - 1) {
          nextItem = editableItems[currentItemIndex + 1];
          nextField = currentField;
        }
      } else if (direction === 'up') {
        // Move to the same field in the previous row
        if (currentItemIndex > 0) {
          nextItem = editableItems[currentItemIndex - 1];
          nextField = currentField;
        }
      }
      
      // If we found a valid next cell, edit it
      if (nextItem && nextField) {
        this.editCell(nextItem, nextField);
      }
    },
    
    getAllItems(items) {
      // Recursively collect all items including children
      let allItems = [];
      
      if (!items) return allItems;
      
      for (const item of Object.values(items)) {
        allItems.push(item);
        if (item.children && Object.keys(item.children).length > 0) {
          allItems = allItems.concat(this.getAllItems(item.children));
        }
      }
      
      return allItems;
    },
    addItemCheck(item) {
      const checked = item.checked ? false : true;

      if (checked) {
        this.utilityStore.addBoqCheckedItems({
          id: item.itemId,
          quantity: (item.quantity - item.quantityPurchased),
          cost: item.materialUnitCost,
          description: item.description,
          boqKey: item.key,
        });
      } else {
        this.utilityStore.removeBoqCheckedItem(item.itemId);
      }
    },
    changeColor(item) {
      const sendData = {
        message: 'BOQ_CHANGE_COLOR',
        data: {
          boqId: this.boqId,
          params: {
            itemId: item.id,
            color: item.color,
          },
        },
      };

      this.socketStore.socket.emit('BOQ_CHANGE_COLOR', sendData);
    },
    showBillOfQuantityEditDialog(item) {
      if (this.boqInformation.status != 'LOCKED') {
        this.utilityStore.openBillOfQuantityEditDialog(item);
      }
      else {
        this.$q.notify({
          message: 'Bill of Quantity is locked',
          color: 'negative',
          position: 'top',
          icon: 'report_problem',
        });
      }
    },
    showBillOfQuantityAddDialog(referenceMethod, item) {
      this.utilityStore.openBillOfQuantityAddDialog(referenceMethod, item);
    },
    showQuantityTakeOffDialog(item) {
      this.utilityStore.openBillOfQuantityQtyTakeOffDialog(item);
    },
    deleteItem(item) {
      const sendData = {
        message: 'BOQ_DELETE_ITEM',
        data: {
          boqId: this.boqId,
          params: {
            itemId: item.id,
          },
        },
      };

      this.socketStore.socket.emit('BOQ_DELETE_ITEM', sendData);
    },
    onDragEnter(e) {
      if (e.target.draggable !== true) {
        e.target.classList.add('drag-enter');
      }
    },
    onDrop(item) {
      const dragItem = this.utilityStore.dragItem;
      const sendData = {
        message: 'BOQ_MOVE_ITEM',
        data: {
          boqId: this.boqId,
          params: {
            moveReferenceMethod: 'after',
            moveFromReferenceId: dragItem.id,
            moveToReferenceId: item.id,
          },
        },
      };

      this.socketStore.socket.emit('BOQ_MOVE_ITEM', sendData);
    },
    onDragLeave(e) {
      e.target.classList.remove('drag-enter');
    },
    onDragStart(item) {
      this.utilityStore.storeDragItem(item);
    },
    onDragOver(e) {
      e.preventDefault();
    },
    showQuantityTakeOff(item) {
      return !item.itemId && this.boqInformation.status == 'LOCKED';
    },
  },
};
</script>
