export interface TestUser {
  username: string;
  password: string;
  email: string;
  role?: string;
}

export interface TestTask {
  title: string;
  description: string;
  difficulty: string;
  assignMode: 'SELF' | 'OTHER' | 'ROLE_GROUP';
  assigneeName?: string; // For OTHER mode
  roleGroupName?: string; // For ROLE_GROUP mode
  dueDate?: string;
  project?: string;
}

export const TEST_USERS: Record<string, TestUser> = {
  DEFAULT: {
    username: 'guillermotabligan',
    password: 'water123',
    email: 'guillermotabligan00@gmail.com',
    role: 'Administrator'
  },
};

export const TEST_TASKS: Record<string, TestTask> = {
  DEFAULT: {
    title: 'E2E Test Task - ' + new Date().toLocaleTimeString(),
    description: 'This is an automated test task created by Playwright E2E testing suite.',
    difficulty: 'EASY',
    assignMode: 'SELF',
  },
  
  SELF_ASSIGN: {
    title: 'Self Assigned Task - ' + new Date().toLocaleTimeString(),
    description: 'This task is assigned to self for personal completion.',
    difficulty: 'EASY',
    assignMode: 'SELF',
  },
  
  OTHER_ASSIGN: {
    title: 'Task for Others - ' + new Date().toLocaleTimeString(),
    description: 'This task is assigned to another team member.',
    difficulty: 'MEDIUM',
    assignMode: 'OTHER',
    assigneeName: 'admin', // This should be a valid user in the system
  },
  
  ROLE_GROUP_ASSIGN: {
    title: 'Role Group Task - ' + new Date().toLocaleTimeString(),
    description: 'This task is assigned to a role group for team collaboration.',
    difficulty: 'HARD',
    assignMode: 'ROLE_GROUP',
    roleGroupName: 'Developer', // This should be a valid role group in the system
  },
  
  DETAILED: {
    title: 'Detailed E2E Test Task - ' + new Date().toLocaleTimeString(),
    description: 'This is a detailed test task with multiple fields filled for comprehensive E2E testing.',
    difficulty: 'MEDIUM',
    assignMode: 'SELF',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
  },
};

// Helper function to get unique task titles
export function getUniqueTaskTitle(prefix = 'E2E Test Task'): string {
  return `${prefix} - ${Date.now()}`;
}

// Helper function to get test user
export function getTestUser(userType: keyof typeof TEST_USERS = 'DEFAULT'): TestUser {
  return TEST_USERS[userType];
}

// Helper function to get test task
export function getTestTask(taskType: keyof typeof TEST_TASKS = 'DEFAULT'): TestTask {
  const task = { ...TEST_TASKS[taskType] };
  // Always generate a unique title
  task.title = getUniqueTaskTitle();
  return task;
}