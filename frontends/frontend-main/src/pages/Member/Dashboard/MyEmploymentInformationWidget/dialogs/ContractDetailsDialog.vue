<template>
  <q-dialog v-model="show" class="md3-dialog-dense">
    <q-card style="width: 700px; max-width: 90vw">
      <div class="md3-header-dense">
        <q-icon name="contact_page" size="20px" />
        <span class="md3-title">Contract Details</span>
        <q-space />
        <q-btn flat round dense icon="close" size="sm" v-close-popup />
      </div>
      <q-card-section class="md3-content-dense">
        <div class="md3-dialog-content-wrapper">
          <div v-if="loading" class="md3-loading-dense">
            <q-spinner-dots size="40px" color="primary" />
            <div class="loading-text">Loading contract details...</div>
          </div>
          <div v-else-if="contractData">
          <div class="md3-section-dense">
            <div class="md3-section-title">
              <q-icon name="description" size="18px" />
              Current Contract
            </div>
            <div class="md3-info-row-dense">
              <span class="md3-info-label">Contract Number:</span>
              <span class="md3-info-value">{{ contractData.currentContract.contractNumber || 'N/A' }}</span>
            </div>
            <div class="md3-info-row-dense">
              <span class="md3-info-label">Contract Type:</span>
              <span class="md3-info-value">{{ contractData.currentContract.contractType || 'N/A' }}</span>
            </div>
            <div class="md3-info-row-dense">
              <span class="md3-info-label">Start Date:</span>
              <span class="md3-info-value">{{ formatDate(contractData.currentContract.startDate) || 'N/A' }}</span>
            </div>
            <div class="md3-info-row-dense">
              <span class="md3-info-label">End Date:</span>
              <span class="md3-info-value">{{ formatDate(contractData.currentContract.endDate) || 'N/A' }}</span>
            </div>
            <div class="md3-info-row-dense">
              <span class="md3-info-label">Status:</span>
              <span class="md3-info-value">
                <span class="md3-badge-dense" :class="contractData.currentContract.status === 'Active' ? 'active' : 'inactive'">
                  {{ contractData.currentContract.status }}
                </span>
              </span>
            </div>
          </div>
          <div v-if="contractData.contractHistory && contractData.contractHistory.length > 0" class="md3-section-dense">
            <div class="md3-section-title">
              <q-icon name="history" size="18px" />
              Contract History
            </div>
            <table class="md3-table-dense">
              <thead>
                <tr>
                  <th>Contract #</th>
                  <th>Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="contract in contractData.contractHistory" :key="contract.contractNumber">
                  <td>{{ contract.contractNumber }}</td>
                  <td>{{ contract.type }}</td>
                  <td>{{ formatDate(contract.startDate) }}</td>
                  <td>{{ formatDate(contract.endDate) || '-' }}</td>
                  <td>
                    <span class="md3-badge-dense" :class="contract.status === 'Active' ? 'active' : 'inactive'">
                      {{ contract.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="md3-empty-dense">
          <q-icon name="article" />
          <div class="empty-title">No Contract Details</div>
          <div class="empty-subtitle">Contract information not available</div>
        </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { date } from 'quasar';
import employeeInfoService, { type ContractDetailsResponse } from 'src/services/employee-info.service';

export default defineComponent({
  name: 'ContractDetailsDialog',
  props: { modelValue: { type: Boolean, default: false } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const show = ref(props.modelValue);
    const loading = ref(false);
    const contractData = ref<ContractDetailsResponse | null>(null);

    watch(() => props.modelValue, (newVal) => {
      show.value = newVal;
      if (newVal) loadContractDetails();
    });

    watch(show, (newVal) => emit('update:modelValue', newVal));

    const loadContractDetails = async () => {
      loading.value = true;
      try {
        contractData.value = await employeeInfoService.getContractDetails();
      } catch (err) {
        console.error('Error loading contract details:', err);
      } finally {
        loading.value = false;
      }
    };

    const formatDate = (dateString: any) => dateString ? date.formatDate(dateString, 'MMM DD, YYYY') : null;

    return { show, loading, contractData, formatDate };
  },
});
</script>

<style scoped lang="scss">
@import './md3-dialog-styles.scss';
</style>