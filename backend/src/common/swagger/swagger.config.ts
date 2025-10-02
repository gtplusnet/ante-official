import { DocumentBuilder } from '@nestjs/swagger';

export interface SwaggerModuleConfig {
  title: string;
  description: string;
  version?: string;
  tags: Array<{ name: string; description: string }>;
  filterTags?: string[];
  customCss?: string;
}

export const MODULE_TAGS = {
  // Core System
  AUTHENTICATION: 'Authentication',
  ACCOUNT: 'Account Management',
  COMPANY: 'Company',
  ROLES: 'Roles & Permissions',

  // Human Resources
  HR_EMPLOYEES: 'HR - Employees',
  HR_TIMEKEEPING: 'HR - Timekeeping',
  HR_FILING: 'HR - Filing',
  HR_PAYROLL: 'HR - Payroll',
  HR_CONFIGURATION: 'HR - Configuration',
  HR_TEAMS: 'HR - Teams',
  HR_SCHEDULE: 'HR - Schedule',

  // School Management
  SCHOOL_STUDENTS: 'School - Students',
  SCHOOL_GUARDIANS: 'School - Guardians',
  SCHOOL_ATTENDANCE: 'School - Attendance',
  SCHOOL_GATE: 'School - Gate',
  SCHOOL_MOBILE: 'School - Mobile',
  SCHOOL_CONFIGURATION: 'School - Configuration',

  // Project Management
  PROJECTS: 'Projects',
  TASKS: 'Tasks',
  BOQ: 'BOQ',
  ACCOMPLISHMENTS: 'Accomplishments',
  PROJECT_TEMPLATES: 'Project Templates',

  // Finance
  PURCHASE_ORDERS: 'Purchase Orders',
  COLLECTIONS: 'Collections',
  PETTY_CASH: 'Petty Cash',
  RFP: 'RFP',
  BILLING: 'Billing',
  INVOICES: 'Invoices',

  // CRM
  LEADS: 'Leads',
  CLIENTS: 'Clients',
  CONTACTS: 'Contacts',

  // Inventory
  ITEMS: 'Inventory - Items',
  WAREHOUSE: 'Inventory - Warehouse',
  SUPPLIERS: 'Inventory - Suppliers',
  DELIVERIES: 'Inventory - Deliveries',
  BRANDS: 'Inventory - Brands',
  RECEIPTS: 'Inventory - Receipts',

  // Communication
  NOTIFICATIONS: 'Notifications',
  ANNOUNCEMENTS: 'Announcements',
  EMAIL: 'Email',
  DISCUSSIONS: 'Discussions',
  SMS: 'SMS',

  // Workflow
  WORKFLOW_TEMPLATES: 'Workflow - Templates',
  WORKFLOW_INSTANCES: 'Workflow - Instances',
  WORKFLOW_APPROVALS: 'Workflow - Approvals',

  // Utilities
  SELECT_OPTIONS: 'Select Options',
  DASHBOARD: 'Dashboard',
  SCHEDULER: 'Scheduler',
  DEVELOPER_TOOLS: 'Developer Tools',
  FILE_UPLOAD: 'File Upload',
  REPORTS: 'Reports',
  SETTINGS: 'Settings',

  // Manpower
  MANPOWER_PLAN: 'Manpower - Planning',
  MANPOWER_REQUEST: 'Manpower - Requests',
  MANPOWER_POOL: 'Manpower - Pool',

  // Asset Management
  ASSETS: 'Assets',
  ASSET_MAINTENANCE: 'Asset Maintenance',
  ASSET_TRACKING: 'Asset Tracking',
};

