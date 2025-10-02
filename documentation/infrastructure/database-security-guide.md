# Database Security Guide

## 🔒 Database Security Rules
**Frontend has controlled access via RLS policies. Backend has FULL access.**

## RLS Policy Management
**All Supabase RLS policies are managed in modular files**: `/backend/src/security/rules/`
- **Individual table rules**: `/backend/src/security/rules/tables/[table-name].sql`
- **Common operations**: `/backend/src/security/rules/_common/`
- **Role grants**: `/backend/src/security/rules/_grants/`
- **ALWAYS edit the appropriate file** when making table-specific changes
- Changes are applied using the security commands below

**📚 AI-Assisted Development**: When creating RLS policies, database functions, or migrations, refer to `/documentation/standards/supabase-ai-prompts-guide.md` for optimized AI prompts tailored to ANTE's architecture

## Apply Security Rules to Database
```bash
cd backend
yarn security:apply --force            # Apply all rules (recommended)
yarn security:apply-table=account      # Apply specific table rules
yarn security:list-tables              # List available table rules
```

## RLS Policy Reference Implementation
**📖 Example file**: `/backend/src/security/rules/tables/client.sql`
- Shows proper JWT handling with custom tokens (NOT Supabase Auth)
- Demonstrates dual-path access patterns for nullable relationships
- Includes X-Source header checking for frontend identification
- **⚠️ CRITICAL**: Always GRANT table permissions to `authenticated` role!
  ```sql
  GRANT SELECT, INSERT, UPDATE ON public."TableName" TO authenticated;
  ```

## 🗄️ Database Architecture

### Environment Endpoints

⚠️ **IMPORTANT**: Local and Staging environments share the same hosted Supabase database!

- **Local Development**: Hosted Supabase at https://ofnmfmwywkhosrmycltb.supabase.co (Ante Staging project)
- **Staging**: Same as Local - https://ofnmfmwywkhosrmycltb.supabase.co (Ante Staging project)
- **Production**: Separate hosted Supabase at https://ccdlrujemqfwclogysjv.supabase.co (Ante Production project)

## Critical Migration Rules
- **NEVER edit database tables directly** through Supabase Studio or SQL clients
- **NEVER use `prisma db push`** in production/staging
- **NEVER use `prisma db pull`** - it will overwrite and reorganize your entire schema.prisma file
- **NEVER use `prisma db pull --force`** - extremely dangerous, will replace your schema completely
- **NEVER modify data directly in production** - use migration scripts or API endpoints
- **ALWAYS create proper migrations** using Prisma for schema changes
- **ALWAYS use `prisma migrate deploy`** for deployments
- **Use Supabase CLI** for local development database management
- **For interactive Prisma commands** (`prisma migrate dev`, `prisma migrate reset`) - ask user to execute manually
- **For non-interactive commands** (`prisma migrate deploy`) - can be executed without user intervention
- **To check table structure** - use `grep -A 20 "model TableName" prisma/schema.prisma` instead
- Commit migration files to git before deployment

## Database Modification Guidelines

### Schema Changes:
- **NEVER use `prisma migrate dev`** - Supabase has no shadow database!
- **NEVER use `prisma db pull` or `prisma db pull --force`** - will overwrite your schema.prisma!
- Create migration files manually in `/backend/prisma/migrations/`
- Use `prisma migrate deploy` to apply migrations
- Run `npx prisma generate` after schema changes
- To check database structure, use the existing schema.prisma file, not db pull

### Data Changes:
- Create migration scripts in `/backend/prisma/migrations/` for data modifications
- Use API endpoints for data updates in production
- NEVER modify data directly through database clients

### RLS Policy Changes:
- Edit appropriate files in `/backend/src/security/rules/tables/[table-name].sql`
- Apply changes using `yarn security:apply --force`

### Interactive Command Policy:
- If Prisma requires interactive input: ALWAYS ask user to execute manually
- Commands like `prisma migrate dev` require user intervention
- **NEVER use `prisma migrate reset`** - this DROPS the entire database and destroys all data!
- **NEVER use `prisma migrate reset --force`** - extremely dangerous, will destroy production data!
- Non-interactive commands like `prisma migrate deploy` can be automated
- If migration issues occur, use `prisma migrate resolve` to mark failed migrations as resolved

## Related Documentation
- **Full Database Details**: `/documentation/infrastructure/supabase-migration-guide.md`
- **Frontend Supabase Integration**: `/frontends/frontend-main/docs/SUPABASE_INTEGRATION.md`
- **AI-Assisted Database Development**: `/documentation/standards/supabase-ai-prompts-guide.md`
- **Prisma Migration Notes**: `/documentation/standards/prisma-migration-notes.md`