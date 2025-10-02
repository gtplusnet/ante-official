<template>
  <q-dialog ref="dialog" :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" :maximized="true" persistent transition-show="slide-up" transition-hide="slide-down"
    @before-show="initializeData">
    <q-card class="full-width">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div class="text-title-medium">Purchase Order</div>
        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <div class="row justify-between align-top">
          <!-- left topbar -->
          <div class="left-side">
            <div class="row">
              <GInput class="q-mr-sm text-body-medium" ref="supplierSelect" type="select-search-with-add"
                apiUrl="/select-box/supplier-list" label="Supplier" v-model="form.supplierId">
              </GInput>
              <GInput class="q-mr-sm text-body-medium" ref="projectSelect" nullOption="No Project" type="select-search"
                apiUrl="/select-box/project-list" label="Request for Project" v-model="form.projectId">
              </GInput>
              <GInput ref="warehouseSelect" class="text-body-medium" type="select-search" apiUrl="/select-box/warehouse-list"
                label="Deliver to Warehouse" v-model="form.warehouseId">
              </GInput>
            </div>
            <div class="row q-mt-sm">
              <!-- Tax Type -->
              <div class="q-mr-sm">
                <g-input required ref="taxTypeSelect" class="text-body-medium" type="select" apiUrl="select-box/tax-list" label="Tax Type"
                  v-model="form.taxType"></g-input>
              </div>

              <!-- Payment Terms -->
              <div class="q-mr-sm">
                <g-input required ref="paymentTermsSelect" class="text-body-medium" type="select" apiUrl="select-box/payment-terms-list"
                  label="Payment Terms" v-model="form.paymentTerms"></g-input>
              </div>

              <!-- Delivery Terms -->
              <div class="q-mr-sm">
                <g-input required type="select" apiUrl="select-box/delivery-terms-list" class="text-body-medium" label="Delivery Terms"
                  v-model="form.deliveryTerms"></g-input>
              </div>

              <!-- Pickup Location -->
              <div class="q-mr-sm">
                <g-input v-if="form.deliveryTerms == 'PICKUP'" required type="select" apiUrl="select-box/location-list"
                  class="text-body-medium" label="Pickup Location" v-model="form.pickupLocationId"></g-input>
              </div>

              <!-- Delivery Date -->
              <div class="q-mr-sm">
                <g-input required type="date" class="text-body-medium" label="Delivery Date" v-model="form.deliveryDate"></g-input>
              </div>

            </div>
          </div>

          <!-- right topbar -->
          <div class="right-side text-right">
            <div class="text-title-small">Total Estimated Price</div>
            <div class="text-headline-small">{{ totalAmount }}</div>
          </div>
        </div>

        <!-- item table v2 -->
        <div class="q-mt-lg">
          <ItemTableSelectV2 ref="itemTableSelectV2" :initialData="utilityStore.billOfQuantityCheckedItems"
            v-model="form.items" @totalAmount="getTotal">
          </ItemTableSelectV2>
        </div>

        <!-- bottom area -->
        <div class="q-mt-md">
          <g-input v-model="form.memo" style="width: 400px" label="Memo" type="textarea" class="text-body-medium"></g-input>
        </div>

        <!-- bottom buttons -->
        <div class="bottom-nav text-right">
          <q-btn class="q-mr-sm text-label-large" no-caps color="white" @click="$emit('update:modelValue', false)" flat>Close</q-btn>
          <q-btn @click="saveData" no-caps color="white" unelevated class="text-label-large text-black">Save</q-btn>
        </div>

      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import GInput from "../../../components/shared/form/GInput.vue";
import ItemTableSelectV2 from './ItemTableSelectV2.vue';
import { api } from 'src/boot/axios';
import { useUtilityStore } from "../../../stores/utility";

export default {
  name: 'PurchaseOrderDialog',
  components: {
    GInput,
    ItemTableSelectV2,
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    warehouseId: {
      type: String,
      default: null,
    },
  },
  emits: ['update:modelValue', 'saveDone'],
  watch: {
    'form.supplierId': {
      handler() {
        const supplierInformation = this.$refs.supplierSelect.getSelectData();
        this.$refs.taxTypeSelect.setAutoSelect(supplierInformation.taxType.key);
        this.$refs.paymentTermsSelect.setAutoSelect(supplierInformation.paymentTerms.key);
      },
      deep: true,
    },
  },
  data() {
    return {
      form: {
        supplierId: null,
        projectId: null,
        taxType: null,
        paymentTerms: null,
        deliveryDate: null,
        warehouseId: null,
        items: [],
        memo: '',
        deliveryTerms: null,
        pickupLocationId: null,
      },
      totalAmount: '0',
      utilityStore: useUtilityStore(),
    }
  },
  mounted() {
    this.initializeData();
    this.form.deliveryDate = new Date().toISOString().substr(0, 10);
  },
  methods: {
    async initializeData() {
      setTimeout(() => {
        if (this.warehouseId) {
          this.$refs.warehouseSelect.setAutoSelect(this.warehouseId);
        }
      })

      this.totalAmount = this.currencyFormat(0);
    },
    getTotal(totalAmount) {
      this.totalAmount = this.currencyFormat(totalAmount);
    },
    async saveData() {
      try {
        this.$q.loading.show();

        const requestData = {
          supplierId: Number(this.form.supplierId),
          projectId: this.form.projectId,
          taxType: this.form.taxType,
          paymentTerms: this.form.paymentTerms,
          deliveryDate: new Date(this.form.deliveryDate).toISOString(),
          warehouseId: this.form.warehouseId,
          items: this.form.items,
          memo: this.form.memo,
          deliveryTerms: this.form.deliveryTerms,
          pickupLocationId: this.form.pickupLocationId,
          type: 'PURCHASE_ORDER',
        }

        await api.post('/purchase-order', requestData);
        this.$emit('saveDone');
        this.$emit('update:modelValue', false);
        
        this.utilityStore.clearBoqCheckedItems();
      } catch (error) {
        this.handleAxiosError(error);
      }

      this.$q.loading.hide();

    }
  },
};
</script>
