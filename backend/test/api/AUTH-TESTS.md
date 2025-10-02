# Auth API Tests - Login & Registration

## Overview

Comprehensive test suite for authentication endpoints covering login and registration functionality.

## Test Coverage

### Registration Tests (`POST /auth/signup`)
✅ **Successful Registration**
- Valid company and account information
- Returns token and account details
- Sets default role as "Developer"

✅ **Validation Tests**
- Missing company information (400 error)
- Missing account information (400 error)
- Invalid email format (400 error)
- Weak password validation (400 error)
- Invalid business type enum (400 error)
- Empty required fields (400 error)

✅ **Duplicate Prevention**
- Duplicate email detection
- Duplicate username detection

✅ **Optional Fields**
- Accepts registrations without optional fields
- Company: registrationNo, phone, tinNo

### Login Tests (`POST /auth/login`)
✅ **Successful Login**
- Login with username
- Login with email (as username field)
- Returns token and account information

✅ **Authentication Failures**
- Invalid username (401 error)
- Invalid password (401 error)
- Non-existent account (401 error)

✅ **Validation**
- Missing username (400 error)
- Missing password (400 error)
- Empty credentials (400 error)

✅ **Response Structure**
- Consistent account information format
- All expected fields present

### Integration Tests
✅ **Full Flow Testing**
- Register → Login with username → Login with email
- Unique tokens for each session
- Consistent account IDs across operations

## Test Structure

The tests use a mock implementation that mirrors the actual auth module behavior:

1. **Mock DTOs** - Match the actual validation rules
2. **Mock Service** - Simulates business logic
3. **Mock Controller** - Handles requests/responses
4. **In-memory Storage** - For test isolation

## Running the Tests

```bash
# Run auth tests only
npm run test:api auth-login-registration.api.spec.ts

# Run with verbose output
npm run test:api:verbose auth-login-registration.api.spec.ts

# Run in watch mode
npm run test:api:watch auth-login-registration.api.spec.ts
```

## Key Validation Rules

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

### Business Type Enum
- SOLE_PROPRIETORSHIP
- PARTNERSHIP
- CORPORATION
- OTHERS

### Industry Enum
- CONSTRUCTION
- MANUFACTURING
- RETAIL
- SERVICES
- OTHERS

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "token": "test-token-...",
    "accountInformation": {
      "id": "account-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "username": "johndoe",
      "role": { "name": "Developer", "level": 1 },
      "company": { ... },
      "status": "ACTIVE",
      "isDeveloper": true,
      ...
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

## Notes

- Tests use mock implementation to avoid database dependencies
- All tests run in isolation with data cleanup between tests
- Validation matches the actual NestJS validation pipeline
- Token generation uses timestamp + random for uniqueness