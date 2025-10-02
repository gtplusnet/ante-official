<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div @dblclick="fillData" class="text-title-medium">{{ this.id ? 'Edit' : 'Add' }} Equipment</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="submitRequest">
          <div class="row">
            <!-- field: item name -->
            <div class="col-6">
              <div class="q-mx-sm">
                <div>
                  <g-input v-model="form.name" label="Item Name" class="text-body-medium" />
                </div>
              </div>
            </div>

            <!-- field: serial code -->
            <div class="col-6">
              <div class="q-mx-sm">
                <div>
                  <g-input v-model="form.serialCode" label="Serial Code" />
                </div>
              </div>
            </div>

            <!-- field: type -->
            <div class="col-6">
              <div class="q-mx-sm">
                <div>
                  <g-input
                    label="Equipment Type"
                    v-model="form.equipmentType"
                    type="select"
                    apiUrl="select-box/equipment-type-list"
                    class="text-body-medium"
                  ></g-input>
                </div>
              </div>
            </div>

            <!-- field: type -->
            <div class="col-6">
              <div class="q-mx-sm">
                <div>
                  <brand-selection v-model="form.brandId" class="text-body-medium" />
                </div>
              </div>
            </div>

            <!-- field: type -->
            <div class="col-12 q-mt-md">
              <div class="q-mx-sm">
                <div>
                  <warehouse-selection v-model="form.currentWarehouseId" class="text-body-medium"/>
                </div>
              </div>
            </div>
          </div>

          <!-- parts -->
          <add-edit-equipment-parts
            :equipmentId="id"
            v-if="id"
          />

          <!-- Asset Media Section -->
          <div v-if="id" class="q-mt-lg">
            <q-separator class="q-mb-md" />
            <div class="text-subtitle1 q-mb-md">
              <q-icon name="o_inventory_2" class="q-mr-sm" />Equipment Media
            </div>
            <asset-equipment-media :equipment-id="id" />
          </div>

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
              :label="this.id ? 'Update' : 'Save'"
              type="submit"
              color="primary"
              class="text-label-large"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 700px;
}
</style>

<script>
import { api } from 'src/boot/axios';
import GInput from "../../../../components/shared/form/GInput.vue";
import WarehouseSelection from '../components/selections/AssetWarehouseSelection.vue';
import BrandSelection from '../../../../components/selection/BrandSelection.vue';
import AddEditEquipmentParts from './AssetAddEditEquipmentParts.vue';
import AssetEquipmentMedia from '../components/AssetEquipmentMedia.vue';

export default {
  name: 'AddEditEquipmentDialog',
  components: {
    GInput,
    WarehouseSelection,
    BrandSelection,
    AddEditEquipmentParts,
    AssetEquipmentMedia,
  },
  props: {
    id: {
      type: Number,
      default: null,
    },
  },
  data: () => ({
    form: {},
  }),
  methods: {
    submitRequest() {
      this.form.id = this.id;

      api
        .post('equipment', this.form)
        .then(() => {
          this.$refs.dialog.hide();
          this.$emit('saveDone');
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });
    },
    fillData() {
      this.form.name = 'Test' + Math.random().toString(36).substring(7);
      this.form.serialCode = Math.random().toString(36).substring(7);
    },
    fetchData() {
      this.$q.loading.show();
      this.form = {};
      this.form.id = this.id;

      if (this.id) {
        api
          .get(`equipment?id=${this.id}`)
          .then((response) => {
            const responseData = response.data.equipmentData;

            this.form.name = responseData.name;
            this.form.serialCode = responseData.serialCode;
            this.form.equipmentType = responseData.equipmentType;
            this.form.brandId = responseData.brandId;
            this.form.currentWarehouseId = responseData.currentWarehouseId;
          })
          .catch((error) => {
            this.handleAxiosError(error);
          })
          .finally(() => {
            this.$q.loading.hide();
          });

        return;
      } else {
        this.$q.loading.hide();
      }
    },
  },
};
</script>
