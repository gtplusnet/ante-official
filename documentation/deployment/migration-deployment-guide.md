# Migration Deployment Guide

## ⚠️ CRITICAL: Shared Database Warning
**Local Development and Staging environments share the same Supabase database!**
- Database: `ofnmfmwywkhosrmycltb.supabase.co` (Ante Staging project)
- Any migrations or data changes in local affect staging immediately
- Production uses a separate database: `ccdlrujemqfwclogysjv.supabase.co`

## Overview
This guide explains how data migrations are handled during deployment to staging and production environments.

## Migration System Architecture

### Two Types of Migrations
1. **Schema Migrations** (Prisma) - Database structure changes
   - Handled by `npx prisma migrate deploy`
   - Run automatically during deployment
   - Located in `/backend/prisma/migrations/`

2. **Data Migrations** (System Migrations) - Data transformation
   - Handled by our custom migration system
   - Run automatically after backend starts
   - Located in `/backend/src/modules/migration/migrations/`

## Automatic Migration Process

### During Deployment
When you run `./deploy/deploy-staging.sh`, the following happens:

1. **Docker Image Build & Push**
2. **Prisma Schema Migrations** (automatic)
3. **Backend Restart**
4. **System Data Migrations** (automatic via `run-migrations.sh`)

### Migration Runner Script
The `deploy/run-migrations.sh` script:
- Waits for backend to be healthy
- Checks for pending migrations
- Runs all pending migrations in order
- Reports success/failure status
- Doesn't fail deployment on migration errors (logs warning instead)

## Manual Migration Commands

### Check Migration Status
```bash
# Local
curl -X GET "http://localhost:3000/migration/status" \
  -H "developer-key: M7UTdtxpG7gdUfH" | jq

# Staging (from server)
curl -X GET "http://localhost:3000/migration/status" \
  -H "developer-key: M7UTdtxpG7gdUfH" | jq
```

### Run Migrations Manually
```bash
# Dry run (see what would happen)
curl -X POST "http://localhost:3000/migration/run?dryRun=true" \
  -H "developer-key: M7UTdtxpG7gdUfH" | jq

# Actual run
curl -X POST "http://localhost:3000/migration/run" \
  -H "developer-key: M7UTdtxpG7gdUfH" | jq
```

### Run Specific Migration
```bash
curl -X POST "http://localhost:3000/migration/run/001-password-bcrypt" \
  -H "developer-key: M7UTdtxpG7gdUfH" | jq
```

## Creating New Migrations

### 1. Create Migration File
```typescript
// backend/src/modules/migration/migrations/002-example.migration.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { 
  MigrationInterface, 
  MigrationContext, 
  MigrationResult 
} from '../migration.interface';

@Injectable()
export class ExampleMigration implements MigrationInterface {
  name = '002-example';
  version = '1.0.0';
  description = 'Example migration description';
  rollbackable = false;

  private readonly logger = new Logger(ExampleMigration.name);

  constructor(private readonly prisma: PrismaService) {}

  async up(context: MigrationContext): Promise<MigrationResult> {
    try {
      if (context.dryRun) {
        this.logger.log('DRY RUN - Would perform migration');
        return {
          success: true,
          recordsProcessed: 0,
          metadata: { dryRun: true }
        };
      }

      // Your migration logic here
      
      return {
        success: true,
        recordsProcessed: 10,
        metadata: { /* any data */ }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        recordsProcessed: 0
      };
    }
  }

  async verify?(): Promise<boolean> {
    // Optional: Verify migration was successful
    return true;
  }

  async down?(): Promise<void> {
    // Optional: Rollback logic
  }
}
```

### 2. Register Migration
```typescript
// backend/src/modules/migration/migration/migration-registry.service.ts
import { ExampleMigration } from '../migrations/002-example.migration';

@Injectable()
export class MigrationRegistry {
  constructor(
    private readonly passwordBcryptMigration: PasswordBcryptMigration,
    private readonly exampleMigration: ExampleMigration, // Add here
  ) {}

  onModuleInit() {
    this.migrations.set(this.passwordBcryptMigration.name, this.passwordBcryptMigration);
    this.migrations.set(this.exampleMigration.name, this.exampleMigration); // Add here
  }
}
```

