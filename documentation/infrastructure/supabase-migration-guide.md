# Supabase Migration Guide

## Overview
This document tracks the ANTE ERP system's database architecture using hosted Supabase for local development and self-hosted Supabase for staging/production environments.

## Migration Status

| Environment | Status | Database | Details |
|-------------|--------|---------|----------|
| **Local Development** | ✅ Active | Hosted Supabase | Project: ofnmfmwywkhosrmycltb (Ante Staging) |
| **Staging** | ✅ Active | Hosted Supabase | Same as Local - Project: ofnmfmwywkhosrmycltb |
| **Production** | ✅ Active | Hosted Supabase | Separate - Project: ccdlrujemqfwclogysjv (Ante Production) |

⚠️ **CRITICAL**: Local and Staging environments share the same database!

## Environment Configurations

### Local Development & Staging (Shared Hosted Supabase)
```bash
# Hosted Supabase Configuration - Ante Staging project
# ⚠️ SHARED between Local and Staging environments!
DATABASE_URL="postgresql://postgres.ofnmfmwywkhosrmycltb:DBC4MbaXut9DdoEx@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public"
DIRECT_URL="postgresql://postgres.ofnmfmwywkhosrmycltb:DBC4MbaXut9DdoEx@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?schema=public"
SUPABASE_URL="https://ofnmfmwywkhosrmycltb.supabase.co"
SUPABASE_ANON_KEY="[anon_key_from_dashboard]"
SUPABASE_SERVICE_KEY="[service_key_from_dashboard]"

# Access Points
Studio: https://supabase.com/dashboard/project/ofnmfmwywkhosrmycltb
API: https://ofnmfmwywkhosrmycltb.supabase.co
Pooled DB: aws-1-ap-southeast-1.pooler.supabase.com:6543
Direct DB: aws-1-ap-southeast-1.pooler.supabase.com:5432

# Supabase CLI Commands
supabase link --project-ref ofnmfmwywkhosrmycltb
supabase db pull  # Pull schema from hosted instance
supabase migration new [name]  # Create new migration
supabase db reset --linked     # Reset to match hosted (BE CAREFUL!)
```

### Staging Environment
```bash
# Uses the SAME hosted Supabase as Local Development
# See "Local Development & Staging" section above for configuration

# Deployment Server: 157.230.246.107
# Backend Container: ante-backend-staging
# Backend URL: https://ante-staging-backend.geertest.com

# ⚠️ WARNING: Any data changes affect both local and staging!
```

### Production Environment
```bash
# Hosted Supabase Configuration - Ante Production project
# ✅ SEPARATE from Staging/Local
DATABASE_URL="postgresql://postgres.ccdlrujemqfwclogysjv:vdEsCOodXBzxKF49@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public"
DIRECT_URL="postgresql://postgres.ccdlrujemqfwclogysjv:vdEsCOodXBzxKF49@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?schema=public"
SUPABASE_URL="https://ccdlrujemqfwclogysjv.supabase.co"
SUPABASE_ANON_KEY="[anon_key_from_dashboard]"
SUPABASE_SERVICE_KEY="[service_key_from_dashboard]"

# Access Points
Studio: https://supabase.com/dashboard/project/ccdlrujemqfwclogysjv
API: https://ccdlrujemqfwclogysjv.supabase.co
Backend: https://api.ante.ph
Pooled DB: aws-1-ap-southeast-1.pooler.supabase.com:6543
Direct DB: aws-1-ap-southeast-1.pooler.supabase.com:5432

# Deployment Server: 178.128.49.38
# Backend Container: ante-backend-production

# Supabase CLI Commands (if needed)
supabase link --project-ref ccdlrujemqfwclogysjv
```

## Critical Configuration Notes

### Local Development with Supabase CLI
For local development, we use hosted Supabase managed through the Supabase CLI:

```bash
# Initialize Supabase CLI (one-time setup)
npm install -g supabase
supabase login

# Link to existing hosted project
supabase link --project-ref ofnmfmwywkhosrmycltb  # For Local/Staging
supabase link --project-ref ccdlrujemqfwclogysjv  # For Production

# Common CLI commands for development
supabase db pull          # Pull schema from hosted instance
supabase migration list   # View migration history
supabase migration new <name>  # Create new migration file
supabase db reset --linked     # Reset local schema to match hosted

# Generate types (for TypeScript)
supabase gen types typescript --linked > types/supabase.ts

# View project info
supabase projects list
supabase status --linked
```

### Username Format
**For Hosted Supabase**: The pooler requires project-specific usernames:

```bash
# ✅ CORRECT - Hosted Supabase format
DATABASE_URL=postgresql://postgres.ofnmfmwywkhosrmycltb:password@host:6543/postgres  # Staging
DATABASE_URL=postgresql://postgres.ccdlrujemqfwclogysjv:password@host:6543/postgres  # Production

# ❌ WRONG - Will cause authentication errors
DATABASE_URL=postgresql://postgres:password@host:6543/postgres
```

### Port Configuration (Hosted Supabase)
- **Port 6543**: Pooled connections via Supavisor (for application use)
- **Port 5432**: Direct PostgreSQL connections (for migrations)
- **Studio**: Web-based database management at supabase.com/dashboard
- **API Gateway**: REST/Auth/Storage/Realtime APIs at [project-ref].supabase.co

## Current Architecture Notes

