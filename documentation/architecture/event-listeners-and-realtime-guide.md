# Event Listeners and Realtime Detection Guide

## Overview
ANTE uses a multi-layered event system to handle changes in the database, whether they originate from the backend API or directly from the frontend via Supabase. This guide documents the architecture and implementation patterns for event listeners and realtime detection.

## Architecture Components

### 1. Internal Event System (EventEmitter)
For changes that go through the backend API, we use NestJS EventEmitter for internal event propagation.

**Location**: `/backend/src/listeners/`

**Key Files**:
- `task-change.listener.ts` - Handles task-related events
- `filing-change.listener.ts` - Handles filing-related events
- `discussion-event.listener.ts` - Handles discussion creation events
- `listeners.module.ts` - Module configuration

**Example Implementation**:
```typescript
// In service layer (e.g., TaskService)
this.eventEmitter.emit('task.changed', {
  action: 'create',
  taskId: task.id,
  task: task,
  affectedUserIds: [task.assignedToId],
  timestamp: new Date().toISOString()
});

// In listener (TaskChangeListener)
@OnEvent('task.changed')
async handleTaskChange(payload: TaskChangeEvent) {
  // Process the event
  await this.socketService.emitToClients('task-changed', payload);
}
```

### 2. Supabase Realtime Listeners
For changes made directly to Supabase (bypassing backend API), we use Supabase Realtime subscriptions.

**Location**: `/backend/src/listeners/task-realtime.listener.ts`

**Key Features**:
- Subscribes to PostgreSQL publication for table changes
- Detects INSERT, UPDATE, DELETE operations
- Handles events from frontend direct database access

**Implementation Pattern**:
```typescript
@Injectable()
export class TaskRealtimeListener implements OnModuleInit, OnModuleDestroy {
  private supabase: SupabaseClient;
  private taskChannel: RealtimeChannel;

  async onModuleInit() {
    // Initialize Supabase client
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Subscribe to table changes
    this.taskChannel = this.supabase
      .channel('task-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'Task'
      }, async (payload) => {
        await this.handleTaskInsert(payload);
      })
      .subscribe();
  }
}
```

### 3. Queue-Based Processing (BullMQ)
To handle multiple backend instances and ensure deduplication, we use BullMQ for job processing.

**Location**:
- `/backend/src/infrastructure/queues/task-queue.module.ts`
- `/backend/src/infrastructure/queues/processors/task-queue.processor.ts`

**Key Features**:
- Job deduplication using unique jobId
- Retry logic with exponential backoff
- Handles multiple backend instances gracefully

**Implementation Pattern**:
```typescript
// Adding job to queue with deduplication
const jobId = `task-created-${taskId}`;
await this.taskQueue.add('process-new-task', {
  taskId: taskId,
  task: task,
  action: 'created'
}, {
  jobId: jobId, // Ensures deduplication
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 }
});

// Processing jobs
@Process('process-new-task')
async processNewTask(job: Job<TaskProcessingJobData>) {
  const { taskId, action } = job.data;
  // Execute business logic
  await this.taskScriptExecutor.executeTaskCreationScripts(task);
}
```

### 4. Script Execution Service
For executing business logic when events are detected.

**Location**: `/backend/src/services/task-script-executor.service.ts`

**Features**:
- Executes scripts based on entity properties
- Supports different trigger conditions (priority, assignment, project)
- Configurable timeout and script paths

## Setting Up Realtime Detection

### Step 1: Enable Realtime for Database Table
```sql
-- Enable realtime publication for a table
ALTER PUBLICATION supabase_realtime ADD TABLE public."Task";

-- Verify publication
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

### Step 2: Configure Environment Variables
```bash
# In /backend/.env
ENABLE_TASK_REALTIME=true
TASK_SCRIPT_TIMEOUT=30000
TASK_SCRIPTS_PATH=scripts/tasks
```

### Step 3: Create Realtime Listener
```typescript
// Example: task-realtime.listener.ts
@Injectable()
export class TaskRealtimeListener implements OnModuleInit {
  constructor(
    private configService: ConfigService,
    @InjectQueue('task-processing') private taskQueue: Queue
  ) {}

  async onModuleInit() {
    if (!this.configService.get('ENABLE_TASK_REALTIME')) return;

    // Setup Supabase subscription
    // Add jobs to queue when events detected
  }
}
```

### Step 4: Create Queue Processor
```typescript
// Example: task-queue.processor.ts
@Processor('task-processing')
export class TaskQueueProcessor {
  @Process('process-new-task')
  async processNewTask(job: Job) {
    // Fetch complete entity data
    // Execute business logic
    // Handle errors and retries
  }
}
```

## Event Flow Diagram

```
Frontend Direct DB Access          Backend API Call
         |                               |
         v                               v
   Supabase Database              Backend Service
         |                               |
         |                               v
         |                        EventEmitter.emit()
         |                               |
         v                               v
  Realtime Publication            Event Listeners
         |                               |
         v                               v
  Realtime Listener                     |
         |                               |
         v                               v
    BullMQ Queue <----------------------+
         |
         v
   Queue Processor
         |
         v
  Script Executor
         |
         v
  Business Logic
