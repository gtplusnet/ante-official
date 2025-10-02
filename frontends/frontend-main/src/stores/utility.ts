import { defineStore } from 'pinia';
interface BoqCheckedItem {
  id: string;
  quantity: number;
  description: string;
  cost: number;
  boqKey: number;
}
export const useUtilityStore = defineStore('utility', {
  state: () => ({
    dragItem: {},
    isBillOfQuantityEditShown: false,
    isBillOfQuantityAddShown: false,
    isBillOfQuantityQtyTakeOffShown: false,
    billOfQuantityAddMethod: 'after',
    billOfQuantityItemClicked: {},
    billOfQuantityCheckedItems: [] as BoqCheckedItem[],

  }),
  actions: {
    addBoqCheckedItems(item: BoqCheckedItem) {
      this.billOfQuantityCheckedItems.push(item);
    },
    removeBoqCheckedItem(itemId: string) {
      this.billOfQuantityCheckedItems = this.billOfQuantityCheckedItems.filter((item) => item.id !== itemId);
    },
    clearBoqCheckedItems() {
      this.billOfQuantityCheckedItems = [];
    },
    storeDragItem(dragItem: object) {
      this.dragItem = dragItem;
    },
    openBillOfQuantityEditDialog(billOfQuantityItemClicked: object) {
      this.isBillOfQuantityEditShown = true;
      this.billOfQuantityItemClicked = billOfQuantityItemClicked;
    },
    openBillOfQuantityAddDialog(method: string, billOfQuantityItemClicked: object) {
      this.isBillOfQuantityAddShown = true;
      this.billOfQuantityAddMethod = method;
      this.billOfQuantityItemClicked = billOfQuantityItemClicked;
    },
    openBillOfQuantityQtyTakeOffDialog(billOfQuantityItemClicked: object) {
      this.isBillOfQuantityQtyTakeOffShown = true;
      this.billOfQuantityItemClicked = billOfQuantityItemClicked;
    },
  },
});
