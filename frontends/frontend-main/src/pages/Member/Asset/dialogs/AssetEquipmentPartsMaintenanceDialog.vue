<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="check" />
        <div class="text-title-medium">
          {{ isWorking ? 'Maintenance Form' : 'Job Order' }}
        </div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="submitRequest">
          <div class="row">
            <!-- field: last name -->
            <div class="col-12">
              <div class="q-mx-sm">
                <div>
                  <g-input
                    type="file"
                    v-model="form.uploadProof"
                    label="Upload Proof"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Maintenance Table -->
          <div
            v-if="!isWorking && itemListBreakdown.length"
            class="text-center q-mt-md text-title-small"
          >
            Repair Items
          </div>
          <table
            v-if="!isWorking && itemListBreakdown.length"
            class="global-table q-mt-md"
          >
            <thead>
              <tr class="text-title-small">
                <th width="40px"></th>
                <th class="text-left">Item Name</th>
                <th class="text-left">Item SKU</th>
                <th class="text-center">Quantity</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in itemListBreakdown" :key="item.id" class="text-body-small">
                <td><q-checkbox v-model="item.isNeeded" /></td>
                <td class="text-left">{{ item.item.name }}</td>
                <td class="text-left">{{ item.item.sku }}</td>
                <td class="text-center">{{ item.quantity }}</td>
              </tr>
            </tbody>
          </table>

          <!-- actions -->
          <div class="text-right q-mt-md">
            <q-btn
              no-caps
              class="q-mr-sm text-label-large"
              outline
              label="Close"
              type="button"
              color="primary"
              v-close-popup
            />
            <q-btn
              no-caps
              unelevated
                :label="isWorking ? 'Check Done' : 'Issue Job Order'"
              type="submit"
              color="primary"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 600px;
}
</style>

<script>
import { api } from 'src/boot/axios';
import GInput from "../../../../components/shared/form/GInput.vue";

export default {
  name: 'EquipmentPartsMaintenanceDialog',
  components: {
    GInput,
  },
  props: {
    partId: {
      type: Number,
      required: true,
    },
    isWorking: {
      type: Boolean,
      required: true,
    },
  },
  data: () => ({
    form: {},
    itemListBreakdown: [],
  }),
  methods: {
    submitRequest() {
      this.form.partId = this.partId;
      this.form.isWorking = this.isWorking;
      this.form.repairItemBreakdown = this.itemListBreakdown
        .filter((item) => item.isNeeded)
        .map((item) => {
          return {
            id: item.id,
            itemId: item.item.id,
            quantity: item.quantity,
          };
        });

      if (!this.form.uploadProof) {
        this.$q.notify({
          message: 'Please upload proof',
          color: 'negative',
          position: 'top',
        });
        return;
      }

      this.$q.loading.show();
      this.form.maintenanceProof = this.form.uploadProof.id;

      api
        .post('equipment/parts-maintenance', this.form)
        .then(() => {
          this.$refs.dialog.hide();
          this.$emit('saveDone');
        })
        .catch((error) => {
          this.handleAxiosError(error);
        })
        .finally(() => {
          this.$q.loading.hide();
        });
    },
    fetchData() {
      if (this.isWorking) {
        return;
      } else {
        this.$q.loading.show();

        api
          .get('equipment/parts-items', {
            params: {
              partId: this.partId,
            },
          })
          .then((response) => {
            this.itemListBreakdown = response.data.map((item) => ({
              ...item,
              isNeeded: true,
            }));
          })
          .catch((error) => {
            this.handleAxiosError(error);
          })
          .finally(() => {
            this.$q.loading.hide();
          });
      }
    },
  },
};
</script>
