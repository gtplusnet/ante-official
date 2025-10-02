<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="calendar_month" />
        <div>Adjust Next Maintenance Date</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="submitRequest">
          <div class="row">
            <div class="col-12">
              <div class="q-mx-sm">
                <div>
                  <g-input
                    type="date"
                    v-model="form.nextMaintenanceDate"
                    label="Next Maintenance Date"
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
import GInput from "../../components/shared/form/GInput.vue";

export default {
  name: 'NextMaintenanceDateAdjustmentDialog',
  components: {
    GInput,
  },
  props: {
    partsData: {
      type: Object,
      required: true,
    },
  },
  data: () => ({
    form: {},
  }),
  methods: {
    submitRequest() {
      const params = {
        partId: this.partsData.id,
        nextMaintenanceDate: new Date(
          this.form.nextMaintenanceDate
        ).toISOString(),
      };

      api
        .post('equipment/parts/set-next-maintenance-date', params)
        .then(() => {
          this.$refs.dialog.hide();
          this.$emit('saveDone');
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });
    },
    fetchData() {
      this.form.nextMaintenanceDate = this.partsData.nextMaintenanceDate.raw;
    },
  },
};
</script>
