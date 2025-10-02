<template>
  <q-dialog v-model="dialogModel" ref="dialog">
    <q-card class="full-width dialog-card" flat>
      <q-form @submit.prevent="transferPettyCash" ref="form">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Transfer Petty Cash</div>
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
                    <div class="text-subtitle2 text-grey">From:</div>
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
              v-model="form.toHolderId"
              :options="holderOptions"
              label="Transfer to Employee"
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
                      Current Balance: ₱{{ formatCurrency(scope.opt.currentBalance || 0) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
          
          <div class="col-12">
            <q-input
              v-model.number="form.amount"
              label="Amount to Transfer"
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
            <q-banner class="bg-purple-1" flat>
              <template v-slot:avatar>
                <q-icon name="info" color="purple" />
              </template>
              <div>
                <div class="text-weight-medium">Balance Changes:</div>
                <div class="q-mt-xs">
                  <q-icon name="arrow_downward" color="negative" size="16px" />
                  {{ holderData?.account.name }}: 
                  ₱{{ formatCurrency(holderData?.currentBalance || 0) }} → 
                  ₱{{ formatCurrency((holderData?.currentBalance || 0) - (form.amount || 0)) }}
                </div>
                <div v-if="selectedHolder">
                  <q-icon name="arrow_upward" color="positive" size="16px" />
                  {{ selectedHolder.label }}: 
                  ₱{{ formatCurrency(selectedHolder.currentBalance || 0) }} → 
                  ₱{{ formatCurrency((selectedHolder.currentBalance || 0) + (form.amount || 0)) }}
                </div>
              </div>
            </q-banner>
          </div>
          
          <div class="col-12">
            <q-input
              v-model="form.reason"
              label="Reason for Transfer"
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
          label="Transfer Petty Cash"
          color="purple"
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
  name: 'PettyCashTransferDialog',
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
      holderOptions: [],
      form: {
        toHolderId: null,
        amount: null,
        reason: ''
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
    selectedHolder() {
      return this.holderOptions.find(h => h.key === this.form.toHolderId);
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
        toHolderId: null,
        amount: null,
        reason: ''
      };
      this.loadHolders();
    },
    async loadHolders() {
      try {
        const response = await this.$api.get('/petty-cash/holder/list');
        // Filter out the current holder and inactive holders
        this.holderOptions = response.data
          .filter(h => h.id !== this.holderData.id && h.isActive)
          .map(h => ({
            key: h.id,
            label: h.account.name,
            currentBalance: h.currentBalance
          }));
      } catch (error) {
        this.handleAxiosError(error);
      }
    },
    async transferPettyCash() {
      // Validate form first
      const valid = await this.$refs.form.validate();
      if (!valid) {
        return;
      }

      // Additional validation for reason field
      if (!this.form.reason || this.form.reason.trim() === '') {
        this.$q.notify({
          type: 'negative',
          message: 'Please provide a reason for the transfer'
        });
        return;
      }

      this.loading = true;
      try {
        await this.$api.post('/petty-cash/holder/transfer', {
          fromHolderId: this.holderData.id,
          toHolderId: this.form.toHolderId,
          amount: this.form.amount,
          reason: this.form.reason.trim()
        });
        
        this.$q.notify({
          type: 'positive',
          message: 'Petty cash transferred successfully'
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