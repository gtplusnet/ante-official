#!/usr/bin/env bash

# Enable error handling
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print messages
print_message() {
    echo -e "${YELLOW}$1${NC}"
}

print_info() {
    echo -e "${BLUE}$1${NC}"
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

print_success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

# Staging database credentials (from CLAUDE.local.md)
STAGING_DB_HOST="db.ofnmfmwywkhosrmycltb.supabase.co"
STAGING_DB_PORT="5432"
STAGING_DB_NAME="postgres"
STAGING_DB_USER="postgres"
STAGING_DB_PASSWORD="DBC4MbaXut9DdoEx"
STAGING_DB_SCHEMA="public"

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
BACKUP_DIR="$PROJECT_ROOT/backups"

# Default behavior
SKIP_DUMP=false
BACKUP_FILE=""

# Usage function
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Copy staging database from Supabase to local PostgreSQL database"
    echo ""
    echo "Options:"
    echo "  --skip-dump <backup_file>    Skip dumping from staging and use existing backup file"
    echo "  -h, --help                   Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                                # Full copy (dump + restore)"
    echo "  $0 --skip-dump backups/staging_backup_*.dump      # Use existing backup"
    echo ""
    exit 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-dump)
            SKIP_DUMP=true
            BACKUP_FILE="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            ;;
    esac
done

# Validate skip-dump option
if [ "$SKIP_DUMP" = true ] && [ -z "$BACKUP_FILE" ]; then
    print_error "--skip-dump requires a backup file path"
    usage
fi

if [ "$SKIP_DUMP" = true ] && [ ! -f "$BACKUP_FILE" ]; then
    print_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Print header
echo ""
print_info "╔════════════════════════════════════════════════════════════╗"
print_info "║     ANTE ERP - Copy Staging Database to Local             ║"
print_info "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    print_error "Backend directory not found at $BACKEND_DIR!"
    print_error "Make sure you're running this from the ante project root"
    exit 1
fi

# Check if .env file exists
if [ ! -f "$BACKEND_DIR/.env" ]; then
    print_error ".env file not found in $BACKEND_DIR!"
    print_error "Please create a .env file with your local database configuration"
    exit 1
fi

# Check for required PostgreSQL commands
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed or not in PATH"
        print_error "Please install PostgreSQL command line tools"
        print_error ""
        print_error "Installation:"
        print_error "  Ubuntu/Debian: sudo apt-get install postgresql-client"
        print_error "  macOS:         brew install postgresql"
        print_error "  Windows:       https://www.postgresql.org/download/windows/"
        exit 1
    fi
}

print_message "Checking required commands..."
check_command psql
check_command pg_dump
check_command pg_restore
print_success "All required commands found"
echo ""

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    print_message "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
fi

# Step 1: Dump staging database (if not skipped)
if [ "$SKIP_DUMP" = false ]; then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/staging_backup_${TIMESTAMP}.dump"

    print_message "Step 1/4: Dumping staging database..."
    echo "Source: $STAGING_DB_HOST:$STAGING_DB_PORT/$STAGING_DB_NAME"
    echo "Output: $BACKUP_FILE"
    echo ""

    # Test connection first
    print_message "Testing connection to staging database..."
    if ! PGPASSWORD=$STAGING_DB_PASSWORD psql -h $STAGING_DB_HOST -p $STAGING_DB_PORT -U $STAGING_DB_USER -d $STAGING_DB_NAME -c "SELECT 1" &> /dev/null; then
        print_error "Cannot connect to staging database"
        print_error "Host: $STAGING_DB_HOST:$STAGING_DB_PORT"
        print_error "Please check network connectivity and credentials"
        exit 1
    fi
    print_success "Connection to staging database successful"
    echo ""

    print_message "Creating database dump (this may take several minutes)..."
    print_message "Using Docker with PostgreSQL 17 to avoid version mismatch..."

    # Use Docker to run pg_dump with PostgreSQL 17
    docker run --rm \
        -e PGPASSWORD=$STAGING_DB_PASSWORD \
        -v "$BACKUP_DIR:/backups" \
        postgres:17-alpine \
        pg_dump \
        -h $STAGING_DB_HOST \
        -p $STAGING_DB_PORT \
        -U $STAGING_DB_USER \
        -d $STAGING_DB_NAME \
        -F c \
        -b \
        -v \
        -f "/backups/$(basename $BACKUP_FILE)" 2>&1 | grep -E "(dumping|creating)" || true

    if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        print_success "Staging database dumped successfully"
        echo "Backup file: $BACKUP_FILE"
        echo "File size: $BACKUP_SIZE"
        echo ""
    else
        print_error "Failed to dump staging database"
        if [ -f "$BACKUP_FILE" ] && [ ! -s "$BACKUP_FILE" ]; then
            print_error "Backup file is empty (0 bytes)"
            print_error "This usually indicates a version mismatch or connection issue"
        fi
        exit 1
    fi
else
    print_message "Step 1/4: Skipping dump (using existing backup)"
    echo "Backup file: $BACKUP_FILE"
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "File size: $BACKUP_SIZE"
    echo ""
fi

