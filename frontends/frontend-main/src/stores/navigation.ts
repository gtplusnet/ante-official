import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useAuthStore } from './auth';
import { hasAccess } from "../utility/access.handler";
import { useQuasar } from 'quasar';

export const useNavigationStore = defineStore('navigation', () => {
  const $q = useQuasar();
  
  const linksList = [
    {
      title: 'Dashboard',
      icon: 'o_space_dashboard',
      route: 'member_dashboard',
      developerOnly: false,
      requiredScope: null,
      canBeDisabled: false,
    },
    {
      title: 'Task',
      icon: 'o_task_alt',
      route: 'member_task_my_task',
      developerOnly: false,
      requiredScope: null,
      canBeDisabled: true,
    },
    {
      title: 'Projects',
      icon: 'o_cases',
      route: 'member_project_dashboard',
      developerOnly: false,
      requiredScope: 'PROJECT_ACCESS',
      canBeDisabled: true,
    },
    {
      title: 'Assets',
      icon: 'o_folder_copy',
      route: 'member_asset_company_warehouse',
      developerOnly: false,
      requiredScope: 'ASSET_ACCESS',
      canBeDisabled: true,
    },
    {
      title: 'Calendar',
      icon: 'o_calendar_month',
      route: 'member_calendar',
      developerOnly: false,
      requiredScope: null,
      canBeDisabled: false,
    },
    {
      title: 'Manpower',
      icon: 'o_groups',
      route: 'member_manpower_dashboard',
      developerOnly: false,
      requiredScope: 'MANPOWER_ACCESS',
      canBeDisabled: true,
    },
    {
      title: 'CRM',
      icon: 'o_handshake',
      route: 'member_leads_dashboard',
      developerOnly: false,
      requiredScope: 'LEADS_ACCESS',
      canBeDisabled: true,
    },
    {
      title: 'Treasury',
      icon: 'o_assured_workload',
      route: 'member_treasury',
      developerOnly: false,
      requiredScope: 'TREASURY_ACCESS',
      canBeDisabled: true,
    },
    {
      title: 'CMS',
      icon: 'o_dashboard',
      route: 'member_cms_dashboard',
      developerOnly: false,
      requiredScope: null,
      canBeDisabled: true,
    },
    {
      title: 'Settings',
      icon: 'o_settings',
      route: 'member_settings_company',
      developerOnly: false,
      requiredScope: 'SETTINGS_ACCESS',
      canBeDisabled: true,
    },
    {
      title: 'School',
      icon: 'o_school',
      route: 'member_school_student_management',
      developerOnly: false,
      requiredScope: 'SCHOOL_MANAGEMENT_ACCESS',
      canBeDisabled: true,
    },
    {
      title: 'Developer',
      icon: 'o_developer_mode',
      route: 'member_developer_company_management',
      developerOnly: true,
      requiredScope: null,
      canBeDisabled: false,
    },
  ];

  const filteredLinks = computed(() => {
    const authStore = useAuthStore();

    return linksList.filter((link) => {
      // Check if module is disabled for the company
      const companyDisabledModules = authStore.companyData?.disabledModules || [];
      if (link.canBeDisabled && companyDisabledModules.includes(link.route)) {
        return false;
      }

      // Developer can access all links
      if (authStore.isDeveloper) {
        return true;
      }

      // Non-developers: filter out developer-only links and check scope access
      return !link.developerOnly && hasAccess(link.requiredScope);
    });
  });

  // Mobile navigation: excludes Dashboard as it's in bottom navigation
  const mobileFilteredLinks = computed(() => {
    const authStore = useAuthStore();
    const isMobile = $q.platform.is.mobile || window.innerWidth <= 768;

    return linksList.filter((link) => {
      // Skip Dashboard on mobile as it's in bottom navigation
      if (isMobile && link.route === 'member_dashboard') {
        return false;
      }

      // Check if module is disabled for the company
      const companyDisabledModules = authStore.companyData?.disabledModules || [];
      if (link.canBeDisabled && companyDisabledModules.includes(link.route)) {
        return false;
      }

      // Developer can access all links
      if (authStore.isDeveloper) {
        return true;
      }

      // Non-developers: filter out developer-only links and check scope access
      return !link.developerOnly && hasAccess(link.requiredScope);
    });
  });

  // Get list of modules that can be toggled on/off
  const toggleableModules = computed(() => {
    return linksList.filter(link => link.canBeDisabled);
  });

  return {
    linksList,
    filteredLinks,
    mobileFilteredLinks,
    toggleableModules,
  };
});
