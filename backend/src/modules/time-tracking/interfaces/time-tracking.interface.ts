import { EmployeeTimekeepingRaw, Task, Project, TimekeepingSource } from '@prisma/client';

export interface CurrentTimerResponse {
  id: number;
  taskId?: number | null;
  taskTitle?: string | null;
  timeIn: Date;
  elapsedSeconds: number;
  taskTotalSeconds?: number; // Total time for this task today (if task tagged)
  task?: Partial<Task & { project?: Partial<Project> }> | null;
  // TIME-IN GEOLOCATION
  timeInLatitude?: number | null;
  timeInLongitude?: number | null;
  timeInLocation?: string | null;
  timeInIpAddress?: string | null;
  timeInGeolocationEnabled?: boolean | null;
}

export interface TimeHistoryEntry extends EmployeeTimekeepingRaw {
  task?: Task & {
    project?: Project & {
      tags?: any[];
    };
  };
  project?: Project;
}

export interface TimeHistoryResponse {
  items: TimeHistoryEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export interface DailySummaryResponse {
  date: Date;
  totalMinutes: number;
  entries: TimeHistoryEntry[];
}