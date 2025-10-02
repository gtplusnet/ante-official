<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div class="text-title-medium">Add Part</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="submitRequest">
          <div class="row">
            <!-- field: part name -->
            <div class="col-12">
              <div class="q-mx-sm">
                <div>
                  <g-input v-model="form.partName" label="Part Name" class="text-body-medium" />
                </div>
              </div>
            </div>

            <!-- field: part name -->
            <div class="col-12">
              <div class="q-mx-sm">
                <div>
                  <g-input
                    type="number"
                    v-model="form.scheduleDay"
                    label="PMS Schedule (E.G Every 10 Days)"
                  />
                </div>
              </div>
            </div>
          </div>
          <!-- actions -->
          <div class="text-right q-mt-md">
            <q-btn
              no-caps
              class="q-mr-sm"
              outline
              label="Close"
              type="button"
              color="primary"
              v-close-popup
            />
            <q-btn
              no-caps
              unelevated
              label="Save"
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
  max-width: 400px;
}
</style>

<script>
import { api } from 'src/boot/axios';
import GInput from "../../../../components/shared/form/GInput.vue";

export default {
  name: 'AddEditEquipmentPartsDialog',
  components: {
    GInput,
  },
  props: {
    equipmentId: {
      type: Number,
      required: true,
    },
  },
  data: () => ({
    form: {
      partName: '',
      scheduleDay: 10,
    },
  }),
  methods: {
    submitRequest() {
      this.form.equipmentId = this.equipmentId;
      this.form.scheduleDay = parseInt(this.form.scheduleDay, 10);

      api
        .post('equipment/part', this.form)
        .then(() => {
          this.$refs.dialog.hide();
          this.$emit('saveDone');
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });
    },
    fetchData() {
      this.form = {
        partName: '',
        scheduleDay: 10,
      };
    },
  },
};
</script>
