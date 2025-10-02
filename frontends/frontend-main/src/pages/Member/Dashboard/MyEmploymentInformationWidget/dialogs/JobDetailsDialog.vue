<template>
  <q-dialog v-model="show" class="md3-dialog-dense">
    <q-card style="width: 700px; max-width: 90vw">
      <!-- MD3 Dense Header -->
      <div class="md3-header-dense">
        <q-icon name="work" size="20px" />
        <span class="md3-title">Job Details</span>
        <q-space />
        <q-btn flat round dense icon="close" size="sm" v-close-popup />
      </div>

      <!-- MD3 Dense Content -->
      <q-card-section class="md3-content-dense">
        <div class="md3-dialog-content-wrapper">
          <!-- Loading State -->
          <div v-if="loading" class="md3-loading-dense">
          <q-spinner-dots size="40px" color="primary" />
          <div class="loading-text">Loading job details...</div>
        </div>

        <!-- Content -->
        <div v-else-if="jobData">
          <!-- Banking Information Section -->
          <div class="md3-section-dense">
            <div class="md3-section-title">
              <q-icon name="account_balance" size="18px" />
              Banking Information
            </div>
            <div class="md3-info-row-dense">
              <span class="md3-info-label">Bank Name:</span>
              <span class="md3-info-value">
                {{ jobData.bankingInfo.bankName || 'Not specified' }}
              </span>
            </div>
            <div class="md3-info-row-dense">
              <span class="md3-info-label">Account Number:</span>
              <span class="md3-info-value masked">
                {{ jobData.bankingInfo.accountNumber || 'Not specified' }}
              </span>
              <q-btn
                v-if="jobData.bankingInfo.accountNumber"
                flat
                dense
                round
                size="sm"
                icon="visibility"
                @click="toggleAccountVisibility"
                class="md3-info-action"
              >
                <q-tooltip>{{ showFullAccount ? 'Hide' : 'Show' }} full account</q-tooltip>
              </q-btn>
            </div>
            <div class="md3-info-row-dense">
              <span class="md3-info-label">Account Name:</span>
              <span class="md3-info-value">
                {{ jobData.bankingInfo.accountName || 'Not specified' }}
              </span>
            </div>
          </div>

          <!-- Salary Information Section -->
          <div class="md3-section-dense">
            <div class="md3-section-title">
              <q-icon name="payments" size="18px" />
              Salary Information
            </div>
            <div class="md3-grid-dense cols-2">
              <div class="md3-card-dense">
                <div class="md3-card-title">Basic Salary</div>
                <div class="md3-card-value">
                  {{ formatCurrency(jobData.salaryInfo.basicSalary) }}
                </div>
                <div class="md3-card-subtitle">Monthly</div>
              </div>
              <div class="md3-card-dense">
                <div class="md3-card-title">Salary Grade</div>
                <div class="md3-card-value" style="font-size: 18px;">
                  {{ jobData.salaryInfo.salaryGrade || 'N/A' }}
                </div>
                <div class="md3-card-subtitle">Classification</div>
              </div>
            </div>
            <div class="q-mt-sm">
              <div class="md3-info-row-dense">
                <span class="md3-info-label">Payroll Group:</span>
                <span class="md3-info-value">
                  {{ jobData.salaryInfo.payrollGroup || 'Not assigned' }}
                </span>
              </div>
              <div class="md3-info-row-dense">
                <span class="md3-info-label">Payment Method:</span>
                <span class="md3-info-value">
                  <q-chip
                    dense
                    size="sm"
                    :color="getPaymentMethodColor(jobData.salaryInfo.paymentMethod)"
                    text-color="white"
                  >
                    {{ jobData.salaryInfo.paymentMethod || 'Not specified' }}
                  </q-chip>
                </span>
              </div>
            </div>
          </div>

          <!-- Employment Information Section -->
          <div class="md3-section-dense">
            <div class="md3-section-title">
              <q-icon name="badge" size="18px" />
              Employment Information
            </div>
            <div class="md3-grid-dense cols-2">
              <div class="md3-info-row-dense">
                <span class="md3-info-label">Employment Type:</span>
                <span class="md3-info-value">
                  {{ jobData.employmentInfo.employmentType || 'Not specified' }}
                </span>
              </div>
              <div class="md3-info-row-dense">
                <span class="md3-info-label">Job Title:</span>
                <span class="md3-info-value">
                  {{ jobData.employmentInfo.jobTitle || 'Not specified' }}
                </span>
              </div>
              <div class="md3-info-row-dense">
                <span class="md3-info-label">Job Level:</span>
                <span class="md3-info-value">
                  {{ jobData.employmentInfo.jobLevel || 'Not specified' }}
                </span>
              </div>
              <div class="md3-info-row-dense">
                <span class="md3-info-label">Reports To:</span>
                <span class="md3-info-value">
                  {{ jobData.employmentInfo.reportingTo || 'Not specified' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="md3-empty-dense">
          <q-icon name="error_outline" />
          <div class="empty-title">Error Loading Data</div>
          <div class="empty-subtitle">{{ error }}</div>
        </div>

        <!-- Empty State -->
        <div v-else class="md3-empty-dense">
          <q-icon name="work_off" />
          <div class="empty-title">No Job Details</div>
          <div class="empty-subtitle">Job information not available</div>
        </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import employeeInfoService, { type JobDetailsResponse } from 'src/services/employee-info.service';

export default defineComponent({
  name: 'JobDetailsDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const show = ref(props.modelValue);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const jobData = ref<JobDetailsResponse | null>(null);
    const showFullAccount = ref(false);

    // Watch for prop changes
    watch(() => props.modelValue, (newVal) => {
      show.value = newVal;
      if (newVal) {
        loadJobDetails();
        showFullAccount.value = false; // Reset visibility when dialog opens
      }
    });

    // Emit changes
    watch(show, (newVal) => {
      emit('update:modelValue', newVal);
    });

    const loadJobDetails = async () => {
      loading.value = true;
      error.value = null;
      try {
        jobData.value = await employeeInfoService.getJobDetails();
      } catch (err: any) {
        console.error('Error loading job details:', err);
        error.value = err.response?.data?.message || 'Failed to load job details';
      } finally {
        loading.value = false;
      }
    };

    const formatCurrency = (amount: number | undefined) => {
      if (!amount) return '₱0.00';
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const getPaymentMethodColor = (method: string | undefined) => {
      if (!method) return 'grey';
      const lowerMethod = method.toLowerCase();
      if (lowerMethod.includes('bank') || lowerMethod.includes('transfer')) return 'primary';
      if (lowerMethod.includes('cash')) return 'green';
      if (lowerMethod.includes('check') || lowerMethod.includes('cheque')) return 'blue';
      return 'grey';
    };

    const toggleAccountVisibility = () => {
      showFullAccount.value = !showFullAccount.value;
      // In a real app, you might want to fetch the full account number from the backend
      // when showing it for the first time
    };

    return {
      show,
      loading,
      error,
      jobData,
      showFullAccount,
      formatCurrency,
      getPaymentMethodColor,
      toggleAccountVisibility,
    };
  },
});
</script>

<style scoped lang="scss">
@import './md3-dialog-styles.scss';
</style>