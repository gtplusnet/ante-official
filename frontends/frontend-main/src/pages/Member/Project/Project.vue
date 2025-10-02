<template>
  <!-- ProjectPage component - handles different project view modes -->
  <!-- Component name: ProjectPage -->
  <expanded-nav-page-container>
    <div class="page-head">
      <div>
        <div class="text-title-large">Project List</div>
        <div class="bread-crumbs text-body-small">
          <q-breadcrumbs>
            <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_project_dashboard' }" />
            <q-breadcrumbs-el label="Project List" />
          </q-breadcrumbs>
        </div>
      </div>
      <div class="views">
        <div class="button-group">
          <div @click="setActiveView(view.name)" v-for="view in viewList" :key="view.name" class="button"
            :class="activeView == view.name ? 'active' : ''"><q-icon :name="view.icon"></q-icon></div>
        </div>
      </div>
    </div>

    <div class="page-content q-mt-lg">
      <project-board-view v-if="activeView == 'board'"></project-board-view>
      <project-grid-view v-if="activeView == 'grid'"></project-grid-view>
      <project-list-view v-if="activeView == 'list'"></project-list-view>
    </div>
  </expanded-nav-page-container>
</template>

<style scoped src="./Project.scss"></style>
<script lang="ts" setup>
// Fix component name to be multi-word
import { ref, onMounted } from 'vue';
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';

// Define component name properly
defineOptions({
  name: 'ProjectPage'
});
import ProjectGridView from './ProjectGridView.vue';
import ProjectBoardView from './ProjectBoardView.vue';
import ProjectListView from './ProjectListView.vue';

// Define types for view items
interface ViewItem {
  icon: string;
  name: string;
}

// Reactive state
const activeView = ref<string>('board');
const viewList = ref<ViewItem[]>([
  { icon: 'view_week', name: 'board' },
  { icon: 'dashboard', name: 'grid' },
  { icon: 'view_list', name: 'list' },
]);

// Methods
const setActiveView = (view: string): void => {
  activeView.value = view;
};

// Lifecycle hooks
onMounted(() => {
  // Initialize component if needed
});
</script>
