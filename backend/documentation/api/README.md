# API Documentation

## Overview

The GEER-ANTE ERP backend provides a comprehensive RESTful API for managing all aspects of the enterprise resource planning system. This document outlines the API structure, authentication, common patterns, and endpoint references.

## Base URL

```
Development: http://localhost:3000
Staging: https://api-staging.ante.ph
Production: https://api.ante.ph
```

## Authentication

### Token-Based Authentication

The API uses a custom token-based authentication system. Tokens are stored in the `AccountToken` table and must be included in the request headers.

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "generated-uuid-token",
    "account": {
      "id": "account-uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": {
        "id": "role-uuid",
        "name": "Admin"
      }
    }
  }
}
```

#### Using the Token

Include the token in the request header for all authenticated endpoints:

```http
GET /api/accounts/profile
token: your-auth-token-here
```

### Public Endpoints

The following endpoints do not require authentication:
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/verify-email` - Email verification
- `GET /health` - System health check

## Response Format

### Standard Success Response

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Optional success message",
  "metadata": {
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error details
    }
  },
  "statusCode": 400
}
```

### Pagination Response

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 250,
      "page": 1,
      "limit": 20,
      "totalPages": 13,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## HTTP Status Codes

| Status Code | Description |
|------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 204 | No Content - Request successful, no content to return |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required or failed |
| 403 | Forbidden - Authenticated but not authorized |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - Service temporarily unavailable |

## Common Request Patterns

### Filtering

```http
GET /api/employees?status=ACTIVE&department=IT&salary_gte=50000
```

### Sorting

```http
GET /api/projects?sort=createdAt:desc,name:asc
```

### Pagination

```http
GET /api/tasks?page=2&limit=20
```

### Field Selection

```http
GET /api/accounts?fields=id,email,firstName,lastName
```

### Search

```http
GET /api/inventory/items?search=laptop&searchFields=name,description
```

## API Modules

### 1. Authentication & Authorization

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login |
| POST | `/auth/signup` | User registration |
| POST | `/auth/logout` | User logout |
| POST | `/auth/refresh-token` | Refresh authentication token |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| POST | `/auth/verify-email` | Verify email address |
| POST | `/auth/resend-verification` | Resend verification email |
| POST | `/auth/google` | Google OAuth login |
| POST | `/auth/facebook` | Facebook OAuth login |

### 2. Account Management

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/accounts` | List all accounts |
| GET | `/accounts/:id` | Get account details |
| GET | `/accounts/profile` | Get current user profile |
| POST | `/accounts` | Create new account |
| PUT | `/accounts/:id` | Update account |
| DELETE | `/accounts/:id` | Delete account (soft delete) |
| POST | `/accounts/:id/avatar` | Upload avatar |
| PUT | `/accounts/:id/password` | Change password |
| PUT | `/accounts/:id/role` | Update account role |

### 3. Human Resources

#### Employee Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hr/employees` | List employees |
| GET | `/hr/employees/:id` | Get employee details |
| POST | `/hr/employees` | Create employee |
| PUT | `/hr/employees/:id` | Update employee |
| DELETE | `/hr/employees/:id` | Delete employee |
| POST | `/hr/employees/import` | Import employees (CSV/Excel) |
| GET | `/hr/employees/:id/documents` | Get employee documents |

#### Timekeeping

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hr/timekeeping/logs` | Get time logs |
| POST | `/hr/timekeeping/clock-in` | Clock in |
| POST | `/hr/timekeeping/clock-out` | Clock out |
| GET | `/hr/timekeeping/summary` | Get attendance summary |
| POST | `/hr/timekeeping/import` | Import biometric logs |
| GET | `/hr/timekeeping/conflicts` | Get attendance conflicts |

#### Payroll

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hr/payroll/periods` | List payroll periods |
| POST | `/hr/payroll/process` | Process payroll |
| GET | `/hr/payroll/:id` | Get payroll details |
| POST | `/hr/payroll/:id/approve` | Approve payroll |
| GET | `/hr/payroll/:id/payslips` | Generate payslips |
| POST | `/hr/payroll/bank-export` | Export for bank |

