<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div>Transfer Money</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="confirmSaveTransaction" class="row">
          <!-- Select Transfer Account -->
          <div class="col-12 q-px-sm q-mb-md">
            <GInput type="select-search" :apiUrl="`/select-box/fund-account-list?exceptId=${this.fundAccountId}`"
              label="Transfer Account" v-model="form.toFundAccountId">
            </GInput>
          </div>

          <!-- Amount -->
          <div class="col-6 q-px-sm">
            <GInput min="0" type="number" label="Amount" v-model="form.amount">
            </GInput>
          </div>

          <!-- Fee -->
          <div class="col-6 q-px-sm">
            <GInput min="0" type="number" label="Transfer Fee" v-model="form.fee">
            </GInput>
          </div>

          <!-- Memo -->
          <div class="col-12 q-px-sm">
            <GInput type="textarea" label="Remarks" v-model="form.memo">
            </GInput>
          </div>
          <div class="col-12 text-right">
            <q-btn no-caps class="q-mr-sm" outline label="Close" type="button" color="primary" v-close-popup />
            <q-btn no-caps unelevated label="Submit Transfer" type="submit" color="primary" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 500px;
  min-height: 350px;
}
</style>

<script>
import GInput from "../../../../components/shared/form/GInput.vue";
import { api } from 'src/boot/axios';

export default {
  name: 'TransferMoneyDialog',
  components: {
    GInput,
  },
  props: {
    fundAccountId: {
      type: Number,
      required: true,
    },
  },
  data: () => ({
    form: {
      toFundAccountId: 0,
      amount: 0,
      fee: 0,
      memo: '',
    }
  }),
  watch: {
  },
  methods: {
    confirmSaveTransaction() {
      if (this.form.amount <= 0) {
        this.$q.notify({
          message: 'Amount must be greater than 0',
          color: 'negative',
          position: 'top',
        });

        return;
      }
      else {
        this.$q.dialog({
          title: 'Confirm Transfer',
          message: `Are you sure you want to transfer ${this.currencyFormat(this.form.amount)}?`,
          ok: true,
          cancel: true,
        }).onOk(() => {
          this.saveTransaction();
        });
      }
    },
    saveTransaction() {
      const params = {
        fromFundAccountId: this.fundAccountId,
        toFundAccountId: this.form.toFundAccountId,
        amount: Number(this.form.amount),
        fee: Number(this.form.fee),
        memo: this.form.memo,
      };

      api.post('/fund-account/transaction/transfer', params)
        .then(() => {
          this.$q.notify({
            message: 'Transfer money successfully',
            color: 'positive',
            position: 'top',
          });

          this.$emit('success');
          this.$emit('close');
          this.$refs.dialog.hide();
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });
    },
    fetchData() {
      this.form = {
        toFundAccountId: 0,
        amount: 0,
        fee: 0,
        memo: '',
      };
    },
  },
};
</script>
