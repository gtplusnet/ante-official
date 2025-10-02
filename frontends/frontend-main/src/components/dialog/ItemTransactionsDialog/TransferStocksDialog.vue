<template>
  <q-dialog ref="dialog" :maximized="true" persistent transition-show="slide-up" transition-hide="slide-down"
    @before-show="initializeData">
    <q-card class="full-width">
      <q-bar @dblclick="fillData()" class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div class="text-title-medium">Transfer Stocks</div>
        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <div class="row justify-between">
          <!-- left topbar -->
          <div class="left-side">
            <div class="row">
              <GInput class="q-mr-s text-body-medium" ref="warehouseSelect" type="select-search" apiUrl="/select-box/warehouse-list"
                label="From Warehouse" v-model="form.fromWarehouseId">
              </GInput>
              <GInput class="text-body-medium" type="select-search" apiUrl="/select-box/warehouse-list" label="To Warehouse"
                v-model="form.toWarehouseId">
              </GInput>
            </div>
            <div class="row q-mt-sm">
              <GInput class="q-mr-sm text-body-medium" type="manual" label="Transfer Type">
                <q-select emit-value map-options outlined dense v-model="form.transferType"
                  :options="transferTypeOptions" />
              </GInput>
              <GInput v-if="form.transferType == 'delivery'" type="date" class="text-body-medium" label="Expected Delivery Date"
                v-model="form.deliveryDateRaw" />
            </div>
          </div>

          <!-- right topbar -->
          <div class="right-side text-right">
            <div class="text-title-medium">Total Estimated Price</div>
            <div class="text-headline-small">{{ totalAmount }}</div>
          </div>
        </div>


        <!-- item table -->
        <div class="q-mt-lg">
          <ItemTableSelect :warehouseId="form.fromWarehouseId" ref="itemTableSelect" v-model="form.items" class="text-body-small"
            @totalAmount="getTotal"></ItemTableSelect>
        </div>

        <!-- bottom area -->
        <div class="q-mt-md">
          <g-input v-model="form.memo" style="width: 400px" label="Memo" type="textarea" class="text-body-medium"></g-input>
        </div>

        <!-- bottom buttons -->
        <div class="bottom-nav text-right">
          <q-btn class="q-mr-sm text-label-large" no-caps color="white" @click="$refs.dialog.hide()" flat>Close</q-btn>
          <q-btn @click="saveData" class="text-label-large text-black" no-caps color="white" unelevated >Save</q-btn>
        </div>

      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import GInput from "../../../components/shared/form/GInput.vue";
import ItemTableSelect from './ItemTableSelect.vue';
import { api } from 'src/boot/axios';

export default {
  name: 'TransferStocksDialog',
  components: {
    GInput,
    ItemTableSelect,
  },
  props: {
    warehouseId: {
      type: String,
      required: true,
    },
  },
  data: () => ({
    form: {
      fromWarehouseId: null,
      toWarehouseId: null,
      inTransitWarehouseId: null,
      items: [],
      memo: '',
      transferType: 'delivery',
      deliveryDateRaw: null,
    },
    transferTypeOptions: [
      { label: 'Delivery', value: 'delivery' },
      { label: 'Direct', value: 'direct' },
    ],
    totalAmount: '0',
  }),
  watch: {
  },
  mounted() {
    this.initializeData();
  },
  methods: {
    async fillData() {
      this.$refs.itemTableSelect.fillData();
    },
    async initializeData() {
      setTimeout(() => {
        this.$refs.warehouseSelect.setAutoSelect(this.warehouseId);
      })

      this.totalAmount = this.currencyFormat(0);

      const today = new Date();
      today.setDate(today.getDate() + 3); // Add 3 days
      this.form.deliveryDateRaw = today.toISOString().substr(0, 10);
    },
    getTotal(totalAmount) {
      this.totalAmount = this.currencyFormat(totalAmount);
    },
    async saveData() {
      try {
        this.$q.loading.show();
        this.form.deliveryDate = new Date(this.form.deliveryDateRaw).toISOString();
        await api.post('/inventory/transfer', this.form);
        this.$emit('saveDone');
        this.$refs.dialog.hide()
      } catch (error) {
        this.handleAxiosError(error);
      }

      this.$q.loading.hide();

    }
  },
};
</script>
