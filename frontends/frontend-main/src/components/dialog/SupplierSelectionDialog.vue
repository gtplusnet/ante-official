<template>
  <q-dialog ref="dialog" @before-show="fetchData" :maximized="true" persistent transition-show="slide-up"
    transition-hide="slide-down">
    <q-card v-if="!isLoading" class="full-width dialog-card canvass-dialog">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="list" />
        <div class="text-title-medium">Supplier Selection ({{ purchaseRequestInfo.itemReceipt.code }})</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <div class="text-right q-mb-sm">
          <span v-if="!isUpdateLoading" class="q-mr-sm text-label-medium">
            <q-icon name="check"></q-icon> Up to date
          </span>
          <span v-if="isUpdateLoading" class="q-mr-sm text-label-medium">
            <q-icon name="check"></q-icon> Saving
          </span>
        </div>

        <div class="q-mt-sm">
          <table class="supplier-selection non-selectable">
            <thead>
              <tr>
                <th width="500px" colspan="3"></th>
                <th class="non-selectable q-pa-sm" v-for="supplier in supplierList" :key="supplier.id">
                  <span class="cursor-pointer" @click="openSupplierInformation(supplier)">{{
                    supplier.supplier.name
                    }}</span>
                </th>
              </tr>
            </thead>
            <!-- terms -->
            <thead>
              <tr>
                <th colspan="3" class="terms text-body-medium">Payment Terms</th>

                <template v-for="supplier in supplierList" :key="supplier.id">
                  <th class="select-supplier">
                    {{ supplier.paymentTerms.label }}
                  </th>

                </template>
              </tr>
              <tr>
                <th colspan="3" class="terms text-body-medium">Delivery Terms</th>

                <template v-for="supplier in supplierList" :key="supplier.id">
                  <th class="select-supplier text-body-medium">
                    {{ supplier.deliveryTerms.label }}
                  </th>
                </template>
              </tr>
            </thead>
            <thead class="text-title-small">
              <tr>
                <th class="q-pa-sm">Item</th>
                <th width="60px">Qty</th>
                <th width="60px">Supplier</th>
                <template v-for="supplier in supplierList" :key="supplier.id">
                  <th >Total Rate</th>
                </template>

              </tr>
            </thead>
            <!-- purchase information -->
            <tbody v-for="item in formattedItemList" :key="item.id">
              <tr>
                <td class="cursor-pointer text-body-medium" @click="openItemInformation(item)">
                  <span>{{ item.itemName }} ({{ item.itemSku }})</span>
                </td>
                <td>
                  <span class="text-body-medium">{{ item.quantity }}</span>
                </td>

                <td>
                  <span class="text-body-medium" :class="item.selectedSupplierId ? 'text-black' : 'text-red'">
                    {{ item.selectedSupplierName || 'Select Supplier' }}
                  </span>
                </td>

                <template v-for="supplier in supplierList" :key="supplier.id">
                  <td @click="selectActiveSupplier(item, supplier)"
                    :class="item.selectedSupplierId == supplier.supplierId ? 'selected' : ''" class="q-pa-sm selection text-body-medium">
                    {{
                      currencyFormat(item.supplierTotalPrice[supplier.supplierId]) }}</td>
                </template>
              </tr>
            </tbody>
            <tbody>
              <tr>
                <td colspan="3" class="text-right text-body-medium">Grand Total</td>
                <template v-for="supplier in formattedSupplierList" :key="supplier.id">
                  <td class="q-pa-sm ">
                    <span class="text-primary text-body-medium">{{ currencyFormat(supplier.grandTotal)
                      }}</span>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="col-12 text-right q-mt-md">
          <q-btn no-caps class="q-mr-sm" outline label="Close" type="button" color="primary" v-close-popup />
          <q-btn @click="submitCanvasSheet" no-caps unelevated type="submit" color="primary">
            <q-icon name="check" size="14px" class="q-mr-xs"></q-icon>
            Submit Supplier Selection
          </q-btn>
        </div>
      </q-card-section>
    </q-card>
    <q-card v-if="isLoading" class="full-width dialog-card canvass-dialog">
      <GlobalLoader />
    </q-card>


    <!-- Select Supplier Dialog -->
    <CanvassSelectSupplierDialog @selectSupplier="selectSupplier" v-if="isSelectSupplierDialogShown"
      v-model="isSelectSupplierDialogShown" :purchaseRequestId="purchaseRequestId" />

    <!-- Item Information Dialog -->
    <ItemInformationDialog v-if="isItemInformationDialogShown" v-model="isItemInformationDialogShown"
      :itemId="itemId" />

    <!-- Supplier Information Dialog -->
    <SupplierInformationDialog v-if="isSupplierInformationDialogShown" v-model="isSupplierInformationDialogShown"
      :supplierId="supplierId" />

    <!-- Supplier Price Update History Dialog -->
    <SupplierPriceUpdateHistoryDialog v-if="isSupplierPriceUpdateHistoryDialogShown"
      v-model="isSupplierPriceUpdateHistoryDialogShown" :supplierId="supplierId" :itemId="itemId" />
  </q-dialog>
