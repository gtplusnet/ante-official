<template>
  <q-page>
    <div class="q-pa-md">
      <h4>Treasury Sidebar Debug Page</h4>
      <div class="q-mb-md">
        <p><strong>Current Route Path:</strong> {{ currentPath }}</p>
        <p><strong>Show Sub Menu:</strong> {{ showSubMenu }}</p>
        <p><strong>Sub Menu Type:</strong> {{ subMenuType }}</p>
        <p><strong>Path includes treasury:</strong> {{ pathIncludesTreasury }}</p>
      </div>
      
      <div class="q-mb-md">
        <q-btn @click="navigateToTreasury" color="primary">Go to Treasury</q-btn>
      </div>
      
      <div v-if="showSubMenu" class="border q-pa-md">
        <h5>Sub Menu Should Be Visible Here</h5>
        <treasury-sub-menu />
      </div>
    </div>
  </q-page>
</template>

<script>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TreasurySubMenu from '../components/sidebar/TreasuryMenu/TreasurySubMenu.vue';

export default {
  name: 'TestTreasurySidebar',
  components: {
    TreasurySubMenu
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    
    const currentPath = computed(() => route.path);
    
    const showSubMenu = computed(() => {
      const path = route.path.toLowerCase();
      return path.includes('/treasury');
    });
    
    const subMenuType = computed(() => {
      const path = route.path.toLowerCase();
      if (path.includes('/treasury')) return 'treasury';
      return '';
    });
    
    const pathIncludesTreasury = computed(() => {
      return route.path.toLowerCase().includes('/treasury');
    });
    
    const navigateToTreasury = () => {
      router.push({ name: 'member_treasury' });
    };
    
    return {
      currentPath,
      showSubMenu,
      subMenuType,
      pathIncludesTreasury,
      navigateToTreasury
    };
  }
};
</script>