<template>
  <q-drawer
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    class="main-navigation text-label-large"
    :mini="!$q.platform.is.mobile"
    :behavior="$q.platform.is.mobile ? 'mobile' : 'desktop'"
    :overlay="$q.platform.is.mobile"
    bordered>
    <!-- Desktop: show both main nav and sub-menu side by side -->
    <template v-if="!$q.platform.is.mobile">
      <div>
        <div class="logo-container">
          <div class="logo"></div>
        </div>
        <q-list class="main-nav-list">
          <EssentialLink
            v-for="link in navigationStore.filteredLinks"
            :key="link.title"
            v-bind="link"
          />
        </q-list>
      </div>
      <div v-if="showSubMenu" class="sub-menu">
        <div :class="['page-title', 'text-dark', 'text-title-medium', { 'crm-page-title': subMenuType === 'leads' }]">
          {{ subMenuTitle }}
        </div>
        <div class="sub-nav-wrapper">
          <ManpowerSubMenu v-if="subMenuType === 'manpower'" />
          <SettingsSubMenu v-if="subMenuType === 'settings'" />
          <DeveloperSubMenu v-if="subMenuType === 'developer'" />
          <SchoolSubMenu v-if="subMenuType === 'school'" />
          <AssetSubMenu v-if="subMenuType === 'asset'" />
          <TreasurySubMenu v-if="subMenuType === 'treasury'" />
          <LeadsSubMenu v-if="subMenuType === 'leads'" />
          <CMSSubMenu v-if="subMenuType === 'cms'" />
          <TaskSubMenu v-if="subMenuType === 'task'" />
          <ProjectSubMenu v-if="subMenuType === 'project'" />
        </div>
      </div>
    </template>

    <!-- Mobile: show either main nav OR sub-menu -->
    <template v-else>
      <div v-if="!mobileSubMenuType" class="mobile-main-nav">
        <div class="mobile-header">
          <div class="ante-mobile-logo"></div>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="close"
            @click="$emit('update:modelValue', false)"
            class="mobile-close-btn"
          />
        </div>
        <q-list class="main-nav-list">
          <EssentialLink
            v-for="link in navigationStore.mobileFilteredLinks"
            :key="link.title"
            v-bind="link"
            @click="handleLinkClick(link)"
          />
        </q-list>
      </div>
      <div v-else class="mobile-sub-menu">
        <div :class="['page-title', 'text-dark', 'text-title-medium', { 'crm-page-title': subMenuType === 'leads' }]">
          <q-btn
            flat
            dense
            round
            icon="arrow_back"
            @click="handleBackClick"
            class="mobile-back-btn q-mr-sm"
          />
          {{ subMenuTitle }}
        </div>
        <div class="sub-nav-wrapper">
          <ManpowerSubMenu v-if="subMenuType === 'manpower'" @close-drawer="emit('update:modelValue', false)" />
          <SettingsSubMenu v-if="subMenuType === 'settings'" @close-drawer="emit('update:modelValue', false)" />
          <DeveloperSubMenu v-if="subMenuType === 'developer'" @close-drawer="emit('update:modelValue', false)" />
          <SchoolSubMenu v-if="subMenuType === 'school'" @close-drawer="emit('update:modelValue', false)" />
          <AssetSubMenu v-if="subMenuType === 'asset'" @close-drawer="emit('update:modelValue', false)" />
          <TreasurySubMenu v-if="subMenuType === 'treasury'" @close-drawer="emit('update:modelValue', false)" />
          <LeadsSubMenu v-if="subMenuType === 'leads'" @close-drawer="emit('update:modelValue', false)" />
          <CMSSubMenu v-if="subMenuType === 'cms'" @close-drawer="emit('update:modelValue', false)" />
          <TaskSubMenu v-if="subMenuType === 'task'" @close-drawer="emit('update:modelValue', false)" />
          <ProjectSubMenu v-if="subMenuType === 'project'" @close-drawer="emit('update:modelValue', false)" />
        </div>
      </div>
    </template>
  </q-drawer>
</template>
<style scoped src="./NevLeft.scss"></style>
<script lang="ts" setup>
import EssentialLink from "../../components/EssentialLink.vue";
import { useNavigationStore } from "../../stores/navigation";
import { useRoute, useRouter } from 'vue-router';
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import ManpowerSubMenu from './ManpowerMenu/ManpowerSubMenu.vue';
import SettingsSubMenu from './SettingsMenu/SettingsSubMenu.vue';
import DeveloperSubMenu from './DeveloperMenu/DeveloperSubMenu.vue';
import SchoolSubMenu from './SchoolMenu/SchoolSubMenu.vue';
import AssetSubMenu from './AssetMenu/AssetSubMenu.vue';
import TreasurySubMenu from './TreasuryMenu/TreasurySubMenu.vue';
import LeadsSubMenu from './LeadsMenu/LeadsSubMenu.vue';
import CMSSubMenu from './CMSMenu/CMSSubMenu.vue';
import TaskSubMenu from './TaskMenu/TaskSubMenu.vue';
import ProjectSubMenu from './ProjectMenu/ProjectSubMenu.vue';

