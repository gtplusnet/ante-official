/**
 * Example: How to create a realtime service for another table
 * This demonstrates the extensibility of our architecture using SOLID principles
 */

import { SupabaseRealtimeService } from '../base/SupabaseRealtimeService';
import { useAuthStore } from 'src/stores/auth';

/**
 * Example Task realtime service
 * Shows how easy it is to add realtime for any table
 */
export class TaskRealtimeService extends SupabaseRealtimeService {
  constructor() {
    super();
    this.userId = null;
  }

  /**
   * Configuration for Task table realtime subscription
   */
  getConfig() {
    const authStore = useAuthStore();
    this.userId = authStore.accountInformation?.id;

    return {
      table: 'Task',
      schema: 'public',
      // Filter to only get tasks assigned to current user
      filter: `assigneeId=eq.${this.userId}`,
      // Only listen for INSERT and UPDATE events
      events: ['INSERT', 'UPDATE']
    };
  }

  /**
   * Transform Task records to application format
   */
  transformPayload(eventType, payload) {
    if (eventType === 'UPDATE') {
      return {
        id: payload.new.id,
        title: payload.new.title,
        status: payload.new.status,
        priority: payload.new.priority,
        dueDate: payload.new.dueDate,
        assigneeId: payload.new.assigneeId,
        // Track what changed
        changes: this.detectChanges(payload.old, payload.new)
      };
    }
    
    return {
      id: payload.id,
      title: payload.title,
      status: payload.status,
      priority: payload.priority,
      dueDate: payload.dueDate,
      assigneeId: payload.assigneeId
    };
  }

  /**
   * Detect what fields changed in an UPDATE
   */
  detectChanges(oldRecord, newRecord) {
    const changes = {};
    const fields = ['status', 'priority', 'title', 'dueDate'];
    
    for (const field of fields) {
      if (oldRecord[field] !== newRecord[field]) {
        changes[field] = {
          from: oldRecord[field],
          to: newRecord[field]
        };
      }
    }
    
    return changes;
  }
}

// HOW TO USE THIS SERVICE:

// 1. Register in the factory (in RealtimeServiceFactory.js):
// import { TaskRealtimeService } from '../tasks/TaskRealtimeService';
// factory.register('Task', TaskRealtimeService);

// 2. Use in a component or composable:
/*
import { useRealtimeSubscription } from '@composables/realtime/useRealtimeSubscription';

export function useTaskRealtime() {
  const tasks = ref([]);
  
  const { subscribe, isConnected } = useRealtimeSubscription('Task', {
    callbacks: {
      onInsert: (newTask) => {
        console.log('New task assigned:', newTask);
        tasks.value.unshift(newTask);
      },
      onUpdate: (updatedTask) => {
        console.log('Task updated:', updatedTask);
        const index = tasks.value.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
          tasks.value[index] = updatedTask;
        }
      }
    }
  });
  
  return { tasks, subscribe, isConnected };
}
*/

// 3. Or use the generic approach for simple cases:
/*
const { subscribe } = useRealtimeSubscription({
  table: 'Project',
  filter: `teamId=eq.${teamId}`,
  events: ['INSERT', 'UPDATE', 'DELETE']
}, {
  callbacks: {
    onInsert: (project) => console.log('New project:', project),
    onUpdate: (project) => console.log('Updated project:', project),
    onDelete: (project) => console.log('Deleted project:', project)
  }
});
*/