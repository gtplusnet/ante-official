<template>
  <q-dialog @before-show="initForm" ref="dialog">
    <q-card class="full-width">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="add" />
        <div @dblclick="fillData()" class="text-title-medium"> {{ this.fundAccountInformation ? 'Edit' : 'Add' }} Fund Account </div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section>
        <q-form @submit.prevent="save" class="row">
          <!-- Type -->
          <div class="col-12 q-px-sm q-mb-md">
            <GInput ref="fundAccountTypeSelect" type="select-search" apiUrl="/select-box/fund-account-type-list"
              label="Fund Account Type" v-model="form.type">
            </GInput>
          </div>
          <!-- Name -->
          <div class="col-6 q-px-sm">
            <GInput required type="text" label="Name" v-model="form.name"></GInput>
          </div>
          <!-- Name -->
          <div class="col-6 q-px-sm">
            <GInput required type="text" label="Account Number" v-model="form.accountNumber"></GInput>
          </div>
          <!-- Initial Balance -->
          <div v-if="!fundAccountInformation" class="col-12 q-px-sm">
            <GInput required type="number" label="Initial Balance" v-model="form.initialBalance"></GInput>
          </div>
          <!-- Description -->
          <div class="col-12 q-px-sm">
            <GInput type="textarea" label="Description" v-model="form.description"></GInput>
          </div>
          <div class="col-12 text-right">
            <q-btn no-caps class="q-mr-sm text-label-large" outline label="Close" type="button" color="primary" v-close-popup />
            <q-btn no-caps unelevated class="text-label-large" :label="this.fundAccountInformation
                ? 'Update Fund Account'
                : 'Save Fund Account'
              " type="submit" color="primary" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
<script>
import GInput from "../../../../components/shared/form/GInput.vue";
import { api, environment } from 'src/boot/axios';

export default {
  name: 'AddEditFundAccount',
  components: {
    GInput,
  },
  props: {
    fundAccountInformation: {
      type: Object || null,
      default: null,
    },
  },
  data: () => ({
    environment: environment,
    form: {},
  }),
  mounted() {
    this.initForm();
  },
  methods: {
    async initForm() {
      this.form = {
        name: '',
        accountNumber: '',
        initialBalance: 0,
        description: '',
        type: null,
      };

      if (this.fundAccountInformation) {
        this.form = {
          name: this.fundAccountInformation.name,
          accountNumber: this.fundAccountInformation.accountNumber,
          description: this.fundAccountInformation.description,
          type: this.fundAccountInformation.type.key,
        };
      }

      const today = new Date();
      this.form.dueDate = today.toISOString().substr(0, 10);
    },
    async fillData() {
      if (environment === 'development') {
        const randomNumber = Math.floor(Math.random() * 1000);
        this.form.name = `Fund Account ${randomNumber}`;
        this.form.accountNumber = `1234567890${randomNumber}`;
        this.form.initialBalance = randomNumber * 1000;

        this.$q.notify({
          color: 'grey-8',
          message: 'Data filled successfully',
          position: 'top',
        });
      }
    },
    async save() {
      this.$q.loading.show();
      try {
        const param = {
          name: this.form.name,
          accountNumber: this.form.accountNumber,
          initialBalance: this.form.initialBalance,
          type: this.form.type,
          description: this.form.description,
        };

        if (this.fundAccountInformation) {
          param.id = this.fundAccountInformation.id;
          await api.patch('/fund-account', param);
        } else {
          await api.post('/fund-account', param);
        }

        this.$q.notify({
          color: 'positive',
          message:
            'Fund account successfully ' +
            (this.fundAccountInformation ? 'updated.' : 'added.'),
          position: 'top',
        });
        this.$emit('close');
        this.$emit('saveDone');
        this.$refs.dialog.hide();
        this.initForm();
      } catch (error) {
        this.handleAxiosError(error);
      } finally {
        this.$q.loading.hide();
      }
    },
  },
};
</script>
