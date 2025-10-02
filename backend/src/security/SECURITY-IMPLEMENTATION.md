# Database Security Implementation

## Overview
This document describes the Row Level Security (RLS) implementation for the ANTE ERP system, ensuring proper data isolation and security.

## Security Architecture

### Authentication Flow
1. User logs in through backend API (`/auth/login`)
2. Backend generates ANTE token and Supabase tokens
3. Supabase tokens are stored and used for direct database access
4. Frontend uses Supabase client with authenticated session

### Security Layers

#### 1. Anonymous Access (REMOVED)
- **Status**: ✅ Secured
- **Previous Issue**: Anonymous users had SELECT access to sensitive tables
- **Resolution**: All GRANT statements for anonymous role removed from `/src/security/rules/_grants/anon.sql`

#### 2. Row Level Security (RLS)
- **Status**: ✅ Enabled
- **Protected Tables**: 
  - `Account` - Full RLS with company isolation
  - `EmployeeData` - Full RLS with company isolation
- **Reference Tables** (RLS disabled, authenticated read-only):
  - `EmployeeContract`, `Project`, `Role`, `RoleGroup`
  - `PayrollGroup`, `Schedule`, `Shift`, `ShiftTime`

#### 3. Company Isolation
- **Implementation**: All sensitive data is filtered by `companyId`
- **Method**: Policies check authenticated user's company via Account table
- **Backward Compatibility**: Policies support both `supabaseUserId` and email matching

## Policy Implementation

### Account Table Policies
```sql
-- Users can access their own account
"supabaseUserId" = auth.uid()::text OR "email" = auth.jwt() ->> 'email'

-- Company isolation for viewing other accounts
"companyId" = (SELECT "companyId" FROM "Account" WHERE ...)
```

### EmployeeData Table Policies
```sql
-- Company-based access through Account relationship
EXISTS (
  SELECT 1 FROM "Account" a1 
  WHERE a1.id = "EmployeeData"."accountId"
  AND a1."companyId" = (user's company)
)
```

### Frontend Access
- **Requirement**: X-Source header must be set to 'frontend-main'
- **Permissions**: SELECT-only (read-only access)
- **Implementation**: Policies check for header in `current_setting('request.headers')`

## Security Commands

### Apply Security Rules
```bash
# Apply all rules
yarn security:apply --force

# Apply specific table rules
yarn security:apply-table=account,employee-data --force

# List available tables
yarn security:list-tables
```

### Testing Security
```bash
# Test login and get tokens
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"pass"}'

# Test data access with token
curl -X GET "http://localhost:3000/employee" \
  -H "token: YOUR_TOKEN_HERE"
```

## File Structure
```
/src/security/
├── rules/
│   ├── _common/
│   │   ├── 01-enable-rls.sql       # Enable RLS on tables
│   │   ├── 02-create-policies.sql  # Create all policies
│   │   └── 03-disable-rls-exceptions.sql # Disable RLS on reference tables
│   ├── _grants/
│   │   ├── anon.sql                # Anonymous grants (EMPTY - secured)
│   │   └── authenticated.sql       # Authenticated user grants
│   └── tables/
│       ├── account.sql             # Account table policies
│       ├── employee-data.sql       # EmployeeData policies
│       └── ...                      # Other table policies
└── cli/
    └── apply-rules.ts              # CLI tool for applying rules
```

## Security Principles

1. **Zero Trust**: No anonymous access to sensitive data
2. **Company Isolation**: Users only see data from their own company
3. **Authenticated Access**: All data access requires valid Supabase session
4. **Frontend Read-Only**: Frontend has SELECT-only permissions
5. **Backend Full Access**: Backend service uses service role key for full access

## Troubleshooting

### Issue: "No data in HRIS tabs"
**Cause**: RLS policies blocking access
**Solution**: Ensure user has valid Supabase session with proper JWT claims

### Issue: "Permission denied"
**Cause**: Missing authentication or wrong company
**Solution**: Verify X-Source header and user's company membership

### Issue: "supabaseUserId not found"
**Cause**: Legacy accounts without Supabase user linked
**Solution**: Policies support email-based matching as fallback

## Migration Notes

### From Anonymous to Authenticated
1. Remove all anonymous GRANT statements
2. Enable RLS on sensitive tables
3. Create company isolation policies
4. Update frontend to use authenticated Supabase sessions

### Future Improvements
1. Populate `supabaseUserId` for all existing accounts
2. Remove email-based fallback once migration complete
3. Add more granular role-based policies
4. Implement write policies for frontend (currently read-only)

## Security Checklist

- [x] Remove anonymous access grants
- [x] Enable RLS on Account table
- [x] Enable RLS on EmployeeData table
- [x] Implement company isolation policies
- [x] Support authenticated Supabase sessions
- [x] Add X-Source header validation
- [x] Test with real user authentication
- [x] Document security implementation

## Deployment Integration

### Migration-Based Deployment (NEW - Sept 2025)
All security rules and views are now integrated into Prisma migrations for consistent deployment across environments.

#### Migration Structure
- **File**: `/prisma/migrations/20250906191300_add_views_and_security_rules/migration.sql`
- **Contains**: All views, security functions, RLS policies, and grants
- **Order**: Views first → Security functions → RLS policies → Grants

#### Deployment Commands
```bash
# Production deployment (automated)
npx prisma migrate deploy

# Local testing with verification
yarn migrate:with-security

# Database-only deployment
yarn deploy:database
```

#### What's Included in Migration
1. **Database Views**
   - `accounts_without_employee_data` - HRIS system integration
   - Proper permissions granted to authenticated users

2. **Security Functions**
   - `public.get_user_company_id()` - Avoids RLS recursion
   - JWT-based company ID extraction

3. **RLS Policies**
   - Account table: Company isolation with email/supabaseUserId fallback
   - EmployeeData table: Company isolation through Account relationship
   - Frontend policies: X-Source header validation for read-only access
   - Reference table policies: Authenticated access to shared data

4. **Role Grants**
   - `authenticated` role: Access to functions and views
   - `service_role`: Full access (backend operations)
   - `anon` role: No access (secure by default)

### Deployment Verification
The migration includes automatic verification steps:
- ✅ Security functions are callable
- ✅ Database views are accessible
- ✅ RLS status is properly configured
- ✅ Prisma client generation succeeds

## Last Updated
September 6, 2025 - Added migration-based deployment with views and security rules integration