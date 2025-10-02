<template>
  <q-dialog v-model="dialogModel" ref="dialog">
    <q-card class="full-width dialog-card" flat>
      <q-form @submit.prevent="processPettyCash" ref="form">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ dialogTitle }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
    <div class="row q-col-gutter-md">
      <div class="col-12" v-if="holderData">
        <q-card flat class="bg-grey-1">
          <q-card-section>
            <div class="text-h6">{{ holderData.account.name }}</div>
            <div class="text-caption text-grey">{{ holderData.account.email }}</div>
            <div class="q-mt-sm">
              <div class="text-weight-medium">Current Balance</div>
              <div class="text-h5 text-primary">
                ₱{{ formatCurrency(holderData.currentBalance) }} 
                <span class="text-caption text-grey">of ₱{{ formatCurrency(holderData.initialAmount) }}</span>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      
      <div class="col-12">
        <q-btn-toggle
          v-model="form.type"
          spread
          no-caps
          flat
          toggle-color="primary"
          :options="[
            {label: 'Refill', value: 'refill'},
            {label: 'Deduct', value: 'deduct'}
          ]"
        />
      </div>
      
      <div class="col-12" v-if="form.type === 'refill'">
        <q-select
          v-model="form.fundAccountId"
          :options="fundAccountOptions"
          label="Source Fund Account"
          option-value="key"
          option-label="label"
          emit-value
          map-options
          :rules="[requiredRule]"
          filled
          dense
        />
      </div>
      
      <div class="col-12">
        <q-input
          v-model.number="form.amount"
          :label="`Amount to ${form.type === 'refill' ? 'Refill' : 'Deduct'}`"
          type="number"
          prefix="₱"
          :rules="[
            requiredRule, 
            v => v > 0 || 'Amount must be greater than 0',
            v => form.type !== 'deduct' || v <= holderData.currentBalance || 'Amount exceeds current balance'
          ]"
          filled
          dense
        />
      </div>
      
      <div class="col-12" v-if="form.type === 'refill'">
        <q-banner class="bg-blue-1" flat>
          <template v-slot:avatar>
            <q-icon name="info" color="blue" />
          </template>
          New balance will be: ₱{{ formatCurrency((holderData?.currentBalance || 0) + (form.amount || 0)) }}
        </q-banner>
      </div>
      
      <div class="col-12" v-if="form.type === 'deduct'">
        <q-banner class="bg-orange-1" flat>
          <template v-slot:avatar>
            <q-icon name="warning" color="orange" />
          </template>
          New balance will be: ₱{{ formatCurrency((holderData?.currentBalance || 0) - (form.amount || 0)) }}
        </q-banner>
      </div>
      
      <div class="col-12">
        <q-input
          v-model="form.reason"
          :label="`Reason for ${form.type === 'refill' ? 'Refill' : 'Deduction'}`"
          type="textarea"
          rows="3"
          :rules="[
            requiredRule,
            v => (v && v.trim().length > 0) || 'Reason cannot be empty'
          ]"
          filled
          dense
        />
      </div>
    </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn
          :label="form.type === 'refill' ? 'Refill' : 'Deduct'"
          :color="form.type === 'refill' ? 'primary' : 'negative'"
          :loading="loading"
          type="submit"
          unelevated
        />
      </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script>
export default {
  name: 'PettyCashRefillDialog',
  components: {},
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    holderData: {
      type: Object,
      default: null
    }
  },
  emits: ['update:modelValue', 'saveDone'],
  data() {
    return {
      loading: false,
      fundAccountOptions: [],
      form: {
        type: 'refill',
        amount: null,
        reason: '',
        fundAccountId: null
      }
    };
  },
  computed: {
    dialogModel: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      }
    },
    dialogTitle() {
      return this.form.type === 'refill' ? 'Refill Petty Cash' : 'Deduct Petty Cash';
    },
    requiredRule() {
      return v => !!v || 'This field is required';
    }
  },
  watch: {
    modelValue(val) {
      if (val) {
        this.resetForm();
      }
    }
  },
  methods: {
    formatCurrency(value) {
      return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value || 0);
    },
    resetForm() {
      this.form = {
        type: 'refill',
        amount: null,
        reason: '',
        fundAccountId: null
      };
      this.loadFundAccounts();
    },
    async loadFundAccounts() {
      try {
        const response = await this.$api.get('/select-box/fund-account-list');
        this.fundAccountOptions = response.data.list;
      } catch (error) {
        this.handleAxiosError(error);
      }
    },
    async processPettyCash() {
      // Validate form first
      const valid = await this.$refs.form.validate();
      if (!valid) {
        return;
      }

      // Additional validation for reason field
      if (!this.form.reason || this.form.reason.trim() === '') {
        this.$q.notify({
          type: 'negative',
          message: 'Please provide a reason'
        });
        return;
      }

      this.loading = true;
      try {
        const endpoint = this.form.type === 'refill' 
          ? '/petty-cash/holder/refill'
          : '/petty-cash/holder/deduct';
          
        const payload = {
          pettyCashHolderId: this.holderData.id,
          amount: this.form.amount,
          reason: this.form.reason.trim()
        };
        
        // Only include fundAccountId for refill
        if (this.form.type === 'refill') {
          payload.fundAccountId = this.form.fundAccountId;
        }
        
        await this.$api.post(endpoint, payload);
        
        this.$q.notify({
          type: 'positive',
          message: `Petty cash ${this.form.type === 'refill' ? 'refilled' : 'deducted'} successfully`
        });
        this.$emit('saveDone');
        this.dialogModel = false;
      } catch (error) {
        this.handleAxiosError(error);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>