<template>
  <q-dialog v-model="show" class="md3-dialog-dense">
    <q-card style="width: 700px; max-width: 90vw">
      <div class="md3-header-dense">
        <q-icon name="remove_circle" size="20px" />
        <span class="md3-title">Deductions</span>
        <q-space />
        <q-btn flat round dense icon="close" size="sm" v-close-popup />
      </div>
      <q-card-section class="md3-content-dense">
        <div class="md3-dialog-content-wrapper">
          <div v-if="loading" class="md3-loading-dense">
            <q-spinner-dots size="40px" color="primary" />
            <div class="loading-text">Loading deductions...</div>
          </div>
          <div v-else-if="deductionsData">
          <!-- Summary Card -->
          <div class="md3-section-dense" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white;">
            <div class="text-center">
              <div style="font-size: 12px; opacity: 0.9;">Total Monthly Deduction</div>
              <div style="font-size: 28px; font-weight: 600; margin: 8px 0;">
                {{ formatCurrency(deductionsData.totalMonthlyDeduction) }}
              </div>
            </div>
          </div>

          <!-- Regular Deductions -->
          <div v-if="deductionsData.regularDeductions.length > 0" class="md3-section-dense">
            <div class="md3-section-title">
              <q-icon name="receipt" size="18px" />
              Regular Deductions
            </div>
            <table class="md3-table-dense">
              <thead>
                <tr>
                  <th>Deduction</th>
                  <th>Amount</th>
                  <th>Frequency</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="deduction in deductionsData.regularDeductions" :key="deduction.id">
                  <td><strong>{{ deduction.name }}</strong></td>
                  <td style="color: var(--q-negative);">{{ formatCurrency(deduction.amount) }}</td>
                  <td>{{ deduction.frequency }}</td>
                  <td>
                    <span class="md3-badge-dense" :class="deduction.status === 'Active' ? 'active' : 'inactive'">
                      {{ deduction.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Loans -->
          <div v-if="deductionsData.loans.length > 0" class="md3-section-dense">
            <div class="md3-section-title">
              <q-icon name="account_balance_wallet" size="18px" />
              Loans
            </div>
            <div v-for="loan in deductionsData.loans" :key="loan.id" class="md3-card-dense" style="margin-bottom: 8px;">
              <div class="row items-center justify-between">
                <div>
                  <div class="md3-card-title">{{ loan.loanType }}</div>
                  <div class="text-dense-caption">
                    Principal: {{ formatCurrency(loan.principalAmount) }} | 
                    Balance: {{ formatCurrency(loan.remainingBalance) }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="md3-card-value" style="font-size: 16px; color: var(--q-negative);">
                    {{ formatCurrency(loan.monthlyAmortization) }}
                  </div>
                  <div class="text-dense-caption">monthly</div>
                </div>
              </div>
              <q-linear-progress 
                :value="(loan.principalAmount - loan.remainingBalance) / loan.principalAmount" 
                color="primary" 
                style="margin-top: 8px;" 
              />
            </div>
          </div>
        </div>
        <div v-else class="md3-empty-dense">
          <q-icon name="money_off" />
          <div class="empty-title">No Deductions</div>
          <div class="empty-subtitle">No deductions information available</div>
        </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import employeeInfoService, { type DeductionsResponse } from 'src/services/employee-info.service';

export default defineComponent({
  name: 'DeductionsDialog',
  props: { modelValue: { type: Boolean, default: false } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const show = ref(props.modelValue);
    const loading = ref(false);
    const deductionsData = ref<DeductionsResponse | null>(null);

    watch(() => props.modelValue, (newVal) => {
      show.value = newVal;
      if (newVal) loadDeductions();
    });

    watch(show, (newVal) => emit('update:modelValue', newVal));

    const loadDeductions = async () => {
      loading.value = true;
      try {
        deductionsData.value = await employeeInfoService.getDeductions();
      } catch (err) {
        console.error('Error loading deductions:', err);
      } finally {
        loading.value = false;
      }
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
      }).format(amount || 0);
    };

    return { show, loading, deductionsData, formatCurrency };
  },
});
</script>

<style scoped lang="scss">
@import './md3-dialog-styles.scss';
</style>