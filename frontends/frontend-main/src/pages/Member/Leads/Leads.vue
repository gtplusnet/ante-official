<template>
  <div class="expanded-nav-page">
    <div class="hidden-navigation"></div>
    <div class="content" :class="{ 'leads-dashboard': isLeadsDashboard }">
      <router-view></router-view>
    </div>
  </div>
</template>

<style scoped>
</style>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useRoute } from 'vue-router';

export default defineComponent({
  name: 'MemberLeads',
  components: {
  },
  setup() {
    const route = useRoute();

    const isLeadsDashboard = computed(() => {
      return route.name === 'member_leads_dashboard';
    });

    return {
      isLeadsDashboard
    };
  },
});
</script>

<style lang="scss" scoped>
.expanded-nav-page {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-gap: 20px;
  min-height: 0;
  align-items: start;
  width: 100%;

  .hidden-navigation {
    visibility: hidden;
    width: 250px;
    flex-shrink: 0;
  }

  .content {
    margin: 0px 4px 0 24px;

    :deep(.page-head) {
      align-items: center;
      display: flex;
      justify-content: space-between;

      .title {
        font-size: 20px;
      }
    }
  }

  .leads-dashboard {
    padding: 0;
    background-color: transparent;
    border: none;
    box-shadow: none;
    display: flex;
    margin: 0px 0px 0px 20px;
  }
}

// Add responsive behavior for smaller screens
@media (max-width: 768px) {
  .expanded-nav-page {
    grid-template-columns: 1fr;
    .hidden-navigation {
      display: none;
    }
  }
}
</style>
