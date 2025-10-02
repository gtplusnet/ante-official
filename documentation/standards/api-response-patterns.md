# API Response Patterns Documentation

## 🚨 CRITICAL: Understanding Backend Response Formats

This document prevents the common mistake of accessing the wrong response data structure when consuming APIs.

## Two Response Patterns in ANTE

### 1. Direct Response Pattern (STANDARD - 95% of endpoints)
**Backend Method**: `utilityService.responseHandler()`  
**Response Structure**: Data is returned directly

```typescript
// Backend Controller
@Get('employment-details')
async getEmploymentDetails(@Res() response: Response) {
  return this.utilityService.responseHandler(
    this.employeeService.getEmploymentDetails(accountId),
    response
  );
}

// API Response
{
  "employeeCode": "GT3337",
  "personalInfo": { ... },
  "contactInfo": { ... }
}

// ✅ CORRECT Frontend Consumption
const response = await api.get('/hris/employee/current/employment-details');
return response.data; // Direct access to data

// ❌ WRONG - Will return undefined
return response.data.data; // There is no nested data property!
```

### 2. Wrapped Response Pattern (RARE - Only specific modules)
**Backend Method**: `utilityService.handleResponse()`  
**Response Structure**: Data is wrapped with message

```typescript
// Backend Controller (CMS, some create/update operations)
@Post()
async create(@Res() response: Response, @Body() dto: CreateDTO) {
  return this.utilityService.handleResponse(
    this.service.create(dto),
    response,
    'Created successfully' // Success message
  );
}

// API Response
{
  "message": "Created successfully",
  "data": {
    "id": 1,
    "name": "Example"
  }
}

// ✅ CORRECT Frontend Consumption
const response = await api.post('/cms/content-types', data);
return response.data.data; // Access nested data property

// ❌ WRONG - Will return the wrapper object
return response.data; // Returns { message: "...", data: {...} }
```

## Quick Reference Guide

| Backend Method | Response Format | Frontend Access | Used For |
|---------------|----------------|-----------------|-----------|
| `responseHandler()` | Direct data | `response.data` | GET requests, lists, queries (95% of cases) |
| `handleResponse()` | `{ message, data }` | `response.data.data` | CREATE/UPDATE with success messages |

## How to Identify Which Pattern An Endpoint Uses

### Method 1: Check the Controller
```typescript
// Look for the utility method being used
return this.utilityService.responseHandler(...) // → use response.data
return this.utilityService.handleResponse(...) // → use response.data.data
```

### Method 2: Test with curl
```bash
# Test the endpoint
curl -X GET "http://localhost:3000/your/endpoint" -H "token: YOUR_TOKEN"

# If response is direct data:
{ "field1": "value1", "field2": "value2" }

# If response is wrapped:
{ "message": "Success", "data": { "field1": "value1" } }
```

### Method 3: Check Error Response
If you get `undefined`, you're probably using the wrong pattern:
```typescript
// If this returns undefined:
const data = response.data.data;

// Try this instead:
const data = response.data;
```

## Standard Frontend Service Pattern

### For Standard Endpoints (responseHandler)
```typescript
class EmployeeService {
  async getEmploymentDetails() {
    const response = await api.get('/hris/employee/current/employment-details');
    return response.data; // ← Direct access
  }

  async getJobDetails() {
    const response = await api.get('/hris/employee/current/job-details');
    return response.data; // ← Direct access
  }
}
```

### For Wrapped Endpoints (handleResponse)
```typescript
class CmsService {
  async createContentType(data: any) {
    const response = await api.post('/cms/content-types', data);
    return response.data.data; // ← Nested access for wrapped response
  }

  async updateContentType(id: string, data: any) {
    const response = await api.put(`/cms/content-types/${id}`, data);
    return response.data.data; // ← Nested access for wrapped response
  }
}
```

## Common Modules and Their Patterns

| Module | Pattern | Frontend Access |
|--------|---------|-----------------|
| HR/Employee | Direct (`responseHandler`) | `response.data` |
| Task | Direct (`responseHandler`) | `response.data` |
| Finance | Direct (`responseHandler`) | `response.data` |
| Equipment | Direct (`responseHandler`) | `response.data` |
| CMS | Wrapped (`handleResponse`) | `response.data.data` |
| Auth/Login | Direct (custom) | `response.data` |

## Error Handling

Both patterns handle errors the same way:
```typescript
try {
  const response = await api.get('/endpoint');
  // Check which pattern based on endpoint
  return isWrappedEndpoint ? response.data.data : response.data;
} catch (error) {
  // Error response is consistent
  console.error(error.response?.data?.message || 'Request failed');
}
```

## Best Practices for New Development

1. **Default to `responseHandler`** for new endpoints (simpler, more common)
2. **Only use `handleResponse`** when you need to return a success message with the data
3. **Document in controller** which pattern is used:
   ```typescript
   /**
    * Get employee details
    * @returns Direct data response (not wrapped)
    */
   @Get('details')
   async getDetails(@Res() response: Response) {
     return this.utilityService.responseHandler(...);
   }
   ```
4. **Be consistent within a module** - don't mix patterns unnecessarily

## Migration Strategy

If you need to change from one pattern to another:
1. Update the backend controller method
2. Update all frontend services consuming that endpoint
3. Test thoroughly as this is a breaking change

## AI/Claude Instructions

When creating new endpoints or services:
1. **CHECK** which utility method the backend uses
2. **MATCH** the frontend consumption pattern accordingly
3. **TEST** with curl to verify the response structure
4. **NEVER ASSUME** - always verify the actual response format

## Common Mistake Prevention Checklist

- [ ] Did you check which utility method the backend uses?
- [ ] Did you test the endpoint with curl to see the actual response?
- [ ] Are you using `response.data` for `responseHandler` endpoints?
- [ ] Are you using `response.data.data` for `handleResponse` endpoints?
- [ ] Did you handle errors appropriately?

---

**Remember**: When in doubt, test with curl first to see the actual response structure!