### Shared Database Implications (Local/Staging)
Since local and staging share the same database:
- ⚠️ **Test data affects both environments**
- ⚠️ **Migrations run in one environment affect the other**
- ⚠️ **Be careful with destructive operations**
- ✅ **Consider using data prefixes** (e.g., `TEST_` for test data)
- ✅ **Always backup before major changes**

### Best Practices for Shared Database
1. **Use environment-specific prefixes** for test data
2. **Coordinate migrations** between team members
3. **Test migrations locally first** (dry run)
4. **Document all database changes** clearly
5. **Consider separating databases** in the future for safety

## Migration Command Reference

### Backup & Restore Commands
```bash
# Create complete backup from source PostgreSQL
pg_dump -h source_host -U username -d database_name \
  --clean --create --verbose \
  --no-owner --no-privileges \
  > complete_backup.sql

# Create data-only backup (for existing schema)
pg_dump -h source_host -U username -d database_name \
  --data-only --disable-triggers --inserts \
  --no-owner --no-privileges \
  > data_backup.sql

# Import to Supabase (disable triggers to avoid FK constraint issues)
psql "postgresql://postgres.tenant1:password@host:5433/postgres" \
  -c "SET session_replication_role = replica;" \
  -f backup.sql

# Re-enable triggers after import
psql "postgresql://postgres.tenant1:password@host:5433/postgres" \
  -c "SET session_replication_role = DEFAULT;"
```

### Health Check Commands
```bash
# Test database connectivity
psql "postgresql://postgres.tenant1:password@host:6543/postgres?pgbouncer=true" -c "SELECT version();"

# Check backend health
curl -s https://ante-staging-backend.geertest.com/health | jq

# Verify container status
ssh user@host "docker ps | grep backend"

# Check container logs
ssh user@host "docker logs container_name --tail 50"
```

## Common Issues & Solutions

### 1. "Tenant or user not found" Error
**Symptom**: Backend container exits immediately with database connection error
**Cause**: Incorrect username format in connection string
**Solution**: Use `postgres.tenant1` instead of `postgres` in DATABASE_URL

### 2. Foreign Key Constraint Violations
**Symptom**: Data import fails with FK constraint errors
**Cause**: Circular dependencies between tables during import
**Solution**: Use `SET session_replication_role = replica;` to disable triggers during import

### 3. Backend Container Won't Start
**Symptom**: Container exits with Prisma initialization errors
**Cause**: Database connection failure or missing environment variables
**Debug**: Check container logs and verify all required environment variables are present

### 4. Pooler Connection Issues
**Symptom**: Connection timeout or authentication errors
**Cause**: Supavisor pooler configuration mismatch
**Solution**: Verify tenant ID matches pooler configuration (`POOLER_TENANT_ID=tenant1`)

## Development Workflow with Supabase CLI

### Setting Up New Environment
1. **Install CLI**: `npm install -g supabase`
2. **Authenticate**: `supabase login`
3. **Link Project**: `supabase link --project-ref ramamglzyiejlznfnngc`
4. **Pull Schema**: `supabase db pull` (gets latest schema from hosted instance)
5. **Generate Types**: `supabase gen types typescript --linked > types/supabase.ts`

### Making Schema Changes

#### Primary Method: Using Prisma (Recommended)
1. **Edit Schema**: Modify `backend/prisma/schema.prisma`
2. **Create Migration**: `cd backend && npx prisma migrate dev --name add_new_table`
3. **Generate Client**: `npx prisma generate`
4. **Optional Types**: `supabase gen types typescript --linked > types/supabase.ts`

#### Alternative: Using Supabase CLI (For advanced SQL only)
Use only for operations not easily handled by Prisma (triggers, functions, RLS policies):
1. **Create Migration**: `supabase migration new add_advanced_feature`
2. **Edit Migration File**: Add SQL in `supabase/migrations/[timestamp]_add_advanced_feature.sql`
3. **Apply Locally**: `supabase db reset --linked`
4. **Sync Prisma**: `cd backend && npx prisma db pull && npx prisma generate`
5. **Update Types**: `supabase gen types typescript --linked > types/supabase.ts`

### Database Copy Operations
Our custom database copy scripts handle data migration between environments:
- **staging-to-local.sh**: Copy staging data to local hosted Supabase
- **production-to-local.sh**: Copy production data to local hosted Supabase
- These scripts automatically handle PostgreSQL compatibility and data transformation

## Environment Migration Status

### Current Database Setup
- ✅ **Local Development**: Hosted Supabase (ofnmfmwywkhosrmycltb) - Shared with staging
- ✅ **Staging Environment**: Same hosted Supabase as local (ofnmfmwywkhosrmycltb)
- ✅ **Production Environment**: Separate hosted Supabase (ccdlrujemqfwclogysjv)

### Benefits of Supabase Migration
- ✅ **Real-time subscriptions** for live data updates
- ✅ **Automatic REST API** generation from database schema
- ✅ **Built-in authentication** system (optional for ANTE)
- ✅ **File storage** with automatic transformations
- ✅ **Row Level Security (RLS)** for fine-grained permissions
- ✅ **Database webhooks** and triggers
- ✅ **Connection pooling** via Supavisor
- ✅ **Web-based management** interface (Studio)

## Maintenance & Monitoring

### Regular Checks
- Monitor Supabase Studio for database health
- Check connection pool usage via Supavisor metrics
- Verify backup procedures are working
- Monitor API response times and availability

### Backup Strategy
- Regular automated backups of Supabase databases
- Test restore procedures periodically
- Maintain backup retention policy
- Document recovery procedures

---

*This document will be updated as the production migration is completed.*