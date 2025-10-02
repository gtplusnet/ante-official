<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div class="text-title-medium">Approve Payment Form</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="submitRequest">
          <div class="col">
            <!-- field: Memo: -->
            <div class="col-6">
              <div class="q-mx-sm">
                <div>
                  <g-input v-model="form.memo" label="Memo:" class="text-body-medium" />
                </div>
              </div>
            </div>

            <!-- Payment Account -->
            <div
              v-if="approvePaymentData.status.requiredFundAccount == true"
              class="col-12 q-px-sm q-mb-md"
            >
              <GInput
                type="select-search"
                apiUrl="/select-box/fund-account-list?exceptId"
                label="Payment Account"
                v-model="form.toFundAccountId"
              >
              </GInput>
            </div>
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
              class="text-label-large"
              label="Approve"
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
  name: 'CreateRequestForPaymentDialog',
  components: {
    GInput,
  },
  props: {
    approvePaymentData: {
      type: Object,
      default: () => null,
    },
  },
  data: () => ({
    form: {
      memo: '',
    },
  }),
  methods: {
    fetchData() {
      if (this.approvePaymentData) {
        // default memo sa dialog
        this.form.memo = this.approvePaymentData.memo || '';
      }
    },
    submitRequest() {
      const payload = {
        id: this.approvePaymentData.id,
        memo:
          this.form.memo.trim() !== ''
            ? this.form.memo
            : this.approvePaymentData.memo, // ito existing memo sa dialog
        fundAccountId: this.form.toFundAccountId,
      };

      console.log(payload);

      api
        .patch('rfp/approve', payload)
        .then(() => {
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
