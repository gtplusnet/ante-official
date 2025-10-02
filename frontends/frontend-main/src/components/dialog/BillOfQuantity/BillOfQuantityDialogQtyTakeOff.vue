<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card bg-grey-2">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div>Quantity Take Off: {{ itemInformation.description }}</div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section class="q-pa-sm">
        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <label for="search">Search Item</label>
            <g-input required type="text" class="bg-white" @input="onSearchInput" v-model="search"></g-input>
          </div>
          <div class="col-6 row">
            <div class="col-6">
              <span class="text-bold q-pa-md">Price Per BOQ</span> {{ numberFormat(itemInformation.materialTotalCost) }}
            </div>
            <div class="col-6">
              <span class="text-bold">Price Per QTO</span> <span
                :class="totalAmount > itemInformation.materialTotalCost ? 'text-red' : ''">{{ numberFormat(totalAmount)
                }}</span>
            </div>
          </div>
        </div>
        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <q-card flat class="item-card">
              <q-table flat :rows="filteredTableData" @row-dblclick="setItemAsSelected" selection="multiple"
                v-model:selected="selectedRows" :loading="tableLoading" :columns="tableColumns" />
              <q-card-actions align="right" class="item-card-actions">
                <q-btn no-caps class="q-mr-sm" @click="isItemCreateEditDialogOpen = true" label="Create New Item"
                  type="button" color="primary" />
                <q-btn no-caps :loading="qto_submitting" @click="addSelectedRows" class="q-mr-sm" label="Add to QTO"
                  type="button" color="primary" />
              </q-card-actions>
            </q-card>
          </div>
          <div class="col-6">
            <q-card flat class="item-card">
              <q-table flat :rows="selectedTableData" :loading="selectedTableLoading" :columns="selectedTableColumns">
                <template v-slot:body-cell-amount="props">
                  <q-input v-model="props.row.amount" type="number" input-style="text-align: center" outlined dense
                    @change="onAmountChange(props.row)" />
                </template>
                <template v-slot:body-cell-actions="props">
                  <q-btn flat icon="delete" color="negative" @click="onDeleteRow(props.row)" />
                </template>
              </q-table>
              <q-card-actions align="right" class="item-card-actions">
                <q-btn v-if="itemInformation.approvalStatus === 'NO_ITEM'" no-caps class="q-mr-sm"
                  @click="submitForApproval" :loading="submitting" label="Submit For Approval" type="button"
                  color="primary" />
                <q-btn v-if="itemInformation.approvalStatus === 'PENDING'" no-caps class="q-mr-sm"
                  @click="submitForApproval" :loading="submitting" label="Approve Changes" type="button"
                  color="primary" />
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- item create edit dialog -->
    <ItemCreateEditDialog v-model="isItemCreateEditDialogOpen" @close="onCloseItemCreateEditDialog" />
  </q-dialog>
</template>
<style scoped lang="scss">
.dialog-card {
  max-width: 1400px;
  min-height: 500px;
}

.item-card {
  min-height: 400px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  /* Space out content */
  &-actions {
    margin-top: auto;
  }
}
</style>
<script>
import GInput from "../../../components/shared/form/GInput.vue";
import { api } from 'src/boot/axios';
import axios from 'axios';
import ItemCreateEditDialog from "../../../components/dialog/ItemCreateEditDialog/ItemCreateEditDialog.vue";