export const TAG_GROUPS = [
  {
    name: 'Core System',
    tags: [
      MODULE_TAGS.AUTHENTICATION,
      MODULE_TAGS.ACCOUNT,
      MODULE_TAGS.COMPANY,
      MODULE_TAGS.ROLES,
    ],
  },
  {
    name: 'Human Resources',
    tags: [
      MODULE_TAGS.HR_EMPLOYEES,
      MODULE_TAGS.HR_TIMEKEEPING,
      MODULE_TAGS.HR_FILING,
      MODULE_TAGS.HR_PAYROLL,
      MODULE_TAGS.HR_CONFIGURATION,
      MODULE_TAGS.HR_TEAMS,
      MODULE_TAGS.HR_SCHEDULE,
    ],
  },
  {
    name: 'School Management',
    tags: [
      MODULE_TAGS.SCHOOL_STUDENTS,
      MODULE_TAGS.SCHOOL_GUARDIANS,
      MODULE_TAGS.SCHOOL_ATTENDANCE,
      MODULE_TAGS.SCHOOL_GATE,
      MODULE_TAGS.SCHOOL_MOBILE,
      MODULE_TAGS.SCHOOL_CONFIGURATION,
    ],
  },
  {
    name: 'Project Management',
    tags: [
      MODULE_TAGS.PROJECTS,
      MODULE_TAGS.TASKS,
      MODULE_TAGS.BOQ,
      MODULE_TAGS.ACCOMPLISHMENTS,
      MODULE_TAGS.PROJECT_TEMPLATES,
    ],
  },
  {
    name: 'Finance',
    tags: [
      MODULE_TAGS.PURCHASE_ORDERS,
      MODULE_TAGS.COLLECTIONS,
      MODULE_TAGS.PETTY_CASH,
      MODULE_TAGS.RFP,
      MODULE_TAGS.BILLING,
      MODULE_TAGS.INVOICES,
    ],
  },
  {
    name: 'CRM',
    tags: [MODULE_TAGS.LEADS, MODULE_TAGS.CLIENTS, MODULE_TAGS.CONTACTS],
  },
  {
    name: 'Inventory',
    tags: [
      MODULE_TAGS.ITEMS,
      MODULE_TAGS.WAREHOUSE,
      MODULE_TAGS.SUPPLIERS,
      MODULE_TAGS.DELIVERIES,
      MODULE_TAGS.BRANDS,
      MODULE_TAGS.RECEIPTS,
    ],
  },
  {
    name: 'Manpower',
    tags: [
      MODULE_TAGS.MANPOWER_PLAN,
      MODULE_TAGS.MANPOWER_REQUEST,
      MODULE_TAGS.MANPOWER_POOL,
    ],
  },
  {
    name: 'Asset Management',
    tags: [
      MODULE_TAGS.ASSETS,
      MODULE_TAGS.ASSET_MAINTENANCE,
      MODULE_TAGS.ASSET_TRACKING,
    ],
  },
  {
    name: 'Communication',
    tags: [
      MODULE_TAGS.NOTIFICATIONS,
      MODULE_TAGS.ANNOUNCEMENTS,
      MODULE_TAGS.EMAIL,
      MODULE_TAGS.DISCUSSIONS,
      MODULE_TAGS.SMS,
    ],
  },
  {
    name: 'Workflow',
    tags: [
      MODULE_TAGS.WORKFLOW_TEMPLATES,
      MODULE_TAGS.WORKFLOW_INSTANCES,
      MODULE_TAGS.WORKFLOW_APPROVALS,
    ],
  },
  {
    name: 'Utilities',
    tags: [
      MODULE_TAGS.SELECT_OPTIONS,
      MODULE_TAGS.DASHBOARD,
      MODULE_TAGS.SCHEDULER,
      MODULE_TAGS.DEVELOPER_TOOLS,
      MODULE_TAGS.FILE_UPLOAD,
      MODULE_TAGS.REPORTS,
      MODULE_TAGS.SETTINGS,
    ],
  },
];