#### Leave Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hr/leaves` | List leave requests |
| POST | `/hr/leaves` | Create leave request |
| PUT | `/hr/leaves/:id` | Update leave request |
| POST | `/hr/leaves/:id/approve` | Approve leave |
| POST | `/hr/leaves/:id/reject` | Reject leave |
| GET | `/hr/leaves/balance/:employeeId` | Get leave balance |

### 4. Project Management

#### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects` | List projects |
| GET | `/projects/:id` | Get project details |
| POST | `/projects` | Create project |
| PUT | `/projects/:id` | Update project |
| DELETE | `/projects/:id` | Delete project |
| GET | `/projects/:id/members` | Get project members |
| POST | `/projects/:id/members` | Add project member |

#### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks` | List tasks |
| GET | `/tasks/:id` | Get task details |
| POST | `/tasks` | Create task |
| PUT | `/tasks/:id` | Update task |
| DELETE | `/tasks/:id` | Delete task |
| POST | `/tasks/:id/assign` | Assign task |
| PUT | `/tasks/:id/status` | Update task status |
| POST | `/tasks/:id/comments` | Add comment |

#### Bill of Quantities (BOQ)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/boq` | List BOQs |
| GET | `/boq/:id` | Get BOQ details |
| POST | `/boq` | Create BOQ |
| PUT | `/boq/:id` | Update BOQ |
| GET | `/boq/:id/versions` | Get BOQ versions |
| POST | `/boq/:id/revision` | Create revision |

### 5. Inventory Management

#### Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/inventory/items` | List items |
| GET | `/inventory/items/:id` | Get item details |
| POST | `/inventory/items` | Create item |
| PUT | `/inventory/items/:id` | Update item |
| DELETE | `/inventory/items/:id` | Delete item |
| GET | `/inventory/items/:id/stock` | Get stock levels |
| POST | `/inventory/items/:id/adjust` | Adjust stock |

#### Warehouses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/warehouses` | List warehouses |
| GET | `/warehouses/:id` | Get warehouse details |
| POST | `/warehouses` | Create warehouse |
| PUT | `/warehouses/:id` | Update warehouse |
| GET | `/warehouses/:id/inventory` | Get warehouse inventory |
| POST | `/warehouses/transfer` | Transfer between warehouses |

#### Purchase Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/purchase-orders` | List purchase orders |
| GET | `/purchase-orders/:id` | Get PO details |
| POST | `/purchase-orders` | Create PO |
| PUT | `/purchase-orders/:id` | Update PO |
| POST | `/purchase-orders/:id/approve` | Approve PO |
| POST | `/purchase-orders/:id/receive` | Receive items |

### 6. Financial Management

#### Fund Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/finance/fund-accounts` | List fund accounts |
| GET | `/finance/fund-accounts/:id` | Get account details |
| POST | `/finance/fund-accounts` | Create fund account |
| PUT | `/finance/fund-accounts/:id` | Update fund account |
| GET | `/finance/fund-accounts/:id/transactions` | Get transactions |
| POST | `/finance/fund-accounts/transfer` | Transfer funds |

#### Petty Cash

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/finance/petty-cash` | List petty cash |
| POST | `/finance/petty-cash/request` | Request petty cash |
| POST | `/finance/petty-cash/:id/liquidate` | Liquidate petty cash |
| GET | `/finance/petty-cash/:id/receipts` | Get receipts |

#### Request for Payment (RFP)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/finance/rfp` | List RFPs |
| GET | `/finance/rfp/:id` | Get RFP details |
| POST | `/finance/rfp` | Create RFP |
| PUT | `/finance/rfp/:id` | Update RFP |
| POST | `/finance/rfp/:id/approve` | Approve RFP |
| POST | `/finance/rfp/:id/pay` | Process payment |

### 7. Communication

#### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | Get notifications |
| GET | `/notifications/unread` | Get unread count |
| PUT | `/notifications/:id/read` | Mark as read |
| PUT | `/notifications/read-all` | Mark all as read |
| DELETE | `/notifications/:id` | Delete notification |

