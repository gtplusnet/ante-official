<template>
  <div>
    <GlobalWidgetCard>
      <template #title> Petty Cash </template>

      <template #more-actions>
        <q-icon name="open_in_new" size="20px" class="text-grey more-action-icon" @click="showViewPettyCashWidgetDialog = true" />
      </template>

      <template #actions>
        <q-icon name="open_in_new" size="20px" class="text-grey action-icon" @click="showViewPettyCashWidgetDialog = true"/>
      </template>

      <template #content>
        <!-- Loading Skeleton -->
        <div v-if="isInitialLoading" class="petty-cash-container">
          <div class="row items-center">
            <div class="col-2">
              <q-skeleton type="circle" size="18px" />
            </div>
            <div class="col-10">
              <div class="row items-center justify-between q-mb-sm">
                <q-skeleton type="text" width="120px" />
                <q-skeleton type="text" width="100px" />
              </div>
              <div class="row items-center justify-between">
                <q-skeleton type="text" width="100px" />
                <q-skeleton type="text" width="80px" />
              </div>
            </div>
          </div>
        </div>

        <!-- No Petty Cash Assigned -->
        <div v-else-if="!hasPettyCash && !isLoading" class="petty-cash-container">
          <div class="text-center text-grey">
            <q-icon name="o_account_balance_wallet" size="24px" class="q-mb-sm" />
            <div class="text-body-medium">No petty cash assigned</div>
          </div>
        </div>

        <!-- Actual Content -->
        <div v-else class="petty-cash-container">
          <div class="row items-center">
            <div class="col-2">
              <q-icon name="o_account_balance_wallet" size="18px" class="cash-icon" />
            </div>
            <div class="col-10">
              <div class="row items-center justify-between">
                <span class="text-label-large text-dark">Remaining Balance</span>
                <div class="text-label-large text-dark">
                  <span class="q-mr-md">₱</span>
                  <span class="amount">{{
                    remainingBalance.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  }}</span>
                  <!-- Refresh indicator -->
                  <q-spinner-dots v-if="isRefreshing" size="12px" class="q-ml-sm" />
                </div>
              </div>
              <div class="row items-center justify-between">
                <span class="text-body-small text-grey-light">
                  Petty Cash Amount
                  <q-tooltip v-if="pendingLiquidation > 0">
                    ₱{{ pendingLiquidation.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) }} pending liquidation
                  </q-tooltip>
                </span>
                <div class="text-body-small text-grey-light">
                  <span class="q-mr-md">₱</span>
                  <span class="amount">{{
                    actualBalance.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </GlobalWidgetCard>

    <!-- View Petty Cash Widget Dialog -->
    <ViewPettyCashWidgetDialog 
      v-model="showViewPettyCashWidgetDialog"
      :holderData="pettyCashData || undefined"
    />
  </div>
</template>

<style scoped src="./PettyCashWidget.scss"></style>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue';
import { defineAsyncComponent } from 'vue';
import { useQuasar } from 'quasar';
import GlobalWidgetCard from 'src/components/shared/global/GlobalWidgetCard.vue';
import { APIRequests } from 'src/utility/api.handler';
import { usePettyCashCacheStore } from 'src/stores/pettyCashCache';
import { useSocketStore } from 'src/stores/socketStore';
import { useAuthStore } from 'src/stores/auth';
import { PettyCashHolderResponse } from 'src/interfaces/petty-cash.interface';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ViewPettyCashWidgetDialog = defineAsyncComponent(() =>
  import('./dialog/ViewPettyCashWidgetDialog.vue')
);

export default defineComponent({
  name: 'PettyCashWidget',
  components: {
    GlobalWidgetCard,
    ViewPettyCashWidgetDialog,
  },
  setup() {
    const $q = useQuasar();
    const cacheStore = usePettyCashCacheStore();
    const socketStore = useSocketStore();
    const authStore = useAuthStore();

    // State
    const isInitialLoading = ref(true);
    const isRefreshing = ref(false);
    const pettyCashData = ref<PettyCashHolderResponse | null>(null);
    const refreshInterval = ref<NodeJS.Timeout | null>(null);
    const showViewPettyCashWidgetDialog = ref(false);

    // Computed
    const isLoading = computed(() => isInitialLoading.value || isRefreshing.value);
    const hasPettyCash = computed(() => !!pettyCashData.value?.isActive);
    const actualBalance = computed(() => pettyCashData.value?.actualBalance || 0);
    const pendingLiquidation = computed(() => pettyCashData.value?.pendingLiquidation || 0);
    const remainingBalance = computed(() => actualBalance.value - pendingLiquidation.value);

    // Methods
    const fetchPettyCashData = async (showLoader = true) => {
      try {
        if (showLoader && !cacheStore.hasCachedData) {
          isInitialLoading.value = true;
        } else if (!showLoader) {
          isRefreshing.value = true;
        }

        const response = await APIRequests.getCurrentUserPettyCash($q);

        // Update cache and local data
        if (response) {
          cacheStore.setCacheData(response);
          pettyCashData.value = response;
        }
      } catch (error: any) {
        // If it's a 404, user doesn't have petty cash assigned
        if (error?.response?.status === 404) {
          pettyCashData.value = null;
        } else {
          console.error('Error fetching petty cash data:', error);
        }
      } finally {
        isInitialLoading.value = false;
        isRefreshing.value = false;
      }
    };

    const initializeData = async () => {
      // If we have cached data, use it immediately
      if (cacheStore.hasCachedData && cacheStore.isCacheValid) {
        pettyCashData.value = cacheStore.data;
        isInitialLoading.value = false;

        // Refresh in background if cache is older than 1 minute
        if (cacheStore.cacheAge > 60000) {
          fetchPettyCashData(false);
        }
      } else {
        // No cache or stale, fetch fresh data
        await fetchPettyCashData(true);
      }
    };

    // Lifecycle
    onMounted(async () => {
      await initializeData();

      // Set up auto-refresh every 5 minutes
      refreshInterval.value = setInterval(() => {
        fetchPettyCashData(false);
      }, 5 * 60 * 1000);

      // Listen for petty cash updates
      socketStore.socket?.on('petty-cash-updated', (data: any) => {
        if (data.accountId === authStore.accountInformation.id) {
          cacheStore.markAsStale();
          fetchPettyCashData(false);
        }
      });
    });

    onUnmounted(() => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value);
      }

      // Clean up socket listener
      socketStore.socket?.off('petty-cash-updated');
    });

    return {
      isInitialLoading,
      isRefreshing,
      isLoading,
      showViewPettyCashWidgetDialog,
      hasPettyCash,
      actualBalance,
      pendingLiquidation,
      remainingBalance,
      pettyCashData,
    };
  },
});
</script>
