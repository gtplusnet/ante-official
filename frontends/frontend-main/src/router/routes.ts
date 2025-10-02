import { RouteRecordRaw } from 'vue-router';
import { MemberRouteGuard } from './route_guard/route_guard';
import { DeveloperRouteGuard } from './route_guard/developer_route_guard';
import { FrontRouteGuard } from './route_guard/front_route_guard';
import { routeScopeMap } from './config/route-scopes';

// Import Lead components eagerly to avoid dynamic import errors in preview
import Leads from 'pages/Member/Leads/Leads.vue';
import LeadPage from 'pages/Member/Leads/LeadPage.vue';

// Import Task components
import Tasks from 'pages/Member/Task/Tasks.vue';
import TaskList from 'pages/Member/Task/TaskList.vue';

/**
 * Helper function to add scope meta fields to routes based on the mapping
 */
function addScopeMeta(routes: RouteRecordRaw[]): RouteRecordRaw[] {
  return routes.map(route => {
    // Add scope meta if route name exists in mapping
    if (route.name && routeScopeMap[route.name as string]) {
      route.meta = {
        ...route.meta,
        requiredScope: routeScopeMap[route.name as string]
      };
    }
    
    // Recursively process children
    if (route.children) {
      route.children = addScopeMeta(route.children);
    }
    
    return route;
  });
}

