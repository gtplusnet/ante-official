#!/usr/bin/env bash

# Enable error handling
set -e

# Check for --no-confirm flag
NO_CONFIRM=false
if [[ "$1" == "--no-confirm" || "$1" == "-y" ]]; then
    NO_CONFIRM=true
fi

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

# Check for required PostgreSQL commands
check_command() {
    # First try the command directly
    if command -v $1 &> /dev/null; then
        return 0
    fi
    
    # If not found, try common PostgreSQL binary locations
    if [ -x "/usr/bin/$1" ]; then
        # Add /usr/bin to PATH if not already there
        if [[ ":$PATH:" != *":/usr/bin:"* ]]; then
            export PATH="/usr/bin:$PATH"
        fi
        return 0
    fi
    
    if [ -x "/usr/lib/postgresql/16/bin/$1" ]; then
        # Add PostgreSQL bin to PATH if not already there
        if [[ ":$PATH:" != *":/usr/lib/postgresql/16/bin:"* ]]; then
            export PATH="/usr/lib/postgresql/16/bin:$PATH"
        fi
        return 0
    fi
    
    print_error "$1 is not installed or not in PATH"
    print_error "Please install PostgreSQL command line tools:"
    print_error "  - For macOS: brew install postgresql"
    print_error "  - For Ubuntu/Debian: sudo apt-get install postgresql-client"
    print_error "  - For Windows: Install PostgreSQL from https://www.postgresql.org/download/windows/"
    exit 1
}

# Check required commands
print_message "Checking required commands..."
check_command pg_dump
check_command pg_restore
check_command psql

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

# Create .env.staging if it doesn't exist
if [ ! -f "$BACKEND_DIR/.env.staging" ]; then
    print_message "Creating .env.staging file..."
    cat > "$BACKEND_DIR/.env.staging" << 'EOF'
# Staging Database Configuration
DATABASE_URL="postgresql://postgres:0000@157.230.246.107:5432/ante?schema=public"

# Staging Server Configuration
SERVER_NAME="STAGING"
TELEGRAM_DEBUG=false
PORT=3000
SOCKET_PORT=4000

# Add other staging environment variables as needed
EOF
    print_success ".env.staging created. Please update it with the correct staging credentials."
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
STAGING_DB_SCHEMA="public"

# Use staging server IP directly
STAGING_DB_HOST="${STAGING_DB_HOST:-157.230.246.107}"
if [ "$STAGING_DB_HOST_FROM_URL" != "localhost" ] && [ "$STAGING_DB_HOST_FROM_URL" != "127.0.0.1" ]; then
    STAGING_DB_HOST="$STAGING_DB_HOST_FROM_URL"
fi

# Print configuration
print_message "Configuration:"
echo "Local Database:"
echo "  Host: $LOCAL_DB_HOST"
echo "  Port: $LOCAL_DB_PORT"
echo "  Database: $LOCAL_DB_NAME"
echo "  User: $LOCAL_DB_USER"
echo "  Schema: $LOCAL_DB_SCHEMA"
echo ""
echo "Staging Database:"
echo "  Host: $STAGING_DB_HOST"
echo "  Port: $STAGING_DB_PORT"
echo "  Database: $STAGING_DB_NAME"
echo "  User: $STAGING_DB_USER"
echo "  Schema: $STAGING_DB_SCHEMA"

# Ask for confirmation
if [ "$NO_CONFIRM" = false ]; then
    read -p "Do you want to proceed with the backup from staging? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Backup cancelled by user"
        exit 1
    fi
else
    print_message "Running in no-confirm mode, proceeding with backup..."
fi

# Create backup directory if it doesn't exist
BACKUP_DIR="$PROJECT_ROOT/backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp for backup file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/staging_backup_${TIMESTAMP}.dump"

# Backup the staging database
print_message "Creating backup of staging database..."
print_message "This may take a few minutes depending on database size..."
PGPASSWORD=$STAGING_DB_PASSWORD pg_dump -p $STAGING_DB_PORT -h $STAGING_DB_HOST -U $STAGING_DB_USER -d $STAGING_DB_NAME -F c -b -v -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    print_success "Staging database backup completed successfully"
    print_success "Backup saved to: $BACKUP_FILE"
else
    print_error "Failed to backup staging database"
    exit 1
fi

# Ask for confirmation before modifying local database
if [ "$NO_CONFIRM" = false ]; then
    print_message "WARNING: This will replace your local database with staging data!"
    read -p "Do you want to drop and recreate the local database? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_message "Keeping backup file at: $BACKUP_FILE"
        print_message "You can restore it manually later with:"
        echo "PGPASSWORD=$LOCAL_DB_PASSWORD pg_restore -p $LOCAL_DB_PORT -h $LOCAL_DB_HOST -U $LOCAL_DB_USER -d $LOCAL_DB_NAME -v $BACKUP_FILE"
        exit 0
    fi
else
    print_message "WARNING: Replacing local database with staging data (no-confirm mode)"
fi

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

print_success "Backup and restore process completed successfully!"
print_message "Your local database now contains a copy of the staging database"