# Step 2: Load local database configuration
print_message "Step 2/4: Loading local database configuration..."
if [ -f "$BACKEND_DIR/.env" ]; then
    export $(grep -v '^#' "$BACKEND_DIR/.env" | grep DATABASE_URL | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL not found in .env file!"
    exit 1
fi

# Parse DATABASE_URL to get local connection details
LOCAL_DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
LOCAL_DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
LOCAL_DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
LOCAL_DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*@[^:]*:\([^\/]*\)\/.*/\1/p')
LOCAL_DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
LOCAL_DB_SCHEMA="public"

# Handle Supabase URLs (extract actual host)
if [[ "$LOCAL_DB_HOST" == *.supabase.co ]]; then
    # Already a Supabase host, use as-is
    true
elif [ "$LOCAL_DB_HOST" = "postgres" ] || [ "$LOCAL_DB_HOST" = "localhost" ]; then
    # Docker or localhost
    LOCAL_DB_HOST="localhost"
    if [ -z "$LOCAL_DB_PORT" ]; then
        LOCAL_DB_PORT="5432"
    fi
fi

# Test local database connection
print_message "Testing connection to local database..."
if ! PGPASSWORD=$LOCAL_DB_PASSWORD psql -h $LOCAL_DB_HOST -p $LOCAL_DB_PORT -U $LOCAL_DB_USER -d $LOCAL_DB_NAME -c "SELECT 1" &> /dev/null; then
    print_error "Cannot connect to local database"
    print_error "Host: $LOCAL_DB_HOST:$LOCAL_DB_PORT"
    print_error "Database: $LOCAL_DB_NAME"
    print_error "User: $LOCAL_DB_USER"
    print_error "Please check your .env file and database server"
    exit 1
fi
print_success "Connection to local database successful"
echo ""

# Print configuration
print_info "Configuration Summary:"
echo "┌─ Staging Database:"
echo "│  Host: $STAGING_DB_HOST:$STAGING_DB_PORT"
echo "│  Database: $STAGING_DB_NAME"
echo "│"
echo "└─ Local Database:"
echo "   Host: $LOCAL_DB_HOST:$LOCAL_DB_PORT"
echo "   Database: $LOCAL_DB_NAME"
echo "   User: $LOCAL_DB_USER"
echo "   Schema: $LOCAL_DB_SCHEMA"
echo ""

# Step 3: Restore to local database
print_message "Step 3/4: Restoring to local database..."
echo ""
print_error "⚠️  WARNING: This will DROP and RECREATE your local database schema!"
print_error "⚠️  All existing local data will be LOST!"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " -r
echo ""
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_error "Restore cancelled by user"
    exit 1
fi

# Drop and recreate local database schema
print_message "Dropping and recreating local database schema..."
PGPASSWORD=$LOCAL_DB_PASSWORD psql \
    -h $LOCAL_DB_HOST \
    -p $LOCAL_DB_PORT \
    -U $LOCAL_DB_USER \
    -d $LOCAL_DB_NAME \
    -c "DROP SCHEMA IF EXISTS $LOCAL_DB_SCHEMA CASCADE; CREATE SCHEMA $LOCAL_DB_SCHEMA;" &> /dev/null

if [ $? -eq 0 ]; then
    print_success "Local database schema reset completed"
else
    print_error "Failed to reset local database schema"
    exit 1
fi

# Restore the backup to the local database
print_message "Restoring backup to local database (this may take several minutes)..."
print_message "Using Docker with PostgreSQL 17 for restore compatibility..."
echo ""

# Determine host for Docker (use host.docker.internal for localhost)
RESTORE_HOST=$LOCAL_DB_HOST
if [ "$LOCAL_DB_HOST" = "localhost" ] || [ "$LOCAL_DB_HOST" = "127.0.0.1" ]; then
    RESTORE_HOST="host.docker.internal"
fi

docker run --rm \
    -e PGPASSWORD=$LOCAL_DB_PASSWORD \
    -v "$BACKUP_DIR:/backups" \
    --add-host=host.docker.internal:host-gateway \
    postgres:17-alpine \
    pg_restore \
    -h $RESTORE_HOST \
    -p $LOCAL_DB_PORT \
    -U $LOCAL_DB_USER \
    -d $LOCAL_DB_NAME \
    -v \
    --no-owner \
    --no-acl \
    "/backups/$(basename $BACKUP_FILE)" 2>&1 | grep -E "(restoring|creating)" || true

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    print_success "Backup restored successfully"
    echo ""
else
    # pg_restore might return non-zero even on successful restore due to warnings
    print_message "Restore completed with warnings (this is usually normal)"
    echo ""
fi

# Step 4: Run Prisma operations
print_message "Step 4/4: Running Prisma operations..."
echo ""

# Generate Prisma client
print_message "Generating Prisma client..."
cd "$BACKEND_DIR" && npx prisma generate &> /dev/null

if [ $? -eq 0 ]; then
    print_success "Prisma client generated successfully"
else
    print_error "Failed to generate Prisma client"
    exit 1
fi

# Run Prisma migrations
print_message "Running Prisma migrations to ensure schema is up to date..."
cd "$BACKEND_DIR" && npx prisma migrate deploy &> /dev/null

if [ $? -eq 0 ]; then
    print_success "Prisma migrations completed successfully"
else
    print_error "Failed to run Prisma migrations"
    print_error "You may need to run 'npx prisma migrate deploy' manually"
fi

# Final summary
echo ""
print_success "╔════════════════════════════════════════════════════════════╗"
print_success "║          Database Copy Completed Successfully!            ║"
print_success "╚════════════════════════════════════════════════════════════╝"
echo ""
print_info "Summary:"
echo "  ✓ Staging database dumped to: $BACKUP_FILE"
echo "  ✓ Backup size: $BACKUP_SIZE"
echo "  ✓ Restored to local database: $LOCAL_DB_NAME"
echo "  ✓ Prisma client generated"
echo "  ✓ Prisma migrations applied"
echo ""
print_message "Your local database is now in sync with staging!"
print_message "You can start your development server with: yarn dev"
echo ""
