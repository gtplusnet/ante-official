<template>
  <q-dialog @dblclick="fillData" ref="dialog" @before-show="initializeForm">
    <q-card class="full-width">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="check" />
        <div>Insert {{ method }} {{ itemInformation.description }}</div>
        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="insertItem" class="row">
          <!-- Particulars -->
          <div class="col-12 q-px-sm">
            <GInput type="text" label="Particulars" v-model="form.description"></GInput>
          </div>

          <!-- Choose Item -->
          <div v-if="itemOnlyShown()" class="col-12 q-px-sm q-mb-md">
            <GInput type="choose_item" label="Choose Item" v-model="form.item"></GInput>
          </div>

          <!-- Quantity -->
          <div v-if="itemOnlyShown()" class="col-6 q-px-sm">
            <GInput type="number" label="Quantity" v-model="form.quantity"></GInput>
          </div>

          <!-- Unit -->
          <div v-if="itemOnlyShown()" class="col-6 q-px-sm">
            <GInput :isDisabled="form.item ? true : false" type="text" label="Unit" v-model="form.materialUnit">
            </GInput>
          </div>

          <!-- Material Unit Cost -->
          <div v-if="itemOnlyShown()" class="col-6 q-px-sm">
            <GInput :isDisabled="form.item ? true : false" type="number" label="Material Cost"
              v-model="form.materialUnitCost">
            </GInput>
          </div>

          <!-- Material Unit Cost -->
          <div v-if="itemOnlyShown()" class="col-6 q-px-sm">
            <GInput type="number" label="Labor Unit Cost" v-model="form.laborUnitCost"></GInput>
          </div>

          <!-- Actions -->
          <div class="col-12 text-right">
            <q-btn no-caps class="q-mr-sm" outline label="Close" type="button" color="primary" v-close-popup />
            <q-btn no-caps unelevated label="Insert Item" type="submit" color="primary" />
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
  name: 'BillOfQuantityDialogInsert',
  components: {
    GInput,
  },
  props: {
    boqId: Number,
    itemInformation: Object,
    method: String,
  },
  data: () => ({
    form: {
      quantity: 1,
      materialUnit: 'pc',
      materialUnitCost: 0,
      laborUnitCost: 0,
    },
    isDisabled: false,
    utilityStore: useUtilityStore(),
  }),
  watch: {
    'form.item': {
      handler: function (value) {
        if (value) {
          this.form.quantity = 1;
          this.form.description = value.name;
          this.form.materialUnitCost = value.formattedEstimatedBuyingPrice.raw;
          this.form.materialUnit = value.uom.abb;
        }
      },
      deep: true,
    },
  },
  mounted() {
  },
  methods: {
    itemOnlyShown() {
      if (this.method == 'inside' && (this.itemInformation.type == 'SUBHEADING' || this.itemInformation.type == 'ITEM')) {
        return true;
      }
      else if (this.method == 'after' && this.itemInformation.type == 'ITEM') {
        return true;
      }
      else if (this.method == 'before' && this.itemInformation.type == 'ITEM') {
        return true;
      }

      return false;
    },
    initializeForm() {
      this.form = {
        description: '',
        quantity: 0,
        materialUnit: '',
        materialUnitCost: 0,
        laborUnitCost: 0,
      };
    },
    fillData() {
      this.form = {
        description: 'Sample ' + Math.floor(Math.random() * 1000000),
        quantity: Math.floor(Math.random() * 100),
        materialUnit: 'pcs',
        materialUnitCost: Math.floor(Math.random() * 10000),
        laborUnitCost: 0,
      };
    },
    insertItem() {
      const sendData = {
        message: 'BOQ_ADD_ITEM',
        data: {
          boqId: this.boqId,
          params: {
            insertReferenceMethod: this.method,
            insertReferenceId: this.itemInformation ? this.itemInformation.id : 0,
            insertValue: {
              itemId: this.form.item ? this.form.item.id : 0,
              description: this.form.description,
              materialUnitCost: Number(this.form.materialUnitCost),
              laborUnitCost: Number(this.form.laborUnitCost),
              quantity: Number(this.form.quantity),
              materialUnit: this.form.materialUnit,
            }
          }
        }
      };

      this.socketStore.socket.emit('BOQ_ADD_ITEM', sendData);
      this.$refs.dialog.hide();
    },
  },
};
</script>
