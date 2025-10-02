<template>
  <q-dialog ref="dialog" @before-show="loadInitialData">
    <q-card class="full-width">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="check" />
        <div>Update Item</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="updateItem" class="row">
          <!-- Particulars -->
          <div class="col-12 q-px-sm">
            <GInput type="text" label="Particulars" v-model="form.description"></GInput>
          </div>

          <!-- Choose Item -->
          <div v-if="itemOnlyShown()" class="col-12 q-px-sm q-mb-md">
            <GInput type="choose_item" label="Choose Item" v-model="form.itemId"></GInput>
          </div>

          <!-- Quantity -->
          <div v-if="itemOnlyShown()" class="col-6 q-px-sm">
            <GInput type="number" label="Quantity" v-model="form.quantity"></GInput>
          </div>

          <!-- Unit -->
          <div v-if="itemOnlyShown()" class="col-6 q-px-sm">
            <GInput :isDisabled="form.itemId ? true : false" type="text" label="Unit" v-model="form.materialUnit">
            </GInput>
          </div>

          <!-- Material Unit Cost -->
          <div v-if="itemOnlyShown()" class="col-6 q-px-sm">
            <GInput :isDisabled="form.itemId ? true : false" type="number" label="Material Cost"
              v-model="form.materialUnitCost"></GInput>
          </div>

          <!-- Labor Unit Cost -->
          <div v-if="itemOnlyShown()" class="col-6 q-px-sm">
            <GInput type="number" label="Labor Unit Cost" v-model="form.laborUnitCost"></GInput>
          </div>

          <!-- Profit Margin -->
          <div class="col-6 q-px-sm">
            <GInput type="number" label="Labor Percentage (%)" v-model="form.laborPercentageCost"></GInput>
          </div>

          <!-- Profit Margin -->
          <div class="col-6 q-px-sm">
            <GInput type="number" label="Profit Margin (%)" v-model="form.profitMarginPercentage"></GInput>
          </div>

          <div class="col-12 text-right">
            <q-btn no-caps class="q-mr-sm" outline label="Close" type="button" color="primary" v-close-popup />
            <q-btn no-caps unelevated label="Update Item" type="submit" color="primary" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import GInput from "../../../components/shared/form/GInput.vue";
import { useUtilityStore } from "../../../stores/utility";

export default {
  name: 'BillOfQuantityDialogUpdate',
  components: {
    GInput,
  },
  props: {
    boqId: Number,
    itemInformation: Object,
    boqInformation: Object,
  },
  data: () => ({
    isInitialized: false,
    form: {
      description: '',
      materialUnitCost: 0,
      laborUnitCost: 0,
      quantity: 0,
      materialUnit: '',
      itemId: null,
      profitMarginPercentage: 0,
      laborPercentageCost: 0,
    },
    utilityStore: useUtilityStore(),
  }),
  watch: {
    'form.itemId': {
      handler: function (value) {
        if (typeof value == 'object') {
          if (this.isInitialized == true) {
            if (this.form.quantity == 0) {
              this.form.quantity = 1;
            }
            this.form.description = value.name;
            this.form.materialUnitCost =
              value.formattedEstimatedBuyingPrice.raw;
            this.form.materialUnit = value.uom.abb;
          } else {
            this.isInitialized = true;
          }
        }
      },
      deep: true,
    },
  },
  mounted() {
    this.watchEventItemUpdate();
  },
  methods: {
    watchEventItemUpdate() {
      this.$bus.on('item-updated', (data) => {
        if (this.form.itemId && data.id == this.form.itemId.id) {
          console.log('item has been update', data);
          this.form.materialUnitCost = data.estimatedBuyingPrice.raw;
          this.form.materialUnit = data.uom.abb;
        }
      });
    },
    itemOnlyShown() {
      if (
        this.itemInformation.type == 'ITEM' &&
        this.itemInformation.children.length == 0
      ) {
        return true;
      }
      return false;
    },
    loadInitialData() {
      this.isInitialized = false;
      this.form = JSON.parse(JSON.stringify(this.itemInformation));
    },
    updateItem() {
      const sendData = {
        message: 'BOQ_EDIT_ITEM',
        data: {
          boqId: this.boqId,
          params: {
            updateId: this.itemInformation.id,
            updateValue: {
              description: this.form.description,
              materialUnitCost: Number(this.form.materialUnitCost),
              laborUnitCost: Number(this.form.laborUnitCost),
              laborPercentageCost: Number(this.form.laborPercentageCost),
              quantity: Number(this.form.quantity),
              materialUnit: this.form.materialUnit,
              itemId: this.form.itemId ? this.form.itemId.id : 0,
              profitMarginPercentage: Number(this.form.profitMarginPercentage),
            },
          },
        },
      };

      this.socketStore.socket.emit('BOQ_EDIT_ITEM', sendData);
      this.$refs.dialog.hide();
    },
  },
};
</script>
