<template>
  <div class="leads-dashboard-counters">
    <GlobalWidgetCounter
      icon="diversity_3"
      icon-color="var(--q-primary)"
      :value="activeDealsDisplay"
      label="Active Deals in Pipeline"
      card-class="dashboard-card-1"
      :loading="loading"
    />
    <GlobalWidgetCounter
      icon="o_business_center"
      icon-color="var(--q-secondary)"
      :value="opportunitiesDisplay"
      label="Total Opportunities"
      card-class="dashboard-card-2"
      :loading="loading"
    />
    <GlobalWidgetCounter
      icon="signal_cellular_alt"
      icon-color="var(--q-accent)"
      :value="mmrDisplay"
      label="MMR Opportunity"
      card-class="dashboard-card-3"
      :loading="loading"
    />
    <GlobalWidgetCounter
      icon="commit"
      icon-color="var(--q-hero)"
      :value="initialCostDisplay"
      label="Initial Cost Opportunity"
      card-class="ico-card"
      :loading="loading"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { api } from 'src/boot/axios';
import GlobalWidgetCounter from 'src/components/shared/global/GlobalWidgetCounter.vue';

interface LeadDashboardCounters {
  activeDealsInPipeline: number;
  totalOpportunities: number;
  mmrOpportunity: string;
  initialCostOpportunity: string;
}

export default defineComponent({
  name: 'DashboardCounters',
  components: {
    GlobalWidgetCounter,
  },
  setup() {
    const loading = ref(false);
    const activeDeals = ref(0);
    const opportunities = ref(0);
    const mmr = ref('₱0.00');
    const initialCost = ref('₱0.00');

    const activeDealsDisplay = computed(() => activeDeals.value.toString());
    const opportunitiesDisplay = computed(() => opportunities.value.toString());
    const mmrDisplay = computed(() => mmr.value);
    const initialCostDisplay = computed(() => initialCost.value);

    const fetchCounters = async () => {
      loading.value = true;
      try {
        const response = await api.get<LeadDashboardCounters>('/lead/dashboard-counters');
        const data = response.data;

        activeDeals.value = data.activeDealsInPipeline;
        opportunities.value = data.totalOpportunities;
        mmr.value = data.mmrOpportunity;
        initialCost.value = data.initialCostOpportunity;
      } catch (error) {
        console.error('Error fetching lead dashboard counters:', error);
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchCounters();
    });

    return {
      loading,
      activeDealsDisplay,
      opportunitiesDisplay,
      mmrDisplay,
      initialCostDisplay,
    };
  },
});
</script>

<style scoped lang="scss">
.leads-dashboard-counters {
  display: flex;
  flex-wrap: wrap;
  gap: 25px;
}

.ico-card {
  background-image: url('assets/img/card1.webp');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #DEF0FF;
}

// Custom font size for specific counters
.dashboard-card-1 :deep(.counter-label) {
  font-size: 12px !important;
}

.ico-card :deep(.counter-label) {
  font-size: 12px !important;
}
</style>
