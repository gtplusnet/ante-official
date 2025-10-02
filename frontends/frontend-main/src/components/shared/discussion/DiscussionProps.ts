export interface DiscussionProps {
  discussionTitle: string;
  discussionModule: DiscussionModule;
  targetId: string;
  fromNotification: boolean;
  defaultWatcherIds?: string[];
  syncWatchers?: boolean;
}

export enum DiscussionModule {
  PayrollSummary = 'PayrollSummary',
  EmployeeDetails = 'EmployeeDetails',
  Task = 'Task',
}
