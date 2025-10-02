# Database Backup Scripts

This directory contains scripts for backing up and restoring databases from staging and production environments.

## Available Scripts

### backup-staging.sh
Backs up the staging database and optionally restores it to your local development database.

**Usage:**
```bash
./scripts/backup-staging.sh
```

**Features:**
- Creates a timestamped backup of the staging database
- Optionally drops and recreates local database schema
- Restores backup to local database
- Runs Prisma migrations after restore
- Saves backup files in `/backups` directory

**Requirements:**
- PostgreSQL client tools installed (`pg_dump`, `pg_restore`, `psql`)
- `.env` file with local database configuration
- `.env.staging` file with staging database credentials

### backup-production.sh
Backs up the production database via SSH and optionally restores it to your local development database.

**Usage:**
```bash
./scripts/backup-production.sh [OPTIONS]

Options:
  --no-confirmation    Skip all confirmation prompts
  --help              Show help message
```

**Features:**
- Connects to production server via SSH
- Creates backup on production server
- Transfers backup to local machine
- Optionally drops and recreates local database schema
- Restores backup to local database
- Runs Prisma migrations after restore
- Saves backup files in `/backups` directory

**Requirements:**
- SSH access to production server (jdev@178.128.49.38)
- PostgreSQL client tools installed
- `.env` file with local database configuration
- `.env.production` file with production database credentials

### verify-staging-backup.sh
Verifies connection to the staging database and displays database information.

**Usage:**
```bash
./scripts/verify-staging-backup.sh
```

**Features:**
- Tests connection to staging database
- Shows database size and table count
- Displays row counts for key tables
- Lists existing backup files

## Environment Files

### .env.staging
Required for staging database connection. Create in `/backend/.env.staging`:

```env
# Staging Database Configuration
DATABASE_URL="postgresql://username:password@157.230.246.107:5432/ante?schema=public"

# Staging Server Configuration
SERVER_NAME="STAGING"
TELEGRAM_DEBUG=false
PORT=3000
SOCKET_PORT=4000
```

### .env.production
Required for production database connection. Create in `/backend/.env.production`:

```env
# Production Database Configuration
DATABASE_URL="postgresql://username:password@178.128.49.38:5432/ante?schema=public"

# Production Server Configuration
SERVER_NAME="PRODUCTION"
TELEGRAM_DEBUG=false
PORT=3000
SOCKET_PORT=4000
```

## Security Notes

⚠️ **IMPORTANT SECURITY CONSIDERATIONS:**

1. **Never commit .env files** - These files contain sensitive database credentials
2. **Handle production data with care** - Production backups contain real user data
3. **Restrict access** - Only authorized personnel should have access to these scripts
4. **Use SSH keys** - Set up SSH key authentication for production server access
5. **Backup files** - Store backup files securely and delete when no longer needed

## PostgreSQL Installation

If PostgreSQL client tools are not installed:

**macOS:**
```bash
brew install postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-client
```

**Windows:**
Download and install from https://www.postgresql.org/download/windows/

## Docker Environment

When running in Docker, the scripts automatically detect and adjust connection settings:
- Container name `postgres` is replaced with `localhost`
- Default port 5432 is used for local connections

## Troubleshooting

### "pg_dump: command not found"
Install PostgreSQL client tools (see installation section above)

### "Cannot connect to staging/production database"
- Check credentials in `.env.staging` or `.env.production`
- Verify network connectivity to the server
- Ensure database user has proper permissions

### "SSH connection failed"
- Verify SSH access: `ssh jdev@178.128.49.38`
- Check SSH key is properly configured
- Ensure you have the correct permissions

### "Failed to restore backup"
- Ensure local database exists
- Check that database user has CREATE SCHEMA permission
- Verify there's enough disk space for the restore

## Best Practices

1. **Regular Backups**: Schedule regular backups of production data
2. **Test Restores**: Periodically test restore process to ensure backups are valid
3. **Version Control**: Keep scripts in version control but never commit credentials
4. **Monitoring**: Monitor backup success/failure and alert on issues
5. **Retention Policy**: Define and implement backup retention policies