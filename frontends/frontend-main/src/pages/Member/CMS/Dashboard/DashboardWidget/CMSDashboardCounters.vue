<template>
  <div class="dashboard-card-container">
    <GlobalWidgetCounter
      icon="folder"
      icon-color="var(--q-primary)"
      :value="collectionTypesCount.toString()"
      label="Collection Types"
      card-class="dashboard-card-1"
      :loading="loading"
      :clickable="true"
      @click="navigateToCollectionTypes"
    />
    <GlobalWidgetCounter
      icon="description"
      icon-color="var(--q-secondary)"
      :value="singleTypesCount.toString()"
      label="Single Types"
      card-class="dashboard-card-2"
      :loading="loading"
      :clickable="true"
      @click="navigateToSingleTypes"
    />
    <GlobalWidgetCounter
      icon="perm_media"
      icon-color="var(--q-accent)"
      :value="mediaFilesCount.toString()"
      label="Media Files"
      card-class="dashboard-card-3"
      :loading="loading"
      :clickable="true"
      @click="navigateToMediaLibrary"
    />
    <GlobalWidgetCounter
      icon="api"
      icon-color="#9333ea"
      :value="apiCallsToday"
      label="API Calls Today"
      card-class="api-card"
      :loading="loading"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Notify } from 'quasar';
import GlobalWidgetCounter from '../../../../../components/shared/global/GlobalWidgetCounter.vue';
import { CMSAnalyticsService, DashboardStats } from 'src/services/cms-analytics.service';

export default defineComponent({
  name: 'CMSDashboardCounters',
  components: {
    GlobalWidgetCounter,
  },
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const dashboardStats = ref<DashboardStats | null>(null);
    const error = ref<string | undefined>(undefined);

    // Computed values with fallbacks
    const collectionTypesCount = computed(() => 
      dashboardStats.value?.contentTypes.collections ?? 0
    );
    
    const singleTypesCount = computed(() => 
      dashboardStats.value?.contentTypes.singles ?? 0
    );
    
    const mediaFilesCount = computed(() => 
      dashboardStats.value?.media.totalFiles ?? 0
    );
    
    const apiCallsToday = computed(() => {
      const count = dashboardStats.value?.apiCalls.today ?? 0;
      if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}k`;
      }
      return count.toString();
    });

    const loadDashboardStats = async () => {
      if (loading.value) return;
      
      loading.value = true;
      error.value = undefined;
      
      try {
        const stats = await CMSAnalyticsService.getDashboardStats();
        dashboardStats.value = stats;
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
        error.value = 'Failed to load dashboard statistics';
        
        // Show user-friendly notification
        Notify.create({
          type: 'negative',
          message: 'Unable to load dashboard statistics. Using default values.',
          timeout: 3000,
        });
      } finally {
        loading.value = false;
      }
    };

    const navigateToCollectionTypes = () => {
      router.push({ name: 'member_cms_collection_types' });
    };

    const navigateToSingleTypes = () => {
      router.push({ name: 'member_cms_single_types' });
    };

    const navigateToMediaLibrary = () => {
      router.push({ name: 'member_cms_media_library' });
    };

    // Load stats when component mounts
    onMounted(() => {
      loadDashboardStats();
    });

    return {
      loading,
      dashboardStats,
      error,
      collectionTypesCount,
      singleTypesCount,
      mediaFilesCount,
      apiCallsToday,
      loadDashboardStats,
      navigateToCollectionTypes,
      navigateToSingleTypes,
      navigateToMediaLibrary,
    };
  },
});
</script>

<style scoped lang="scss">
.dashboard-card-container {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.api-card {
  background-image: url('../../../../../assets/img/card1.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #f0e6ff;
}
</style>