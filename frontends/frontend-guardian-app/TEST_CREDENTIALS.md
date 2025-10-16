# Guardian App - Test Credentials

## Test Guardian Accounts

Use these credentials to test the Guardian App login functionality:

### Test Account 1 (SQL Seeded - For Mobile App Only)
- **Email:** `robert.doe@email.com`
- **Password:** `water123`
- **Name:** Robert Doe
- **Phone:** 9171234567
- **Company ID:** 999 (Test School)
- **Created via:** SQL seed script

### Test Account 2 (Created via School Module - Works for Both Apps)
- **Email:** `maria.santos@email.com`
- **Password:** `guardian123`
- **Name:** Maria Cruz Santos
- **Phone:** 9171234568
- **Company ID:** 1 (Mater Dei Academy)
- **Created via:** School Module Guardian Management
- **Status:** ✅ Can login to Guardian App

## API Endpoint
```
POST /api/public/school-guardian/auth/login
```

## Test Request (curl)
```bash
curl -X POST http://localhost:3000/api/public/school-guardian/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "robert.doe@email.com",
    "password": "water123",
    "platform": "web"
  }'
```

## Expected Response
```json
{
  "success": true,
  "data": {
    "token": "<generated-token>",
    "guardian": {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "firstName": "Robert",
      "lastName": "Doe",
      "email": "robert.doe@email.com",
      "phoneNumber": "9171234567"
    },
    "students": [],
    "permissions": []
  },
  "message": "Login successful",
  "timestamp": "<timestamp>"
}
```

## How the Test Account Was Created

The test Guardian account is created via the SQL script located at:
```
backend/src/modules/school/sync/test-data.sql
```

### Password Hash Generation
The password hash is generated using bcrypt (10 salt rounds):
```bash
cd backend
node scripts/generate-password-hash.js water123
```

This generates:
```
Hash: $2b$10$.Rinx45q0iAf8/FukpTgr.IQTq.OB7lcOL5eO2a2NYhAKkTlRNmBO
```

### Applying Test Data
To (re)create the test Guardian account:
```bash
cd backend
psql $DATABASE_URL -f src/modules/school/sync/test-data.sql
```

## Notes

- The test account is created with `isActive: true` to allow login
- The account is linked to company ID 999 (Test School)
- Students can be added after login using the "Add Student" feature
- The password uses bcrypt hashing (same as production accounts)

## Creating New Test Accounts

To create additional test accounts:

1. Generate password hash:
   ```bash
   node scripts/generate-password-hash.js <your-password>
   ```

2. Add SQL INSERT statement to `test-data.sql`:
   ```sql
   INSERT INTO "Guardian" (id, "firstName", "lastName", "dateOfBirth", email, password, key, "contactNumber", "companyId", "isActive", "searchKeyword", "createdAt", "updatedAt")
   VALUES
     ('<uuid>', '<firstName>', '<lastName>', '<dob>', '<email>', '<bcrypt-hash>', E'\\x0123456789ABCDEF', '<phone>', <companyId>, true, '<search-terms>', NOW(), NOW())
   ON CONFLICT (id) DO UPDATE SET
     password = EXCLUDED.password,
     "isActive" = EXCLUDED."isActive";
   ```

3. Apply the SQL file as shown above

---

## 🔧 Fix Applied (2025-10-16)

### Problem
Guardians created through **School Module > Guardian Management** (frontend-main) could not login to the **Guardian App** with a 401 Unauthorized error.

### Root Cause
**Password Encryption Mismatch:**
- School Module used `EncryptionService` (AES encryption) to hash passwords
- Guardian Public API used `bcrypt.compare()` to verify passwords
- These two methods are incompatible!

### Solution
Updated `backend/src/modules/school/guardian/guardian.service.ts` to use **bcrypt** for password hashing:

**Changed Methods:**
1. `create()` - Now uses `bcrypt.hash(password, 10)` instead of `EncryptionService.encrypt()`
2. `resetPassword()` - Now uses `bcrypt.hash(password, 10)` instead of `EncryptionService.encrypt()`

**Benefits:**
- ✅ Guardians created via School Module can now login to Guardian App
- ✅ Single password encryption standard (bcrypt) across both systems
- ✅ More secure (bcrypt is industry standard for password hashing)
- ✅ Compatible with Guardian Public API

**Impact:**
- **New Guardians:** All new Guardian accounts will use bcrypt (compatible with both apps)
- **Existing Guardians:** Accounts created before this fix will need password reset to work with Guardian App

---

**Last Updated:** 2025-10-16
