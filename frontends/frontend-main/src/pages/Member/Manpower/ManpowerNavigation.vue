<template>
  <div class="manpower">
    <div class="navigation">
      <div class="title text-title-medium">Manpower</div>
      <div>
        <q-list>
          <template v-for="nav in filteredNavList" :key="nav.key">
            <q-item
              v-if="!nav.child"
              clickable
              v-ripple
              @click="navigate(nav.key)"
              class="nav-item"
              :class="['nav-item', isMainNavActive(nav) ? 'active' : '']"
            >
              <q-item-section>
                <q-item-label class="text-label-medium">{{ nav.title }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-expansion-item
              v-else
              expand-separator
              :label="nav.title"
              :model-value="expandedState[nav.key]"
              :class="isMainNavActive(nav) ? 'active' : ''"
              class="text-label-medium"
            >
              <q-card>
                <q-list class="nav-list q-pb-md ">
                  <q-item
                    v-for="childNav in nav.child"
                    :key="childNav.key"
                    clickable
                    v-ripple
                    @click="navigate(childNav.key)"
                    class="nav-item"
                    :class="childNav.key == activeNav ? 'active' : ''"
                  >
                    <q-item-section class="sub-nav text-body-small">
                      <i v-if="childNav.icon" class="material-icons nav-icon">{{ childNav.icon }}</i>
                      {{ childNav.title }}
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card>
            </q-expansion-item>
          </template>
        </q-list>
      </div>
    </div>
    <div class="content">
      <slot></slot>
    </div>
  </div>
</template>

<style lang="scss" src="./ManpowerPage.scss" scoped></style>

<script lang="ts">
import { useRouter } from 'vue-router';
import { ref, computed } from 'vue';
import { hasAccess } from "../../../utility/access.handler";

interface ChildNavItem {
  icon: string;
  title: string;
  key: string;
  requiredScope?: string[];
}

interface NavItem {
  title: string;
  key: string;
  child?: ChildNavItem[];
  requiredScope?: string[];
}

export default {
  name: 'ManpowerNavigation',
  props: {},
  setup() {
    const $router = useRouter();
    const activeNav = ref($router.currentRoute.value.name?.toString() || '');

    // Compute which expansion items should be open
    const expandedState = computed(() => {
      const state: Record<string, boolean> = {};
      navList.value.forEach((nav) => {
        if (nav.child) {
          state[nav.key] = nav.child.some((child) => child.key === activeNav.value);
        }
      });
      return state;
    });

    // Determine if a main nav item is active
    const isMainNavActive = (nav: NavItem) => {
      if (nav.child) {
        return nav.child.some((child) => child.key === activeNav.value);
      }
      return nav.key === activeNav.value;
    };

    const navList = ref<NavItem[]>([
      {
        title: 'Payroll',
        key: 'payroll',
        child: [
          { icon: 'schedule', title: 'Payroll Time Keeping', key: 'member_manpower_payroll_time_keeping', requiredScope: ['MANPOWER_TIME_KEEPING_ACCESS_ALL', 'MANPOWER_TIME_KEEPING_ACCESS_BY_BRANCH'] },
          { icon: 'account_balance', title: 'Payroll Center', key: 'member_manpower_payroll_center', requiredScope: ['MANPOWER_PAYROLL_CENTER_ACCESS'] },
          { icon: 'receipt_long', title: 'Payslip Center', key: 'member_manpower_payslip_center', requiredScope: ['MANPOWER_PAYSLIP_CENTER_ACCESS'] },
          { icon: 'alarm', title: 'Time Importation', key: 'member_manpower_time_importation', requiredScope: ['MANPOWER_TIME_IMPORTATION_ACCESS'] },
        ],
      },
      {
        title: 'HRIS',
        key: 'member_manpower_hris',
      },
      {
        title: 'Team',
        key: 'team',
        child: [
          { icon: 'fact_check', title: 'Team Attendance', key: 'member_manpower_team_attendance', requiredScope: ['MANPOWER_TEAM_ATTENDANCE_ACCESS'] },
          {
            icon: 'swap_horiz',
            title: 'Team Shifting Management',
            key: 'member_manpower_team_shifting_management',
            requiredScope: ['MANPOWER_TEAM_SHIFTS_ACCESS'],
          },
        ],
      },
      {
        title: 'Configuration',
        key: 'configuration',
        child: [
          { icon: 'group', title: 'Payroll Group', key: 'member_manpower_payroll_group', requiredScope: ['MANPOWER_CONFIGURATION_PAYROLL_GROUP_ACCESS'] },
          { icon: 'event', title: 'Holidays', key: 'member_manpower_holidays', requiredScope: ['MANPOWER_CONFIGURATION_LOCAL_HOLIDAY_ACCESS'] },
          { icon: 'beach_access', title: 'Service Incentive Leaves', key: 'member_manpower_service_incentive_leave', requiredScope: ['MANPOWER_CONFIGURATION_SERVICE_INCLUSIVE_LEAVE_ACCESS'] },
          { icon: 'remove_circle_outline', title: 'Deduction', key: 'member_manpower_deduction', requiredScope: ['MANPOWER_CONFIGURATION_DEDUCTION_ACCESS'] },
          { icon: 'money', title: 'Allowance', key: 'member_manpower_allowance', requiredScope: ['MANPOWER_CONFIGURATION_ALLOWANCE_ACCESS'] },
          { icon: 'verified_user', title: 'Payroll Approvers', key: 'member_manpower_payroll_approvers', requiredScope: ['MANPOWER_CONFIGURATION_PAYROLL_APPROVERS_ACCESS'] },
          { icon: 'table_chart', title: 'Tax Table', key: 'member_manpower_tax_table', requiredScope: ['MANPOWER_CONFIGURATION_TAX_ACCESS'] },
          { icon: 'local_hospital', title: 'Philhealth', key: 'member_manpower_philhealth', requiredScope: ['MANPOWER_CONFIGURATION_PHILHEALTH_ACCESS'] },
          { icon: 'security', title: 'SSS', key: 'member_manpower_sss', requiredScope: ['MANPOWER_CONFIGURATION_SSS_ACCESS'] },
          { icon: 'favorite', title: 'Pagibig', key: 'member_manpower_pagibig', requiredScope: ['MANPOWER_CONFIGURATION_PAGIBIG_ACCESS'] },
          { icon: 'calendar_today', title: 'Schedule Management', key: 'member_manpower_schedule_management', requiredScope: ['MANPOWER_CONFIGURATION_SCHEDULE_ACCESS'] },
          { icon: 'autorenew', title: 'Shift Management', key: 'member_manpower_shift_management', requiredScope: ['MANPOWER_CONFIGURATION_SHIFT_ACCESS'] },
          { icon: 'hourglass_bottom', title: 'Cut-Off Management', key: 'member_manpower_cutoff_management', requiredScope: ['MANPOWER_CONFIGURATION_CUTOFF_ACCESS'] },
        ],
      },
      {
        title: 'Time Keeping Device',
        key: 'member_manpower_time_keeping_device',
        requiredScope: ['MANPOWER_TIME_KEEPING_DEVICE_ACCESS'],
      },
      {
        title: 'Reports',
        key: 'reports',
        child: [
          { icon: 'account_balance', title: 'SSS Contributions', key: 'member_manpower_reports_sss', requiredScope: ['MANPOWER_REPORTS_SSS_ACCESS'] },
          { icon: 'local_hospital', title: 'PhilHealth Contributions', key: 'member_manpower_reports_philhealth', requiredScope: ['MANPOWER_REPORTS_PHILHEALTH_ACCESS'] },
          { icon: 'favorite', title: 'Pag-IBIG Contributions', key: 'member_manpower_reports_pagibig', requiredScope: ['MANPOWER_REPORTS_PAGIBIG_ACCESS'] },
          { icon: 'receipt', title: 'Tax Withholding', key: 'member_manpower_reports_tax', requiredScope: ['MANPOWER_REPORTS_TAX_ACCESS'] },
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

    return {
      navigate,
      filteredNavList,
      activeNav,
      expandedState,
      isMainNavActive,
    };
  },
};
</script>
