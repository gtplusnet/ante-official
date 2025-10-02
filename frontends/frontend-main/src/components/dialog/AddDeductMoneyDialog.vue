<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div>{{ type == 'ADD' ? 'Add' : 'Deduct' }} Money</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="confirmSaveTransaction" class="row">
          <!-- Amount -->
          <div class="col-12 q-px-sm">
            <GInput min="0" type="number" label="Amount" v-model="form.amount">
            </GInput>
          </div>

          <!-- Memo -->
          <div class="col-12 q-px-sm">
            <GInput type="textarea" label="Remarks" v-model="form.memo">
            </GInput>
          </div>

          <div class="col-12 text-right">
            <q-btn no-caps class="q-mr-sm" outline label="Close" type="button" color="primary" v-close-popup />
            <q-btn no-caps unelevated :label="this.type == 'ADD' ? 'Add Money' : 'Deduct Money'" type="submit"
              color="primary" />
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
import GInput from "../../components/shared/form/GInput.vue";
import { api } from 'src/boot/axios';
export default {
  name: 'AddDeductMoneyDialog',
  components: {
    GInput,
  },
  props: {
    type: {
      type: String,
      required: true,
    },
    fundAccountId: {
      type: Number,
      required: true,
    },
  },
  data: () => ({
    form: {
      amount: 0,
      memo: '',
    }
  }),
  watch: {
  },
  methods: {
    confirmSaveTransaction() {
      if (Number(this.form.amount) <= 0) {
        this.$q.notify({
          message: 'Amount must be greater than 0',
          color: 'negative',
          position: 'top',
          timeout: 2000,
        });
        return;
      }
      else {
        this.$q.dialog({
          title: 'Confirm',
          message: `Are you sure you want to ${this.type == 'ADD' ? 'add' : 'deduct'} money?`,
          ok: true,
          cancel: true,
        }).onOk(() => {
          this.saveTransaction();
        });
      }

    },
    async saveTransaction() {
      try {
        await api.post('/fund-account/transaction', {
          fundAccountId: this.fundAccountId,
          type: this.type,
          amount: Number(this.form.amount),
          memo: this.form.memo,
        });

        this.$emit('close');
        this.$emit('saveDone');
        this.$refs.dialog.hide();
      } catch (error) {
        console.error(error);
      }
    },
    fetchData() {
      this.form = {
        amount: 0,
        memo: '',
      };
    },
  },
};
</script>
