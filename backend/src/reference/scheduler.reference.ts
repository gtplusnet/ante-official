export interface SchedulerDefinition {
  key: string;
  name: string;
  description: string;
  taskType: string;
  cronExpression: string;
  isActive: boolean;
  taskConfig: Record<string, unknown>;
}

export const SCHEDULER_DEFINITIONS: Record<string, SchedulerDefinition> = {
  LOG_CLEANUP: {
    key: 'LOG_CLEANUP',
    name: 'Log File Cleanup',
    description: 'Cleans up old log files to free disk space',
    taskType: 'log-cleanup',
    cronExpression: '0 * * * *', // Every hour
    isActive: true,
    taskConfig: {
      retentionDays: 7,
      logPaths: ['./logs', './pm2-logs', '/var/log/geer-ante'],
      patterns: ['*.log', '*.out', '*.err'],
      maxSizeBeforeCleanup: 1024 * 1024 * 100, // 100MB
    },
  },
  DATABASE_CLEANUP: {
    key: 'DATABASE_CLEANUP',
    name: 'Database Cleanup',
    description: 'Cleans up old queue logs and temporary data',
    taskType: 'database-cleanup',
    cronExpression: '0 2 * * *', // Daily at 2 AM
    isActive: true,
    taskConfig: {
      queueLogDays: 30,
      tempDataDays: 7,
      notificationDays: 90,
    },
  },
  DAILY_REPORT: {
    key: 'DAILY_REPORT',
    name: 'Daily Summary Report',
    description: 'Generates daily summary reports for system activity',
    taskType: 'report-generation',
    cronExpression: '0 6 * * *', // Daily at 6 AM
    isActive: false,
    taskConfig: {
      reportType: 'daily-summary',
      recipients: [],
      includeMetrics: ['user-activity', 'system-health', 'error-summary'],
    },
  },
  TIMEKEEPING_PROCESSING: {
    key: 'TIMEKEEPING_PROCESSING',
    name: 'Daily Timekeeping Processing',
    description:
      'Processes uncomputed timekeeping dates and detects attendance conflicts',
    taskType: 'timekeeping-daily-processing',
    cronExpression: '0 23 * * *', // Daily at 11 PM
    isActive: true,
    taskConfig: {
      processOnlyUncomputed: true,
      detectConflicts: true,
      batchSize: 10,
      maxRetries: 3,
      conflictTypes: ['MISSING_LOG', 'MISSING_TIME_OUT'],
      skipPastCutoffs: true, // Skip cutoff periods that are entirely in the past
      maxDaysInPast: 30, // Optional: only process cutoffs from last 30 days
    },
  },
  HRIS_ACCOUNT_CHECK: {
    key: 'HRIS_ACCOUNT_CHECK',
    name: 'HRIS Account Check',
    description:
      'Checks employee accounts for contract issues and other HRIS-related problems',
    taskType: 'hris-account-check',
    cronExpression: '0 1 * * *', // Daily at 1:00 AM
    isActive: true,
    taskConfig: {
      batchSize: 100,
      processInterval: 5000, // 5 seconds between batches
      checks: {
        contracts: true,
        leaves: false, // Disabled for now, can be enabled later
      },
    },
  },
  CUTOFF_DATE_RANGE_GENERATION: {
    key: 'CUTOFF_DATE_RANGE_GENERATION',
    name: 'Cutoff Date Range Generation',
    description: 'Ensures cutoff date ranges exist 1 day in advance',
    taskType: 'cutoff-date-range-generation',
    cronExpression: '1 0 * * *', // Daily at 12:01 AM
    isActive: true,
    taskConfig: {
      daysAhead: 1,
    },
  },
};
