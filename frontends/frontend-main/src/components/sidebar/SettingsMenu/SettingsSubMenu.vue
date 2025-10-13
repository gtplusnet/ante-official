<template>
  <div class="q-pa-sm">
    <div v-for="item in filteredNavList" :key="item.key" class="settings-submenu">
      <div class="settings-item row items-center justify-between"
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
        <div v-for="child in item.child" :key="child.key" class="settings-item-dropdown row items-center justify-between" :class="child.key == activeNav ? 'active' : ''" @click.stop="navigate(child.key)">
          <div class="row items-center">
            <div><q-icon :name="getActiveIcon(child.icon, child.key == activeNav)" size="20px" class="menu-icon q-mr-sm" /></div>
            <div class="text-label-medium text-grey">{{ child.title }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./SettingsSubMenu.scss"></style>

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
  name: 'SettingsSubMenu',

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
        title: 'Personal',
        key: 'personal',
        icon: 'o_person',
        child: [
          { icon: 'o_email', title: 'Email Configuration', key: 'member_settings_email' }, // Personal settings - no scope required
        ],
      },
      {
        title: 'Company',
        key: 'company',
        icon: 'o_business',
        child: [
          { icon: 'o_business', title: 'Company Information', key: 'member_settings_company', requiredScope: ['SETTINGS_COMPANY_ACCESS'] },
          { icon: 'o_location_on', title: 'Branches', key: 'member_settings_branches', requiredScope: ['SETTINGS_BRANCHES_ACCESS'] },
        ],
      },
      {
        title: 'Users',
        key: 'users',
        icon: 'o_people',
        child: [
          { icon: 'o_people', title: 'Users', key: 'member_settings_user', requiredScope: ['SETTINGS_USER_ACCESS'] },
          { icon: 'o_history', title: 'Inactive Users', key: 'member_settings_inactive_users', requiredScope: ['SETTINGS_USER_ACCESS'] },
          { icon: 'o_group', title: 'Departments', key: 'member_settings_role_group', requiredScope: ['SETTINGS_ROLE_GROUP_ACCESS'] },
          { icon: 'send', title: 'User Invite', key: 'member_settings_user_invite', requiredScope: ['SETTINGS_USER_ACCESS'] },
        ],
      },
      {
        title: 'Security',
        key: 'security',
        icon: 'o_security',
        child: [
          { icon: 'o_security', title: 'Roles', key: 'member_settings_roles', requiredScope: ['SETTINGS_ROLES_ACCESS'] },
          { icon: 'o_account_box', title: 'User Levels', key: 'member_settings_user_level', requiredScope: ['SETTINGS_USER_LEVEL_ACCESS'] }
        ],
      },
      {
        title: 'Workflow',
        key: 'workflow_configuration',
        icon: 'o_settings_applications',
        child: [
          { icon: 'o_shopping_cart', title: 'Purchase Request Workflow', key: 'member_settings_workflow_purchase_request', requiredScope: ['SETTINGS_WORKFLOW_ACCESS'] },
          { icon: 'o_local_shipping', title: 'Delivery Status Workflow', key: 'member_settings_workflow_delivery', requiredScope: ['SETTINGS_WORKFLOW_ACCESS'] },
          { icon: 'o_receipt', title: 'Liquidation Workflow', key: 'member_settings_workflow_liquidation', requiredScope: ['SETTINGS_WORKFLOW_ACCESS'] },
        ],
      },
      {
        title: 'System',
        key: 'system',
        icon: 'o_settings',
        child: [
            { icon: 'o_devices', title: 'Device Management', key: 'member_settings_device_management', requiredScope: ['SETTINGS_DEVICE_MANAGEMENT_ACCESS'] },
            { icon: 'o_code', title: 'Super Admin Promotion', key: 'member_settings_developer_promotion', requiredScope: ['SETTINGS_DEVELOPER_PROMOTION_ACCESS'] },
            { icon: 'o_send', title: 'Sent Emails', key: 'member_settings_system_emails', requiredScope: ['SETTINGS_SYSTEM_EMAILS_ACCESS'] },
            { icon: 'o_info', title: 'About', key: 'member_settings_about' },
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
