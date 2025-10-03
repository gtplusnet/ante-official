# Workflow API Documentation

## Overview

The Workflow API provides a comprehensive system for managing business process workflows, with initial implementation focused on petty cash liquidation approvals. The system supports configurable workflows with multiple stages, automated task creation, and complete audit trails.

## Base URL

```
http://localhost:3000
```

## Authentication

All endpoints require authentication via token header:

```http
token: YOUR_ACCESS_TOKEN
```

## Workflow Instance Endpoints

### 1. Create Workflow Instance

Creates a new workflow instance for a given workflow type.

**Endpoint:** `POST /workflow-instance`

**Request Body:**
```json
{
  "workflowCode": "PETTY_CASH_LIQUIDATION",
  "sourceModule": "PETTY_CASH_LIQUIDATION",
  "sourceId": "123",
  "metadata": {
    "description": "Office supplies purchase",
    "amount": 1500,
    "requestedBy": "John Doe"
  }
}
```

**Response:**
```json
{
  "id": 1,
  "workflowId": 68,
  "currentStageId": 340,
  "sourceModule": "PETTY_CASH_LIQUIDATION",
  "sourceId": "123",
  "status": "ACTIVE",
  "startedAt": "2025-08-14T04:27:53.097Z",
  "completedAt": null,
  "startedById": "590a4b22-c4ec-4ccc-b9f1-b371cf908257",
  "metadata": {
    "description": "Office supplies purchase",
    "amount": 1500,
    "requestedBy": "John Doe"
  },
  "createdAt": "2025-08-14T04:27:53.097Z",
  "updatedAt": "2025-08-14T04:27:53.097Z",
  "currentStage": {
    "id": 340,
    "name": "Pending Review",
    "key": "PENDING",
    "description": "Initial submission pending review",
    "color": "#FFA726",
    "textColor": "white",
    "sequence": 1,
    "isInitial": true,
    "isFinal": false
  },
  "workflow": {
    "id": 68,
    "name": "Petty Cash Liquidation Workflow",
    "code": "PETTY_CASH_LIQUIDATION",
    "description": "Default workflow for processing petty cash liquidations",
    "isActive": true,
    "isDefault": true
  }
}
```

### 2. Get Workflow Instance Details

Retrieves detailed information about a specific workflow instance.

**Endpoint:** `GET /workflow-instance/:id`

**Parameters:**
- `id` (path): Workflow instance ID

**Response:**
```json
{
  "id": 1,
  "workflowId": 68,
  "currentStageId": 340,
  "sourceModule": "PETTY_CASH_LIQUIDATION",
  "sourceId": "123",
  "status": "ACTIVE",
  "startedAt": "2025-08-14T04:27:53.097Z",
  "completedAt": null,
  "startedById": "590a4b22-c4ec-4ccc-b9f1-b371cf908257",
  "metadata": {
    "description": "Office supplies purchase",
    "amount": 1500
  },
  "workflow": {
    "id": 68,
    "name": "Petty Cash Liquidation Workflow",
    "code": "PETTY_CASH_LIQUIDATION",
    "stages": [
      {
        "id": 340,
        "name": "Pending Review",
        "key": "PENDING",
        "description": "Initial submission pending review",
        "color": "#FFA726",
        "textColor": "white",
        "sequence": 1,
        "isInitial": true,
        "isFinal": false
      },
      {
        "id": 341,
        "name": "Approved",
        "key": "APPROVED",
        "description": "Liquidation has been approved",
        "color": "#66BB6A",
        "textColor": "white",
        "sequence": 2,
        "isInitial": false,
        "isFinal": true
      },
      {
        "id": 342,
        "name": "Rejected",
        "key": "REJECTED",
        "description": "Liquidation has been rejected",
        "color": "#EF5350",
        "textColor": "white",
        "sequence": 3,
        "isInitial": false,
        "isFinal": true
      }
    ],
    "buttonConfigs": [
      {
        "id": 311,
        "transitionCode": "APPROVE",
        "buttonLabel": "Approve",
        "buttonColor": "positive",
        "buttonIcon": "check",
        "confirmationRequired": true,
        "confirmationTitle": "Approve Liquidation",
        "confirmationMessage": "Are you sure you want to approve this liquidation?",
        "remarkRequired": false
      },
      {
        "id": 312,
        "transitionCode": "REJECT",
        "buttonLabel": "Reject",
        "buttonColor": "negative",
        "buttonIcon": "close",
        "confirmationRequired": true,
        "confirmationTitle": "Reject Liquidation",
        "confirmationMessage": "Are you sure you want to reject this liquidation?",
        "remarkRequired": true,
        "remarkPrompt": "Please provide a reason for rejection"
      }
    ]
  },
  "currentStage": {
    "id": 340,
    "name": "Pending Review",
    "transitionsFrom": [
      {
        "id": 305,
        "fromStageId": 340,
        "toStageId": 341,
        "conditionType": "ALL",
        "conditionData": [
          {
            "type": "AMOUNT_LIMIT",
            "value": 50000,
            "message": "Amount exceeds approval limit"
          },
          {
            "type": "RECEIPT_REQUIRED",
            "value": true,
            "message": "Receipt attachment is required"
          }
        ],
        "transitionType": "APPROVAL",
        "buttonName": "Approve Liquidation",
        "buttonColor": "positive",
        "toStage": {
          "id": 341,
          "name": "Approved",
          "key": "APPROVED"
        }
      },
      {
        "id": 306,
        "fromStageId": 340,
        "toStageId": 342,
        "transitionType": "APPROVAL",
        "buttonName": "Reject Liquidation",
        "buttonColor": "negative",
        "toStage": {
          "id": 342,
          "name": "Rejected",
          "key": "REJECTED"
        }
      }
    ]
  },
  "startedBy": {
    "id": "590a4b22-c4ec-4ccc-b9f1-b371cf908257",
    "firstName": "Guillermo0",
    "lastName": "Tabligan",
    "email": "guillermotabligan00@gmail.com"
  },
  "history": [
    {
      "id": 1,
      "instanceId": 1,
      "fromStageId": null,
      "toStageId": 340,
      "action": "WORKFLOW_STARTED",
      "performedById": "590a4b22-c4ec-4ccc-b9f1-b371cf908257",
      "performedAt": "2025-08-14T04:27:53.100Z",
      "remarks": "Workflow initiated",
      "performedBy": {
        "id": "590a4b22-c4ec-4ccc-b9f1-b371cf908257",
        "firstName": "Guillermo0",
        "lastName": "Tabligan",
        "email": "guillermotabligan00@gmail.com"
      }
    }
  ],
  "tasks": []
}
```

