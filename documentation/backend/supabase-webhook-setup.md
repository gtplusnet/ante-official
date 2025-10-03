# Supabase Webhook Setup for Task Processing

## Overview
This document describes how to set up Supabase Database Webhooks to enable asynchronous processing of tasks created via direct Supabase insertion.

## Purpose
When tasks are created directly via Supabase (bypassing the backend API), we need to:
1. Create task watchers (CREATOR and ASSIGNEE)
2. Send notifications to assignees
3. Create discussion threads
4. Log activities

## Setup Instructions

### 1. Access Supabase Dashboard
- Go to your Supabase project dashboard
- Navigate to **Database > Webhooks**

### 2. Create Task Insert Webhook

Click "Create a new hook" and configure as follows:

**Basic Configuration:**
- **Name**: `task_insert_webhook`
- **Table**: `Task`
- **Events**: ☑ INSERT (only check INSERT)

**HTTP Request:**
- **Method**: `POST`
- **URL**:
  - Local development: `http://localhost:3000/webhooks/supabase/task`
  - Staging: `https://api-staging.geertest.com/webhooks/supabase/task`
  - Production: `https://api.geertest.com/webhooks/supabase/task`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "X-Supabase-Event": "task.insert"
}
```

**Webhook Payload:**
Supabase will automatically send:
```json
{
  "type": "INSERT",
  "table": "Task",
  "schema": "public",
  "record": {
    "id": 123,
    "name": "Task name",
    "projectId": 86,
    "companyId": 16,
    "createdBy": "account-uuid",
    "assignedTo": "account-uuid",
    // ... other task fields
  },
  "old_record": null
}
```

### 3. Local Development Setup

For local development, you need to expose your local backend to the internet:

#### Option A: Using ngrok (Recommended)
```bash
# Install ngrok if not already installed
npm install -g ngrok

# Start your backend
yarn dev

# In another terminal, expose port 3000
ngrok http 3000

# You'll get a URL like: https://abc123.ngrok.io
# Use this URL in the webhook configuration:
# https://abc123.ngrok.io/webhooks/supabase/task
```

#### Option B: Using localtunnel
```bash
# Install localtunnel
npm install -g localtunnel

# Expose port 3000
lt --port 3000

# You'll get a URL like: https://xyz.loca.lt
# Use this URL in the webhook configuration
```

### 4. Testing the Webhook

1. **Enable webhook in Supabase Dashboard**
   - After creating the webhook, ensure it's enabled

2. **Monitor webhook logs**
   - In Supabase Dashboard, go to Database > Webhooks
   - Click on your webhook to see delivery logs

3. **Test task creation**
   ```javascript
   // Frontend code to test
   const { createQuickTask } = useTask();

   const task = await createQuickTask({
     name: 'Test webhook task',
     projectId: 86,
     companyId: 16,
     // ... other fields
   });
   ```

4. **Check backend logs**
   ```bash
   # Monitor backend logs
   yarn logs:backend

   # You should see:
   # [SupabaseWebhookController] Processing new task: 123 - Test webhook task
   # [SupabaseWebhookController] Added creator watcher for task 123
   # [SupabaseWebhookController] Sent notification to assignee for task 123
   ```

## Webhook Security

### Adding Signature Verification (Optional but Recommended)

1. **Generate a webhook secret**
   ```bash
   openssl rand -hex 32
   # Example output: a1b2c3d4e5f6...
   ```

2. **Add secret to Supabase webhook**
   - In webhook configuration, add the secret
   - Supabase will include HMAC-SHA256 signature in `x-supabase-signature` header

3. **Verify signature in backend**
   ```typescript
   // In supabase-webhook.controller.ts
   private verifyWebhookSignature(payload: any, signature: string): boolean {
     const secret = process.env.SUPABASE_WEBHOOK_SECRET;
     const hmac = crypto.createHmac('sha256', secret);
     hmac.update(JSON.stringify(payload));
     const computedSignature = hmac.digest('hex');
     return computedSignature === signature;
   }
   ```

## Troubleshooting

### Webhook not triggering
- Check if webhook is enabled in Supabase Dashboard
- Verify the table name is correct (`Task` not `task`)
- Ensure INSERT event is checked

### Webhook returns 404
- Verify backend is running
- Check the webhook URL is correct
- Ensure the route exists: `/webhooks/supabase/task`

### Webhook returns 500
- Check backend logs for errors
- Verify database connections (Task Watchers, Notifications)
- Check if required services are initialized

### Local development issues
- Ensure ngrok/localtunnel is running
- Update webhook URL if tunnel URL changes
- Check firewall/network settings

## Monitoring

### Backend Metrics
- Task webhooks received
- Watchers created
- Notifications sent
- Discussions created
- Processing errors

### Supabase Dashboard
- Webhook delivery success rate
- Response times
- Failed deliveries
- Retry attempts

## Related Files
- Backend webhook controller: `/backend/src/modules/webhooks/supabase-webhook.controller.ts`
- Frontend task composable: `/frontend/src/composables/supabase/useTask.ts`
- Task store: `/frontend/src/stores/task.ts`
- TaskList component: `/frontend/src/pages/Member/Task/TaskList.vue`