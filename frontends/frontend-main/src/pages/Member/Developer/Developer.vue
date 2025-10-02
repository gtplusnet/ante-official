<template>
  <expanded-nav-page-container>
    <router-view></router-view>
  </expanded-nav-page-container>
</template>

<style src="./DeveloperPage.scss"></style>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import { useAuthStore } from '../../../stores/auth';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';

export default defineComponent({
  name: 'DeveloperMainPage',
  components: {
    ExpandedNavPageContainer,
  },
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();
    const $q = useQuasar();

    onMounted(() => {
      // Double-check developer access as a fallback
      if (!authStore.isDeveloper) {
        $q.notify({
          type: 'negative',
          message: 'Access Denied: Developer privileges required',
          position: 'top',
          timeout: 3000
        });
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push({ name: 'member_dashboard' });
        }, 1000);
      }
    });

    return {};
  }
});
</script>
