<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div class="text-title-medium">Start Collection</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="submitRequest">
          <div class="col">
            <!-- field: Amount: -->
            <div class="col-6">
              <div class="q-mx-sm">
                <div>
                  <g-input v-model="form.amount" label="Amount:" />
                </div>
              </div>
            </div>
          </div>

          <!-- actions -->
          <div class="text-right q-mt-md">
            <q-btn
              no-caps
              unelevated
              label="Submit"
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
}
</style>

<script>
import { api } from 'src/boot/axios';
import GInput from "../../components/shared/form/GInput.vue";

export default {
  name: 'CreateRequestForPaymentDialog',
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
    },
  }),
  methods: {
    fetchData() {
      this.form.amount = this.collectionData.amount.raw;
    },
    submitRequest() {
      const payload = {
        id: this.collectionData.id,
        amount: Number(this.form.amount),
      };

      api
        .post('/collection/start-collection', payload)
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
