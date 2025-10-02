<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <div @dblclick="fillData()" class="text-title-medium">
          {{ this.supplierInformation ? 'Edit' : 'Create' }} Supplier Account
        </div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <form v-if="initialDataLoaded" @submit.prevent="save">
          <div class="row">
            <!-- Supplier Name -->
            <div class="col-6 q-px-sm">
              <g-input
                required
                type="text"
                label="Supplier Name"
                v-model="form.name"
                class="text-body-medium"
              ></g-input>
            </div>

            <!-- Contact Number -->
            <div class="col-6 q-px-sm">
              <g-input
                required
                type="text"
                label="Contact Number"
                v-model="form.contactNumber"
                class="text-body-medium"
              ></g-input>
            </div>

            <!-- Email -->
            <div class="col-6 q-px-sm">
              <g-input
                required
                type="text"
                label="Email"
                v-model="form.email"
                class="text-body-medium"
              ></g-input>
            </div>

            <!-- Location -->
            <div class="col-6 q-px-sm">
              <g-input
                required
                type="select"
                apiUrl="select-box/location-list"
                label="Location"
                v-model="form.locationId"
                class="text-body-medium"
              ></g-input>
            </div>

            <!-- Tax Type -->
            <div class="col-6 q-px-sm">
              <g-input
                required
                type="select"
                apiUrl="select-box/tax-list"
                label="Tax Type"
                v-model="form.taxType"
                class="text-body-medium"
              ></g-input>
            </div>

            <!-- Payment Terms -->
            <div class="col-6 q-px-sm">
              <g-input
                required
                type="select"
                apiUrl="select-box/payment-terms-list"
                label="Payment Terms"
                v-model="form.paymentTerms"
                class="text-body-medium"
              ></g-input>
            </div>
            <div class="col-12 text-right q-mt-md">
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
                :label="supplierInformation ? 'Update' : 'Save'"
                type="submit"
                color="primary"
                class="text-label-large"
              />
            </div>
          </div>
        </form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 700px;
}
</style>

<script>
import GInput from "../../../../components/shared/form/GInput.vue";
import { api, environment } from 'src/boot/axios';
export default {
  name: 'AddEditSupplierDialog',
  components: {
    GInput,
  },
  props: {
    supplierInformation: {
      type: Object || null,
      default: null,
    },
  },
  data: () => ({
    environment: environment,
    form: {},
  }),
  watch: {},
  methods: {
    async fillData() {
      this.$q.loading.show();
      const { data } = await api.get('https://randomuser.me/api');
      const personInformation = data.results[0];

      this.form.name = `${personInformation.name.first} ${personInformation.name.last}`;
      this.form.contactNumber = personInformation.phone;
      this.form.email = personInformation.email;

      this.$q.loading.hide();
    },
    async save() {
      this.$q.loading.show();

      if (this.supplierInformation) {
        await this.apiUpdate();
      } else {
        await this.apiSave();
      }
    },
    apiSave() {
      api
        .post('supplier', this.form)
        .then((data) => {
          this.$q.loading.hide();
          this.$emit('saveDone', data.data.data);
          this.$refs.dialog.hide();
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });
    },
    apiUpdate() {
      api
        .patch(`supplier/${this.supplierInformation.id}`, this.form)
        .then(() => {
          this.$q.loading.hide();
          this.$emit('saveDone');
          this.$refs.dialog.hide();
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });
    },
    fetchData() {
      this.$q.loading.show();
      this.initialDataLoaded = false;

      if (this.supplierInformation) {
        this.form = {
          name: this.supplierInformation.name,
          contactNumber: this.supplierInformation.contactNumber,
          email: this.supplierInformation.email,
          locationId: this.supplierInformation.locationId,
          taxType: this.supplierInformation.taxType.key,
          paymentTerms: this.supplierInformation.paymentTerms.key,
        };
        this.$q.loading.hide();
        this.initialDataLoaded = true;
      } else {
        this.form = {
          name: '',
          contactNumber: '',
          email: '',
          locationId: null,
          taxType: null,
          paymentTerms: null,
        };
        this.$q.loading.hide();
        this.initialDataLoaded = true;
      }
    },
  },
};
</script>
