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

# Check if .env.staging file exists
if [ ! -f "$BACKEND_DIR/.env.staging" ]; then
    print_error ".env.staging file not found in $BACKEND_DIR!"
    print_error "Please create a .env.staging file with your staging database configuration"
    exit 1
fi

# Load staging environment variables from .env.staging
print_message "Loading staging environment variables from $BACKEND_DIR/.env.staging..."
if [ -f "$BACKEND_DIR/.env.staging" ]; then
    # Load staging DATABASE_URL
    STAGING_DATABASE_URL=$(grep -E "^DATABASE_URL=" "$BACKEND_DIR/.env.staging" | cut -d '=' -f2- | tr -d '"')
fi

# Check if STAGING_DATABASE_URL is set
if [ -z "$STAGING_DATABASE_URL" ]; then
    print_error "DATABASE_URL not found in .env.staging file!"
    exit 1
fi

# Parse STAGING_DATABASE_URL to get staging connection details
STAGING_DB_USER=$(echo $STAGING_DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
STAGING_DB_PASSWORD=$(echo $STAGING_DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
STAGING_DB_HOST_FROM_URL=$(echo $STAGING_DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
STAGING_DB_PORT=$(echo $STAGING_DATABASE_URL | sed -n 's/.*@[^:]*:\([^\/]*\)\/.*/\1/p')
STAGING_DB_NAME=$(echo $STAGING_DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Use staging server IP directly
STAGING_DB_HOST="${STAGING_DB_HOST:-157.230.246.107}"
if [ "$STAGING_DB_HOST_FROM_URL" != "localhost" ] && [ "$STAGING_DB_HOST_FROM_URL" != "127.0.0.1" ]; then
    STAGING_DB_HOST="$STAGING_DB_HOST_FROM_URL"
fi

# Print configuration
print_message "Staging Database Configuration:"
echo "  Host: $STAGING_DB_HOST"
echo "  Port: $STAGING_DB_PORT"
echo "  Database: $STAGING_DB_NAME"
echo "  User: $STAGING_DB_USER"
echo ""

# Test connection to staging database
print_message "Testing connection to staging database..."

# Try to connect and get basic info
PGPASSWORD=$STAGING_DB_PASSWORD psql -p $STAGING_DB_PORT -h $STAGING_DB_HOST -U $STAGING_DB_USER -d $STAGING_DB_NAME -c "\dt" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    print_success "Connection to staging database successful!"
    
    # Get database size
    print_message "Getting database information..."
    DB_SIZE=$(PGPASSWORD=$STAGING_DB_PASSWORD psql -p $STAGING_DB_PORT -h $STAGING_DB_HOST -U $STAGING_DB_USER -d $STAGING_DB_NAME -t -c "SELECT pg_size_pretty(pg_database_size('$STAGING_DB_NAME'));")
    echo "Database size: $DB_SIZE"
    
    # Get table count
    TABLE_COUNT=$(PGPASSWORD=$STAGING_DB_PASSWORD psql -p $STAGING_DB_PORT -h $STAGING_DB_HOST -U $STAGING_DB_USER -d $STAGING_DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")
    echo "Number of tables: $TABLE_COUNT"
    
    # Get some key table row counts
    print_message "Getting row counts for key tables..."
    
    # Account table
    ACCOUNT_COUNT=$(PGPASSWORD=$STAGING_DB_PASSWORD psql -p $STAGING_DB_PORT -h $STAGING_DB_HOST -U $STAGING_DB_USER -d $STAGING_DB_NAME -t -c "SELECT COUNT(*) FROM \"Account\";" 2>/dev/null || echo "0")
    echo "  Account records: $ACCOUNT_COUNT"
    
    # Role table
    ROLE_COUNT=$(PGPASSWORD=$STAGING_DB_PASSWORD psql -p $STAGING_DB_PORT -h $STAGING_DB_HOST -U $STAGING_DB_USER -d $STAGING_DB_NAME -t -c "SELECT COUNT(*) FROM \"Role\";" 2>/dev/null || echo "0")
    echo "  Role records: $ROLE_COUNT"
    
    # Check if backup directory exists
    BACKUP_DIR="$PROJECT_ROOT/backups"
    if [ -d "$BACKUP_DIR" ]; then
        print_message ""
        print_message "Existing backups in $BACKUP_DIR:"
        ls -lh "$BACKUP_DIR"/*.dump 2>/dev/null || echo "  No backup files found"
    fi
    
    print_success "Staging database verification completed!"
    echo ""
    echo "You can create a backup using: ./backup-staging.sh"
    
else
    print_error "Failed to connect to staging database!"
    print_error "Please check your credentials in .env.staging"
    exit 1
fi