export const TAG_DESCRIPTIONS = {
  [MODULE_TAGS.AUTHENTICATION]:
    'User authentication, login, logout, and session management',
  [MODULE_TAGS.ACCOUNT]:
    'User account management, profile updates, and preferences',
  [MODULE_TAGS.COMPANY]: 'Company management and configuration',
  [MODULE_TAGS.ROLES]: 'Role-based access control and permissions management',

  [MODULE_TAGS.HR_EMPLOYEES]: 'Employee management, profiles, and records',
  [MODULE_TAGS.HR_TIMEKEEPING]:
    'Time tracking, attendance, and work hours management',
  [MODULE_TAGS.HR_FILING]: 'HR document filing and management',
  [MODULE_TAGS.HR_PAYROLL]:
    'Payroll processing, salary adjustments, and compensation',
  [MODULE_TAGS.HR_CONFIGURATION]: 'HR system configuration and settings',
  [MODULE_TAGS.HR_TEAMS]: 'Team management and organization structure',
  [MODULE_TAGS.HR_SCHEDULE]: 'Employee scheduling and shift management',

  [MODULE_TAGS.SCHOOL_STUDENTS]: 'Student records and management',
  [MODULE_TAGS.SCHOOL_GUARDIANS]: 'Guardian/parent information and management',
  [MODULE_TAGS.SCHOOL_ATTENDANCE]: 'Student attendance tracking and reporting',
  [MODULE_TAGS.SCHOOL_GATE]: 'School gate entry/exit management',
  [MODULE_TAGS.SCHOOL_MOBILE]: 'Mobile app APIs for guardians',
  [MODULE_TAGS.SCHOOL_CONFIGURATION]: 'School system configuration',

  [MODULE_TAGS.PROJECTS]: 'Project management and tracking',
  [MODULE_TAGS.TASKS]: 'Task management and assignment',
  [MODULE_TAGS.BOQ]: 'Bill of Quantities management',
  [MODULE_TAGS.ACCOMPLISHMENTS]: 'Project accomplishments and milestones',
  [MODULE_TAGS.PROJECT_TEMPLATES]: 'Project templates and presets',

  [MODULE_TAGS.PURCHASE_ORDERS]: 'Purchase order creation and management',
  [MODULE_TAGS.COLLECTIONS]: 'Payment collections and receivables',
  [MODULE_TAGS.PETTY_CASH]: 'Petty cash management and tracking',
  [MODULE_TAGS.RFP]: 'Request for Proposal management',
  [MODULE_TAGS.BILLING]: 'Billing and payment processing',
  [MODULE_TAGS.INVOICES]: 'Invoice generation and management',

  [MODULE_TAGS.LEADS]: 'Sales leads and opportunities',
  [MODULE_TAGS.CLIENTS]: 'Client management and relationships',
  [MODULE_TAGS.CONTACTS]: 'Contact information management',

  [MODULE_TAGS.ITEMS]: 'Inventory items and stock management',
  [MODULE_TAGS.WAREHOUSE]: 'Warehouse operations and locations',
  [MODULE_TAGS.SUPPLIERS]: 'Supplier management and relationships',
  [MODULE_TAGS.DELIVERIES]: 'Delivery tracking and management',
  [MODULE_TAGS.BRANDS]: 'Brand management for inventory items',
  [MODULE_TAGS.RECEIPTS]: 'Item receipt and stock intake',

  [MODULE_TAGS.MANPOWER_PLAN]: 'Manpower planning and allocation',
  [MODULE_TAGS.MANPOWER_REQUEST]: 'Manpower request and approval',
  [MODULE_TAGS.MANPOWER_POOL]: 'Available manpower pool management',

  [MODULE_TAGS.ASSETS]: 'Asset registration and management',
  [MODULE_TAGS.ASSET_MAINTENANCE]: 'Asset maintenance scheduling and tracking',
  [MODULE_TAGS.ASSET_TRACKING]: 'Asset location and status tracking',

  [MODULE_TAGS.NOTIFICATIONS]: 'In-app notifications and alerts',
  [MODULE_TAGS.ANNOUNCEMENTS]: 'Company-wide announcements',
  [MODULE_TAGS.EMAIL]: 'Email communication and templates',
  [MODULE_TAGS.DISCUSSIONS]: 'Team discussions and messaging',
  [MODULE_TAGS.SMS]: 'SMS messaging and notifications',

  [MODULE_TAGS.WORKFLOW_TEMPLATES]: 'Workflow template creation and management',
  [MODULE_TAGS.WORKFLOW_INSTANCES]: 'Active workflow instances and tracking',
  [MODULE_TAGS.WORKFLOW_APPROVALS]: 'Approval processes and workflows',

  [MODULE_TAGS.SELECT_OPTIONS]: 'Dynamic dropdown options and lookups',
  [MODULE_TAGS.DASHBOARD]: 'Dashboard data and analytics',
  [MODULE_TAGS.SCHEDULER]: 'Job scheduling and cron tasks',
  [MODULE_TAGS.DEVELOPER_TOOLS]: 'Developer utilities and debugging tools',
  [MODULE_TAGS.FILE_UPLOAD]: 'File upload and management',
  [MODULE_TAGS.REPORTS]: 'Report generation and export',
  [MODULE_TAGS.SETTINGS]: 'System settings and configuration',
};

export function createSwaggerConfig(
  moduleConfig: SwaggerModuleConfig,
): DocumentBuilder {
  const description = moduleConfig.description;

  const builder = new DocumentBuilder()
    .setTitle(moduleConfig.title)
    .setDescription(description)
    .setVersion(moduleConfig.version || '1.0')
    .addServer('http://localhost:3000', 'Local Development')
    .addServer('https://backend-ante.geertest.com', 'Staging')
    .addServer('https://api.ante.com', 'Production')
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'token',
        description:
          'Custom authentication token (40-character hex string). Pass the token received from login endpoint.',
      },
      'custom-token',
    );

  // Add all tags with descriptions
  for (const tag of moduleConfig.tags) {
    builder.addTag(tag.name, tag.description);
  }

  return builder;
}