### 3. Add to Module Providers
```typescript
// backend/src/modules/migration/migration.module.ts
import { ExampleMigration } from './migrations/002-example.migration';

@Module({
  providers: [
    // ...
    PasswordBcryptMigration,
    ExampleMigration, // Add here
    // ...
  ],
})
```

## Deployment Workflow

### Staging Deployment
```bash
# ⚠️ WARNING: Migrations affect BOTH local and staging (shared database)!

# 1. Test migration locally first (dry run)
curl -X POST "http://localhost:3000/migration/run?dryRun=true" \
  -H "developer-key: M7UTdtxpG7gdUfH" | jq

# 2. Commit and push changes
git add .
git commit -m "Add new migration: 002-example"
git push origin main

# 3. Deploy to staging
./deploy/deploy-staging.sh

# Migration runs automatically!
# Check logs to verify:
ssh jdev@157.230.246.107
docker logs ante-backend-staging --tail 100 | grep -i migration

# Note: Migration may already be completed if run locally first
```

### Production Deployment
```bash
# 1. Test on staging first!

# 2. Create release on GitHub
# This triggers automatic deployment

# 3. Migrations run automatically after deployment

# 4. Monitor production
ssh jdev@178.128.49.38
docker logs ante-backend --tail 100 | grep -i migration
```

## Migration Status

### Migration States
- **PENDING** - Not yet run
- **RUNNING** - Currently executing
- **COMPLETED** - Successfully completed
- **FAILED** - Failed execution
- **SKIPPED** - Manually skipped

### Handling Failed Migrations
If a migration fails:

1. **Check logs** for error details
2. **Fix the issue** in the migration code
3. **Reset migration** (if safe):
   ```sql
   DELETE FROM "SystemMigration" WHERE name = 'migration-name';
   ```
4. **Re-run** the migration

## Environment Variables

### Required for Migrations
```bash
# In backend .env
DEVELOPER_KEY=M7UTdtxpG7gdUfH

# Optional - to auto-run on startup
RUN_MIGRATIONS_ON_STARTUP=false  # Set to true to enable
AUTO_MIGRATE=false               # Set to true to auto-execute
```

## Security Considerations

1. **Developer Key** - Required for all migration endpoints
2. **No Auto-Run in Production** - Migrations require explicit execution
3. **Backup Before Migration** - Always backup database before major migrations
4. **Test on Staging** - All migrations must pass staging before production

## Troubleshooting

### Migration Won't Run
- Check if already marked as COMPLETED/FAILED in database
- Verify developer key is correct
- Ensure backend is healthy

### Migration Keeps Failing
- Check for data inconsistencies
- Review migration logs for specific errors
- Consider partial success handling

### Rollback Needed
- Use migration's `down()` method if implemented
- Otherwise, restore from backup
- Update SystemMigration status manually

## Example: Password Migration

The `001-password-bcrypt` migration demonstrates:
- Checking for column existence
- Batch processing
- Error handling for partial success
- Dry-run support
- Verification step

```typescript
// Key features:
- Migrates passwords from encryption to bcrypt hashing
- Handles both Account and Guardian tables
- Processes in batches to avoid memory issues
- Continues on individual record failures
- Reports success/failure counts
```

## Best Practices

1. **Always include dry-run support**
2. **Process in batches for large datasets**
3. **Handle partial success gracefully**
4. **Include verification step**
5. **Log detailed progress**
6. **Test locally first** (but remember it affects staging!)
7. **Use test prefixes** for test data in shared database
8. **Coordinate with team** when running migrations (shared database)
9. **Test on staging before production**
10. **Keep migrations idempotent** (safe to run multiple times)
11. **Consider database separation** for safer development

## CLI Commands Reference

```bash
# Local development
npm run migration:status         # Check status
npm run migration:list           # List all migrations
npm run migration:dry-run        # Test without changes
npm run migration:run            # Run all pending
npm run migration:run:one        # Run specific migration

# On server (via runner script)
./deploy/run-migrations.sh --dry-run
./deploy/run-migrations.sh --backend-url http://localhost:3000
./deploy/run-migrations.sh --developer-key YOUR_KEY
```