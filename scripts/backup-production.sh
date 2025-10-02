#!/usr/bin/env bash

# Enable error handling
set -e

# Usage function
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Copy production database to local development environment"
    echo ""
    echo "Options:"
    echo "  --no-confirmation    Skip all confirmation prompts"
    echo "  --help              Show this help message"
    echo ""
    exit 0
}

# Parse command line arguments
NO_CONFIRMATION=false
for arg in "$@"; do
    case $arg in
        --no-confirmation)
            NO_CONFIRMATION=true
            shift
            ;;
        --help|-h)
            usage
            ;;
        *)
            # Unknown option
            ;;
    esac
done

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

# Create .env.production if it doesn't exist
if [ ! -f "$BACKEND_DIR/.env.production" ]; then
    print_message "Creating .env.production file..."
    cat > "$BACKEND_DIR/.env.production" << 'EOF'
# Production Database Configuration
DATABASE_URL="postgresql://postgres:your_production_password@178.128.49.38:5432/ante?schema=public"

# Production Server Configuration
SERVER_NAME="PRODUCTION"
TELEGRAM_DEBUG=false
PORT=3000
SOCKET_PORT=4000

# Add other production environment variables as needed
EOF
    print_success ".env.production created. Please update it with the correct production credentials."
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

# Load production environment variables from .env.production
print_message "Loading production environment variables from $BACKEND_DIR/.env.production..."
if [ -f "$BACKEND_DIR/.env.production" ]; then
    # Load production DATABASE_URL
    PRODUCTION_DATABASE_URL=$(grep -E "^DATABASE_URL=" "$BACKEND_DIR/.env.production" | cut -d '=' -f2- | tr -d '"')
fi

# Check if PRODUCTION_DATABASE_URL is set
if [ -z "$PRODUCTION_DATABASE_URL" ]; then
    print_error "DATABASE_URL not found in .env.production file!"
    exit 1
fi

# Parse PRODUCTION_DATABASE_URL to get production connection details
PRODUCTION_DB_USER=$(echo $PRODUCTION_DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
PRODUCTION_DB_PASSWORD=$(echo $PRODUCTION_DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
PRODUCTION_DB_HOST=$(echo $PRODUCTION_DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
PRODUCTION_DB_PORT=$(echo $PRODUCTION_DATABASE_URL | sed -n 's/.*@[^:]*:\([^\/]*\)\/.*/\1/p')
PRODUCTION_DB_NAME=$(echo $PRODUCTION_DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
PRODUCTION_DB_SCHEMA="public"

# Production server SSH details
PRODUCTION_SSH="jdev@178.128.49.38"
PRODUCTION_DIR="/var/www/ante/backend"

# Print configuration
print_message "Configuration:"
echo "Local Database:"
echo "  Host: $LOCAL_DB_HOST"
echo "  Port: $LOCAL_DB_PORT"
echo "  Database: $LOCAL_DB_NAME"
echo "  User: $LOCAL_DB_USER"
echo "  Schema: $LOCAL_DB_SCHEMA"
echo ""
echo "Production Database (via SSH):"
echo "  SSH: $PRODUCTION_SSH"
echo "  Host: $PRODUCTION_DB_HOST (on production server)"
echo "  Port: $PRODUCTION_DB_PORT"
echo "  Database: $PRODUCTION_DB_NAME"
echo "  User: $PRODUCTION_DB_USER"
echo "  Schema: $PRODUCTION_DB_SCHEMA"

# Check SSH access
print_message "Checking SSH access to production server..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes $PRODUCTION_SSH 'echo "SSH connection successful"' > /dev/null 2>&1; then
    print_error "Cannot connect to production server via SSH"
    print_error "Please ensure you have SSH access to $PRODUCTION_SSH"
    exit 1
fi
print_success "SSH connection verified"

# Ask for confirmation
if [ "$NO_CONFIRMATION" = false ]; then
    read -p "Do you want to proceed with the backup from PRODUCTION to LOCAL? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Backup cancelled by user"
        exit 1
    fi
else
    print_message "Skipping confirmation (--no-confirmation flag set)"
fi

# Create backup directory if it doesn't exist
BACKUP_DIR="$PROJECT_ROOT/backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp for backup file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DUMP_FILE="production_backup_${TIMESTAMP}.dump"
BACKUP_FILE="$BACKUP_DIR/$DUMP_FILE"

# Create backup on production server
print_message "Creating backup of production database..."
print_message "This may take a few minutes depending on database size..."

# Execute pg_dump on production server
ssh $PRODUCTION_SSH << EOF
cd /tmp
export PGPASSWORD='$PRODUCTION_DB_PASSWORD'
pg_dump -p $PRODUCTION_DB_PORT -h localhost -U $PRODUCTION_DB_USER -d $PRODUCTION_DB_NAME -F c -b -v -f /tmp/$DUMP_FILE
if [ \$? -eq 0 ]; then
    echo "Production database backup completed successfully"
else
    echo "Failed to backup production database"
    exit 1
fi
EOF

if [ $? -ne 0 ]; then
    print_error "Failed to create backup on production server"
    exit 1
fi

# Transfer backup file to local machine
print_message "Transferring backup file to local machine..."
scp $PRODUCTION_SSH:/tmp/$DUMP_FILE "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    print_success "Backup file transferred successfully"
    print_success "Backup saved to: $BACKUP_FILE"
else
    print_error "Failed to transfer backup file"
    # Clean up remote file
    ssh $PRODUCTION_SSH "rm -f /tmp/$DUMP_FILE"
    exit 1
fi

# Clean up remote backup file
print_message "Cleaning up remote backup file..."
ssh $PRODUCTION_SSH "rm -f /tmp/$DUMP_FILE"

# Ask for confirmation before dropping local database
if [ "$NO_CONFIRMATION" = false ]; then
    echo ""
    echo "WARNING: This will DROP and RECREATE your local database schema!"
    echo "Local database: $LOCAL_DB_NAME on $LOCAL_DB_HOST:$LOCAL_DB_PORT"
    read -p "Are you sure you want to continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_message "Keeping backup file at: $BACKUP_FILE"
        print_message "You can restore it manually later with:"
        echo "PGPASSWORD=$LOCAL_DB_PASSWORD pg_restore -p $LOCAL_DB_PORT -h $LOCAL_DB_HOST -U $LOCAL_DB_USER -d $LOCAL_DB_NAME -v $BACKUP_FILE"
        exit 0
    fi
else
    print_message "Proceeding to drop and recreate local database (--no-confirmation flag set)"
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

print_success "Production to local backup and restore process completed successfully!"
echo ""
echo "Your local database has been refreshed with production data."
echo "Remember: This is production data - handle with care!"