#### Announcements

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/announcements` | List announcements |
| GET | `/announcements/:id` | Get announcement |
| POST | `/announcements` | Create announcement |
| PUT | `/announcements/:id` | Update announcement |
| DELETE | `/announcements/:id` | Delete announcement |

### 8. Reports & Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/dashboard` | Dashboard metrics |
| GET | `/reports/payroll-summary` | Payroll summary |
| GET | `/reports/attendance` | Attendance report |
| GET | `/reports/inventory` | Inventory report |
| GET | `/reports/financial` | Financial report |
| GET | `/reports/project-status` | Project status report |

## WebSocket Events

The API also supports real-time communication via WebSocket (Socket.io):

### Connection

```javascript
const socket = io('http://localhost:4000', {
  auth: {
    token: 'your-auth-token'
  }
});
```

### Events

#### Client to Server

| Event | Description | Payload |
|-------|-------------|---------|
| `join-room` | Join a chat room | `{ roomId: string }` |
| `send-message` | Send message | `{ roomId: string, message: string }` |
| `typing` | User typing indicator | `{ roomId: string }` |
| `mark-read` | Mark messages as read | `{ messageIds: string[] }` |

#### Server to Client

| Event | Description | Payload |
|-------|-------------|---------|
| `new-message` | New message received | `{ message: MessageObject }` |
| `user-typing` | User is typing | `{ userId: string, roomId: string }` |
| `notification` | New notification | `{ notification: NotificationObject }` |
| `task-updated` | Task status changed | `{ task: TaskObject }` |

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Default limit**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **File upload endpoints**: 10 requests per hour per user

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

## File Upload

### Single File Upload

```http
POST /api/upload/single
Content-Type: multipart/form-data
token: your-auth-token

file: [binary data]
type: avatar|document|attachment
```

### Multiple File Upload

```http
POST /api/upload/multiple
Content-Type: multipart/form-data
token: your-auth-token

files: [multiple binary data]
type: documents
```

### File Size Limits

- Images: 5MB
- Documents: 10MB
- Bulk imports: 50MB

## Validation

The API uses DTOs (Data Transfer Objects) with class-validator for request validation:

### Example Validation Errors

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "email must be a valid email address"
      },
      {
        "field": "password",
        "message": "password must be at least 8 characters"
      }
    ]
  },
  "statusCode": 422
}
```

## Versioning

The API uses header-based versioning for major changes:

```http
GET /api/employees
API-Version: 1.0
```

Current API version: **1.0**

## Testing the API

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Get profile
curl -X GET http://localhost:3000/accounts/profile \
  -H "token: your-auth-token"
```

### Using Postman

Import the Postman collections from:
- `/postman/ai-chat.postman_collection.json`
- `/postman/discussion.postman_collection.json`
- `/postman/payroll-approvers.postman_collection.json`
- `/postman/user-level.postman_collection.json`

### Using HTTPie

```bash
# Login
http POST localhost:3000/auth/login \
  email=admin@example.com \
  password=password123

# Get profile
http GET localhost:3000/accounts/profile \
  token:your-auth-token
```

## SDK Examples

### JavaScript/TypeScript

```typescript
class AnteAPIClient {
  private baseURL: string;
  private token: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async login(email: string, password: string) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    if (data.success) {
      this.token = data.data.token;
    }
    return data;
  }

  async getProfile() {
    const response = await fetch(`${this.baseURL}/accounts/profile`, {
      headers: {
        'token': this.token,
      },
    });
    
    return response.json();
  }
}

// Usage
const client = new AnteAPIClient('http://localhost:3000');
await client.login('admin@example.com', 'password123');
const profile = await client.getProfile();
```

## Best Practices

1. **Always include authentication token** in request headers for protected endpoints
2. **Handle pagination** for large datasets to improve performance
3. **Use appropriate HTTP methods** (GET for read, POST for create, PUT for update, DELETE for remove)
4. **Include proper Content-Type headers** especially for JSON and file uploads
5. **Implement retry logic** for network failures with exponential backoff
6. **Cache responses** where appropriate to reduce server load
7. **Validate input** on client side before sending to API
8. **Handle errors gracefully** and show user-friendly messages
9. **Use HTTPS** in production environments
10. **Monitor rate limits** and implement queuing if necessary

## Support

For API issues or questions:
- Check API status: `GET /health`
- Review error messages and codes
- Check request/response headers
- Verify authentication token validity
- Contact the development team for assistance