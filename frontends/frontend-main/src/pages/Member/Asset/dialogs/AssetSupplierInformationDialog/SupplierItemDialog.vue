<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div v-if="itemId">Edit Supplier Item</div>
        <div v-else>Add Supplier Item</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="submitRequest">
          <div class="row">
            <!-- field: first name -->
            <div class="col-12" v-if="!itemId">
              <div class="q-mx-sm">
                <div>
                  <g-input type="choose_item" v-model="form.itemInformation" label="Item" />
                </div>
              </div>
            </div>

            <!-- field: last name -->
            <div class="col-12">
              <div class="q-mx-sm">
                <div>
                  <g-input type="number" v-model="form.price" label="Price" />
                </div>
              </div>
            </div>
          </div>

          <!-- actions -->
          <div class="text-right q-mt-md">
            <q-btn no-caps class="q-mr-sm" outline label="Close" type="button" color="primary" v-close-popup />
            <q-btn no-caps unelevated label="Save" type="submit" color="primary" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 500px;
}
</style>

<script>
import { api } from 'src/boot/axios';
import GInput from '../../../../../components/shared/form/GInput.vue';

export default {
  name: 'SupplierItemDialog',
  components: {
    GInput,
  },
  props: {
    supplierId: {
      type: Number,
      required: true,
    },
    itemId: {
      type: String,
      default: null,
    }
  },
  data: () => ({
    form: {
      itemInformation: null,
      price: '',
    },
  }),
  methods: {
    submitRequest() {

      if (!this.form.itemInformation && !this.itemId) {
        this.$q.notify({
          message: 'Please select item',
          color: 'negative',
          position: 'top',
          icon: 'report_problem',
        });
        return;
      }

      const formData = {
        itemId: this.itemId ? this.itemId : this.form.itemInformation.id,
        supplierId: this.supplierId,
        price: this.form.price,
      }

      if (!formData.price) {
        this.$q.notify({
          message: 'Please enter price',
          color: 'negative',
          position: 'top',
          icon: 'report_problem',
        });
        return;
      }

      api.post('supplier/update-price', formData)
        .then(() => {
          this.$refs.dialog.hide();
          this.$emit('saveDone');
        }).catch((error) => {
          this.handleAxiosError(error);
        });
    },
    fetchData() {
      this.form = {};
    },
  },
};
</script>
