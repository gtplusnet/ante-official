<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="wallet" />
        <div class="text-title-medium">Create Payment</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section>
        <q-form @submit.prevent="confirmPayment" class="row">
          <!-- Remaining Balance -->
          <div class="col-12 q-px-sm q-mb-md">
            <GInput
              required
              type="readonly"
              label="Unpaid Balance"
              v-model="form.balance"
            ></GInput>
          </div>

          <!-- Payment Account -->
          <div class="col-12 q-px-sm q-mb-md">
            <GInput
              type="select-search"
              apiUrl="/select-box/fund-account-list?exceptId"
              label="Payment Account"
              v-model="form.toFundAccountId"
            >
            </GInput>
          </div>

          <!-- Amount -->
          <div class="col-12 q-px-sm">
            <GInput
              required
              type="text"
              label="Payment Amount"
              v-model="form.amount"
            ></GInput>
          </div>

          <!-- Fee -->
          <div class="col-12 q-px-sm">
            <GInput
              required
              type="text"
              label="Transaction Fee"
              v-model="form.fee"
            ></GInput>
          </div>

          <div class="col-12 text-right">
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
              label="Create Payment"
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
  max-width: 500px;
  min-height: 260px;
}
</style>

<script>
import GInput from "../../../../components/shared/form/GInput.vue";
import { api } from 'src/boot/axios';

export default {
  name: 'PurchaseOrderPaymentDialog',
  components: {
    GInput,
  },
  props: {
    purchaseOrderId: {
      type: Number,
      default: null,
    },
    balance: {
      type: Number,
      default: 0,
    },
  },
  data: () => ({
    form: {},
  }),
  watch: {},
  methods: {
    confirmPayment() {
      this.$q
        .dialog({
          title: 'Confirm Payment',
          message: 'Are you sure you want to create this payment?',
          ok: true,
          cancel: true,
        })
        .onOk(() => {
          this.savePayment();
        });
    },
    savePayment() {
      this.$q.loading.show();

      api
        .post('/purchase-order/create-payment', {
          purchaseOrderId: this.purchaseOrderId,
          paymentAccountId: this.form.toFundAccountId,
          paymentAmount: Number(this.form.amount),
          fee: Number(this.form.fee),
        })
        .then(() => {
          this.$emit('saveDone');
          this.$emit('close');
          this.$refs.dialog.hide();
        })
        .catch((error) => {
          this.handleAxiosError(error);
        })
        .finally(() => {
          this.$q.loading.hide();
        });
    },
    fetchData() {
      this.form.balance = this.currencyFormat(this.balance);
      this.form.amount = this.balance;
      this.form.fee = 0;
    },
  },
};
</script>
