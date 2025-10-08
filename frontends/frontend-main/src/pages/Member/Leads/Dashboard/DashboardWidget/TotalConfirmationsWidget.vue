<template>
  <div>
    <GlobalWidgetCard class="total-confirmations-widget">
      <template #title>Total Confirmations</template>
      <template #actions>
        <div v-if="loading">
          <q-skeleton type="text" width="30px" />
        </div>
        <span v-else class="text-title-medium-w-[700]">{{ totalConfirmations }}</span>
      </template>
      <template #content>
        <div v-if="loading" class="q-pb-md">
          <q-skeleton type="rect" height="50px" class="q-mb-md" />
          <q-skeleton type="rect" height="50px" />
        </div>
        <div v-else class="q-pb-md">
          <!-- Wins -->
          <div class="row items-center justify-between q-pb-md">
            <div class="row items-center">
              <div class="icon-container win-icon">
                <q-icon name="o_military_tech" size="18px" />
              </div>
              <span class="text-label-large text-dark">Wins</span>
            </div>
            <span class="text-body-medium">{{ winsCount }}</span>
          </div>
          <!-- Losses -->
          <div class="row items-center justify-between">
            <div class="row items-center">
              <div class="icon-container loss-icon">
                <q-icon name="o_bookmark_remove" size="18px" />
              </div>
              <span class="text-label-large text-dark">Losses</span>
            </div>
            <span class="text-body-medium">{{ lossesCount }}</span>
          </div>
        </div>
      </template>
    </GlobalWidgetCard>
  </div>
</template>

<script lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Notify, useQuasar } from 'quasar';
import GlobalWidgetCard from 'src/components/shared/global/GlobalWidgetCard.vue';
import { APIRequests } from 'src/utility/api.handler';

interface BoardColumn {
  boardKey: string;
  boardName: string;
  boardType: string;
  boardOrder: number;
  boardProjects?: any[];
}

export default {
  name: "TotalConfirmationsWidget",
  components: {
    GlobalWidgetCard,
  },
  setup() {
    const $q = useQuasar();

    // Reactive data
    const loading = ref(false);
    const winsCount = ref(0);
    const lossesCount = ref(0);

    // Computed total confirmations
    const totalConfirmations = computed(() => winsCount.value + lossesCount.value);

    const loadConfirmationsData = async () => {
      try {
        loading.value = true;

        // Fetch board data using the same endpoint as other widgets
        const response = await APIRequests.getLeadBoard($q);

        if (Array.isArray(response)) {
          // Find won and loss columns
          const wonColumn = (response as BoardColumn[]).find(
            (col) => col.boardKey === 'won'
          );
          const lossColumn = (response as BoardColumn[]).find(
            (col) => col.boardKey === 'loss'
          );

          // Update counts
          winsCount.value = wonColumn?.boardProjects?.length || 0;
          lossesCount.value = lossColumn?.boardProjects?.length || 0;
        }
      } catch (error) {
        console.error('[TotalConfirmations] Failed to load confirmations data:', error);
        Notify.create({
          type: 'negative',
          message: 'Failed to load confirmations data',
          position: 'top',
        });
      } finally {
        loading.value = false;
      }
    };

    // Load data on mount
    onMounted(async () => {
      await loadConfirmationsData();
    });

    return {
      loading,
      winsCount,
      lossesCount,
      totalConfirmations,
    };
  },
};
</script>

<style scoped lang="scss">
.icon-container {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;

  &.win-icon {
    background-color: var(--q-primary);
    color: #fff;
  }

  &.loss-icon {
    background-color: var(--q-error-tinted);
    color: var(--q-error);
  }
}
</style>

