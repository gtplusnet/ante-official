/**
 * Centralized mapping of route names to required scopes
 * This provides a single source of truth for route permissions
 * 
 * Scopes can be:
 * - string: Single scope required
 * - string[]: Any one of the scopes is sufficient (OR logic)
 */

export const routeScopeMap: Record<string, string | string[]> = {
  // ========== ASSET MODULE ==========
  // Warehouse
  'member_asset_company_warehouse': 'ASSET_COMPANY_WAREHOUSE_ACCESS',
  'member_asset_project_warehouse': 'ASSET_PROJECT_WAREHOUSE_ACCESS',
  'member_asset_intransit_warehouse': 'ASSET_INTRANSIT_WAREHOUSE_ACCESS',
  'member_asset_temporary_warehouse': 'ASSET_TEMPORARY_WAREHOUSE_ACCESS',
  
  // Item
  'member_asset_item_simple': 'ASSET_ITEM_SIMPLE_ACCESS',
  'member_asset_item_advance': 'ASSET_ITEM_ADVANCE_ACCESS',
  'member_asset_item_deleted': 'ASSET_ITEM_DELETED_ACCESS',
  
  // Purchasing
  'member_asset_purchase_request': 'ASSET_PURCHASE_REQUEST_ACCESS',
  'member_asset_purchase_order': 'ASSET_PURCHASE_ORDER_ACCESS',
  'member_asset_suppliers': 'ASSET_SUPPLIERS_ACCESS',
  
  // Deliveries
  'member_asset_deliveries_pending': 'ASSET_DELIVERIES_PENDING_ACCESS',
  'member_asset_deliveries_truck_load': 'ASSET_DELIVERIES_TRUCK_LOAD_ACCESS',
  'member_asset_deliveries_done': 'ASSET_DELIVERIES_DONE_ACCESS',
  'member_asset_deliveries_canceled': 'ASSET_DELIVERIES_CANCELED_ACCESS',
  
  // Equipment
  'member_asset_equipment_list': 'ASSET_EQUIPMENT_LIST_ACCESS',
  'member_asset_equipment_parts': 'ASSET_EQUIPMENT_PARTS_ACCESS',
  'member_asset_equipment_joborders': 'ASSET_EQUIPMENT_JOBORDERS_ACCESS',

  // ========== MANPOWER MODULE ==========
  'member_manpower_dashboard': 'MANPOWER_ACCESS',
  'member_manpower_hris': 'MANPOWER_HRIS_ACCESS',
  'member_manpower_cashier_management': 'MANPOWER_CASHIER_MANAGEMENT_ACCESS',
  'member_manpower_payroll_center': 'MANPOWER_PAYROLL_CENTER_ACCESS',
  'member_manpower_payslip_center': 'MANPOWER_PAYSLIP_CENTER_ACCESS',
  'member_manpower_payroll_time_keeping': ['MANPOWER_TIME_KEEPING_ACCESS_ALL', 'MANPOWER_TIME_KEEPING_ACCESS_BY_BRANCH'],
  'member_manpower_time_importation': 'MANPOWER_TIME_IMPORTATION_ACCESS',
  'member_manpower_time_keeping_device': 'MANPOWER_TIME_KEEPING_DEVICE_ACCESS',
  'member_manpower_timekeeping_raw_logs': 'MANPOWER_TIMEKEEPING_RAW_LOGS_ACCESS',
  'member_manpower_team_attendance': 'MANPOWER_TEAM_ATTENDANCE_ACCESS',
  'member_manpower_team_shifting_management': 'MANPOWER_TEAM_SHIFTS_ACCESS',
  
  // Manpower Configuration
  'member_manpower_payroll_group': 'MANPOWER_CONFIGURATION_PAYROLL_GROUP_ACCESS',
  'member_manpower_holidays': 'MANPOWER_CONFIGURATION_LOCAL_HOLIDAY_ACCESS',
  'member_manpower_deduction': 'MANPOWER_CONFIGURATION_DEDUCTION_ACCESS',
  'member_manpower_deduction_plan': 'MANPOWER_CONFIGURATION_DEDUCTION_ACCESS',
  'member_manpower_allowance': 'MANPOWER_CONFIGURATION_ALLOWANCE_ACCESS',
  'member_manpower_allowance_plan': 'MANPOWER_CONFIGURATION_ALLOWANCE_ACCESS',
  'member_manpower_service_incentive_leave': 'MANPOWER_CONFIGURATION_SERVICE_INCLUSIVE_LEAVE_ACCESS',
  'member_manpower_service_incentive_leave_plan': 'MANPOWER_CONFIGURATION_SERVICE_INCLUSIVE_LEAVE_ACCESS',
  'member_manpower_payroll_approvers': 'MANPOWER_CONFIGURATION_PAYROLL_APPROVERS_ACCESS',
  'member_manpower_tax_table': 'MANPOWER_CONFIGURATION_TAX_ACCESS',
  'member_manpower_philhealth': 'MANPOWER_CONFIGURATION_PHILHEALTH_ACCESS',
  'member_manpower_sss': 'MANPOWER_CONFIGURATION_SSS_ACCESS',
  'member_manpower_pagibig': 'MANPOWER_CONFIGURATION_PAGIBIG_ACCESS',
  'member_manpower_schedule_management': 'MANPOWER_CONFIGURATION_SCHEDULE_ACCESS',
  'member_manpower_shift_management': 'MANPOWER_CONFIGURATION_SHIFT_ACCESS',
  'member_manpower_cutoff_management': 'MANPOWER_CONFIGURATION_CUTOFF_ACCESS',
  
  // Manpower Scheduling
  'member_manpower_individual_scheduling': 'MANPOWER_INDIVIDUAL_SCHEDULING_ACCESS',
  
  // Manpower Reports
  'member_manpower_reports_sss': 'MANPOWER_REPORTS_SSS_ACCESS',
  'member_manpower_reports_philhealth': 'MANPOWER_REPORTS_PHILHEALTH_ACCESS',
  'member_manpower_reports_pagibig': 'MANPOWER_REPORTS_PAGIBIG_ACCESS',
  'member_manpower_reports_tax': 'MANPOWER_REPORTS_TAX_ACCESS',

  // Manpower API
  'member_manpower_pos_device_management': 'SETTINGS_DEVICE_MANAGEMENT_ACCESS',

  // ========== TREASURY MODULE ==========
  'member_treasury': 'TREASURY_FUND_ACCOUNT_ACCESS',
  
  // Payables
  'member_treasury_payables': 'TREASURY_PAYABLES',
  'member_treasury_payables_purchase_order': 'TREASURY_PAYABLES_PURCHASE_ORDER_ACCESS',
  'member_treasury_payables_suppliers': 'TREASURY_PAYABLES_SUPPLIERS_ACCESS',
  'member_treasury_payables_request_payment': 'TREASURY_PAYABLES_REQUEST_PAYMENT_ACCESS',
  
  // Receivables
  'member_treasury_receivables': 'TREASURY_RECEIVABLES',
  'member_treasury_receivables_project': 'TREASURY_RECEIVABLES_PROJECT_ACCESS',
  'member_treasury_receivables_client': 'TREASURY_RECEIVABLES_CLIENT_ACCESS',
  'member_treasury_receivables_logs': 'TREASURY_RECEIVABLES_LOGS_ACCESS',
  'member_treasury_receivables_review': 'TREASURY_RECEIVABLES_REVIEW_ACCESS',
  
  // Petty Cash
  'member_treasury_pettycash': 'TREASURY_PETTYCASH_HOLDERS_ACCESS',
  'member_treasury_pettycash_liquidation': 'TREASURY_PETTYCASH_LIQUIDATION_ACCESS',

  // ========== PROJECT MODULE ==========
  'member_project': 'PROJECT_ACCESS',
  'member_project_page': 'PROJECT_ACCESS',

  // ========== LEADS MODULE ==========
  'member_leads': 'LEADS_ACCESS',
  'member_lead_page': 'LEADS_ACCESS',

  // ========== CALENDAR MODULE ==========
  // Calendar should be accessible to all authenticated users
  // 'member_calendar': 'CALENDAR_ACCESS', // Commented out - no scope required

  // ========== SETTINGS MODULE ==========
  // Personal settings - accessible to all authenticated users
  // 'member_settings_email': 'SETTINGS_EMAIL_ACCESS', // Personal email settings should be accessible to all
  
  // Company settings - require specific permissions
  'member_settings_company': 'SETTINGS_COMPANY_ACCESS',
  'member_settings_branches': 'SETTINGS_BRANCHES_ACCESS',
  
  // User management - require specific permissions
  'member_settings_user': 'SETTINGS_USER_ACCESS',
  'member_settings_user_invite': 'SETTINGS_USER_INVITE_ACCESS',
  'member_settings_inactive_users': 'SETTINGS_INACTIVE_USERS_ACCESS',
  'member_settings_role_group': 'SETTINGS_ROLE_GROUP_ACCESS',
  
  // Security settings - require specific permissions
  'member_settings_roles': 'SETTINGS_ROLES_ACCESS',
  'member_settings_user_level': 'SETTINGS_USER_LEVEL_ACCESS',
  
  // Workflow settings - require specific permissions
  'member_settings_workflow': 'SETTINGS_WORKFLOW',
  'member_settings_workflow_purchase_request': 'SETTINGS_WORKFLOW_ACCESS',
  'member_settings_workflow_delivery': 'SETTINGS_WORKFLOW_DELIVERY_ACCESS',
  
  // System settings - require specific permissions
  'member_settings_developer_promotion': 'SETTINGS_DEVELOPER_PROMOTION_ACCESS',
  'member_settings_system_emails': 'SETTINGS_SYSTEM_EMAILS_ACCESS',
  'member_settings_device_management': 'SETTINGS_DEVICE_MANAGEMENT_ACCESS',
  // 'member_settings_about': 'SETTINGS_ABOUT_ACCESS', // About page should be accessible to all

  // ========== SCHOOL MODULE ==========
  'member_school_student_management': 'SCHOOL_STUDENT_MANAGEMENT_ACCESS',
  'member_school_guardian_management': 'SCHOOL_GUARDIAN_MANAGEMENT_ACCESS',
  'member_school_device_management': 'SCHOOL_DEVICE_MANAGEMENT_ACCESS',
  'member_school_gate_management': 'SCHOOL_GATE_MANAGEMENT_ACCESS',
  'member_school_year_management': 'SCHOOL_YEAR_MANAGEMENT_ACCESS',
  'member_school_grade_level': 'SCHOOL_GRADE_LEVEL_ACCESS',
  'member_school_section_management': 'SCHOOL_SECTION_MANAGEMENT_ACCESS',
  'member_school_course_management': 'SCHOOL_COURSE_MANAGEMENT_ACCESS',
  'member_school_enrollment': 'SCHOOL_ENROLLMENT_ACCESS',
  'member_school_attendance': 'SCHOOL_ATTENDANCE_ACCESS',
  'member_school_grading': 'SCHOOL_GRADING_ACCESS',
};

/**
 * Helper function to get required scope(s) for a route
 */
export function getRouteScope(routeName: string): string | string[] | undefined {
  return routeScopeMap[routeName];
}

/**
 * Helper function to check if a route has scope requirements
 */
export function routeRequiresScope(routeName: string): boolean {
  return routeName in routeScopeMap;
}