<template>
  <q-dialog v-model="dialogModel" ref="dialog">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="account_balance_wallet" />
        <div>Assign Petty Cash</div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form @submit.prevent="assignPettyCash" ref="form">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <!-- Account Selection -->
              <div v-if="!selectedAccount" class="q-gutter-sm">
                <div class="text-subtitle2 q-mb-xs">Account *</div>
                <q-btn
                  label="Select Account"
                  icon="person_search"
                  color="primary"
                  outline
                  @click="showAccountDialog = true"
                  class="full-width"
                />
              </div>
              <div v-else class="account-selection-display">
                <div class="text-subtitle2 q-mb-xs">Selected Account</div>
                <q-card flat bordered class="bg-grey-1">
                  <q-card-section class="q-py-sm">
                    <div class="row items-center">
                      <div class="col">
                        <div class="text-body1 text-weight-medium">
                          {{ selectedAccount.fullName }}
                        </div>
                        <div class="text-caption text-grey-7">
                          @{{ selectedAccount.username }} - {{ selectedAccount.role || 'No Role' }}
                        </div>
                      </div>
                      <div class="col-auto">
                        <q-btn
                          label="Change"
                          size="sm"
                          flat
                          color="primary"
                          @click="showAccountDialog = true"
                        />
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
            
            <div class="col-12">
              <q-select
                v-model="form.fundAccountId"
                :options="fundAccountOptions"
                label="Source Fund Account"
                option-value="key"
                option-label="label"
                emit-value
                map-options
                :rules="[requiredRule]"
                outlined
                dense
              />
            </div>
            
            <div class="col-12">
              <q-input
                v-model.number="form.initialAmount"
                label="Initial Amount"
                type="number"
                prefix="₱"
                :rules="[requiredRule, v => v > 0 || 'Amount must be greater than 0']"
                outlined
                dense
              />
            </div>
            
            <div class="col-12">
              <q-input
                v-model="form.reason"
                label="Reason for Assignment"
                type="textarea"
                rows="3"
                :rules="[requiredRule]"
                outlined
                dense
              />
            </div>
          </div>
        </q-form>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn
          label="Assign"
          color="primary"
          :loading="loading"
          @click="assignPettyCash"
        />
      </q-card-actions>
    </q-card>

    <!-- Account Selection Dialog -->
    <SelectSingleAccountDialog
      v-model="showAccountDialog"
      @account-selected="handleAccountSelected"
    />
  </q-dialog>
</template>

<script>
import { defineAsyncComponent } from 'vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const SelectSingleAccountDialog = defineAsyncComponent(() =>
  import('./SelectSingleAccountDialog.vue')
);

export default {
  name: 'PettyCashAssignmentDialog',
  components: {
    SelectSingleAccountDialog
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'saveDone'],
  data() {
    return {
      loading: false,
      showAccountDialog: false,
      selectedAccount: null,
      fundAccountOptions: [],
      form: {
        accountId: null,
        fundAccountId: null,
        initialAmount: null,
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
    handleAxiosError(error) {
      // Override the global error handler for better petty cash specific messages
      if (error.response?.data) {
        const data = error.response.data;
        let errorMessage = '';
        
        // Check for errorMessage field first (as shown in your error structure)
        if (data.errorMessage) {
          errorMessage = data.errorMessage;
        } else if (data.message) {
          // Fallback to message field
          if (Array.isArray(data.message)) {
            errorMessage = data.message[0];
          } else {
            errorMessage = data.message;
          }
        } else {
          // Generic error message
          errorMessage = 'An error occurred while processing your request';
        }
        
        // Show notification for better visibility
        this.$q.notify({
          type: 'negative',
          message: errorMessage,
          position: 'top',
          timeout: 5000,
          actions: [
            { label: 'Dismiss', color: 'white' }
          ]
        });
        
        // Also show dialog for critical errors
        if (errorMessage.includes('already has an active petty cash')) {
          this.$q.dialog({
            title: 'Cannot Assign Petty Cash',
            message: errorMessage,
            persistent: true,
            ok: {
              label: 'Understood',
              color: 'primary'
            }
          });
        }
      } else {
        // Fallback to global handler if no response data
        this.$q.notify({
          type: 'negative',
          message: 'An unexpected error occurred',
          position: 'top'
        });
      }
    },
    resetForm() {
      this.form = {
        accountId: null,
        fundAccountId: null,
        initialAmount: null,
        reason: ''
      };
      this.selectedAccount = null;
      this.loadFundAccounts();
    },
    async loadFundAccounts() {
      try {
        const response = await this.$api.get('/select-box/fund-account-list');
        this.fundAccountOptions = response.data.list;
      } catch (error) {
        // Use local error handler
        this.handleAxiosError(error);
      }
    },
    handleAccountSelected(account) {
      this.selectedAccount = account;
      this.form.accountId = account.id;
      this.showAccountDialog = false;
    },
    async assignPettyCash() {
      // Validate account selection
      if (!this.form.accountId) {
        this.$q.notify({
          type: 'negative',
          message: 'Please select an account'
        });
        return;
      }

      // Validate form
      const valid = await this.$refs.form.validate();
      if (!valid) {
        return;
      }

      this.loading = true;
      try {
        await this.$api.post('/petty-cash/holder/assign', this.form);
        this.$q.notify({
          type: 'positive',
          message: 'Petty cash assigned successfully'
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

<style scoped>
.dialog-card {
  max-width: 500px;
}

.account-selection-display {
  margin-bottom: 8px;
}
</style>