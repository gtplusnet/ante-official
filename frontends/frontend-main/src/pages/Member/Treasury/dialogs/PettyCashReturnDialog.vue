<template>
  <q-dialog v-model="dialogModel" ref="dialog">
    <q-card class="full-width dialog-card" flat>
      <q-form @submit.prevent="returnPettyCash" ref="form">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Return Petty Cash to Fund Account</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12" v-if="holderData">
            <q-card flat class="bg-grey-1">
              <q-card-section>
                <div class="row items-center">
                  <div class="col">
                    <div class="text-h6">{{ holderData.account.name }}</div>
                    <div class="text-caption text-grey">{{ holderData.account.email }}</div>
                  </div>
                  <div class="col-auto">
                    <div class="text-right">
                      <div class="text-caption text-grey">Current Balance</div>
                      <div class="text-h5 text-primary">
                        ₱{{ formatCurrency(holderData.currentBalance) }}
                      </div>
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
          
          <div class="col-12">
            <q-select
              v-model="form.fundAccountId"
              :options="fundAccountOptions"
              label="Return to Fund Account"
              option-value="key"
              option-label="label"
              emit-value
              map-options
              :rules="[requiredRule]"
              filled
              dense
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption>
                      Balance: ₱{{ formatCurrency(scope.opt.balance || 0) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
          
          <div class="col-12">
            <q-input
              v-model.number="form.amount"
              label="Amount to Return"
              type="number"
              prefix="₱"
              :rules="[
                requiredRule, 
                v => v > 0 || 'Amount must be greater than 0',
                v => v <= holderData.currentBalance || 'Amount exceeds current balance'
              ]"
              filled
              dense
            />
          </div>
          
          <div class="col-12">
            <q-banner class="bg-green-1" flat>
              <template v-slot:avatar>
                <q-icon name="info" color="green" />
              </template>
              <div>
                <div>Petty Cash Balance: ₱{{ formatCurrency((holderData?.currentBalance || 0) - (form.amount || 0)) }}</div>
                <div v-if="selectedFundAccount">
                  Fund Account Balance: ₱{{ formatCurrency((selectedFundAccount.balance || 0) + (form.amount || 0)) }}
                </div>
              </div>
            </q-banner>
          </div>
          
          <div class="col-12">
            <q-input
              v-model="form.reason"
              label="Reason for Return"
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
          label="Return Petty Cash"
          color="green"
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
  name: 'PettyCashReturnDialog',
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
    requiredRule() {
      return v => !!v || 'This field is required';
    },
    selectedFundAccount() {
      return this.fundAccountOptions.find(fa => fa.key === this.form.fundAccountId);
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
        amount: null,
        reason: '',
        fundAccountId: this.holderData?.fundAccountId || null
      };
      this.loadFundAccounts();
    },
    async loadFundAccounts() {
      try {
        const response = await this.$api.get('/select-box/fund-account-list');
        this.fundAccountOptions = response.data.list;
        
        // Pre-select the original fund account if available
        if (this.holderData?.fundAccountId && !this.form.fundAccountId) {
          this.form.fundAccountId = this.holderData.fundAccountId;
        }
      } catch (error) {
        this.handleAxiosError(error);
      }
    },
    async returnPettyCash() {
      // Validate form first
      const valid = await this.$refs.form.validate();
      if (!valid) {
        return;
      }

      // Additional validation for reason field
      if (!this.form.reason || this.form.reason.trim() === '') {
        this.$q.notify({
          type: 'negative',
          message: 'Please provide a reason for the return'
        });
        return;
      }

      this.loading = true;
      try {
        await this.$api.post('/petty-cash/holder/return', {
          pettyCashHolderId: this.holderData.id,
          fundAccountId: this.form.fundAccountId,
          amount: this.form.amount,
          reason: this.form.reason.trim()
        });
        
        this.$q.notify({
          type: 'positive',
          message: 'Petty cash returned successfully'
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