### 3. Get Workflow Instance by Source

Retrieves a workflow instance by its source module and ID.

**Endpoint:** `GET /workflow-instance/source/:module/:id`

**Parameters:**
- `module` (path): Source module name (e.g., "PETTY_CASH_LIQUIDATION")
- `id` (path): Source entity ID

**Response:**
```json
{
  "id": 1,
  "workflowId": 68,
  "currentStageId": 340,
  "sourceModule": "PETTY_CASH_LIQUIDATION",
  "sourceId": "123",
  "status": "ACTIVE",
  "workflow": {
    "name": "Petty Cash Liquidation Workflow"
  },
  "currentStage": {
    "name": "Pending Review",
    "color": "#FFA726"
  }
}
```

### 4. List Workflow Instances

Retrieves a paginated list of workflow instances with optional filtering.

**Endpoint:** `GET /workflow-instance`

**Query Parameters:**
- `workflowId` (optional): Filter by workflow template ID
- `sourceModule` (optional): Filter by source module
- `status` (optional): Filter by status (ACTIVE, COMPLETED, CANCELLED, SUSPENDED)
- `startedById` (optional): Filter by user who started the workflow
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Example:** `GET /workflow-instance?page=1&limit=10&status=ACTIVE`

**Response:**
```json
{
  "instances": [
    {
      "id": 1,
      "workflowId": 68,
      "currentStageId": 340,
      "sourceModule": "PETTY_CASH_LIQUIDATION",
      "sourceId": "123",
      "status": "ACTIVE",
      "startedAt": "2025-08-14T04:27:53.097Z",
      "workflow": {
        "id": 68,
        "name": "Petty Cash Liquidation Workflow",
        "code": "PETTY_CASH_LIQUIDATION"
      },
      "currentStage": {
        "id": 340,
        "name": "Pending Review",
        "key": "PENDING",
        "color": "#FFA726"
      },
      "startedBy": {
        "id": "590a4b22-c4ec-4ccc-b9f1-b371cf908257",
        "firstName": "Guillermo0",
        "lastName": "Tabligan",
        "email": "guillermotabligan00@gmail.com"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### 5. Get Workflow Timeline

Retrieves the timeline/history of a workflow instance.

**Endpoint:** `GET /workflow-instance/:id/timeline`

**Parameters:**
- `id` (path): Workflow instance ID

**Response:**
```json
[
  {
    "type": "start",
    "timestamp": "2025-08-14T04:27:53.097Z",
    "stage": {
      "id": 340,
      "name": "Pending Review",
      "key": "PENDING",
      "color": "#FFA726"
    },
    "performer": {
      "id": "590a4b22-c4ec-4ccc-b9f1-b371cf908257"
    },
    "action": "Workflow Started"
  },
  {
    "type": "transition",
    "timestamp": "2025-08-14T04:27:53.100Z",
    "fromStage": null,
    "toStage": {
      "id": 340,
      "name": "Pending Review",
      "key": "PENDING",
      "color": "#FFA726"
    },
    "performer": {
      "id": "590a4b22-c4ec-4ccc-b9f1-b371cf908257",
      "firstName": "Guillermo0",
      "lastName": "Tabligan",
      "email": "guillermotabligan00@gmail.com"
    },
    "action": "WORKFLOW_STARTED",
    "remarks": "Workflow initiated"
  }
]
```

### 6. Get Available Actions

Retrieves the available actions/transitions for the current user on a workflow instance.

**Endpoint:** `GET /workflow-instance/:id/actions`

**Parameters:**
- `id` (path): Workflow instance ID

**Response:**
```json
[
  {
    "action": "Approve Liquidation",
    "targetStage": "Approved",
    "targetStageId": 341,
    "buttonColor": "positive",
    "buttonName": "Approve Liquidation"
  },
  {
    "action": "Reject Liquidation",
    "targetStage": "Rejected",
    "targetStageId": 342,
    "buttonColor": "negative",
    "buttonName": "Reject Liquidation"
  }
]
```

### 7. Perform Workflow Transition

Executes a workflow transition (approve, reject, etc.).

**Endpoint:** `POST /workflow-instance/:id/transition`

**Parameters:**
- `id` (path): Workflow instance ID

**Request Body:**
```json
{
  "action": "Approve Liquidation",
  "remarks": "All documentation is complete and amount is within limits",
  "metadata": {
    "approverComment": "Approved for immediate processing"
  }
}
```

**Response:**
```json
{
  "id": 1,
  "workflowId": 68,
  "currentStageId": 341,
  "sourceModule": "PETTY_CASH_LIQUIDATION",
  "sourceId": "123",
  "status": "COMPLETED",
  "startedAt": "2025-08-14T04:27:53.097Z",
  "completedAt": "2025-08-14T04:35:21.456Z",
  "currentStage": {
    "id": 341,
    "name": "Approved",
    "key": "APPROVED",
    "color": "#66BB6A",
    "isFinal": true
  }
}
```

### 8. Cancel Workflow

Cancels an active workflow instance.

**Endpoint:** `POST /workflow-instance/:id/cancel`

**Parameters:**
- `id` (path): Workflow instance ID

**Request Body:**
```json
{
  "reason": "Request cancelled by submitter"
}
```

**Response:**
```json
{
  "id": 1,
  "status": "CANCELLED",
  "completedAt": "2025-08-14T04:40:15.789Z"
}
```

### 9. Suspend Workflow

Temporarily suspends a workflow instance.

**Endpoint:** `POST /workflow-instance/:id/suspend`

**Parameters:**
- `id` (path): Workflow instance ID

**Request Body:**
```json
{
  "reason": "Pending additional documentation"
}
```

**Response:**
```json
{
  "id": 1,
  "status": "SUSPENDED",
  "metadata": {
    "suspendedAt": "2025-08-14T04:45:30.123Z",
    "suspendedById": "590a4b22-c4ec-4ccc-b9f1-b371cf908257",
    "suspendReason": "Pending additional documentation"
  }
}
```

### 10. Resume Workflow

Resumes a suspended workflow instance.

**Endpoint:** `POST /workflow-instance/:id/resume`

**Parameters:**
- `id` (path): Workflow instance ID

**Response:**
```json
{
  "id": 1,
  "status": "ACTIVE",
  "metadata": {
    "resumedAt": "2025-08-14T04:50:45.456Z",
    "resumedById": "590a4b22-c4ec-4ccc-b9f1-b371cf908257"
  }
}
```

### 11. Get Workflow Tasks

Retrieves tasks associated with a workflow instance.

**Endpoint:** `GET /workflow-instance/:id/tasks`

**Parameters:**
- `id` (path): Workflow instance ID

**Response:**
```json
[
  {
    "id": 1,
    "instanceId": 1,
    "stageId": 340,
    "taskId": 156,
    "completedAt": null,
    "createdAt": "2025-08-14T04:27:53.150Z",
    "task": {
      "id": 156,
      "title": "Review Petty Cash Liquidation",
      "description": "Review and approve/reject liquidation request for Office supplies purchase",
      "assignedTo": {
        "id": "590a4b22-c4ec-4ccc-b9f1-b371cf908257",
        "firstName": "Guillermo0",
        "lastName": "Tabligan",
        "email": "guillermotabligan00@gmail.com"
      },
      "boardLane": {
        "id": 1,
        "name": "To Do",
        "key": "BACKLOG"
      }
    },
    "stage": {
      "id": 340,
      "name": "Pending Review",
      "key": "PENDING"
    }
  }
]
```

### 12. Get User's Pending Workflows

Retrieves workflow instances that have pending tasks assigned to the current user.

**Endpoint:** `GET /workflow-instance/user/pending`

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Response:**
```json
{
  "instances": [
    {
      "id": 1,
      "workflowId": 68,
      "currentStageId": 340,
      "sourceModule": "PETTY_CASH_LIQUIDATION",
      "sourceId": "123",
      "status": "ACTIVE",
      "workflow": {
        "id": 68,
        "name": "Petty Cash Liquidation Workflow"
      },
      "currentStage": {
        "id": 340,
        "name": "Pending Review"
      },
      "tasks": [
        {
          "id": 1,
          "task": {
            "id": 156,
            "title": "Review Petty Cash Liquidation",
            "description": "Review and approve/reject liquidation request"
          },
          "stage": {
            "id": 340,
            "name": "Pending Review"
          }
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### 13. Get Overdue Workflows (Admin)

Retrieves workflow instances that are overdue (for administrators).

**Endpoint:** `GET /workflow-instance/monitoring/overdue`

**Query Parameters:**
- `hours` (optional, default: 24): Hours to consider overdue

**Response:**
```json
[
  {
    "id": 1,
    "workflowId": 68,
    "sourceModule": "PETTY_CASH_LIQUIDATION",
    "sourceId": "123",
    "status": "ACTIVE",
    "startedAt": "2025-08-13T04:27:53.097Z",
    "workflow": {
      "id": 68,
      "name": "Petty Cash Liquidation Workflow"
    },
    "currentStage": {
      "id": 340,
      "name": "Pending Review"
    },
    "startedBy": {
      "id": "590a4b22-c4ec-4ccc-b9f1-b371cf908257",
      "firstName": "Guillermo0",
      "lastName": "Tabligan",
      "email": "guillermotabligan00@gmail.com"
    },
    "tasks": [
      {
        "id": 1,
        "completedAt": null,
        "task": {
          "id": 156,
          "assignedTo": {
            "id": "590a4b22-c4ec-4ccc-b9f1-b371cf908257",
            "firstName": "Guillermo0",
            "lastName": "Tabligan",
            "email": "guillermotabligan00@gmail.com"
          }
        }
      }
    ]
  }
]
```

## Status Codes

### Success Responses
- `200 OK` - Request successful
- `201 Created` - Resource created successfully

### Error Responses
- `400 Bad Request` - Invalid request parameters or validation failed
- `401 Unauthorized` - Authentication token missing or invalid
- `403 Forbidden` - User doesn't have permission for the action
- `404 Not Found` - Workflow instance not found
- `422 Unprocessable Entity` - Business rule validation failed
- `500 Internal Server Error` - Server error

## Workflow Status Values

- `ACTIVE` - Workflow is currently active and processing
- `COMPLETED` - Workflow has been completed successfully
- `CANCELLED` - Workflow has been cancelled
- `SUSPENDED` - Workflow has been temporarily suspended

## Workflow Types

### Petty Cash Liquidation Workflow

**Code:** `PETTY_CASH_LIQUIDATION`

**Default Stages:**
1. **Pending Review** (PENDING) - Orange (#FFA726)
2. **Approved** (APPROVED) - Green (#66BB6A) 
3. **Rejected** (REJECTED) - Red (#EF5350)

**Available Actions:**
- **Approve Liquidation** - Moves from Pending → Approved
- **Reject Liquidation** - Moves from Pending → Rejected

**Business Rules:**
- Amount limit: 50,000 maximum
- Receipt attachment required
- Approval confirmation required
- Rejection requires remarks

## Integration Examples

### Frontend Integration (Vue.js)

```javascript
// Get workflow instance details
async getWorkflowDetails(instanceId) {
  const response = await fetch(`/workflow-instance/${instanceId}`, {
    headers: {
      'token': this.authToken,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}

// Perform workflow action
async approveWorkflow(instanceId, remarks) {
  const response = await fetch(`/workflow-instance/${instanceId}/transition`, {
    method: 'POST',
    headers: {
      'token': this.authToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'Approve Liquidation',
      remarks: remarks
    })
  });
  return await response.json();
}
```

### Backend Integration (Node.js Service)

```javascript
// Create workflow for petty cash liquidation
async createLiquidationWorkflow(liquidationId, metadata) {
  const workflowData = {
    workflowCode: 'PETTY_CASH_LIQUIDATION',
    sourceModule: 'PETTY_CASH_LIQUIDATION',
    sourceId: liquidationId.toString(),
    metadata: metadata
  };
  
  return await this.workflowEngineService.startWorkflow(workflowData);
}
```

## Notes

- All endpoints require valid authentication token
- Workflow instances are company-scoped (users can only see workflows from their company)
- Task assignments are based on workflow stage configuration
- Audit trail is automatically maintained for all workflow actions
- Business rule validation is performed before each transition
- Metadata can store custom data relevant to the workflow type