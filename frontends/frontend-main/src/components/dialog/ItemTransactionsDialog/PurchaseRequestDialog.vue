<template>
  <q-dialog ref="dialog" :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" :maximized="true" persistent transition-show="slide-up" transition-hide="slide-down"
    @before-show="initializeData">
    <q-card class="full-width">
      <q-bar @dblclick="fillData()" class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div class="text-title-medium">Purchase Request</div>
        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <div class="row justify-between">
          <!-- left topbar -->
          <div class="row left-side">
            <!-- Request for Project -->
            <GInput null-option="No Project" class="q-mr-sm text-body-medium" ref="projectSelect" type="select-search"
              apiUrl="/select-box/project-list" label="Request for Project" v-model="form.projectId">
            </GInput>

            <!-- Destination Warehouse -->
            <GInput class="q-mr-sm text-body-medium" ref="warehouseSelect" type="select-search" apiUrl="/select-box/warehouse-list"
              label="Deliver to Warehouse" v-model="form.warehouseId">
            </GInput>

            <!-- Delivery Date -->
            <div class="q-mr-sm text-body-medium">
              <GInput required type="date" label="Delivery Date" v-model="form.deliveryDate"></GInput>
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
          <GInput v-model="form.memo" style="width: 400px" label="Memo" type="textarea" class="text-body-medium"></GInput>
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
  name: 'PurchaseRequestDialog',
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
    projectId: {
      type: Number,
      default: null,
    },
    billOfQuantityId: {
      type: Number,
      default: null,
    }
  },
  emits: ['update:modelValue', 'saveDone'],
  data: () => ({
    form: {
      warehouseId: null,
      items: [],
      memo: '',
      deliveryDate: null,
    },
    totalAmount: '0',
    utilityStore: useUtilityStore(),
  }),
  watch: {
    'form.projectId': {
      handler() {
        if (this.$refs.warehouseSelect) {
          this.loadWarehouseBasedOnSelectedProject();
        }
      },
    },
  },
  mounted() {
    this.initializeData();
  },
  methods: {
    async fillData() {
      this.$refs.itemTableSelect.fillData();
    },
    loadWarehouseBasedOnSelectedProject() {
      if (!this.$refs.warehouseSelect) {
        return;
      }

      const warehouseList = this.$refs.warehouseSelect.getSelectOptions();
      const projectId = this.form.projectId;
      const warehouseId = warehouseList.find((item) => item.projectId == projectId)?.value;

      if (warehouseId) {
        this.form.warehouseId = warehouseId;
      }
    },
    async initializeData() {
      setTimeout(() => {
        if (this.warehouseId) {
          this.$refs.warehouseSelect.setAutoSelect(this.warehouseId);
        }

        // default is after 3 days
        this.form.deliveryDate = new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().substr(0, 10);

        if (this.projectId) {
          this.form.projectId = this.projectId;
          setTimeout(() => {
            this.loadWarehouseBasedOnSelectedProject();
          });
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
        this.form.type = 'PURCHASE_REQUEST';

        const params = {
          projectId: this.form.projectId,
          warehouseId: this.form.warehouseId,
          items: this.form.items,
          memo: this.form.memo,
          deliveryDate: this.form.deliveryDate ? new Date(this.form.deliveryDate + 'T00:00:00.000Z').toISOString() : null,
          billOfQuantityId: this.billOfQuantityId,
        };

        await api.post('/purchase-order/request', params);
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
