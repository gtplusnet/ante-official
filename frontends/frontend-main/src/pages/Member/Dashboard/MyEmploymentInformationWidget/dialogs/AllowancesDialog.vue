<template>
  <q-dialog v-model="show" class="md3-dialog-dense">
    <q-card style="width: 700px; max-width: 90vw">
      <!-- MD3 Dense Header -->
      <div class="md3-header-dense">
        <q-icon name="attach_money" size="20px" />
        <span class="md3-title">Allowances</span>
        <q-space />
        <q-btn flat round dense icon="close" size="sm" v-close-popup />
      </div>

      <!-- MD3 Dense Content -->
      <q-card-section class="md3-content-dense">
        <div class="md3-dialog-content-wrapper">
          <!-- Loading State -->
          <div v-if="loading" class="md3-loading-dense">
          <q-spinner-dots size="40px" color="primary" />
          <div class="loading-text">Loading allowances...</div>
        </div>

        <!-- Content -->
        <div v-else-if="allowancesData && allowancesData.allowances.length > 0">
          <!-- Summary Card -->
          <div class="md3-section-dense" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
            <div class="text-center">
              <div style="font-size: 12px; opacity: 0.9;">Total Monthly Allowance</div>
              <div style="font-size: 28px; font-weight: 600; margin: 8px 0;">
                {{ formatCurrency(allowancesData.totalMonthlyAllowance) }}
              </div>
              <div style="font-size: 11px; opacity: 0.8;">
                {{ allowancesData.allowances.length }} active allowance{{ allowancesData.allowances.length !== 1 ? 's' : '' }}
              </div>
            </div>
          </div>

          <!-- Allowances List -->
          <div class="md3-section-dense">
            <div class="md3-section-title">
              <q-icon name="list_alt" size="18px" />
              Allowance Details
            </div>
            <table class="md3-table-dense">
              <thead>
                <tr>
                  <th>Allowance Name</th>
                  <th>Amount</th>
                  <th>Frequency</th>
                  <th>Status</th>
                  <th>Effective Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="allowance in allowancesData.allowances" :key="allowance.id">
                  <td>
                    <strong>{{ allowance.name }}</strong>
                  </td>
                  <td>
                    <span style="font-weight: 500; color: var(--q-primary);">
                      {{ formatCurrency(allowance.amount) }}
                    </span>
                  </td>
                  <td>
                    <q-chip dense size="sm" outline>
                      {{ allowance.frequency }}
                    </q-chip>
                  </td>
                  <td>
                    <span 
                      class="md3-badge-dense"
                      :class="allowance.status === 'Active' ? 'active' : 'inactive'"
                    >
                      {{ allowance.status }}
                    </span>
                  </td>
                  <td>
                    {{ formatDate(allowance.effectiveDate) || 'N/A' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!loading && (!allowancesData || allowancesData.allowances.length === 0)" class="md3-empty-dense">
          <q-icon name="money_off" />
          <div class="empty-title">No Allowances</div>
          <div class="empty-subtitle">You don't have any allowances assigned</div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="md3-empty-dense">
          <q-icon name="error_outline" />
          <div class="empty-title">Error Loading Data</div>
          <div class="empty-subtitle">{{ error }}</div>
        </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { date } from 'quasar';
import employeeInfoService, { type AllowancesResponse } from 'src/services/employee-info.service';

export default defineComponent({
  name: 'AllowancesDialog',
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
    const allowancesData = ref<AllowancesResponse | null>(null);

    // Watch for prop changes
    watch(() => props.modelValue, (newVal) => {
      show.value = newVal;
      if (newVal) {
        loadAllowances();
      }
    });

    // Emit changes
    watch(show, (newVal) => {
      emit('update:modelValue', newVal);
    });

    const loadAllowances = async () => {
      loading.value = true;
      error.value = null;
      try {
        allowancesData.value = await employeeInfoService.getAllowances();
      } catch (err: any) {
        console.error('Error loading allowances:', err);
        error.value = err.response?.data?.message || 'Failed to load allowances';
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

    const formatDate = (dateString: string | Date | undefined) => {
      if (!dateString) return null;
      return date.formatDate(dateString, 'MMM DD, YYYY');
    };

    return {
      show,
      loading,
      error,
      allowancesData,
      formatCurrency,
      formatDate,
    };
  },
});
</script>

<style scoped lang="scss">
@import './md3-dialog-styles.scss';
</style>