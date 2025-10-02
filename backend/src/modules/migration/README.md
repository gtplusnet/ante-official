# System Migration Module

## Overview

The System Migration Module provides a robust, production-ready system for managing one-time data migrations in the ANTE ERP backend. It ensures migrations run only once per environment, supports dry-run testing, provides verification steps, and maintains comprehensive logs.

## Features

- **One-time execution**: Migrations are tracked in the database and run only once
- **Environment-aware**: Separate tracking for development, staging, and production
- **Dry-run mode**: Test migrations without making changes
- **Verification**: Built-in verification to confirm migration success
- **Rollback support**: Optional rollback capability for reversible migrations
- **CLI commands**: Full CLI interface for migration management
- **API endpoints**: REST API for developer access
- **Batch processing**: Efficient processing of large datasets
- **Comprehensive logging**: Detailed logs of all migration operations
- **Startup integration**: Optional automatic migration on container startup

## Password Migration (001-password-bcrypt)

The first implemented migration addresses a critical security issue by migrating passwords from reversible AES-256-CTR encryption to irreversible bcrypt hashing.

### Migration Details

- **Name**: 001-password-bcrypt
- **Version**: 1.0.0
- **Rollbackable**: No (hashing is irreversible)
- **Description**: Migrates passwords from AES-256-CTR encryption to bcrypt hashing

### What It Does

1. Adds a `passwordHash` column to the Account table
2. Decrypts existing passwords using the legacy encryption
3. Hashes passwords with bcrypt (saltRounds: 10)
4. Stores hashed passwords in the new `passwordHash` field
5. Authentication supports both methods during transition
6. Legacy passwords are automatically migrated on successful login

## CLI Commands

### Run All Pending Migrations
```bash
npm run migration:run
# or with options
npm run migration:run -- --dry-run --verbose
```

### Run Specific Migration
```bash
npm run migration:run:one 001-password-bcrypt
# or with options
npm run migration:run:one 001-password-bcrypt -- --dry-run --verbose
```

### Check Migration Status
```bash
npm run migration:status
```

### List All Migrations
```bash
npm run migration:list
```

### Verify Migrations
```bash
npm run migration:verify
# or verify specific migration
npm run migration:verify 001-password-bcrypt
```

### Dry Run (Test Mode)
```bash
npm run migration:dry-run
```

### Rollback Migration (if supported)
```bash
npm run migration:rollback [migration-name]
```

## API Endpoints

All endpoints require developer access (`isDeveloper: true`).

### GET /migration/status
Returns the current status of all migrations.

### GET /migration/list
Lists all available migrations.

### GET /migration/pending
Lists pending migrations that haven't been executed.

### POST /migration/run
Runs all pending migrations.

Query parameters:
- `dryRun` (boolean): Run in test mode
- `verbose` (boolean): Enable verbose logging

### POST /migration/run/:name
Runs a specific migration.

### POST /migration/verify/:name
Verifies a specific migration.

### POST /migration/rollback/:name
Rolls back a migration (if rollbackable).

## Environment Variables

```env
# Enable migration check on startup (default: false)
RUN_MIGRATIONS_ON_STARTUP=false

# Automatically run pending migrations on startup (default: false)
AUTO_MIGRATE=false

# Required for password migration
ENCRYPTION_KEY=your-encryption-key
```

## Docker Integration

### Dockerfile Entry
```dockerfile
# Optional: Run migrations on container startup
ENV RUN_MIGRATIONS_ON_STARTUP=true
ENV AUTO_MIGRATE=false
```

### Docker Compose
```yaml
services:
  backend:
    environment:
      - RUN_MIGRATIONS_ON_STARTUP=true
      - AUTO_MIGRATE=false
```

## PM2 Integration

### ecosystem.config.js
```javascript
module.exports = {
  apps: [{
    name: 'ante-backend',
    script: './dist/main.js',
    env: {
      RUN_MIGRATIONS_ON_STARTUP: 'true',
      AUTO_MIGRATE: 'false'
    },
    // Run migrations before starting
    pre_deploy: 'npm run migration:run'
  }]
};
```

## GitHub Actions Integration

### .github/workflows/deploy.yml
```yaml
- name: Run migrations
  run: |
    docker exec ante-backend npm run migration:status
    docker exec ante-backend npm run migration:run
    docker exec ante-backend npm run migration:verify
```

## Creating New Migrations

### 1. Create Migration Class

Create a new file in `/src/modules/migration/migrations/`:

```typescript
import { Migration, MigrationContext, MigrationResult } from '../interfaces/migration.interface';

export class YourMigration extends Migration {
  name = '002-your-migration-name';
  version = '1.0.0';
  description = 'Description of what this migration does';
  rollbackable = false; // Set to true if reversible

  async up(context: MigrationContext): Promise<MigrationResult> {
    try {
      // Your migration logic here
      
      return {
        success: true,
        recordsProcessed: 0,
        metadata: {}
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verify(): Promise<boolean> {
    // Verification logic
    return true;
  }

  // Optional: Only if rollbackable = true
  async down(context: MigrationContext): Promise<MigrationRollbackResult> {
    // Rollback logic
  }
}
```

### 2. Register Migration

Add to `/src/modules/migration/migration/migration-registry.service.ts`:

```typescript
import { YourMigration } from '../migrations/002-your-migration.migration';

async registerMigrations() {
  const migrations: Migration[] = [
    new PasswordBcryptMigration(),
    new YourMigration(), // Add here
  ];
  // ...
}
```

## Best Practices

### 1. Always Test with Dry Run
```bash
npm run migration:dry-run -- --verbose
```

### 2. Backup Before Migration
```bash
# Create database backup
pg_dump ante_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migration
npm run migration:run

# Verify
npm run migration:verify
```

### 3. Monitor Logs
```bash
# Watch logs during migration
docker logs -f ante-backend
```

### 4. Staged Deployment
1. Test on development
2. Deploy to staging and verify
3. Deploy to production with monitoring

## Troubleshooting

### Migration Failed

1. Check logs for error details
2. Fix the issue in the migration code
3. Reset migration status if needed (manually in database)
4. Re-run the migration

### Verification Failed

1. Check what data wasn't migrated correctly
2. Run migration again for missed records
3. Update verification logic if needed

### Performance Issues

1. Adjust batch size: `--batch-size 50`
2. Run during low-traffic periods
3. Consider splitting large migrations

## Security Considerations

1. **Developer-only access**: API endpoints require `isDeveloper: true`
2. **Environment isolation**: Migrations tracked per environment
3. **No automatic production runs**: `AUTO_MIGRATE` should be false in production
4. **Audit trail**: All migrations logged with executor and timestamp
5. **Verification step**: Ensures data integrity after migration

## Migration Status Flow

```
PENDING → RUNNING → COMPLETED
           ↓          ↓
         FAILED    ROLLED_BACK
           ↓
        SKIPPED
```

## Support

For issues or questions about migrations:
1. Check the migration logs
2. Verify database connectivity
3. Ensure proper environment variables
4. Contact the development team with error details