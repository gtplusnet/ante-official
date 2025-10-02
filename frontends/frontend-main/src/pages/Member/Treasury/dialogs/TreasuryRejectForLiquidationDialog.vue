<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div>Reject Payment Form</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="submitRequest">
          <div class="col">
            <!-- field: Memo: -->
            <div class="col-6">
              <div class="q-mx-sm">
                <div>
                  <g-input v-model="form.reason" label="Reason:" />
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
              label="Reject"
              type="submit"
              color="red"
            />
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
import GInput from "../../../../components/shared/form/GInput.vue";

export default {
  name: 'CreateRequestForPaymentDialog',
  components: {
    GInput,
  },
  props: {
    rejectForLiquidationData: {
      type: Object,
      default: () => null,
    },
  },
  data: () => ({
    form: {
      id: null,
      reason: null,
    },
  }),
  methods: {
    submitRequest() {
      const payload = {
        id: this.rejectForLiquidationData.data.id,
        reason: this.form.reason,
      };

      api
        .patch('petty-cash/liquidation/reject', payload)
        .then(() => {
          console.log(payload);

          this.$refs.dialog.hide();
          this.$emit('saveDone');
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });
    },
  },
};
</script>
