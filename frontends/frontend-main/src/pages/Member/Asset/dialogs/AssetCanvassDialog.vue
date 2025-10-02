<template>
  <q-dialog ref="dialog" @before-show="fetchData" :maximized="true" persistent transition-show="slide-up"
    transition-hide="slide-down">
    <q-card v-if="!isLoading" class="full-width dialog-card canvass-dialog">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="list" />
        <div>Canvassing ({{ purchaseRequestInfo.itemReceipt.code }})</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <div class="text-right q-mb-sm">
          <span v-if="!isUpdateLoading" class="q-mr-sm text-weight-medium">
            <q-icon name="check"></q-icon> Up to date
          </span>
          <span v-if="isUpdateLoading" class="q-mr-sm text-weight-medium">
            <q-icon name="check"></q-icon> Saving
          </span>
          <q-btn @click="openSelectSupplierDialog" color="primary" unelevated no-caps>
            <q-icon name="add" size="14px" class="q-mr-xs"></q-icon>
            Add Supplier Selection
          </q-btn>
        </div>

        <div class="q-mt-sm">
          <table>
            <thead>
              <tr>
                <th colspan="2"></th>
                <th class="non-selectable q-pa-sm" v-for="supplier in supplierList" :key="supplier.id" colspan="2">
                  <span class="cursor-pointer" @click="openSupplierInformation(supplier)">{{ supplier.supplier.name
                    }}</span>
                  <span class="delete cursor-pointer q-ml-xs" @click="deleteSupplier(supplier.supplierId)"><q-icon
                      size="16px" class="q-mb-xs" color="red" name="close"></q-icon></span>
                </th>
              </tr>
            </thead>
            <!-- terms -->
            <thead>
              <tr>
                <th colspan="2" class="terms">Payment Terms</th>

                <template v-for="supplier in supplierList" :key="supplier.id">
                  <th class="select" colspan="2">
                    <g-input
                      @update:modelValue="(newValue) => updatePaymentTerms(supplier.supplierId, supplier.paymentTerms.key, newValue)"
                      :borderless="true" required ref="paymentTermsSelect" type="select"
                      apiUrl="select-box/payment-terms-list" v-model="supplier.paymentTerms.key"></g-input>
                  </th>

                </template>
              </tr>
              <tr>
                <th colspan="2" class="terms">Delivery Terms</th>

                <template v-for="supplier in supplierList" :key="supplier.id">
                  <th class="select" colspan="2">
                    <g-input
                      @update:modelValue="(newValue) => updateDeliveryTerms(supplier.supplierId, supplier.deliveryTerms.key, newValue)"
                      :borderless="true" required ref="paymentTermsSelect" type="select"
                      apiUrl="select-box/delivery-terms-list" v-model="supplier.deliveryTerms.key"></g-input>
                  </th>

                </template>
              </tr>
            </thead>
            <thead>
              <tr>
                <th>Item</th>
                <th width="60px">Qty</th>
                <template v-for="supplier in supplierList" :key="supplier.id">
                  <th>Rate</th>
                  <th>Total</th>
                </template>
              </tr>
            </thead>

            <!-- purchase information -->
            <tbody v-for="item in formattedItemList" :key="item.id">
              <tr>
                <td class="cursor-pointer" @click="openItemInformation(item)">
                  <span>{{ item.itemName }} ({{ item.itemSku }})</span>
                </td>
                <td>
                  <span class="amount">{{ item.quantity }}</span>
                </td>

                <template v-for="supplier in supplierList" :key="supplier.id">
                  <td>
                    <div class="price-update">
                      <div>
                        <q-input @keydown="validateNumber($event)"
                          @change="saveUpdatedPrice(item.item.id, supplier.supplierId, item.supplierPrice[supplier.supplierId])"
                          class="input quantity" v-model="item.supplierPrice[supplier.supplierId]" type="text"
                          borderless dense></q-input>
                      </div>
                      <div class="q-pa-xs">
                        <q-btn @click="openPriceUpdateHistory(supplier.supplierId, item.item.id)" dense flat><q-icon
                            size="16px" name="history"></q-icon></q-btn>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="amount">{{ currencyFormat(item.supplierTotalPrice[supplier.supplierId])
                      }}</span>
                  </td>
                </template>
              </tr>
            </tbody>
            <tbody>
              <tr>
                <td colspan="2" class="text-right text-subtitle1">Grand Total</td>
                <template v-for="supplier in formattedSupplierList" :key="supplier.id">
                  <td></td>
                  <td class="q-pa-sm">
                    <span class="amount text-primary">{{ currencyFormat(supplier.grandTotal) }}</span>
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
            Submit Canvass Sheet
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

<style scoped lang="scss" src="./AssetCanvassDialog.scss"></style>

<script>
import axios from 'axios';
import { api } from 'src/boot/axios';
import GlobalLoader from "../../../../components/shared/common/GlobalLoader.vue";
import GInput from "../../../../components/shared/form/GInput.vue";
import CanvassSelectSupplierDialog from './AssetCanvassSelectSupplierDialog.vue';
import ItemInformationDialog from "../../../../components/dialog/ItemInformationDialog/ItemInformationDialog.vue";
import SupplierInformationDialog from './AssetSupplierInformationDialog/SupplierInformationDialog.vue';
import SupplierPriceUpdateHistoryDialog from "../../../../components/dialog/SupplierPriceUpdateHistoryDialog.vue";

export default {
  name: 'CanvassDialog',
  components: {
    GInput,
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
    submitCanvasSheet() {
      api.post('/purchase-order/request-update', { purchaseRequestId: this.purchaseRequestId, status: this.purchaseRequestInfo.status.nextStage })
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
    deleteSupplier(supplierId) {
      this.$q.dialog({
        title: 'Remove Supplier',
        message: 'Are you sure you want to remove this supplier from the selection?',
        ok: 'Yes',
        cancel: 'No',
        html: true,
      }).onOk(() => {
        this.$q.loading.show();

        api.post('/purchase-order/canvass/delete-supplier', {
          purchaseRequestId: this.purchaseRequestId,
          supplierId,
        }).then(() => {
          this.fetchData();
        }).catch((error) => {
          this.handleAxiosError(error);
        }).finally(() => {
          this.$q.loading.hide();
        });
      });
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
        this.items = response;
        this.purchaseRequestInfo = response.data.purchaseRequestInformation;
        this.items = response.data.purchaseRequestItems;
        this.supplierList = response.data.supplierList;

        this.isLoading = false;
      } catch (error) {
        console.error(error);
      }
    },
  },
};
</script>
