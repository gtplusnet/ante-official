<template>
  <div class="q-pa-sm nav-submenu">
    <div v-for="item in filteredNavList" :key="item.key">
      <div class="nav-item row items-center justify-between"
           :class="item.key == activeNav ? 'active' : ''"
           @click="item.child && item.child.length > 0 ? toggleDropdown(item.key) : navigate(item.key)">
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
          style="color: var(--q-grey-icon)"
        />
      </div>

      <div v-if="item.child && item.child.length > 0 && openKey === item.key" class="q-pb-sm">
        <div v-for="child in item.child" :key="child.key" class="nav-item-dropdown row items-center justify-between" :class="child.key == activeNav ? 'active' : ''" @click.stop="navigate(child.key)">
          <div class="row items-center">
            <div><q-icon :name="getActiveIcon(child.icon, child.key == activeNav)" size="20px" class="menu-icon q-mr-sm" /></div>
            <div class="text-label-medium text-grey">{{ child.title }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./ManpowerSubMenu.scss"></style>

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
  name: 'ManpowerSubMenu',

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
        key: 'member_manpower_dashboard',
        icon: 'o_grid_view',
      },
      {
        title: 'Payroll',
        key: 'payroll',
        icon: 'o_calculate',
        child: [
          {
            icon: 'o_schedule',
            title: 'Payroll Time Keeping',
            key: 'member_manpower_payroll_time_keeping',
            requiredScope: ['MANPOWER_TIME_KEEPING_ACCESS_ALL', 'MANPOWER_TIME_KEEPING_ACCESS_BY_BRANCH'],
          },
          { icon: 'o_account_balance', title: 'Payroll Center', key: 'member_manpower_payroll_center', requiredScope: ['MANPOWER_PAYROLL_CENTER_ACCESS'] },
          // { icon: 'o_receipt_long', title: 'Payslip Center', key: 'member_manpower_payslip_center', requiredScope: ['MANPOWER_PAYSLIP_CENTER_ACCESS'] },
        ],
      },
      {
        title: 'HRIS',
        key: 'member_manpower_hris',
        icon: 'o_folder_open',
      },
      {
        title: 'Team Management',
        key: 'member_manpower_team_management',
        icon: 'o_groups',
        requiredScope: ['MANPOWER_TEAM_MANAGEMENT_ACCESS'],
      },
      // {
      //   title: 'Team',
      //   key: 'team',
      //   icon: 'o_groups',
      //   child: [
      //     { icon: 'o_fact_check', title: 'Team Attendance', key: 'member_manpower_team_attendance', requiredScope: ['MANPOWER_TEAM_ATTENDANCE_ACCESS'] },
      //     {
      //       icon: 'o_swap_horiz',
      //       title: 'Team Shifting Management',
      //       key: 'member_manpower_team_shifting_management',
      //       requiredScope: ['MANPOWER_TEAM_SHIFTS_ACCESS'],
      //     },
      //     {
      //       icon: 'o_group_work',
      //       title: 'Team Management',
      //       key: 'member_manpower_team_management',
      //       requiredScope: ['MANPOWER_TEAM_MANAGEMENT_ACCESS'],
      //     },
      //   ],
      // },
      {
        title: 'Timekeeping Logs',
        key: 'timekeeping_logs',
        icon: 'o_access_time',
        child: [
          // { icon: 'o_tablet_android', title: 'Time Keeping Device', key: 'member_manpower_time_keeping_device', requiredScope: ['MANPOWER_TIME_KEEPING_DEVICE_ACCESS'] },
          { icon: 'o_alarm', title: 'Time Importation', key: 'member_manpower_time_importation', requiredScope: ['MANPOWER_TIME_IMPORTATION_ACCESS'] },
          { icon: 'o_list_alt', title: 'Raw Logs Browse', key: 'member_manpower_timekeeping_raw_logs', requiredScope: ['MANPOWER_TIMEKEEPING_RAW_LOGS_ACCESS'] },
        ],
      },
      {
        title: 'Configuration',
        key: 'configuration',
        icon: 'o_settings_applications',
        child: [
          { icon: 'o_group', title: 'Payroll Group', key: 'member_manpower_payroll_group', requiredScope: ['MANPOWER_CONFIGURATION_PAYROLL_GROUP_ACCESS'] },
          { icon: 'o_event', title: 'Holidays', key: 'member_manpower_holidays', requiredScope: ['MANPOWER_CONFIGURATION_LOCAL_HOLIDAY_ACCESS'] },
          {
            icon: 'o_beach_access',
            title: 'Service Incentive Leaves',
            key: 'member_manpower_service_incentive_leave',
            requiredScope: ['MANPOWER_CONFIGURATION_SERVICE_INCLUSIVE_LEAVE_ACCESS'],
          },
          { icon: 'o_remove_circle_outline', title: 'Deduction', key: 'member_manpower_deduction', requiredScope: ['MANPOWER_CONFIGURATION_DEDUCTION_ACCESS'] },
          { icon: 'o_money', title: 'Allowance', key: 'member_manpower_allowance', requiredScope: ['MANPOWER_CONFIGURATION_ALLOWANCE_ACCESS'] },
          { icon: 'o_verified_user', title: 'Payroll Approvers', key: 'member_manpower_payroll_approvers', requiredScope: ['MANPOWER_CONFIGURATION_PAYROLL_APPROVERS_ACCESS'] },
          { icon: 'o_table_chart', title: 'Tax Table', key: 'member_manpower_tax_table', requiredScope: ['MANPOWER_CONFIGURATION_TAX_ACCESS'] },
          { icon: 'o_local_hospital', title: 'Philhealth', key: 'member_manpower_philhealth', requiredScope: ['MANPOWER_CONFIGURATION_PHILHEALTH_ACCESS'] },
          { icon: 'o_security', title: 'SSS', key: 'member_manpower_sss', requiredScope: ['MANPOWER_CONFIGURATION_SSS_ACCESS'] },
          { icon: 'o_favorite', title: 'Pagibig', key: 'member_manpower_pagibig', requiredScope: ['MANPOWER_CONFIGURATION_PAGIBIG_ACCESS'] },
          { icon: 'o_hourglass_bottom', title: 'Cut-Off Management', key: 'member_manpower_cutoff_management', requiredScope: ['MANPOWER_CONFIGURATION_CUTOFF_ACCESS'] },
        ],
      },
      {
        title: 'Scheduling',
        key: 'scheduling',
        icon: 'o_schedule',
        child: [
          { icon: 'o_person', title: 'Individual Scheduling', key: 'member_manpower_individual_scheduling', requiredScope: ['MANPOWER_INDIVIDUAL_SCHEDULING_ACCESS'] },
          { icon: 'o_groups', title: 'Team Scheduling', key: 'member_manpower_team_scheduling', requiredScope: ['MANPOWER_TEAM_SCHEDULING_ACCESS'] },
          { icon: 'o_calendar_today', title: 'Schedule Management', key: 'member_manpower_schedule_management', requiredScope: ['MANPOWER_CONFIGURATION_SCHEDULE_ACCESS'] },
          { icon: 'o_autorenew', title: 'Shift Management', key: 'member_manpower_shift_management', requiredScope: ['MANPOWER_CONFIGURATION_SHIFT_ACCESS'] },
        ],
      },
      {
        title: 'Reports',
        key: 'reports',
        icon: 'o_article',
        child: [
          { icon: 'o_account_balance', title: 'SSS Contributions', key: 'member_manpower_reports_sss', requiredScope: ['MANPOWER_REPORTS_SSS_ACCESS'] },
          { icon: 'o_local_hospital', title: 'PhilHealth Contributions', key: 'member_manpower_reports_philhealth', requiredScope: ['MANPOWER_REPORTS_PHILHEALTH_ACCESS'] },
          { icon: 'o_favorite', title: 'Pag-IBIG Contributions', key: 'member_manpower_reports_pagibig', requiredScope: ['MANPOWER_REPORTS_PAGIBIG_ACCESS'] },
          { icon: 'o_receipt', title: 'Tax Withholding', key: 'member_manpower_reports_tax', requiredScope: ['MANPOWER_REPORTS_TAX_ACCESS'] },
        ],
      },
      {
        title: 'Media Library',
        key: 'member_manpower_media_library',
        icon: 'o_perm_media',
      },
      {
        title: 'API',
        key: 'api',
        icon: 'o_api',
        child: [
          { icon: 'o_devices', title: 'Device Management', key: 'member_manpower_api_devices', requiredScope: [] },
          { icon: 'o_description', title: 'API Documentation', key: 'member_manpower_api_documentation', requiredScope: [] },
        ],
      },
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