defineProps<{
  modelValue: boolean
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>();

const $q = useQuasar();

const navigationStore = useNavigationStore();
const route = useRoute();
const router = useRouter();

// Track mobile submenu state
const mobileSubMenuType = ref('');
const mobileSubMenuTitle = ref('');

const showSubMenu = computed(() => {
  // On desktop, show submenu based on route
  if (!$q.platform.is.mobile) {
    const path = route.path.toLowerCase();
    return (
      path.includes('/manpower') ||
      path.includes('/settings') ||
      path.includes('/school') ||
      path.includes('/developer') ||
      path.includes('/asset') ||
      path.includes('/treasury') ||
      path.includes('/leads') ||
      path.includes('/cms') ||
      path.includes('/task') ||
      path.includes('/project')
    );
  }
  return false;
});

const subMenuType = computed(() => {
  // On mobile, use mobileSubMenuType; on desktop, use route-based logic
  if ($q.platform.is.mobile && mobileSubMenuType.value) {
    return mobileSubMenuType.value;
  }

  const path = route.path.toLowerCase();
  if (path.includes('/manpower')) return 'manpower';
  if (path.includes('/settings')) return 'settings';
  if (path.includes('/school')) return 'school';
  if (path.includes('/developer')) return 'developer';
  if (path.includes('/treasury')) return 'treasury';
  if (path.includes('/asset')) return 'asset';
  if (path.includes('/leads')) return 'leads';
  if (path.includes('/cms')) return 'cms';
  if (path.includes('/task')) return 'task';
  if (path.includes('/project')) return 'project';
  return '';
});

const subMenuTitle = computed(() => {
  // On mobile, use mobileSubMenuTitle; on desktop, use route-based logic
  if ($q.platform.is.mobile && mobileSubMenuTitle.value) {
    return mobileSubMenuTitle.value;
  }

  const path = route.path.toLowerCase();
  if (path.includes('/manpower')) return 'Manpower';
  if (path.includes('/settings')) return 'Settings';
  if (path.includes('/school')) return 'School';
  if (path.includes('/developer')) return 'Developer';
  if (path.includes('/treasury')) return 'Treasury';
  if (path.includes('/asset')) return 'Assets';
  if (path.includes('/leads')) return 'Customer Relationship Management';
  if (path.includes('/cms')) return 'CMS';
  if (path.includes('/task')) return 'Tasks';
  if (path.includes('/project')) return 'Projects';
  return '';
});

const handleLinkClick = (linkData: any) => {
  if ($q.platform.is.mobile) {
    // Get the route from the emitted data
    const linkRoute = linkData.route?.toLowerCase() || '';

    // Check if this link has a submenu
    if (linkRoute.includes('manpower')) {
      mobileSubMenuType.value = 'manpower';
      mobileSubMenuTitle.value = 'Manpower';
    } else if (linkRoute.includes('settings')) {
      mobileSubMenuType.value = 'settings';
      mobileSubMenuTitle.value = 'Settings';
    } else if (linkRoute.includes('school')) {
      mobileSubMenuType.value = 'school';
      mobileSubMenuTitle.value = 'School';
    } else if (linkRoute.includes('developer')) {
      mobileSubMenuType.value = 'developer';
      mobileSubMenuTitle.value = 'Developer';
    } else if (linkRoute.includes('treasury')) {
      mobileSubMenuType.value = 'treasury';
      mobileSubMenuTitle.value = 'Treasury';
    } else if (linkRoute.includes('asset')) {
      mobileSubMenuType.value = 'asset';
      mobileSubMenuTitle.value = 'Assets';
    } else if (linkRoute.includes('leads')) {
      mobileSubMenuType.value = 'leads';
      mobileSubMenuTitle.value = 'CRM';
    } else if (linkRoute.includes('cms')) {
      mobileSubMenuType.value = 'cms';
      mobileSubMenuTitle.value = 'CMS';
    } else if (linkRoute.includes('task')) {
      mobileSubMenuType.value = 'task';
      mobileSubMenuTitle.value = 'Tasks';
    } else if (linkRoute.includes('project')) {
      mobileSubMenuType.value = 'project';
      mobileSubMenuTitle.value = 'Projects';
    } else {
      // If no submenu, navigate directly and close drawer
      router.push({ name: linkData.route });
      emit('update:modelValue', false);
    }
  }
};

const handleBackClick = () => {
  mobileSubMenuType.value = '';
  mobileSubMenuTitle.value = '';
};
</script>
