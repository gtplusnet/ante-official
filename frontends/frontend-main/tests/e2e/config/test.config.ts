export const TEST_CONFIG = {
  // Application URLs
  BASE_URL: 'http://localhost:9000',
  LOGIN_URL: '/#/',
  DASHBOARD_URL: '/#/member/dashboard',
  
  // Test timeouts
  TIMEOUT: {
    SHORT: 5000,
    MEDIUM: 10000,
    LONG: 30000,
    NAVIGATION: 60000,
  },
  
  // Selectors
  SELECTORS: {
    // Login form selectors
    LOGIN: {
      USERNAME_INPUT: '[data-testid="login-username-input"]',
      PASSWORD_INPUT: '[data-testid="login-password-input"]',
      SUBMIT_BUTTON: '[data-testid="login-submit-button"]',
      MANUAL_LOGIN_BUTTON: 'button:has-text("Sign in manually")',
      OAUTH_SECTION: '.oauth-section',
    },
    
    // Dashboard selectors
    DASHBOARD: {
      CONTAINER: '[data-testid="dashboard-container"]',
      TASK_WIDGET: '[data-testid="task-widget"]',
      TASK_WIDGET_FALLBACK: '.task-widget',
    },
    
    // Task widget selectors
    TASK_WIDGET: {
      MORE_MENU: '[data-testid="task-widget-more-menu"]',
      MORE_MENU_FALLBACK: '.task-menu-button',
      CREATE_TASK_BUTTON: '[data-testid="task-create-button"]',
      CREATE_TASK_BUTTON_FALLBACK: 'q-item:has-text("Create Task")',
    },
    
    // Task creation dialog selectors
    TASK_DIALOG: {
      ASSIGN_MODE: '[data-testid="task-assign-mode-select"]',
      TITLE_INPUT: '[data-testid="task-title-input"]',
      DIFFICULTY_SELECT: '[data-testid="task-difficulty-select"]',
      DESCRIPTION_EDITOR: '[data-testid="task-description-editor"]',
      SUBMIT_BUTTON: '[data-testid="task-submit-button"]',
      CANCEL_BUTTON: 'button:has-text("Cancel")',
      // Fallback selectors
      TITLE_INPUT_FALLBACK: 'input[placeholder*="Task Title"], .q-field:has(label:text("Task Title")) input',
      SUBMIT_BUTTON_FALLBACK: 'button:has-text("Create Task")',
    },
  },
  
  // Test data
  CREDENTIALS: {
    USERNAME: 'guillermotabligan',
    PASSWORD: 'water123',
    EMAIL: 'guillermotabligan00@gmail.com',
  },
  
  // Task test data
  TASK_DATA: {
    TITLE: 'Playwright Test Task',
    DESCRIPTION: 'This is a test task created by Playwright automation',
    DIFFICULTY: 'EASY',
    ASSIGN_MODE: 'SELF',
  },
};