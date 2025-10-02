<template>
  <expanded-nav-page-container>
    <div class="cms-page">
      <div class="page-header">
        <h1 class="text-h5">{{ pageTitle }}</h1>
      </div>

      <GlobalWidgetCard>
        <template #content>
          <div class="coming-soon">
            <q-icon :name="pageIcon" size="64px" color="grey-5" />
            <div class="text-h6 text-grey q-mt-md">{{ pageTitle }}</div>
            <div class="text-body2 text-grey-7">
              This feature is coming soon. Stay tuned for updates!
            </div>
          </div>
        </template>
      </GlobalWidgetCard>
    </div>
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';
import GlobalWidgetCard from '../../../components/shared/global/GlobalWidgetCard.vue';

export default defineComponent({
  name: 'CMSPageTemplate',
  components: {
    ExpandedNavPageContainer,
    GlobalWidgetCard,
  },
  props: {
    pageTitle: {
      type: String,
      required: true,
    },
    pageIcon: {
      type: String,
      default: 'construction',
    },
  },
});
</script>

<style scoped lang="scss">
.cms-page {
  padding: 24px;

  .page-header {
    margin-bottom: 24px;
  }

  .coming-soon {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .cms-page {
    padding: 16px;
  }
}
</style>