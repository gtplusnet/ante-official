<template>
  <div class="q-pa-sm">
    <div v-for="item in filteredNavList" :key="item.key" class="cms-submenu">
      <div class="cms-item row items-center justify-between"
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
        <div v-for="child in item.child" :key="child.key" class="cms-item-dropdown row items-center justify-between" :class="child.key == activeNav ? 'active' : ''" @click.stop="navigate(child.key)">
          <div class="row items-center">
            <div><q-icon :name="getActiveIcon(child.icon, child.key == activeNav)" size="20px" class="menu-icon q-mr-sm" /></div>
            <div class="text-label-medium text-grey">{{ child.title }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./CMSSubMenu.scss"></style>

<script lang="ts">
import { ref, watch, computed, onMounted, getCurrentInstance } from 'vue';
import { useRouter } from 'vue-router';
import { hasAccess } from '../../../utility/access.handler';
import { useQuasar } from 'quasar';

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
  name: 'CMSSubMenu',

  setup() {
    // Track which dropdown is open
    const openKey = ref<string | null>(null);
    const $router = useRouter();
    const $q = useQuasar();
    const instance = getCurrentInstance();
    const activeNav = ref<string | null>($router.currentRoute.value.name?.toString() || null);

    // Keep activeNav in sync with the current route
    watch(() => $router.currentRoute.value.name, (newName) => {
      activeNav.value = newName ? newName.toString() : null;
    });

    function toggleDropdown(key: string) {
      openKey.value = openKey.value === key ? null : key;
    }

    // Compute which expansion items should be open based on active route
    const expandedState = computed(() => {
      const state: Record<string, boolean> = {};

      // If we have an active nav, find its parent and expand it
      if (activeNav.value) {
        navList.value.forEach((nav) => {
          if (nav.child) {
            // Check if any child matches the active nav
            const hasActiveChild = nav.child.some(child => child.key === activeNav.value);
            state[nav.key] = hasActiveChild;
          }
        });
      }

      return state;
    });

    // Set initial open state based on current route
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
        title: 'Dashboard',
        key: 'member_cms_dashboard',
        icon: 'o_dashboard',
      },
      {
        title: 'Content Manager',
        key: 'member_cms_collection_types',
        icon: 'o_article',
      },
      {
        title: 'Media Library',
        key: 'member_cms_media_library',
        icon: 'o_perm_media',
      },
      {
        title: 'Content Type Builder',
        key: 'member_cms_content_type_builder',
        icon: 'o_build',
      },
      {
        title: 'API',
        key: 'member_cms_api_tokens',
        icon: 'o_api',
      }
    ]);

    // Filter navList and childNavs based on access
    const filteredNavList = computed(() => {
      return navList.value
        .map((nav) => {
          // If nav has children, filter children by access
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

    const navigate = (key: string) => {
      try {
        $router.push({ name: key }).catch((error: unknown) => {
          // Handle navigation errors silently (e.g., navigating to same route)
          console.warn('Navigation error:', error);
        });
        
        // On mobile, emit event to close drawer
        if ($q.platform.is.mobile) {
          // Emit event to parent NavLeft component
          instance?.emit('close-drawer');
        }
      } catch (error) {
        console.error('Router navigation failed:', error);
      }
    };

    // Watch for route changes to update activeNav
    $router.afterEach((to) => {
      try {
        activeNav.value = to.name?.toString() || '';
      } catch (error) {
        console.error('Error updating activeNav:', error);
        activeNav.value = '';
      }
    });

    const getActiveIcon = (icon: string, isActive: boolean) => {
      if (isActive && icon.startsWith('o_')) {
        return icon.substring(2);
      }
      return icon;
    };

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