const routesConfig: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/FrontLayout.vue'),
    beforeEnter: (to, from, next) => {
      console.log('[ROUTE DEBUG] FrontLayout beforeEnter:', {
        toName: to.name,
        toPath: to.path,
        toFullPath: to.fullPath,
        toMatched: to.matched.map(m => m.name)
      });
      FrontRouteGuard(to, from, next);
    },
    children: [
      {
        name: 'front_landing',
        path: '/',
        component: () => import('pages/Front/SignIn/SignIn.vue'),
        meta: { title: 'Sign In' }
      },
      {
        name: 'front_login',
        path: '/login',
        component: () => import('pages/Front/SignIn/SignIn.vue'),
        meta: { title: 'Sign In' }
      },
      {
        name: 'front_signup',
        path: 'signup',
        component: () => import('pages/Front/SignUp/SignUp.vue'),
        meta: { title: 'Sign Up' }
      },
      {
        name: 'front_inactive_account',
        path: 'inactive-account',
        component: () => import('pages/Front/InactiveAccount/InactiveAccount.vue'),
      },
      {
        name: 'front_verify_email',
        path: 'verify-email/:token',
        component: () => import('pages/Front/EmailVerification/VerificationSuccess.vue'),
      },
      {
        name: 'front_invite_accept',
        path: 'invite/:token',
        component: () => import('pages/Front/Invite/InviteAcceptance.vue'),
      },
    ],
  },
  {
    path: '/preview',
    component: () => import('layouts/BlankLayout.vue'),
    children: [
      {
        name: 'preview_timekeeping',
        path: 'timekeeping',
        component: () => import('pages/Preview/TimekeepingPreview.vue'),
      },
    ],
  },
  {
    path: '/member',
    beforeEnter: MemberRouteGuard,
    component: () => import('layouts/MainLayout.vue'),
    children: [
      // Dashboard
      {
        name: 'member_dashboard',
        path: 'dashboard',
        component: () => import('pages/Member/Dashboard/Dashboard.vue'),
        meta: { title: 'Dashboard' }
      },

      // Task
      {
        name: 'member_task',
        path: 'task',
        component: Tasks,
        redirect: { name: 'member_task_my_task' },
        children: [
          {
            path: 'my-task',
            name: 'member_task_my_task',
            component: TaskList,
            props: { filter: 'my' },
            meta: { title: 'My Tasks' }
          },
          {
            path: 'all',
            name: 'member_task_all',
            component: TaskList,
            props: { filter: 'all' },
            meta: { title: 'All Tasks' }
          },
          {
            path: 'approval',
            name: 'member_task_approval',
            component: TaskList,
            props: { filter: 'approval' },
            meta: { title: 'Approval Tasks' }
          },
          {
            path: 'due',
            name: 'member_task_due',
            component: TaskList,
            props: { filter: 'due' },
            meta: { title: 'Due Tasks' }
          },
          {
            path: 'done',
            name: 'member_task_done',
            component: TaskList,
            props: { filter: 'done' },
            meta: { title: 'Done Tasks' }
          },
          {
            path: 'assigned',
            name: 'member_task_assigned',
            component: TaskList,
            props: { filter: 'assigned' },
            meta: { title: 'Assigned Tasks' }
          },
          {
            path: 'complete',
            name: 'member_task_complete',
            component: TaskList,
            props: { filter: 'complete' },
            meta: { title: 'Complete Tasks' }
          },
          {
            path: 'deleted',
            name: 'member_task_deleted',
            component: TaskList,
            props: { filter: 'deleted' },
            meta: { title: 'Deleted Tasks' }
          },
        ],
      },

      // Profile
      {
        name: 'member_profile',
        path: 'profile',
        component: () => import('pages/Member/Profile/MemberProfileMobilePage.vue'),
        meta: { title: 'Profile' }
      },

      // Project
      {
        name: 'member_project_dashboard',
        path: 'project/dashboard',
        component: () => import('pages/Member/Project/ProjectDashboard.vue'),
        meta: { title: 'Project Dashboard' }
      },
      {
        name: 'member_project',
        path: 'project',
        component: () => import('pages/Member/Project/Project.vue'),
        meta: { title: 'Active Projects' }
      },
      {
        name: 'member_project_page',
        path: 'project/:id',
        component: () => import('pages/Member/Project/ProjectPage.vue'),
        meta: { title: 'Project Details' }
      },
      {
        name: 'member_project_client_management',
        path: 'project/client-management',
        component: () => import('pages/Member/Project/ClientManagement.vue'),
        meta: { title: 'Client Management' }
      },
      {
        name: 'member_project_media_library',
        path: 'project/media-library',
        component: () => import('pages/Member/Project/MediaLibrary.vue'),
        meta: { title: 'Media Library' }
      },

      // Asset
      // Warehouse
      {
        name: 'member_asset_company_warehouse',
        path: 'asset/warehouse/company',
        component: () => import('pages/Member/Asset/Warehouse/AssetCompanyWarehouse.vue'),
      },
      {
        name: 'member_asset_project_warehouse',
        path: 'asset/warehouse/project',
        component: () => import('pages/Member/Asset/Warehouse/AssetProjectWarehouse.vue'),
      },
      {
        name: 'member_asset_intransit_warehouse',
        path: 'asset/warehouse/intransit',
        component: () => import('pages/Member/Asset/Warehouse/AssetInTransitWarehouse.vue'),
      },
      {
        name: 'member_asset_temporary_warehouse',
        path: 'asset/warehouse/temporary',
        component: () => import('pages/Member/Asset/Warehouse/AssetTemporaryWarehouse.vue'),
      },
      // Item
      {
        name: 'member_asset_item_simple',
        path: 'asset/item/simple',
        component: () => import('pages/Member/Asset/Item/AssetItemSimple.vue'),
      },
      {
        name: 'member_asset_item_advance',
        path: 'asset/item/advance',
        component: () => import('pages/Member/Asset/Item/AssetItemAdvance.vue'),
      },
      {
        name: 'member_asset_item_deleted',
        path: 'asset/item/deleted',
        component: () => import('pages/Member/Asset/Item/AssetItemDeleted.vue'),
      },
      // Purchasing
      {
        name: 'member_asset_purchase_request',
        path: 'asset/purchasing/request',
        component: () => import('pages/Member/Asset/Purchasing/AssetPurchaseRequest.vue'),
      },
      {
        name: 'member_asset_purchase_order',
        path: 'asset/purchasing/order',
        component: () => import('pages/Member/Asset/Purchasing/AssetPurchaseOrder.vue'),
      },
      {
        name: 'member_asset_suppliers',
        path: 'asset/purchasing/suppliers',
        component: () => import('pages/Member/Asset/Purchasing/AssetSuppliers.vue'),
      },
      // Deliveries
      {
        name: 'member_asset_deliveries_pending',
        path: 'asset/deliveries/pending',
        component: () => import('pages/Member/Asset/Deliveries/AssetDeliveriesPending.vue'),
      },
      {
        name: 'member_asset_deliveries_truck_load',
        path: 'asset/deliveries/truck-load',
        component: () => import('pages/Member/Asset/Deliveries/AssetDeliveriesTruckLoad.vue'),
      },
      {
        name: 'member_asset_deliveries_done',
        path: 'asset/deliveries/done',
        component: () => import('pages/Member/Asset/Deliveries/AssetDeliveriesDone.vue'),
      },
      {
        name: 'member_asset_deliveries_canceled',
        path: 'asset/deliveries/canceled',
        component: () => import('pages/Member/Asset/Deliveries/AssetDeliveriesCanceled.vue'),
      },
      // Equipment
      {
        name: 'member_asset_equipment_list',
        path: 'asset/equipment/list',
        component: () => import('pages/Member/Asset/Equipment/AssetEquipmentList.vue'),
      },
      {
        name: 'member_asset_equipment_parts',
        path: 'asset/equipment/parts',
        component: () => import('pages/Member/Asset/Equipment/AssetEquipmentParts.vue'),
      },
      {
        name: 'member_asset_equipment_joborders',
        path: 'asset/equipment/joborders',
        component: () => import('pages/Member/Asset/Equipment/AssetEquipmentJobOrders.vue'),
      },

      // CMS
      {
        name: 'member_cms_dashboard',
        path: 'cms/dashboard',
        component: () => import('pages/Member/CMS/Dashboard/CMSDashboard.vue'),
        meta: { title: 'CMS Dashboard' }
      },
      {
        name: 'member_cms_content_type_builder',
        path: 'cms/content-type-builder',
        component: () => import('pages/Member/CMS/ContentTypes/ContentTypeBuilder.vue'),
        meta: { title: 'Content Type Builder' }
      },
      {
        name: 'member_cms_collection_types',
        path: 'cms/content-manager/:contentType?',
        component: () => import('pages/Member/CMS/ContentManager/ContentManager.vue'),
        meta: { title: 'Content Manager' }
      },
      {
        name: 'member_cms_single_types',
        path: 'cms/single-types',
        component: () => import('pages/Member/CMS/CMSPageTemplate.vue'),
        meta: { title: 'Single Types' },
        props: { pageTitle: 'Single Types', pageIcon: 'description' }
      },
      {
        name: 'member_cms_components',
        path: 'cms/components',
        component: () => import('pages/Member/CMS/CMSPageTemplate.vue'),
        meta: { title: 'Components' },
        props: { pageTitle: 'Components', pageIcon: 'widgets' }
      },
      {
        name: 'member_cms_media_library',
        path: 'cms/media-library',
        component: () => import('pages/Member/CMS/Media/MediaLibrary.vue'),
        meta: { title: 'Media Library' }
      },
      {
        name: 'member_treasury_media_library',
        path: 'treasury/media-library',
        component: () => import('pages/Member/Treasury/TreasuryMediaLibrary.vue'),
        meta: { title: 'Treasury Media Library' }
      },
      {
        name: 'member_school_media_library',
        path: 'school/media-library',
        component: () => import('pages/Member/School/SchoolMediaLibrary.vue'),
        meta: { title: 'School Media Library' }
      },
      {
        name: 'member_leads_media_library',
        path: 'leads/media-library',
        component: () => import('pages/Member/Leads/LeadsMediaLibrary.vue'),
        meta: { title: 'Leads Media Library' }
      },
      {
        name: 'member_asset_media_library',
        path: 'asset/media-library',
        component: () => import('pages/Member/Asset/AssetMediaLibrary.vue'),
        meta: { title: 'Asset Media Library' }
      },
      {
        name: 'member_manpower_media_library',
        path: 'manpower/media-library',
        component: () => import('pages/Member/Manpower/ManpowerMediaLibrary.vue'),
        meta: { title: 'Manpower Media Library' }
      },
      {
        name: 'member_cms_api_tokens',
        path: 'cms/api-tokens',
        component: () => import('pages/Member/CMS/API/CMSAPIPage.vue'),
        meta: { title: 'API Management' }
      },
      {
        name: 'member_cms_webhooks',
        path: 'cms/webhooks',
        component: () => import('pages/Member/CMS/CMSPageTemplate.vue'),
        meta: { title: 'Webhooks' },
        props: { pageTitle: 'Webhooks', pageIcon: 'webhook' }
      },
      {
        name: 'member_cms_documentation',
        path: 'cms/documentation',
        component: () => import('pages/Member/CMS/CMSPageTemplate.vue'),
        meta: { title: 'API Documentation' },
        props: { pageTitle: 'API Documentation', pageIcon: 'description' }
      },
      {
        name: 'member_cms_locales',
        path: 'cms/locales',
        component: () => import('pages/Member/CMS/CMSPageTemplate.vue'),
        meta: { title: 'Locales' },
        props: { pageTitle: 'Locales', pageIcon: 'translate' }
      },
      {
        name: 'member_cms_translations',
        path: 'cms/translations',
        component: () => import('pages/Member/CMS/CMSPageTemplate.vue'),
        meta: { title: 'Translations' },
        props: { pageTitle: 'Translations', pageIcon: 'g_translate' }
      },
      {
        name: 'member_cms_roles',
        path: 'cms/roles',
        component: () => import('pages/Member/CMS/CMSPageTemplate.vue'),
        meta: { title: 'Roles & Permissions' },
        props: { pageTitle: 'Roles & Permissions', pageIcon: 'admin_panel_settings' }
      },
      {
        name: 'member_cms_email_templates',
        path: 'cms/email-templates',
        component: () => import('pages/Member/CMS/CMSPageTemplate.vue'),
        meta: { title: 'Email Templates' },
        props: { pageTitle: 'Email Templates', pageIcon: 'email' }
      },
      {
        name: 'member_cms_plugins',
        path: 'cms/plugins',
        component: () => import('pages/Member/CMS/CMSPageTemplate.vue'),
        meta: { title: 'Plugins' },
        props: { pageTitle: 'Plugins', pageIcon: 'extension' }
      },
      {
        name: 'member_cms_audit_logs',
        path: 'cms/audit-logs',
        component: () => import('pages/Member/CMS/CMSPageTemplate.vue'),
        meta: { title: 'Audit Logs' },
        props: { pageTitle: 'Audit Logs', pageIcon: 'history' }
      },

      // Manpower
      {
        name: 'member_manpower_dashboard',
        path: 'manpower/dashboard',
        component: () => import('pages/Member/Manpower/Dashboard/ManpowerDashboard.vue'),
        meta: { title: 'Manpower Dashboard' }
      },
      {
        name: 'member_manpower_payroll_center',
        path: 'manpower/payroll-center',
        component: () => import('pages/Member/Manpower/Payroll/PayrollCenterPage/PayrollCenterMenuPage.vue'),
      },
      {
        name: 'member_manpower_payslip_center',
        path: 'manpower/payslip-center',
        component: () => import('pages/Member/Manpower/Payroll/PayslipCenterMenuPage.vue'),
      },
      {
        name: 'member_manpower_payroll_time_keeping',
        path: 'manpower/payroll-time-keeping',
        component: () => import('pages/Member/Manpower/Payroll/PayrollTimeKeepingMenuPageV2.vue'),
      },
      {
        name: 'member_manpower_time_importation',
        path: 'manpower/time-importation',
        component: () => import('pages/Member/Manpower/TimeImportation/TimeImportationMenuPage.vue'),
      },
      {
        name: 'member_manpower_hris',
        path: 'manpower/hris',
        component: () => import('pages/Member/Manpower/HRIS/HRISMenuPage.vue'),
      },
      {
        name: 'member_manpower_time_keeping_device',
        path: 'manpower/time-keeping-device',
        component: () => import('pages/Member/Manpower/TimeKeepingDevice/TimeKeepingDeviceMenuPage.vue'),
      },
      {
        name: 'member_manpower_timekeeping_raw_logs',
        path: 'manpower/timekeeping-raw-logs',
        component: () => import('pages/Member/Manpower/TimekeepingRawLogs/TimekeepingRawLogsMenuPage.vue'),
      },
      {
        name: 'member_manpower_team_attendance',
        path: 'manpower/team-attendance',
        component: () => import('pages/Member/Manpower/Team/TeamAttendanceMenuPage.vue'),
      },
      {
        name: 'member_manpower_team_shifting_management',
        path: 'manpower/team-shifting-management',
        component: () => import('pages/Member/Manpower/Team/TeamShiftingManagementMenuPage.vue'),
      },
      {
        name: 'member_manpower_team_management',
        path: 'manpower/team-management',
        component: () => import('pages/Member/Manpower/Team/TeamManagementMenuPage.vue'),
      },

      {
        name: 'member_manpower_payroll_group',
        path: 'manpower/payroll-group',
        component: () => import('pages/Member/Manpower/Configuration/PayrollGroupMenuPage.vue'),
      },

      {
        name: 'member_manpower_holidays',
        path: 'manpower/holidays',
        component: () => import('pages/Member/Manpower/Configuration/Holiday/HolidayHeaderMenuPage.vue'),
      },


      {
        name: 'member_manpower_deduction',
        path: 'manpower/deduction',
        component: () => import('pages/Member/Manpower/Configuration/Deduction/DeductionMenuPage.vue'),
      },

      {
        name: 'member_manpower_deduction_plan',
        path: 'manpower/deduction/:planId',
        component: () => import('pages/Member/Manpower/Configuration/Deduction/DeductionMenuPagePlan.vue'),
      },

      {
        name: 'member_manpower_allowance',
        path: 'manpower/allowance',
        component: () => import('pages/Member/Manpower/Configuration/Allowance/AllowanceMenuPage.vue'),
      },

      {
        name: 'member_manpower_allowance_plan',
        path: 'manpower/allowance/:planId',
        component: () => import('pages/Member/Manpower/Configuration/Allowance/AllowanceMenuPagePlan.vue'),
      },

      {
        name: 'member_manpower_service_incentive_leave',
        path: 'manpower/service-incentive-leave',
        component: () => import('pages/Member/Manpower/Configuration/ServiceIncentiveLeave/ServiceIncentiveLeaveMenuPage.vue'),
      },

      {
        name: 'member_manpower_service_incentive_leave_plan',
        path: 'manpower/service-incentive-leave/:planId',
        component: () => import('pages/Member/Manpower/Configuration/ServiceIncentiveLeave/ServiceIncentiveLeaveMenuPagePlan.vue'),
      },

      {
        name: 'member_manpower_payroll_approvers',
        path: 'manpower/payroll-approvers',
        component: () => import('pages/Member/Manpower/Configuration/PayrollApprovers/PayrollApproversMenuPage.vue'),
      },

      {
        name: 'member_manpower_tax_table',
        path: 'manpower/tax-table',
        component: () => import('pages/Member/Manpower/Configuration/TaxTableMenuPage.vue'),
      },

      {
        name: 'member_manpower_philhealth',
        path: 'manpower/philhealth',
        component: () => import('pages/Member/Manpower/Configuration/PhilhealthMenuPage.vue'),
      },

      {
        name: 'member_manpower_sss',
        path: 'manpower/sss',
        component: () => import('pages/Member/Manpower/Configuration/SSSPage/SSSMenuPage.vue'),
      },

      {
        name: 'member_manpower_pagibig',
        path: 'manpower/pagibig',
        component: () => import('pages/Member/Manpower/Configuration/PagibigMenuPage.vue'),
      },

      {
        name: 'member_manpower_schedule_management',
        path: 'manpower/schedule-management',
        component: () => import('pages/Member/Manpower/Configuration/ScheduleManagement/ScheduleManagementMenuPage.vue'),
      },

      {
        name: 'member_manpower_shift_management',
        path: 'manpower/shift-management',
        component: () => import('pages/Member/Manpower/Configuration/ShiftManagementMenuPage.vue'),
      },

      {
        name: 'member_manpower_cutoff_management',
        path: 'manpower/cutoff-management',
        component: () => import('pages/Member/Manpower/Configuration/CutOffManagement/CutOffManagementMenuPage.vue'),
      },

      // Manpower Scheduling
      {
        name: 'member_manpower_individual_scheduling',
        path: 'manpower/individual-scheduling',
        component: () => import('pages/Member/Manpower/Scheduling/IndividualSchedulingMenuPage.vue'),
      },
      {
        name: 'member_manpower_team_scheduling',
        path: 'manpower/team-scheduling',
        component: () => import('pages/Member/Manpower/Scheduling/TeamSchedulingMenuPage.vue'),
      },

      // Manpower Reports
      {
        name: 'member_manpower_reports_sss',
        path: 'manpower/reports/sss',
        component: () => import('pages/Member/Manpower/Reports/SSSContributionsReport.vue'),
      },
      {
        name: 'member_manpower_reports_philhealth',
        path: 'manpower/reports/philhealth',
        component: () => import('pages/Member/Manpower/Reports/PhilhealthContributionsReport.vue'),
      },
      {
        name: 'member_manpower_reports_pagibig',
        path: 'manpower/reports/pagibig',
        component: () => import('pages/Member/Manpower/Reports/PagibigContributionsReport.vue'),
      },
      {
        name: 'member_manpower_reports_tax',
        path: 'manpower/reports/tax',
        component: () => import('pages/Member/Manpower/Reports/TaxWithholdingReport.vue'),
      },

      // Manpower API
      {
        name: 'member_manpower_api_devices',
        path: 'manpower/api/devices',
        component: () => import('pages/Member/Manpower/API/ManpowerAPIDevices.vue'),
      },
      {
        name: 'member_manpower_api_documentation',
        path: 'manpower/api/documentation',
        component: () => import('pages/Member/Manpower/API/ManpowerAPIDocumentation.vue'),
      },

      // Test route
      {
        name: 'test_schedule_adjustment',
        path: 'test/schedule-adjustment',
        component: () => import('pages/TestScheduleAdjustment.vue'),
      },
      {
        name: 'test_treasury_sidebar',
        path: 'test/treasury-sidebar',
        component: () => import('pages/TestTreasurySidebar.vue'),
      },

      // Treasury
      {
        name: 'member_treasury',
        path: 'treasury',
        component: () => import('pages/Member/Treasury/TreasuryFundAccount.vue'),
      },
      {
        name: 'member_treasury_payables',
        path: 'treasury/payables',
        component: () => import('pages/Member/Treasury/TreasuryPayables.vue'),
      },
      {
        name: 'member_treasury_payables_purchase_order',
        path: 'treasury/payables/purchase-order',
        component: () => import('pages/Member/Treasury/TreasuryPayablesPurchaseOrder.vue'),
      },
      {
        name: 'member_treasury_payables_suppliers',
        path: 'treasury/payables/suppliers',
        component: () => import('pages/Member/Treasury/TreasuryPayablesSuppliers.vue'),
      },
      {
        name: 'member_treasury_payables_request_payment',
        path: 'treasury/payables/request-payment',
        component: () => import('pages/Member/Treasury/TreasuryPayablesRequestPayment.vue'),
      },
      {
        name: 'member_treasury_receivables',
        path: 'treasury/receivables',
        component: () => import('pages/Member/Treasury/TreasuryReceivables.vue'),
      },
      {
        name: 'member_treasury_receivables_project',
        path: 'treasury/receivables/project',
        component: () => import('pages/Member/Treasury/TreasuryReceivablesProject.vue'),
      },
      {
        name: 'member_treasury_receivables_client',
        path: 'treasury/receivables/client',
        component: () => import('pages/Member/Treasury/TreasuryReceivablesClient.vue'),
      },
      {
        name: 'member_treasury_receivables_logs',
        path: 'treasury/receivables/logs',
        component: () => import('pages/Member/Treasury/TreasuryReceivablesLogs.vue'),
      },
      {
        name: 'member_treasury_receivables_review',
        path: 'treasury/receivables/review',
        component: () => import('pages/Member/Treasury/TreasuryReceivablesReview.vue'),
      },
      {
        name: 'member_treasury_pettycash',
        path: 'treasury/pettycash',
        component: () => import('pages/Member/Treasury/TreasuryPettyCash.vue'),
      },
      {
        name: 'member_treasury_pettycash_liquidation',
        path: 'treasury/pettycash/liquidation',
        component: () => import('pages/Member/Treasury/TreasuryPettyCashLiquidation.vue'),
      },

      // Settings
      {
        path: 'settings',
        component: () => import('pages/Member/Settings/Settings.vue'),
        children: [
          {
            path: 'email',
            name: 'member_settings_email',
            component: () => import('pages/Member/Settings/SettingsEmail.vue'),
          },
          {
            path: 'company',
            name: 'member_settings_company',
            component: () => import('pages/Member/Settings/SettingsCompany.vue'),
          },
          {
            path: 'workflow',
            name: 'member_settings_workflow',
            component: () => import('pages/Member/Settings/SettingsWorkflow.vue'),
          },
          {
            path: 'workflow-purchase-request',
            name: 'member_settings_workflow_purchase_request',
            component: () => import('pages/Member/Settings/SettingsPurchaseRequestWorkflow.vue'),
          },
          {
            path: 'workflow-delivery',
            name: 'member_settings_workflow_delivery',
            component: () => import('pages/Member/Settings/SettingsDeliveryWorkflow.vue'),
          },
          {
            path: 'workflow-liquidation',
            name: 'member_settings_workflow_liquidation',
            component: () => import('pages/Member/Settings/SettingsLiquidationWorkflow.vue'),
          },
          {
            path: 'developer-promotion',
            name: 'member_settings_developer_promotion',
            component: () => import('pages/Member/Settings/DeveloperPromotion.vue'),
          },
          {
            path: 'about',
            name: 'member_settings_about',
            component: () => import('pages/Member/Settings/SettingsAbout.vue'),
          },
          {
            path: 'branches',
            name: 'member_settings_branches',
            component: () => import('pages/Member/Settings/SettingsBranches.vue'),
          },
          {
            path: 'user',
            name: 'member_settings_user',
            component: () => import('pages/Member/Settings/SettingsUser.vue'),
          },
          {
            path: 'user-invite',
            name: 'member_settings_user_invite',
            component: () => import('pages/Member/Settings/SettingsUserInvite.vue'),
          },
          {
            path: 'inactive-users',
            name: 'member_settings_inactive_users',
            component: () => import('pages/Member/Settings/SettingsInactiveUsers.vue'),
          },
          {
            path: 'role-group',
            name: 'member_settings_role_group',
            component: () => import('pages/Member/Settings/SettingsRoleGroup.vue'),
          },
          {
            path: 'roles',
            name: 'member_settings_roles',
            component: () => import('pages/Member/Settings/SettingsRoles.vue'),
          },
          {
            path: 'user-level',
            name: 'member_settings_user_level',
            component: () => import('pages/Member/Settings/SettingsUserLevel.vue'),
          },
          {
            path: 'scope',
            name: 'member_settings_scope',
            component: () => import('pages/Member/Settings/SettingsScope.vue'),
          },
          {
            path: 'system-emails',
            name: 'member_settings_system_emails',
            component: () => import('pages/Member/Settings/SettingsSystemEmails.vue'),
          },
        ],
      },

      // School Management
      {
        name: 'member_school_student_management',
        path: 'school-management/student',
        component: () => import('pages/Member/SchoolManagement/StudentManagement.vue'),
      },
      {
        name: 'member_school_guardian_management',
        path: 'school-management/guardian',
        component: () => import('pages/Member/SchoolManagement/GuardianManagement.vue'),
      },
      {
        name: 'member_school_device_management',
        path: 'school-management/device',
        component: () => import('pages/Member/SchoolManagement/DeviceManagement.vue'),
      },
      {
        name: 'member_school_gate_management',
        path: 'school-management/gate',
        component: () => import('pages/Member/SchoolManagement/GateManagement.vue'),
      },
      {
        name: 'member_school_gate_api_documentation',
        path: 'school/gate-api/documentation',
        component: () => import('pages/Member/School/GateAPI/GateAPIDocumentation.vue'),
      },
      {
        name: 'member_school_gate_api_devices',
        path: 'school/gate-api/devices',
        component: () => import('pages/Member/School/GateAPI/GateAPIDevices.vue'),
      },
      {
        name: 'member_school_guardian_api_documentation',
        path: 'school/guardian-api/documentation',
        component: () => import('pages/Member/School/GuardianAPI/GuardianAPIDocumentation.vue'),
      },
      {
        name: 'member_school_year_management',
        path: 'school-management/school-year',
        component: () => import('pages/Member/SchoolManagement/SchoolYearManagement.vue'),
      },
      {
        name: 'member_school_grade_level',
        path: 'school-management/grade-level',
        component: () => import('pages/Member/SchoolManagement/GradeLevelManagement.vue'),
      },
      {
        name: 'member_school_section_management',
        path: 'school-management/section',
        component: () => import('pages/Member/SchoolManagement/SectionManagement.vue'),
      },
      {
        name: 'member_school_course_management',
        path: 'school-management/course',
        component: () => import('pages/Member/SchoolManagement/CourseManagement.vue'),
      },
      {
        name: 'member_school_enrollment',
        path: 'school-management/enrollment',
        component: () => import('pages/Member/SchoolManagement/EnrollmentManagement.vue'),
      },
      {
        name: 'member_school_attendance',
        path: 'school-management/attendance',
        component: () => import('pages/Member/SchoolManagement/AttendanceManagement.vue'),
      },
      {
        name: 'member_school_grading',
        path: 'school-management/grading',
        component: () => import('pages/Member/SchoolManagement/GradingManagement.vue'),
      },

      // Developer
      {
        path: 'developer',
        component: () => import('pages/Member/Developer/Developer.vue'),
        beforeEnter: DeveloperRouteGuard,
        children: [
          {
            path: 'company-management',
            name: 'member_developer_company_management',
            component: () => import('pages/Member/Developer/CompanyManagement.vue'),
          },
          {
            path: 'developer-scripts',
            name: 'member_developer_scripts',
            component: () => import('pages/Member/Developer/DeveloperScripts.vue'),
          },
          {
            path: 'database-viewer',
            name: 'member_developer_database_viewer',
            component: () => import('pages/Member/Developer/DatabaseViewer/DatabaseViewer.vue'),
          },
          {
            path: 'queue-process',
            name: 'member_developer_queue_process',
            component: () => import('pages/Member/Developer/QueueProcess.vue'),
          },
          {
            path: 'manpower-queue',
            name: 'member_developer_manpower_queue',
            component: () => import('pages/Member/Developer/ManpowerQueueMonitor.vue'),
          },
          {
            path: 'user-management',
            name: 'member_developer_user_management',
            component: () => import('pages/Member/Developer/DeveloperUserManagement.vue'),
          },
          {
            path: 'default-roles',
            name: 'member_developer_default_roles',
            component: () => import('pages/Member/Developer/DeveloperRoles.vue'),
          },
          {
            path: 'default-user-levels',
            name: 'member_developer_default_user_levels',
            component: () => import('pages/Member/Developer/DeveloperUserLevels.vue'),
          },
          {
            path: 'scheduler-management',
            name: 'member_developer_scheduler_management',
            component: () => import('pages/Member/Developer/SchedulerManagement.vue'),
          },
          {
            path: 'seed-tracking',
            name: 'member_developer_seed_tracking',
            component: () => import('pages/Member/Developer/SeedTracking.vue'),
          },
          {
            path: 'migrations',
            name: 'member_developer_migrations',
            component: () => import('pages/Member/Developer/MigrationMonitor.vue'),
          },
        ],
      },

      // Leads
      {
        name: 'member_leads',
        path: 'leads',
        component: Leads,
        redirect: { name: 'member_leads_dashboard' },
        children: [
          {
            path: 'dashboard',
            name: 'member_leads_dashboard',
            component: () => import('pages/Member/Leads/Dashboard/LeadsDashboard.vue'),
          },
          {
            path: 'deals',
            name: 'member_leads_deals',
            component: () => import('pages/Member/Leads/Deals/LeadsDeals.vue'),
          },
          {
            path: 'companies',
            name: 'member_leads_companies',
            component: () => import('pages/Member/Leads/Companies/LeadCompanies.vue'),
          },
          {
            path: 'people',
            name: 'member_leads_people',
            component: () => import('pages/Member/Leads/People/LeadsPeople.vue'),
          },
          {
            path: 'point-of-contact',
            name: 'member_leads_point_of_contact',
            component: () => import('pages/Member/Leads/People/PointOfContact.vue'),
          },
          {
            path: 'relationship-owners',
            name: 'member_leads_relationship_owners',
            component: () => import('pages/Member/Leads/People/RelationshipOwners.vue'),
          },
          {
            path: 'proposal',
            name: 'member_leads_proposal',
            component: () => import('pages/Member/Leads/Proposal/LeadsProposal.vue'),
          },
          {
            path: 'presentation',
            name: 'member_leads_presentation',
            component: () => import('pages/Member/Leads/Presentation/LeadsPresentation.vue'),
          },
          {
            path: 'contract',
            name: 'member_leads_contract',
            component: () => import('pages/Member/Leads/Contract/LeadsContract.vue'),
          },
        ],
      },
      {
        name: 'member_lead_page',
        path: 'leads/:id',
        component: LeadPage,
      },

      // Calendar
      {
        name: 'member_calendar',
        path: 'calendar',
        component: () => import('pages/Member/Calendar/CalendarPage.vue'),
      },

      // Email
      {
        name: 'member_email',
        path: 'email',
        component: () => import('pages/Member/Email/EmailPage.vue'),
      },

      // Socket Test (Development)
      {
        name: 'member_socket_test',
        path: 'socket-test',
        component: () => import('pages/Test/SocketTest.vue'),
      },
    ],
  },

  // User Profile (standalone route if needed)
  {
    path: '/profile',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'profile',
        component: () => import('pages/UserProfilePage.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

// Apply scope meta fields to all routes
const routes = addScopeMeta(routesConfig);

export default routes;