```

## Common Patterns and Best Practices

### 1. Deduplication Strategy
Always use unique job IDs to prevent duplicate processing:
```typescript
const jobId = `${eventType}-${entityId}-${timestamp}`;
```

### 2. Error Handling
Implement retry logic with exponential backoff:
```typescript
{
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 }
}
```

### 3. Environment-Based Feature Flags
Use environment variables to enable/disable features:
```typescript
this.isEnabled = this.configService.get('ENABLE_FEATURE', 'false') === 'true';
```

### 4. Cleanup on Module Destroy
Always clean up subscriptions and connections:
```typescript
async onModuleDestroy() {
  if (this.channel) {
    await this.supabase.removeChannel(this.channel);
  }
}
```

## Monitoring and Debugging

### Real-time Log Monitoring
```bash
# Monitor realtime listener activity
pm2 logs ante-backend -f --lines 0 | grep -E "Realtime|Queue|Script"

# Check specific task processing
pm2 logs ante-backend | grep "task-created-[TASK_ID]"
```

### Console Logging Pattern
```typescript
console.log('=== EVENT DETECTED ===');
console.log(`Type: ${event.type}`);
console.log(`Entity: ${event.entity}`);
console.log(`Timestamp: ${event.timestamp}`);
console.log('====================');
```

### Debug Checklist
1. ✅ Is the table enabled for realtime publication?
2. ✅ Are environment variables configured correctly?
3. ✅ Is the Supabase client initialized with correct credentials?
4. ✅ Is the queue connection (Redis) working?
5. ✅ Are there any errors in PM2 logs?

## Troubleshooting

### Issue: Realtime events not firing
**Solution**: Check if table is added to publication:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public."YourTable";
```

### Issue: Duplicate processing
**Solution**: Ensure jobId is unique and consistent across instances

### Issue: Queue jobs not processing
**Solution**: Check Redis connection and BullMQ configuration

### Issue: Scripts not executing
**Solution**: Verify script paths and permissions in environment variables

## Adding New Event Listeners

### Step 1: Create Listener Class
```typescript
@Injectable()
export class YourEntityListener {
  @OnEvent('entity.changed')
  async handleEntityChange(payload: EntityChangeEvent) {
    // Handle the event
  }
}
```

### Step 2: Register in Module
```typescript
// In listeners.module.ts
providers: [
  YourEntityListener,
  // ... other listeners
]
```

### Step 3: Emit Events from Service
```typescript
// In your service
this.eventEmitter.emit('entity.changed', {
  action: 'create',
  entity: entity,
  timestamp: new Date().toISOString()
});
```

## Testing Event Listeners

### Manual Testing with cURL
```bash
# Test direct database creation (bypassing backend)
curl -X POST "https://[SUPABASE_URL]/rest/v1/[Table]" \
  -H "apikey: [SERVICE_KEY]" \
  -H "Authorization: Bearer [SERVICE_KEY]" \
  -d '{"field": "value"}'
```

### Unit Testing
```typescript
describe('TaskRealtimeListener', () => {
  it('should process INSERT events', async () => {
    const payload = { new: { id: 1, title: 'Test' } };
    await listener.handleTaskInsert(payload);
    expect(taskQueue.add).toHaveBeenCalled();
  });
});
```

## Security Considerations

1. **Service Keys**: Only use service keys in backend, never expose to frontend
2. **RLS Policies**: Ensure proper Row Level Security for frontend access
3. **Event Validation**: Always validate event payloads before processing
4. **Rate Limiting**: Implement rate limiting for event processing
5. **Audit Logging**: Log all significant events for security audit

## Performance Optimization

1. **Batch Processing**: Group multiple events when possible
2. **Selective Subscriptions**: Only subscribe to necessary events
3. **Efficient Queries**: Use indexed fields when fetching related data
4. **Connection Pooling**: Reuse database connections
5. **Memory Management**: Clean up listeners and subscriptions properly

## Related Documentation

- [Backend Structure Guide](/documentation/architecture/backend-structure-guide.md)
- [API Response Patterns](/documentation/standards/api-response-patterns.md)
- [Supabase Migration Guide](/documentation/infrastructure/supabase-migration-guide.md)
- [PM2 Log Monitoring](/CLAUDE.md#-real-time-log-monitoring-with-pm2)