export default {
  name: 'BillOfQuantityDialogQtyTakeOff',
  components: {
    GInput,
    ItemCreateEditDialog,
  },
  props: {
    itemInformation: Object,
  },
  data: () => ({
    isItemCreateEditDialogOpen: false,
    search: '',
    tableLoading: false,
    selectedTableLoading: false,
    submitting: false,
    qto_submitting: false,
    totalAmount: 0,
    tableData: [
      {
        id: 1,
        sku: '',
        name: '',
        formatCurrency: {},
        uom: '',
      },
    ],
    selectedRows: [],
    searchCancelToken: null,
    tableColumns: [
      {
        name: 'sku',
        label: 'Item Code',
        field: 'sku',
        align: 'left',
        required: true,
        format: (val) => `${val}`,
        sortable: true,
      },
      {
        name: 'name',
        label: 'Item Name',
        field: 'name',
        align: 'left',
        required: true,
        format: (val) => `${val}`,
        sortable: true,
      },
      {
        name: 'estimatedBuyingPrice',
        label: 'Price',
        field: 'estimatedBuyingPrice',
        align: 'left',
        required: true,
        format: (val) => val?.formatCurrency || '',
        sortable: true,
      },
      {
        name: 'uom',
        label: 'UOM',
        field: 'uom',
        align: 'left',
        required: true,
        format: (val) => val?.key || '',
        sortable: true,
      },
    ],
    selectedTableColumns: [
      {
        name: 'sku',
        label: 'Item Code',
        field: 'item',
        align: 'left',
        required: true,
        format: (val) => val?.sku || '',
        sortable: true,
      },
      {
        name: 'name',
        label: 'Item Name',
        field: 'item',
        align: 'left',
        required: true,
        format: (val) => val?.name || '',
        sortable: true,
      },
      {
        name: 'estimatedBuyingPrice',
        label: 'Price',
        field: 'item',
        align: 'left',
        required: true,
        format: (val) => val?.estimatedBuyingPrice?.formatCurrency || '',
        sortable: true,
      },
      {
        name: 'amount',
        label: 'Amount',
        field: 'amount',
        align: 'left',
        required: true,
        format: (val) => val || 0,
        sortable: true,
      },
      {
        name: 'uom',
        label: 'UOM',
        field: 'item',
        align: 'left',
        required: true,
        format: (val) => val?.uom?.key || '',
        sortable: true,
      },
      {
        name: 'actions',
        label: 'Actions',
        align: 'center',
        field: 'actions',
        sortable: false,
      },
    ],
    selectedTableData: [],
  }),
  mounted() { },
  computed: {
    filteredTableData() {
      const selectedIds = new Set(
        this.selectedTableData.map((entry) => entry.item.id)
      );

      return this.tableData.filter((item) => !selectedIds.has(item.id));
    },
  },
  methods: {
    async fetchData() {
      this.fetchOptionTableData();
      this.fetchSelectedTableData();
    },
    onSearchInput() {
      if (this.searchCancelToken) {
        this.searchCancelToken.cancel();
      }
      this.searchCancelToken = axios.CancelToken.source();
      this.fetchOptionTableData();
    },
    async fetchOptionTableData() {
      this.tableLoading = true;
      try {
        let option_res = await api.get(
          `/boq/quantity-take-off?key=${this.itemInformation.key}&search=${this.search}`,
          { cancelToken: this.searchCancelToken?.token }
        );
        this.tableData = option_res.data.list;
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('Request canceled', error.message);
        } else {
          console.error(error);
        }
      }
      this.tableLoading = false;
    },
    async fetchSelectedTableData() {
      this.selectedTableLoading = true;
      let selection_res = await api.get(
        `/boq/quantity-take-off/selection?id=${this.itemInformation.key}`
      );
      this.selectedTableData = selection_res.data.list.sort(
        (a, b) => a.id - b.id
      );
      this.selectedTableLoading = false;

      // compute total amount of selected items
      this.totalAmount = this.selectedTableData.reduce(
        (acc, item) => acc + (item.item.estimatedBuyingPrice.raw * item.amount),
        0
      );
    },
    async setItemAsSelected(evt, row) {
      this.qto_submitting = true;
      await api.post('/boq/quantity-take-off', {
        key: this.itemInformation.key,
        itemId: row.id,
        amount: 1,
      });

      this.qto_submitting = false;
      this.fetchOptionTableData();
      this.fetchSelectedTableData();
    },
    addSelectedRows() {
      this.selectedTableLoading = true;
      this.selectedRows.forEach((row) => {
        this.setItemAsSelected(null, row);
      });

      this.qto_submitting = false;

      this.selectedRows = [];
    },
    async submitForApproval() {
      this.submitting = true;
      try {
        await api.put('/boq/quantity-take-off/submit', {
          key: this.itemInformation.key,
        });

        this.$q.notify({
          color: 'positive',
          message: 'Quantity take off request successfully submitted',
          position: 'top',
        });

        this.$emit('close');
        this.$refs.dialog.hide();
      } catch (error) {
        this.handleAxiosError(error);
      }
      this.submitting = false;
    },
    async onAmountChange(row) {
      await api.post('/boq/quantity-take-off', {
        key: this.itemInformation.key,
        itemId: row.item.id,
        amount: Number(row.amount),
      });
      this.fetchSelectedTableData();
    },
    async onDeleteRow(row) {
      await api.delete('/boq/quantity-take-off?id=' + row.id);
      this.fetchSelectedTableData();
      this.fetchOptionTableData();
    },
    onCloseItemCreateEditDialog() {
      this.isItemCreateEditDialogOpen = false;
      this.fetchOptionTableData();
    },
  },
};
</script>
