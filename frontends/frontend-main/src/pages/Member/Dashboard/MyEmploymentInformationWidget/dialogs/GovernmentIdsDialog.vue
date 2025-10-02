<template>
  <q-dialog v-model="show" class="md3-dialog-dense">
    <q-card style="width: 600px; max-width: 90vw">
      <!-- MD3 Dense Header -->
      <div class="md3-header-dense">
        <q-icon name="account_balance" size="20px" />
        <span class="md3-title">Government IDs</span>
        <q-space />
        <q-btn flat round dense icon="close" size="sm" v-close-popup />
      </div>

      <!-- MD3 Dense Content -->
      <q-card-section class="md3-content-dense">
        <div class="md3-dialog-content-wrapper">
          <!-- Loading State -->
          <div v-if="loading" class="md3-loading-dense">
            <q-spinner-dots size="40px" color="primary" />
            <div class="loading-text">Loading government IDs...</div>
          </div>

          <!-- Content -->
          <div v-else-if="governmentData">
          <div class="md3-section-dense">
            <div class="md3-section-title">
              <q-icon name="badge" size="18px" />
              Government Identification Numbers
            </div>
            <div class="md3-section-subtitle">
              Click on any ID to copy to clipboard
            </div>
            
            <!-- TIN -->
            <div class="md3-info-row-dense">
              <span class="md3-info-label">TIN:</span>
              <span class="md3-info-value masked">
                {{ governmentData.tin || 'Not provided' }}
              </span>
              <q-btn
                v-if="governmentData.tin"
                flat
                dense
                round
                size="sm"
                icon="content_copy"
                @click="copyToClipboard('TIN', governmentData.tin)"
                class="md3-copy-btn"
              >
                <q-tooltip>Copy TIN</q-tooltip>
              </q-btn>
            </div>

            <!-- SSS -->
            <div class="md3-info-row-dense">
              <span class="md3-info-label">SSS:</span>
              <span class="md3-info-value masked">
                {{ governmentData.sss || 'Not provided' }}
              </span>
              <q-btn
                v-if="governmentData.sss"
                flat
                dense
                round
                size="sm"
                icon="content_copy"
                @click="copyToClipboard('SSS', governmentData.sss)"
                class="md3-copy-btn"
              >
                <q-tooltip>Copy SSS</q-tooltip>
              </q-btn>
            </div>

            <!-- HDMF/Pag-IBIG -->
            <div class="md3-info-row-dense">
              <span class="md3-info-label">HDMF/Pag-IBIG:</span>
              <span class="md3-info-value masked">
                {{ governmentData.hdmf || 'Not provided' }}
              </span>
              <q-btn
                v-if="governmentData.hdmf"
                flat
                dense
                round
                size="sm"
                icon="content_copy"
                @click="copyToClipboard('HDMF', governmentData.hdmf)"
                class="md3-copy-btn"
              >
                <q-tooltip>Copy HDMF</q-tooltip>
              </q-btn>
            </div>

            <!-- PhilHealth -->
            <div class="md3-info-row-dense">
              <span class="md3-info-label">PhilHealth:</span>
              <span class="md3-info-value masked">
                {{ governmentData.phic || 'Not provided' }}
              </span>
              <q-btn
                v-if="governmentData.phic"
                flat
                dense
                round
                size="sm"
                icon="content_copy"
                @click="copyToClipboard('PhilHealth', governmentData.phic)"
                class="md3-copy-btn"
              >
                <q-tooltip>Copy PhilHealth</q-tooltip>
              </q-btn>
            </div>
          </div>

          <!-- Other IDs if available -->
          <div v-if="governmentData.otherIds && governmentData.otherIds.length > 0" class="md3-section-dense">
            <div class="md3-section-title">
              <q-icon name="credit_card" size="18px" />
              Other Identification
            </div>
            <div v-for="otherId in governmentData.otherIds" :key="otherId.type" class="md3-info-row-dense">
              <span class="md3-info-label">{{ otherId.type }}:</span>
              <span class="md3-info-value">{{ otherId.number }}</span>
              <q-btn
                flat
                dense
                round
                size="sm"
                icon="content_copy"
                @click="copyToClipboard(otherId.type, otherId.number)"
                class="md3-copy-btn"
              >
                <q-tooltip>Copy {{ otherId.type }}</q-tooltip>
              </q-btn>
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
          <q-icon name="badge" />
          <div class="empty-title">No Government IDs</div>
          <div class="empty-subtitle">Government ID information not available</div>
        </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import employeeInfoService, { type GovernmentIdsResponse } from 'src/services/employee-info.service';

export default defineComponent({
  name: 'GovernmentIdsDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const show = ref(props.modelValue);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const governmentData = ref<GovernmentIdsResponse | null>(null);

    // Watch for prop changes
    watch(() => props.modelValue, (newVal) => {
      show.value = newVal;
      if (newVal) {
        loadGovernmentIds();
      }
    });

    // Emit changes
    watch(show, (newVal) => {
      emit('update:modelValue', newVal);
    });

    const loadGovernmentIds = async () => {
      loading.value = true;
      error.value = null;
      try {
        governmentData.value = await employeeInfoService.getGovernmentIds();
      } catch (err: any) {
        console.error('Error loading government IDs:', err);
        error.value = err.response?.data?.message || 'Failed to load government IDs';
      } finally {
        loading.value = false;
      }
    };

    const copyToClipboard = async (label: string, value: string) => {
      try {
        // Remove masking for actual copy (in production, you might want to fetch the full value from backend)
        await navigator.clipboard.writeText(value);
        $q.notify({
          type: 'positive',
          message: `${label} copied to clipboard`,
          position: 'top',
          timeout: 2000,
        });
      } catch (err) {
        $q.notify({
          type: 'negative',
          message: 'Failed to copy to clipboard',
          position: 'top',
          timeout: 2000,
        });
      }
    };

    return {
      show,
      loading,
      error,
      governmentData,
      copyToClipboard,
    };
  },
});
</script>

<style scoped lang="scss">
@import './md3-dialog-styles.scss';
</style>