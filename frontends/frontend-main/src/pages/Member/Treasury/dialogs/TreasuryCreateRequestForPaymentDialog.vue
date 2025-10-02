<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div class="text-title-medium">Request For Payment Form</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="submitRequest">
          <div class="row">
            <!-- field: Payee Type: -->
            <div class="col-6 q-mb-md">
              <div class="q-mx-sm">
                <div>
                  <g-input
                    label="Payee Type"
                    v-model="form.payeeType"
                    type="select"
                    apiUrl="/select-box/payee-type"
                  ></g-input>
                </div>
              </div>
            </div>

            <!-- field: PayeeID for CLIENT -->
            <div class="col-6">
              <div class="q-mx-sm">
                <div v-if="form.payeeType == 'SUPPLIER'">
                  <SupplierSelection v-model="form.payeeId" />
                </div>
                <div v-else-if="form.payeeType == 'EMPLOYEE'">
                  <EmployeeSelection v-model="form.payeeId" />
                </div>
                <div v-else-if="form.payeeType == 'CLIENT'">
                  <ClientSelection v-model="form.payeeId" />
                </div>
                <div v-else-if="form.payeeType == 'GOVERNMENT'">
                  <g-input
                    v-model="form.payeeId.null"
                    label="Government Name:"
                  />
                </div>
                <div v-else-if="form.payeeType == 'OTHER'">
                  <g-input v-model="form.payeeId.null" label="Other Name:" />
                </div>
              </div>
            </div>

            <!-- field: Purchase Order ID: -->
            <div v-if="form.payeeType == 'SUPPLIER'" class="col-6">
              <div class="q-mx-sm">
                <div>
                  <g-input
                    type="number"
                    v-model="form.purchaseOrderId"
                    label="Purchase Order ID:"
                  />
                </div>
              </div>
            </div>

            <!-- field: Payment Type: -->
            <div class="col-6">
              <div class="q-mx-sm">
                <div>
                  <PaymentSelection v-model="form.paymentType" />
                </div>
              </div>
            </div>

            <!-- field: Project ID: -->
            <div class="col-6 q-mb-md">
              <div class="q-mx-sm">
                <div>
                  <ProjectSelection v-model="form.projectId" />
                </div>
              </div>
            </div>

            <!-- field: Amount: -->
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

            <!-- field: Memo: -->
            <div class="col-6">
              <div class="q-mx-sm">
                <div>
                  <g-input v-model="form.memo" label="Memo:" />
                </div>
              </div>
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
  max-width: 900px;
}
</style>

<script>
import { api } from 'src/boot/axios';
import GInput from "../../../../components/shared/form/GInput.vue";
import ProjectSelection from "../../../../components/selection/ProjectSelection.vue";
import SupplierSelection from "../../../../components/selection/SupplierSelection.vue";
import EmployeeSelection from "../../../../pages/Member/Manpower/components/selections/ManpowerEmployeeSelection.vue";
import PaymentSelection from "../../../../components/selection/PaymentSelection.vue";
import ClientSelection from "../../../../components/selection/ClientSelection.vue";

export default {
  name: 'CreateRequestForPaymentDialog',
  components: {
    GInput,
    ProjectSelection,
    SupplierSelection,
    EmployeeSelection,
    PaymentSelection,
    ClientSelection,
  },
  props: {},
  data: () => ({
    form: {
      payeeType: null,
      payeeId: null,
      purchaseOrderId: null,
      paymentType: null,
      projectId: null,
      amount: null,
      memo: null,
    },
  }),
  methods: {
    submitRequest() {
      this.form.purchaseOrderId = Number(this.form.purchaseOrderId);
      this.form.projectId = Number(this.form.projectId);
      this.form.amount = Number(this.form.amount);

      api
        .post('/rfp/create', this.form)
        .then(() => {
          this.$refs.dialog.hide();
          this.$emit('saveDone');
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });
    },
    fetchData() {
      this.form = {};
    },
  },
};
</script>
