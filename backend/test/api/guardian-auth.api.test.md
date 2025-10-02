# Guardian Mobile Authentication API Tests

## Prerequisites
1. Run the migration script: `cd /home/jdev/geer-ante/backend && ./run-guardian-migration.sh`
2. Start the backend server: `yarn dev` or `npm run dev`
3. Backend should be running on `http://localhost:3000`

## Test Endpoints

### 1. Guardian Registration
```bash
curl -X POST http://localhost:3000/api/guardian/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "middleName": "Smith",
    "dateOfBirth": "1990-01-15",
    "email": "john.doe@example.com",
    "password": "Test@1234",
    "contactNumber": "9123456789",
    "address": "123 Main St, City",
    "occupation": "Engineer"
  }'
```

Expected Response:
```json
{
  "guardian": {
    "id": "uuid",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "middleName": "Smith",
    "contactNumber": "9123456789",
    "students": []
  },
  "tokens": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "expiresIn": 900
  },
  "company": {
    "id": 1,
    "name": "Company Name"
  }
}
```

### 2. Guardian Login
```bash
curl -X POST http://localhost:3000/api/guardian/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "Test@1234"
  }'
```

### 3. Get Profile (Requires Authentication)
```bash
curl -X POST http://localhost:3000/api/guardian/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Refresh Token
```bash
curl -X POST http://localhost:3000/api/guardian/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### 5. Change Password
```bash
curl -X POST http://localhost:3000/api/guardian/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "currentPassword": "Test@1234",
    "newPassword": "NewTest@1234"
  }'
```

### 6. Forgot Password
```bash
curl -X POST http://localhost:3000/api/guardian/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com"
  }'
```

### 7. Logout
```bash
curl -X POST http://localhost:3000/api/guardian/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Testing from Frontend

1. Start the frontend: `cd /home/jdev/geer-guardian-app && yarn dev`
2. Navigate to `http://localhost:5010`
3. Test registration at `/register`
4. Test login at `/login`

## Common Issues

### CORS Error
If you get CORS errors, make sure the backend has CORS configured for the frontend URL:
```typescript
// In main.ts or app configuration
app.enableCors({
  origin: ['http://localhost:5010', 'http://localhost:3000'],
  credentials: true,
});
```

### Database Connection
Ensure PostgreSQL is running and the DATABASE_URL in `.env` is correct.

### JWT Secret
Make sure `GUARDIAN_JWT_SECRET` is set in the backend `.env` file.

## Postman Collection
Import this collection to Postman for easier testing:

```json
{
  "info": {
    "name": "Guardian Mobile API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Register",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"firstName\": \"John\",\n  \"lastName\": \"Doe\",\n  \"email\": \"john.doe@example.com\",\n  \"password\": \"Test@1234\",\n  \"contactNumber\": \"9123456789\",\n  \"dateOfBirth\": \"1990-01-15\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/guardian/auth/register",
          "host": ["{{baseUrl}}"],
          "path": ["api", "guardian", "auth", "register"]
        }
      }
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"john.doe@example.com\",\n  \"password\": \"Test@1234\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/guardian/auth/login",
          "host": ["{{baseUrl}}"],
          "path": ["api", "guardian", "auth", "login"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000",
      "type": "string"
    }
  ]
}
```