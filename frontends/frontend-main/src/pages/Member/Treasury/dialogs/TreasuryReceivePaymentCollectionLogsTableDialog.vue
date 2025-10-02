<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div class="text-title-medium">Receive Payment</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="submitRequest">
          <div class="col">
            <!-- field: Receive Amount: -->
            <div class="col-6">
              <div class="q-mx-sm">
                <div>
                  <g-input
                    type="number"
                    v-model="form.amount"
                    label="Amount:"
                  />
                </div>
              </div>
            </div>

            <!-- Payment Account ID -->
            <div class="col-12 q-px-sm q-mb-md">
              <GInput
                type="select-search"
                apiUrl="/select-box/fund-account-list?exceptId"
                label="Receiving Account"
                v-model="form.toFundAccountId"
              >
              </GInput>
            </div>
          </div>

          <!-- actions -->
          <div class="text-right q-mt-lg">
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
              class="text-label-large"
              label="Receive Payment"
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
  max-width: 500px;
}
</style>

<script>
import { api } from 'src/boot/axios';
import GInput from "../../../../components/shared/form/GInput.vue";

export default {
  name: 'ReceivePaymentCollectionLogsTableDialog',
  components: {
    GInput,
  },
  props: {
    collectionData: {
      type: Object,
      default: () => null,
    },
  },
  data: () => ({
    form: {
      amount: null,
      toFundAccountId: null,
    },
  }),
  methods: {
    submitRequest() {
      const params = {
        collectionId: this.collectionData.id,
        paymentAmount: Number(this.form.amount),
        fundAccountId: Number(this.form.toFundAccountId),
      };

      api
        .patch('collection/receive-payment', params)
        .then(() => {
          console.log(params);
          this.$refs.dialog.hide();
          this.$emit('saveDone');
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });
    },
    fetchData() {
      this.form = {
        amount: this.collectionData.amount.raw,
      };
    },
  },
};
</script>
