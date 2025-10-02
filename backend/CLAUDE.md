# GEER-ANTE ERP - Backend Claude Instructions

## 🔴 CRITICAL: PM2-based Development
- Backend now runs with PM2 process manager (PM2 process name: `ante-backend`)
- **Check for errors**: Use `yarn logs:backend` or `pm2 logs ante-backend` to see TypeScript errors in real-time
- **From root directory**: Use `yarn logs:backend` for continuous log monitoring
- Building can be done locally: `yarn build` (no longer requires Docker exec)
- PM2 automatically restarts on file changes in development mode
- Databases run in Docker containers, applications run with PM2
- **Full PM2 Architecture**: See `ecosystem.config.js` and `/documentation/infrastructure/docker-services-guide.md`

## 🚀 PM2 Service Information
- **PM2 Process Name**: `ante-backend`
- **API Port**: 3000 (http://localhost:3000)
- **WebSocket Port**: 4000 (ws://localhost:4000)
- **Database Services**:
  - PostgreSQL: Hosted Supabase at https://ramamglzyiejlznfnngc.supabase.co (managed via CLI)
  - Redis: `localhost:6379` (Docker container: ante-redis-dev)
  - MongoDB: `localhost:27017` (Docker container: ante-mongodb-dev)
- **Development Commands**:
  - Start all: `yarn dev` (from root)
  - Backend logs: `yarn logs:backend`
  - PM2 status: `yarn status`
  - Stop all: `yarn stop`

### Supabase Features Available in Backend
- ✅ **PostgreSQL with Pooling**: Connection pooling via Supavisor for high concurrency
- ✅ **REST API**: Direct database queries at https://api.geertest.com/rest/v1/
- ✅ **Real-time Subscriptions**: WebSocket connections for live data updates
- ✅ **File Storage**: Built-in file upload and image transformation capabilities
- ✅ **Auto-generated API**: Automatic REST endpoints based on database schema
- ✅ **Row Level Security**: Fine-grained security policies (if needed)

**⚠️ Different connection patterns for PM2 development vs Docker deployment!**

#### Development (PM2 + Docker Databases)
```yaml
# CORRECT - Use localhost since backend runs with PM2, not in Docker
DATABASE_URL: postgresql://user:pass@localhost:5432/ante
REDIS_HOST: localhost
MONGODB_URI: mongodb://localhost:27017/ante

# WRONG - Don't use Docker service names for PM2 development
DATABASE_URL: postgresql://user:pass@postgres:5432/ante  # ❌ Only for Docker deployment
REDIS_HOST: redis  # ❌ Only for Docker deployment
```

#### Staging Environment
```yaml
# CORRECT - Use Docker service names or host.docker.internal
REDIS_HOST: redis  # If Redis runs in same Docker network
REDIS_HOST: host.docker.internal  # If Redis runs on host
DATABASE_URL: postgresql://user:pass@host.docker.internal:5432/ante

# WRONG - Never use external IPs from inside containers
REDIS_HOST: 157.230.246.107  # ❌ This will fail!
DATABASE_URL: postgresql://user:pass@157.230.246.107:5432/ante  # ❌
```

#### Production Environment
```yaml
# CORRECT - Use Docker service names or managed service URLs
REDIS_HOST: ante-redis-production  # Docker service name
MONGODB_URI: mongodb://ante-mongodb-production:27017/ante_production
DATABASE_URL: postgresql://user:pass@private-db-host.ondigitalocean.com:25060/ante

# WRONG - Never use server's external IP
REDIS_HOST: 178.128.49.38  # ❌ Will cause connection failures!
```

### Common Docker Networking Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| Redis connection failed | `Error: connect ECONNREFUSED 157.230.246.107:6379` | Change `REDIS_HOST` from external IP to `redis` or `host.docker.internal` |
| Database connection timeout | `Error: connect ETIMEDOUT 178.128.49.38:5432` | Use `host.docker.internal` or Docker service name |
| MongoDB connection refused | `MongoNetworkError` | Use `mongodb` service name, not localhost or external IP |
| Service discovery failure | `getaddrinfo ENOTFOUND` | Ensure services are in same Docker network |

### Docker Network Debugging Commands
```bash
# Check container's network configuration
docker inspect ante-backend-staging | grep -A 10 NetworkMode

# List all networks
docker network ls

# Inspect network to see connected containers
docker network inspect ante-staging-network

# Test connectivity from inside container
docker exec ante-backend-staging ping redis
docker exec ante-backend-staging nc -zv redis 6379

# View container's resolved DNS
docker exec ante-backend-staging cat /etc/hosts
```

### Environment File Best Practices
1. **Always use service names** for Docker-to-Docker communication
2. **Use `host.docker.internal`** when accessing host services from container
3. **Never hardcode external IPs** in environment files
4. **Test connections** after deployment using health checks
5. **Document service dependencies** in docker-compose.yml

## 🧪 Backend Testing Guidelines
- Only create/fix tests when explicitly requested.
- Test files: `*.spec.ts` in the same directory as code.
- Run tests: `yarn test` or `npm test` (unit), `yarn test:e2e` (E2E), `yarn test:cov` (coverage).
- Coverage: 80% minimum for new/modified code.

## 🔴 CRITICAL: Database Schema Changes
- After editing `schema.prisma`, STOP and notify the user to run the migration.
- Never run `prisma migrate` or `db push` yourself.
- Wait for user confirmation before continuing.
- Migration file is required for deployment and team sync.
- **With PM2 development**: Migrations can be run directly (no Docker exec needed)
- **NEVER use `prisma db push` in production or staging** - it causes migration drift
- **NEVER use `prisma db pull`** - it will overwrite the entire schema with database state and reorganize everything
- **NEVER use `prisma db pull --force`** - it will completely replace your schema.prisma file with database introspection
- **NEVER use `supabase db pull`** - it will overwrite the entire schema with database state
- **NEVER use `prisma migrate reset`** - this DROPS the entire database and is extremely dangerous!
- **NEVER use `prisma migrate reset --force`** - this will destroy all data without confirmation!
- **ALWAYS use `prisma migrate deploy` for production and staging deployments**
- **If migration issues occur**: Use `prisma migrate resolve` to mark failed migrations as resolved
- **To check table structure**: Use `grep -A 20 "model TableName" prisma/schema.prisma` instead of db pull

### Prisma Migration with PM2 Development + Hosted Supabase

#### Primary Method: Manual Migration Creation (Supabase has no shadow database)
**IMPORTANT: Supabase does NOT provide a shadow database, so `prisma migrate dev` will NOT work!**

```bash
# From backend directory
cd backend

# Option 1: Create migration SQL manually
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_<migration_name>
# Create migration.sql file with your SQL changes

# Option 2: Use diff to generate SQL (compare schema to database)
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/$(date +%Y%m%d%H%M%S)_<migration_name>/migration.sql

# Apply migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

#### Alternative: Using Supabase CLI (For advanced SQL operations)
Use Supabase CLI only for complex SQL operations not easily handled by Prisma:

```bash
# Create new migration file for raw SQL
supabase migration new <migration_name>

# Edit the migration file in supabase/migrations/[timestamp]_<migration_name>.sql
# Add your complex SQL changes (triggers, functions, RLS policies, etc.)

# Apply migrations to hosted Supabase instance
supabase db reset --linked

# Generate Prisma client after schema changes
cd backend
# WARNING: NEVER use 'npx prisma db pull' - it will overwrite the schema
npx prisma generate
```

#### Troubleshooting Migration Issues
```bash
# If Prisma migration fails, reset and retry
cd backend
npx prisma migrate reset --force
npx prisma migrate dev --name <migration_name>

# If Supabase CLI issues, reset local state
supabase db reset --linked

# View migration status
npx prisma migrate status
supabase migration list
```

#### Important Notes for Supabase + Prisma Development
- **NO SHADOW DATABASE**: Supabase doesn't provide shadow database - **NEVER use `prisma migrate dev`**
- **Manual Migrations**: Create migration files manually or use `prisma migrate diff`
- **Supabase CLI**: Use only for advanced SQL operations (triggers, functions, RLS policies)
- **Local Development**: Use hosted Supabase via CLI (no Docker PostgreSQL needed)
- **Always run `npx prisma generate`** after schema changes or pulling migrations
- **Migration files**: Prisma migrations in `/prisma/migrations/` must always be committed
- **Supabase migrations**: Only commit `/supabase/migrations/` when using CLI for advanced operations
- **NEVER use `prisma db push` in ANY environment** (causes migration drift)
- **NEVER use `prisma migrate dev`** with Supabase (no shadow database available)
- **Always use `prisma migrate deploy`** to apply migrations

## 🔒 Database Security Rules
**Frontend has controlled access via RLS policies. Backend has FULL access.**

### Apply Security Rules to Database
```bash
cd backend
# Apply all rules (recommended)
yarn security:apply --force

# OR apply using explicit command
yarn security:apply-rules --all --force
```

### Apply Specific Table Rules
```bash
# List available table rules
yarn security:list-tables

# Apply specific table rules
yarn security:apply-table=account --force
yarn security:apply-table=account,company,employee-data --force

# Preview changes before applying
yarn security:apply-table=account --dry-run
```

### If You Need to Modify Rules
```bash
# For specific tables: Edit individual files
vim src/security/rules/tables/account.sql
vim src/security/rules/tables/company.sql

# Apply only the changed table
yarn security:apply-table=account --force

# For system-wide changes: Edit common files
vim src/security/rules/_common/01-enable-rls.sql
vim src/security/rules/_grants/authenticated.sql

# Apply all rules
yarn security:apply --force
```

**That's it!** Rules are automatically updated each time you run the command. The new modular structure makes it easy to work on individual tables.

## 👁️ Database Views Management
**Centralized database view management with single source of truth approach.**

### Apply Database Views
```bash
cd backend
yarn views:apply --force
```

### View Management Commands
```bash
# Apply all views
yarn views:apply

# Apply views without confirmation
yarn views:apply-force

# Preview what would be applied
yarn views:dry-run

# List all available view files
yarn views:list

# Show SQL that will be executed
yarn views:show

# Apply specific views only
yarn views:apply --only=accounts-without

# Exclude specific views
yarn views:apply --exclude=test-view
```

### Creating New Views
1. Create a new `.sql` file in `/src/views/definitions/` using kebab-case naming
2. Use the standard structure with `CREATE OR REPLACE VIEW`
3. Include appropriate permissions and comments
4. Run `yarn views:apply` to apply the new view

### Current Views
- **accounts_without_employee_data**: Used by HRIS Not Yet Setup tab
- Views are automatically accessible via Supabase PostgREST API

**For complete documentation**: `/backend/src/views/README.md`

## Code Standards
- Lint: `npm run lint` (uses `/backend/.eslintrc.js`)
- TypeScript aliases: `@modules`, `@common`, `@shared`, `@infrastructure` (see `tsconfig.json`)
- Naming: camelCase (vars/fns), PascalCase (classes/interfaces), kebab-case (utils)
- Import order: External → Internal → Relative
- See `/documentation/standards/backend-coding-standards.md`

## Deployment & Environment
- Use `deploy-staging.sh`/`deploy-live.sh` for backend deployment.
- Environment: see `/backend/.env.example` for required vars.
- PM2 process: `backend` (see `/ecosystem.config.js`)
- Port: 3000 (API), 5432 (Postgres), 27017 (MongoDB)

## API & Auth
- Custom token-based auth (NOT JWT). Token in `AccountToken` table, header: `token: YOUR_TOKEN_HERE`.
- Public endpoints: `/auth/login`, `/auth/signup`. All others require token.
- Error handling: custom error classes, consistent format.
- See `/documentation/standards/controller-patterns.md`.

### 🚨 Response Format Guidelines - CRITICAL
**Two utility methods with DIFFERENT outputs:**

1. **`responseHandler()` (STANDARD - Use for 95% of endpoints)**
   ```typescript
   // Returns data directly
   return this.utility.responseHandler(
     this.service.getData(),
     response
   );
   // Output: { field1: "value", field2: "value" }
   // Frontend: response.data
   ```

2. **`handleResponse()` (RARE - Only when message needed)**
   ```typescript
   // Wraps data with message
   return this.utility.handleResponse(
     this.service.create(dto),
     response,
     'Created successfully'
   );
   // Output: { message: "Created successfully", data: { ... } }
   // Frontend: response.data.data
   ```

**Default to `responseHandler()` unless you specifically need a success message!**
**📚 Full guide: `/documentation/standards/api-response-patterns.md`**

## Module Registry
- Modules in `/backend/src/modules/` (see CLAUDE.md root for full list).
- Each module: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.validator.ts`, `*.interface.ts`.
- See `/documentation/architecture/backend-structure-guide.md`.

## PM2 Usage
- Monitor logs: `pm2 logs backend` or `yarn logs` (all logs).
- Check status: `yarn status`.

## Error Prevention Checklist
- Always verify service methods before use.
- Import from specific module files, not parent dirs.
- Check schema.prisma for relationships before using includes.
- Use proper error typing and interface requirements.
- Run `yarn build` frequently, check logs after every change.
- See CLAUDE.md root for full checklist.

## 🚨 Webhook Architecture Guidelines
**CRITICAL: Business logic should be handled in the backend service layer, NOT via database webhooks**

### DO NOT:
- ❌ Create Supabase database triggers that call webhooks back to the backend
- ❌ Use database functions to trigger application-level business logic
- ❌ Create circular dependencies between database and application

### DO:
- ✅ Handle all business logic (watchers, notifications, discussions) directly in the service layer
- ✅ Keep database triggers for database-only concerns (audit logs, updated_at timestamps)
- ✅ Use webhooks only for external integrations (third-party services)
- ✅ Process all side effects synchronously or via background jobs in the application

### Why This Matters:
1. **Single Source of Truth**: Business logic stays in one place (the backend service)
2. **Debugging**: Easier to trace and debug when logic is in the application
3. **Testing**: Can unit test business logic without database dependencies
4. **Performance**: Avoids unnecessary network calls between database and backend
5. **Reliability**: No risk of webhook failures causing data inconsistencies

Example: When a task is created via `/task/create` endpoint:
- The TaskService should directly create watchers, send notifications, and create discussions
- NOT: Database trigger → Webhook → Backend processing

## Documentation
- Update `/documentation/` for new patterns, fixes, or modules.
- Update `/documentation/standards/prisma-migration-notes.md` for schema changes.
- See `/documentation/README.md` for full index. 