# Supabase JWT Authentication Guide

## Overview

The ANTE system uses a hybrid authentication approach that combines backend-managed authentication with Supabase's Row Level Security (RLS) policies. This ensures secure, company-isolated data access while maintaining compatibility with existing backend APIs.

## Architecture

### Authentication Flow

1. **Login**: User authenticates through backend (`/auth/login`)
2. **Token Generation**: Backend generates custom JWT tokens with user metadata
3. **Frontend Storage**: Tokens stored in localStorage and Pinia stores
4. **Supabase Client**: Frontend creates authenticated Supabase client with JWT
5. **RLS Enforcement**: Database enforces company-based access via JWT metadata

### Key Components

- **Backend Token Service**: Generates non-expiring JWT tokens with user metadata
- **Frontend Supabase Service**: Manages Supabase client with custom JWT authentication
- **RLS Policies**: Enforce company-based data isolation using JWT metadata
- **Session Persistence**: Automatic session restoration on page refresh

## Implementation Details

### Backend Token Generation

Location: `/backend/src/infrastructure/supabase/supabase.service.ts`

```typescript
// Generates JWT tokens that expire in 2099 (effectively never)
async generateAccessToken(userId: string, claims: {
  email: string;
  accountId: string;
  roleId: string;
  companyId?: number;
}) {
  const farFutureExpiry = Math.floor(new Date('2099-12-31').getTime() / 1000);

  const payload = {
    aud: 'authenticated',
    exp: farFutureExpiry, // Token expires in 2099
    sub: userId,
    email: claims.email,
    role: 'authenticated',
    user_metadata: {
      accountId: claims.accountId,
      roleId: claims.roleId,
      companyId: claims.companyId,
      email: claims.email
    }
  };

  return jwt.sign(payload, this.supabaseJwtSecret);
}
```

### Frontend Supabase Service

Location: `/frontends/frontend-main/src/services/supabase.js`

Key features:
- Custom JWT session management
- Session persistence in localStorage
- Automatic client recreation with proper headers
- X-Source header for RLS policy identification

```javascript
// Setting session with backend JWT
async setSession(accessToken, refreshToken) {
  // Parse JWT to extract user information
  const payload = JSON.parse(atob(accessToken.split('.')[1]));

  // Store tokens and user info
  this.customAccessToken = accessToken;
  this.customUser = payload.user_metadata;

  // Persist to localStorage
  localStorage.setItem('supabase-custom-session', JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken,
    user: userInfo
  }));

  // Client is created with proper headers when getClient() is called
}

// Get authenticated Supabase client
getClient() {
  if (this.isCustomSession && this.customAccessToken) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          'Authorization': `Bearer ${this.customAccessToken}`,
          'X-Source': 'frontend-main' // Required for RLS policies
        }
      }
    });
  }
  return this.client; // Default client
}
```

### RLS Policy Structure

Location: `/backend/src/security/rules/tables/`

Example Task table policy:
```sql
CREATE POLICY "tasks_select_company_filtered" ON public."Task"
  FOR SELECT
  TO authenticated
  USING (
    -- Check request source
    current_setting('request.headers', true)::json->>'x-source' = 'frontend-main'
    -- Filter by company from JWT
    AND "companyId" = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'companyId')::int,
      0
    )
  );
```

### Frontend Auth Store

Location: `/frontends/frontend-main/src/stores/auth.ts`

Handles:
- Supabase token storage
- Session initialization on app boot
- Integration with multi-account support

## Usage in Components

### Setting Up Authentication

```typescript
// In login component
const response = await api.post('/auth/login', credentials);
const { supabaseToken, supabaseRefreshToken } = response.data;

// Store tokens in auth store
await authStore.storeSupabaseTokens(supabaseToken, supabaseRefreshToken);
```

### Using Authenticated Supabase Client

```typescript
import supabaseService from 'src/services/supabase';

// Get authenticated client
const supabase = supabaseService.getClient();

// Query with automatic company filtering
const { data, error } = await supabase
  .from('Task')
  .select('*')
  .eq('companyId', userCompanyId); // Company filtering enforced by RLS
```

### Session Restoration

Handled automatically in `/frontends/frontend-main/src/boot/auth.ts`:

```typescript
// On app boot, if user is authenticated
if (authStore.isAuthenticated) {
  await authStore.initializeSupabaseSession();
}
```

## Security Features

1. **Non-Expiring Tokens**: Tokens expire in 2099, eliminating refresh complexity
2. **Company Isolation**: RLS policies enforce strict company-based data access
3. **Source Verification**: X-Source header prevents unauthorized access
4. **Role-Based Access**: JWT contains role information for fine-grained permissions
5. **Session Persistence**: Secure localStorage storage with automatic restoration

## Testing Authentication

Use the test script at `/debug/test-auth-flow.js` to verify:
- Token generation and structure
- RLS policy enforcement
- Company-based filtering
- ApprovalMetadata access

```bash
cd debug
node test-auth-flow.js
```

## Troubleshooting

### Common Issues

1. **"Permission denied for table"**
   - Check if table has GRANT SELECT for authenticated role
   - Verify X-Source header is set to 'frontend-main'
   - Ensure JWT contains user_metadata.companyId

2. **"Supabase client not initialized"**
   - Check environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
   - Verify supabaseService.initialize() is called

3. **Session not persisting**
   - Check localStorage for 'supabase-custom-session'
   - Verify auth boot file runs after axios boot

### Debug Commands

```bash
# Check current RLS policies
cd backend
yarn security:list-tables

# Apply RLS updates
yarn security:apply --force

# Test specific table access
cd debug
node test-approval-simple.js
```

## Migration Notes

### From Anon Keys to JWT Authentication

1. Frontend receives JWT from backend login
2. Frontend uses JWT instead of anon key for authorization
3. RLS policies filter data based on JWT metadata
4. No changes required to backend API endpoints

### Future Improvements

- [ ] Add token refresh mechanism (currently not needed due to long expiry)
- [ ] Implement role-based RLS policies beyond company filtering
- [ ] Add audit logging for data access
- [ ] Consider implementing Supabase Realtime with authentication

## Related Documentation

- [RLS Policy Management Guide](./rls-policy-management-guide.md) - Complete guide for creating and managing RLS policies
- [Backend CLAUDE.md](/backend/CLAUDE.md) - Backend-specific instructions including security rules
- [Root CLAUDE.md](/CLAUDE.md) - Main project instructions with database security section
- [Frontend Supabase Integration](/frontends/frontend-main/docs/SUPABASE_INTEGRATION.md)
- [Backend Authentication Service](/backend/src/modules/auth/README.md)