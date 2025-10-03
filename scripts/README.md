# Utility Scripts

This directory contains utility scripts for the ANTE ERP system.

## Available Scripts

### restore-backup.sh
Restores a database backup to your local development database.

**Usage:**
```bash
./scripts/restore-backup.sh <backup-file>
```

**Features:**
- Restores backup to local database
- Runs Prisma migrations after restore
- Validates backup file before restore

**Requirements:**
- PostgreSQL client tools installed (`pg_dump`, `pg_restore`, `psql`)
- `.env` file with local database configuration

### switch-env.sh
Switches between different environment configurations.

**Usage:**
```bash
./scripts/switch-env.sh <environment>
```

### update-cloudflare-ips.sh
Updates Cloudflare IP whitelist configuration.

**Usage:**
```bash
./scripts/update-cloudflare-ips.sh
```

### env-aliases.sh
Environment variable aliases and shortcuts.

**Usage:**
```bash
source ./scripts/env-aliases.sh
```

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

When running in Docker, scripts automatically detect and adjust connection settings:
- Container name `postgres` is replaced with `localhost`
- Default port 5432 is used for local connections

## Security Notes

⚠️ **IMPORTANT SECURITY CONSIDERATIONS:**

1. **Never commit .env files** - These files contain sensitive database credentials
2. **Handle database data with care** - Backups may contain sensitive user data
3. **Restrict access** - Only authorized personnel should have access to these scripts
4. **Backup files** - Store backup files securely and delete when no longer needed

## Troubleshooting

### "pg_dump: command not found"
Install PostgreSQL client tools (see installation section above)

### "Cannot connect to database"
- Check credentials in `.env` file
- Verify network connectivity to the database server
- Ensure database user has proper permissions

### "Failed to restore backup"
- Ensure local database exists
- Check that database user has CREATE SCHEMA permission
- Verify there's enough disk space for the restore

## Best Practices

1. **Regular Backups**: Schedule regular backups of important data
2. **Test Restores**: Periodically test restore process to ensure backups are valid
3. **Version Control**: Keep scripts in version control but never commit credentials
4. **Monitoring**: Monitor backup success/failure and alert on issues
5. **Retention Policy**: Define and implement backup retention policies
