<template>
  <div class="global-widget-more-actions">
    <!-- Filter Button -->
    <div v-if="showFilter && filterActions.length > 0" class="action-wrapper q-ml-xs">
      <GButton
        variant="icon"
        icon="swap_vert"
        color="grey-7"
        size="sm"
        icon-size="md"
        :data-testid="filterTestId"
      >
        <GlobalMenuList
          :items="filterActions"
          @item-click="$emit('filter-click', $event)"
        />
      </GButton>
    </div>

    <!-- More Button -->
    <div v-if="showMore && moreActions.length > 0" class="action-wrapper q-ml-xs">
      <GButton
        variant="icon"
        icon="more_vert"
        color="grey-7"
        size="sm"
        icon-size="md"
        :data-testid="moreTestId"
      >
        <GlobalMenuList
          :items="moreActions"
          @item-click="$emit('more-click', $event)"
        />
      </GButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import GButton from '../buttons/GButton.vue';
import GlobalMenuList, { type MenuItem } from './GlobalMenuList.vue';

interface Action extends MenuItem {}

interface Props {
  filterActions?: Action[];
  moreActions?: Action[];
  showFilter?: boolean;
  showMore?: boolean;
  filterTestId?: string;
  moreTestId?: string;
}

withDefaults(defineProps<Props>(), {
  filterActions: () => [],
  moreActions: () => [],
  showFilter: true,
  showMore: true,
  filterTestId: 'widget-filter-menu',
  moreTestId: 'widget-more-menu',
});

defineEmits<{
  'filter-click': [key: string];
  'more-click': [key: string];
}>();
</script>

<style scoped>
.global-widget-more-actions {
  display: flex;
  align-items: center;
  gap: 0;
}

.action-wrapper {
  display: flex;
  align-items: center;
}
</style>
