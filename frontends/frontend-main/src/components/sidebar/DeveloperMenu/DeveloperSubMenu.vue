<template>
  <div class="q-pa-sm">
    <div v-for="item in filteredNavList" :key="item.key" class="developer-submenu">
      <div class="developer-item row items-center justify-between"
           :class="item.key == activeNav ? 'active' : ''"
           @click="item.child && item.child.length > 0 ? toggleDropdown(item.key) : navigate(item.key)"
           style="cursor: pointer">
        <div class="row items-center">
          <div><q-icon :name="getActiveIcon(item.icon, item.key == activeNav)" size="22px" class="menu-icon q-mr-sm" /></div>
          <div class="text-label-large text-grey">{{ item.title }}</div>
        </div>
        <q-icon
          v-if="item.child && item.child.length > 0"
          name="keyboard_arrow_down"
          size="22px"
          class="transition-rotate"
          :class="{ rotated: openKey === item.key }"
          style="color: var(--q-grey-icon); transition: transform 0.2s"
        />
      </div>

      <div v-if="item.child && item.child.length > 0 && openKey === item.key" class="q-pb-sm">
        <div v-for="child in item.child" :key="child.key" class="developer-item-dropdown row items-center justify-between" :class="child.key == activeNav ? 'active' : ''" @click.stop="navigate(child.key)">
          <div class="row items-center">
            <div><q-icon :name="getActiveIcon(child.icon, child.key == activeNav)" size="20px" class="menu-icon q-mr-sm" /></div>
            <div class="text-label-medium text-grey">{{ child.title }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./DeveloperSubMenu.scss"></style>

<script lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { hasAccess } from '../../../utility/access.handler';

interface NavItem {
  title: string;
  key: string;
  icon: string;
  child?: ChildNavItem[];
  requiredScope?: string[];
}

interface ChildNavItem {
  icon: string;
  title: string;
  key: string;
  requiredScope?: string[];
}

export default {
  name: 'DeveloperSubMenu',

  setup() {
    const openKey = ref<string | null>(null);
    const $router = useRouter();
    const activeNav = ref<string | null>($router.currentRoute.value.name?.toString() || null);

    watch(() => $router.currentRoute.value.name, (newName) => {
      activeNav.value = newName ? newName.toString() : null;
    });

    function toggleDropdown(key: string) {
      openKey.value = openKey.value === key ? null : key;
    }

    const expandedState = computed(() => {
      const state: Record<string, boolean> = {};

      if (activeNav.value) {
        navList.value.forEach((nav) => {
          if (nav.child) {
            const hasActiveChild = nav.child.some(child => child.key === activeNav.value);
            state[nav.key] = hasActiveChild;
          }
        });
      }

      return state;
    });

    onMounted(() => {
      if (activeNav.value) {
        navList.value.forEach((nav) => {
          if (nav.child && nav.child.some(child => child.key === activeNav.value)) {
            openKey.value = nav.key;
          }
        });
      }
    });

    const navList = ref<NavItem[]>([
      {
        title: 'System',
        key: 'system_management',
        icon: 'o_admin_panel_settings',
        child: [
          { icon: 'o_business', title: 'Company Management', key: 'member_developer_company_management' },
          { icon: 'o_people', title: 'User Management', key: 'member_developer_user_management' },
        ],
      },
      {
        title: 'Developer Tools',
        key: 'developer_tools',
        icon: 'o_build',
        child: [
          { icon: 'o_code', title: 'Developer Scripts', key: 'member_developer_scripts' },
          { icon: 'o_storage', title: 'Database Tables', key: 'member_developer_database_viewer' },
          { icon: 'o_schedule', title: 'Scheduler Management', key: 'member_developer_scheduler_management' },
          { icon: 'o_queue', title: 'Queue Process', key: 'member_developer_queue_process' },
          { icon: 'o_pending_actions', title: 'Manpower Queue Monitor', key: 'member_developer_manpower_queue' },
          { icon: 'o_agriculture', title: 'Seed Tracking', key: 'member_developer_seed_tracking' },
          { icon: 'o_sync_alt', title: 'System Migrations', key: 'member_developer_migrations' },
        ],
      },
      {
        title: 'Configuration',
        key: 'configuration',
        icon: 'o_settings',
        child: [
          { icon: 'o_assignment_ind', title: 'Default Roles', key: 'member_developer_default_roles' },
          { icon: 'o_trending_up', title: 'Default User Levels', key: 'member_developer_default_user_levels' },
        ],
      },
    ]);

    const filteredNavList = computed(() => {
      return navList.value
        .map((nav) => {
          if (nav.child) {
            const filteredChild = nav.child.filter((child) => {
              if (!child.requiredScope || child.requiredScope.length === 0) return true;
              return child.requiredScope.some((scope) => hasAccess(scope));
            });
            if (filteredChild.length > 0) {
              return { ...nav, child: filteredChild };
            }
            return null;
          } else {
            if (!nav.requiredScope || nav.requiredScope.length === 0) return nav;
            if (nav.requiredScope.some((scope) => hasAccess(scope))) return nav;
            return null;
          }
        })
        .filter(Boolean) as NavItem[];
    });

    const getActiveIcon = (icon: string, isActive: boolean) => {
      if (isActive && icon.startsWith('o_')) {
        return icon.substring(2);
      }
      return icon;
    };

    const navigate = (key: string) => {
      try {
        $router.push({ name: key }).catch((error: unknown) => {
          console.warn('Navigation error:', error);
        });
      } catch (error) {
        console.error('Router navigation failed:', error);
      }
    };

    $router.afterEach((to) => {
      try {
        activeNav.value = to.name?.toString() || '';
      } catch (error) {
        console.error('Error updating activeNav:', error);
        activeNav.value = '';
      }
    });

    return {
      openKey,
      toggleDropdown,
      filteredNavList,
      expandedState,
      activeNav,
      navigate,
      getActiveIcon,
    };
  },
};
</script>