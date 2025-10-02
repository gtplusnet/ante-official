#!/usr/bin/env bash

# Enable error handling
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print messages
print_message() {
    echo -e "${YELLOW}$1${NC}"
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

print_success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

# Usage function
usage() {
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Restore a database backup file to local development database"
    echo ""
    echo "Arguments:"
    echo "  backup_file    Path to the .dump backup file to restore"
    echo ""
    echo "Example:"
    echo "  $0 backups/staging_backup_20240315_143022.dump"
    echo ""
    exit 0
}

# Check arguments
if [ $# -eq 0 ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    usage
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

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

# Load environment variables from .env for local database
print_message "Loading local environment variables from $BACKEND_DIR/.env..."
if [ -f "$BACKEND_DIR/.env" ]; then
    export $(grep -v '^#' "$BACKEND_DIR/.env" | xargs)
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

# For Docker environment, replace container names with localhost
if [ "$LOCAL_DB_HOST" = "postgres" ]; then
    LOCAL_DB_HOST="localhost"
    LOCAL_DB_PORT="5432"
fi

# Print configuration
print_message "Restore Configuration:"
echo "Backup File: $BACKUP_FILE"
echo "Local Database:"
echo "  Host: $LOCAL_DB_HOST"
echo "  Port: $LOCAL_DB_PORT"
echo "  Database: $LOCAL_DB_NAME"
echo "  User: $LOCAL_DB_USER"
echo "  Schema: $LOCAL_DB_SCHEMA"
echo ""

# Ask for confirmation
print_message "WARNING: This will DROP and RECREATE your local database schema!"
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Restore cancelled by user"
    exit 1
fi

# Check for required PostgreSQL commands
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed or not in PATH"
        print_error "Please install PostgreSQL command line tools"
        exit 1
    fi
}

print_message "Checking required commands..."
check_command psql
check_command pg_restore

# Drop all tables in the local database
print_message "Dropping and recreating local database schema..."
PGPASSWORD=$LOCAL_DB_PASSWORD psql -p $LOCAL_DB_PORT -h $LOCAL_DB_HOST -U $LOCAL_DB_USER -d $LOCAL_DB_NAME -c "DROP SCHEMA $LOCAL_DB_SCHEMA CASCADE; CREATE SCHEMA $LOCAL_DB_SCHEMA;"

if [ $? -eq 0 ]; then
    print_success "Local database schema reset completed"
else
    print_error "Failed to reset local database schema"
    exit 1
fi

# Restore the backup to the local database
print_message "Restoring backup to local database..."
print_message "This may take a few minutes depending on backup size..."
PGPASSWORD=$LOCAL_DB_PASSWORD pg_restore -p $LOCAL_DB_PORT -h $LOCAL_DB_HOST -U $LOCAL_DB_USER -d $LOCAL_DB_NAME -v "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    print_success "Backup restored successfully"
else
    print_error "Failed to restore backup"
    exit 1
fi

# Run Prisma migrations
print_message "Running Prisma migrations to ensure schema is up to date..."
cd "$BACKEND_DIR" && npx prisma migrate deploy

if [ $? -eq 0 ]; then
    print_success "Prisma migrations completed successfully"
else
    print_error "Failed to run Prisma migrations"
    exit 1
fi

print_success "Database restore completed successfully!"
echo ""
echo "Your local database has been restored from: $BACKUP_FILE"