</template>

<style scoped lang="scss">
@import '../../pages/Member/Asset/dialogs/AssetCanvassDialog.scss';
</style>

<script>
import axios from 'axios';
import { api } from 'src/boot/axios';
import GlobalLoader from "../../components/shared/common/GlobalLoader.vue";
import CanvassSelectSupplierDialog from "../../pages/Member/Asset/dialogs/AssetCanvassSelectSupplierDialog.vue";
import ItemInformationDialog from './ItemInformationDialog/ItemInformationDialog.vue';
import SupplierInformationDialog from "../../pages/Member/Asset/dialogs/AssetSupplierInformationDialog/SupplierInformationDialog.vue";
import SupplierPriceUpdateHistoryDialog from './SupplierPriceUpdateHistoryDialog.vue';
export default {
  name: 'SupplierSelectionDialog',
  components: {
    GlobalLoader,
    CanvassSelectSupplierDialog,
    ItemInformationDialog,
    SupplierInformationDialog,
    SupplierPriceUpdateHistoryDialog,
  },
  props: {
    purchaseRequestId: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      isUpdateLoading: false,
      updatePriceRequest: null,
      cancelTokenSource: null, // Variable to store the cancel token source
      itemId: null,
      supplierId: null,
      isLoading: true,
      purchaseRequestInfo: {},
      isSelectSupplierDialogShown: false,
      isItemInformationDialogShown: false,
      isSupplierInformationDialogShown: false,
      isSupplierPriceUpdateHistoryDialogShown: false,
      supplierList: [],
      items: [],
    };
  },
  computed: {
    formattedItemList() {
      return this.items.map((item) => ({
        ...item,
        supplierTotalPrice: this.getTotalPerSupplier(item),
      }));
    },
    formattedSupplierList() {
      return this.supplierList.map((supplier) => ({
        ...supplier,
        grandTotal: this.formattedItemList.reduce((total, item) => total + item.supplierTotalPrice[supplier.supplierId], 0),
      }));
    }
  },
  watch: {
  },
  methods: {
    selectActiveSupplier(item, supplier) {
      let itemReference = this.items.find((i) => i.item.id === item.item.id);

      itemReference.selectedSupplierId = supplier.supplierId;
      itemReference.selectedSupplierName = supplier.supplier.name;
    },
    submitCanvasSheet() {
      const items = this.formattedItemList.map((item) => ({
        itemId: item.item.id,
        supplierId: item.selectedSupplierId,
        rate: item.supplierPrice[item.selectedSupplierId],
      }));


      api.post('/purchase-order/submit-supplier-selection', { purchaseRequestId: this.purchaseRequestId, items })
        .then(() => {
          this.$q.notify({
            message: 'Canvass sheet submitted successfully.',
            color: 'positive',
            position: 'top',
            timeout: 2000,
          });

          this.$emit('close');
          this.$emit('saveDone');
          this.$refs.dialog.hide();
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });
    },
    openPriceUpdateHistory(supplierId, itemId) {
      this.supplierId = supplierId;
      this.itemId = itemId;
      this.isSupplierPriceUpdateHistoryDialogShown = true;
    },
    validateNumber(event) {
      const inputValue = event.target.value;

      // Allow digits (0-9), a single decimal point (.), and backspace
      if ((event.key < '0' || event.key > '9') && event.key !== '.' && event.key !== 'Backspace') {
        event.preventDefault();
      }

      // Prevent multiple decimal points
      if (event.key === '.' && inputValue.includes('.')) {
        event.preventDefault();
      }
    },
    async updatePaymentTerms(supplierId, oldPaymentTerms, newPaymentTerms) {
      this.isUpdateLoading = true;

      if (oldPaymentTerms !== newPaymentTerms) {
        try {
          const purchaseRequestId = this.purchaseRequestId;
          await api.post('/purchase-order/canvass/update-payment-terms', { purchaseRequestId, supplierId, paymentTerms: newPaymentTerms });

        } catch (error) {
          this.handleAxiosError(error);
        }
      }

      this.isUpdateLoading = false;
    },
    async updateDeliveryTerms(supplierId, oldDeliveryTerms, newDeliveryTerms) {
      this.isUpdateLoading = true;

      if (oldDeliveryTerms !== newDeliveryTerms) {
        try {
          const purchaseRequestId = this.purchaseRequestId;
          await api.post('/purchase-order/canvass/update-delivery-terms', { purchaseRequestId, supplierId, deliveryTerms: newDeliveryTerms });
        } catch (error) {
          this.handleAxiosError(error);
        }
      }

      this.isUpdateLoading = false;
    },
    openSupplierInformation(data) {
      this.supplierId = data.supplierId;
      this.isSupplierInformationDialogShown = true;
    },
    openItemInformation(data) {
      this.itemId = data.item.id;
      this.isItemInformationDialogShown = true;
    },
    getTotalPerSupplier(item) {
      const total = {};

      this.supplierList.forEach((supplier) => {
        total[supplier.supplierId] = item.supplierPrice[supplier.supplierId] * item.quantity;
      });

      return total;
    },
    async saveUpdatedPrice(itemId, supplierId, price) {
      this.isUpdateLoading = true;

      // Cancel the previous request if it exists
      if (this.cancelTokenSource) {
        this.cancelTokenSource.cancel('Operation canceled due to new request.');
      }

      // Create a new cancel token source
      this.cancelTokenSource = axios.CancelToken.source();

      this.updatePriceRequest = api.post('/supplier/update-price', { itemId, supplierId, price }, {
        cancelToken: this.cancelTokenSource.token,
      });

      try {
        await this.updatePriceRequest;
      } catch (error) {
        this.handleAxiosError(error);
      }

      this.isUpdateLoading = false;
    },
    async selectSupplier(data) {
      this.$q.loading.show();

      try {
        await api.post('/purchase-order/canvass/add-supplier', {
          purchaseRequestId: this.purchaseRequestId,
          supplierId: data.id,
        });

        this.fetchData();
      } catch (error) {
        this.handleAxiosError(error);
      }

      this.$q.loading.hide();
    },
    async openSelectSupplierDialog() {
      this.isSelectSupplierDialogShown = true;
    },
    async fetchData() {
      this.isUpdateLoading = false;
      try {
        this.supplierList = [];
        this.items = [];

        const response = await api.get(`/purchase-order/canvass?purchaseRequestId=${this.purchaseRequestId}`);
        this.items = response.data;
        this.purchaseRequestInfo = response.data.purchaseRequestInformation;
        this.items = this.addParamToItems(response.data.purchaseRequestItems);
        this.supplierList = response.data.supplierList;

        this.isLoading = false;
      } catch (error) {
        console.error(error);
      }
    },
    addParamToItems(items) {
      return items.map((item) => ({
        ...item,
        selectedSupplierId: null,
        selectedSupplierName: null,
      }));
    },
  },
};
</script>
