<template>
  <q-dialog @before-show="initForm()" ref="dialog">
    <q-card style="width: 400px;">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div>Truck Load</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="updateDelivery" class="row">
          <!-- Choose Truck -->
          <div class="col-12 q-px-sm q-mb-md">
            <GInput type="select-search" apiUrl="/select-box/warehouse-list?inTransitWarehouseOnly=true"
              label="In Transit Warehouse" v-model="form.warehouseId">
            </GInput>
          </div>

          <div class="col-12 text-right">
            <q-btn no-caps class="q-mr-sm" outline label="Close" type="button" color="primary" v-close-popup />
            <q-btn no-caps unelevated label="Done" type="submit" color="primary" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>

  </q-dialog>
</template>

<script>
import GInput from "../../components/shared/form/GInput.vue";
import { api, environment } from 'src/boot/axios';

export default {
  name: 'TruckLoadDialog',
  components: {
    GInput,
  },
  props: {
    deliveryId: {
      type: Number,
      required: true,
    },
  },
  data: () => ({
    environment: environment,
    form: {},
  }),
  mounted() {
    this.initForm();
  },
  methods: {
    async initForm() {
    },
    async updateDelivery() {
      this.$q.loading.show();
      try {
        const param = {
          deliveryId: this.deliveryId,
          warehouseId: this.form.warehouseId,
        };

        const response = await api.post('/delivery/set-stage-for-delivery', param);
        console.log(response);

        this.$q.notify({
          color: 'positive',
          message: 'Delivery updated successfully',
          position: 'top',
        });

        this.$emit('close');
        this.$emit('saveDone');
        this.$refs.dialog.hide();
        this.initForm();
      } catch (error) {
        this.handleAxiosError(error);
      } finally {
        this.$q.loading.hide();
      }
    },
  },
};
</script>