export function getSwaggerOptions(customTitle: string, tagGroups?: any[]) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Auto-authentication script for development mode only
  const devModeAutoAuth = isDevelopment
    ? `
    // Auto-authentication for development mode
    window.addEventListener('load', function() {
      const isDev = true; // This file is only served in development
      
      if (isDev) {
        console.log('Development mode detected - attempting auto-authentication...');
        
        // Add dev mode indicator beside authorize button
        setTimeout(function() {
          const authWrapper = document.querySelector('.swagger-ui .auth-wrapper');
          if (authWrapper && !document.querySelector('.dev-mode-indicator')) {
            const devIndicator = document.createElement('div');
            devIndicator.className = 'dev-mode-indicator';
            devIndicator.innerHTML = '🔓 DEV MODE - Auto-authenticating...';
            authWrapper.appendChild(devIndicator);
          }
        }, 100);
        
        // Auto-authenticate with test credentials
        setTimeout(function() {
          fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: 'guillermotabligan',
              password: 'water123'
            })
          })
          .then(response => response.json())
          .then(data => {
            // Check for token in response (handle both wrapped and direct response)
            const token = data.token || (data.data && data.data.token);
            if (token) {
              console.log('Auto-authentication successful!');
              
              // Wait for Swagger UI to fully load
              const checkAndAuthorize = setInterval(function() {
                if (window.ui && window.ui.preauthorizeApiKey) {
                  window.ui.preauthorizeApiKey('custom-token', token);
                  console.log('Token applied to Swagger UI:', token);
                  
                  // Update indicator to show success
                  const indicator = document.querySelector('.dev-mode-indicator');
                  if (indicator) {
                    indicator.innerHTML = '✅ DEV MODE - Authenticated';
                    indicator.classList.add('success');
                  }
                  
                  clearInterval(checkAndAuthorize);
                }
              }, 100);
              
              // Stop trying after 5 seconds
              setTimeout(function() {
                clearInterval(checkAndAuthorize);
              }, 5000);
            } else {
              console.error('Auto-authentication failed - no token in response:', data);
            }
          })
          .catch(error => {
            console.error('Auto-authentication error:', error);
          });
        }, 1000); // Wait a bit for the server to be ready
      }
    });
  `
    : '';

  const baseOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none', // Collapse all operations by default
      defaultModelsExpandDepth: -1, // Hide models section by default
      defaultModelExpandDepth: 1,
    },
    customSiteTitle: customTitle,
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customCss: `
      ${
        isDevelopment
          ? `
      /* Development mode indicator */
      .swagger-ui .auth-wrapper {
        display: flex !important;
        align-items: center !important;
        gap: 15px !important;
      }
      
      .dev-mode-indicator {
        background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 13px;
        display: inline-flex;
        align-items: center;
        box-shadow: 0 2px 6px rgba(255, 87, 34, 0.3);
        animation: pulse 2s infinite;
        white-space: nowrap;
        margin: 0;
      }
      
      .dev-mode-indicator.success {
        background: linear-gradient(135deg, #4caf50 0%, #45a049 100%) !important;
        animation: none !important;
      }
      
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.8; }
        100% { opacity: 1; }
      }
      `
          : ''
      }
      
      /* Swagger styles */
      /* .swagger-ui .topbar { display: none } */ /* Top bar is visible */
      .swagger-ui .info { margin-bottom: 50px }
      .swagger-ui .scheme-container { margin-bottom: 30px }
      /* .swagger-ui .models { display: none } */ /* Commented out - was hiding models section */
      
      /* Tag group styling */
      .swagger-ui .opblock-tag-section h3 {
        border-bottom: 2px solid #61affe;
        padding-bottom: 10px;
        margin-bottom: 20px;
      }
      
      /* Tag styling */
      .swagger-ui .opblock-tag {
        font-size: 18px !important;
        font-weight: 600 !important;
        padding: 10px 0 !important;
        border-bottom: 1px solid #e8e8e8;
      }
      
      /* Improved spacing */
      .swagger-ui .opblock {
        margin-bottom: 10px !important;
      }
      
      /* Better visual grouping */
      .swagger-ui .opblock-tag[data-tag*="HR -"],
      .swagger-ui .opblock-tag[data-tag*="School -"],
      .swagger-ui .opblock-tag[data-tag*="Inventory -"],
      .swagger-ui .opblock-tag[data-tag*="Workflow -"],
      .swagger-ui .opblock-tag[data-tag*="Manpower -"] {
        background-color: #f7f7f7;
        padding-left: 20px !important;
      }
    </style>
    <script>
      ${devModeAutoAuth}
    </script>
    <style>/* Continue styles */`,
  };

  // Add tag groups if provided
  if (tagGroups && tagGroups.length > 0) {
    baseOptions.swaggerOptions['x-tagGroups'] = tagGroups;
  }

  return baseOptions;
}

// Main configuration
export const SWAGGER_CONFIG = {
  title: 'ANTE Backend API - Complete Documentation',
  description:
    'Complete API documentation for all modules in the ANTE ERP system',
  tags: Object.entries(TAG_DESCRIPTIONS).map(([name, description]) => ({
    name,
    description,
  })),
};

// Export for backward compatibility
export const MODULE_CONFIGS = { all: SWAGGER_CONFIG };
