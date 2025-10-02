#!/bin/bash

# ANTE Environment Switcher
# Switch between staging and production databases while keeping API connections local
# Usage: ./switch-env.sh [staging|production|status|backup|restore]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_ENV="$PROJECT_ROOT/backend/.env"
FRONTEND_ENV="$PROJECT_ROOT/frontends/frontend-main/.env"
BOT_ENV_DIR="$PROJECT_ROOT/bot/environments"

# Function to print colored output
print_color() {
    local color=$1
    shift
    echo -e "${color}$*${NC}"
}


# Function to get current environment
get_current_env() {
    if [[ -f "$BACKEND_ENV" ]]; then
        if grep -q "ofnmfmwywkhosrmycltb" "$BACKEND_ENV"; then
            echo "staging"
        elif grep -q "ccdlrujemqfwclogysjv" "$BACKEND_ENV"; then
            echo "production"
        else
            echo "unknown"
        fi
    else
        echo "not configured"
    fi
}

# Function to show current status
show_status() {
    local current_env=$(get_current_env)
    
    print_color $CYAN "╔════════════════════════════════════════╗"
    print_color $CYAN "║       ANTE Environment Status          ║"
    print_color $CYAN "╚════════════════════════════════════════╝"
    
    if [[ "$current_env" == "staging" ]]; then
        print_color $YELLOW "Current Environment: STAGING"
        print_color $YELLOW "Database: Supabase Staging (ofnmfmwywkhosrmycltb)"
    elif [[ "$current_env" == "production" ]]; then
        print_color $RED "Current Environment: PRODUCTION"
        print_color $RED "Database: Supabase Production (ccdlrujemqfwclogysjv)"
    else
        print_color $BLUE "Current Environment: $current_env"
    fi
    
    print_color $GREEN "API URL: http://localhost:3000 (local)"
    print_color $GREEN "Socket URL: ws://localhost:4000 (local)"
    
    # Check if services are running
    echo ""
    print_color $CYAN "Service Status:"
    if pm2 list 2>/dev/null | grep -q "ante-backend.*online"; then
        print_color $GREEN "✓ Backend is running"
    else
        print_color $YELLOW "✗ Backend is not running"
    fi
    
    if pm2 list 2>/dev/null | grep -q "ante-frontend-main.*online"; then
        print_color $GREEN "✓ Frontend is running"
    else
        print_color $YELLOW "✗ Frontend is not running"
    fi
}

# Function to process backend environment file with local overrides
process_backend_env() {
    local source_file="$1"
    local target_file="$2"
    local env_type="$3"
    
    if [[ ! -f "$source_file" ]]; then
        print_color $RED "Error: Bot environment file not found: $source_file"
        exit 1
    fi
    
    print_color $YELLOW "Processing backend configuration from bot environment..."
    
    # Copy the source file first
    cp "$source_file" "$target_file.tmp"
    
    # Apply local development overrides
    {
        # Read original file and apply overrides
        while IFS= read -r line || [[ -n "$line" ]]; do
            # Skip empty lines and comments
            [[ -z "$line" ]] && echo "$line" && continue
            [[ "$line" =~ ^[[:space:]]*# ]] && echo "$line" && continue
            
            # Extract key if it's a valid assignment
            if [[ "$line" =~ ^[[:space:]]*([A-Z_][A-Z0-9_]*)=(.*)$ ]]; then
                local key="${BASH_REMATCH[1]}"
                local value="${BASH_REMATCH[2]}"
                
                # Apply local overrides
                case "$key" in
                    "SERVER_NAME")
                        if [[ "$env_type" == "staging" ]]; then
                            echo "SERVER_NAME=\"STAGING-LOCAL\""
                        else
                            echo "SERVER_NAME=\"PRODUCTION-LOCAL\""
                        fi
                        ;;
                    "NODE_ENV")
                        echo "NODE_ENV=development"
                        ;;
                    "REDIS_HOST")
                        echo "REDIS_HOST=localhost"
                        ;;
                    "MONGODB_URI")
                        echo "MONGODB_URI=\"mongodb://jdev:water123@localhost:27017/ante-test?authSource=admin\""
                        ;;
                    "SENTRY_ENVIRONMENT")
                        if [[ "$env_type" == "staging" ]]; then
                            echo "SENTRY_ENVIRONMENT=staging-local"
                        else
                            echo "SENTRY_ENVIRONMENT=production-local"
                        fi
                        ;;
                    *)
                        # Keep original value
                        echo "$line"
                        ;;
                esac
            else
                echo "$line"
            fi
        done < "$source_file"
    } > "$target_file"
    
    # Clean up temp file
    rm -f "$target_file.tmp"
    
    print_color $GREEN "✓ Backend configuration processed"
}

# Function to process frontend environment file with local overrides
process_frontend_env() {
    local env_type="$1"
    local target_file="$2"
    
    # Check if bot frontend env exists, if not create from backend Supabase config
    local bot_frontend_env="$BOT_ENV_DIR/$env_type/frontend-main.env"
    local bot_backend_env="$BOT_ENV_DIR/$env_type/backend.env"
    
    print_color $YELLOW "Processing frontend configuration..."
    
    # Extract Supabase configuration from backend env
    local supabase_url=""
    local supabase_anon_key=""
    local supabase_project_id=""
    
    if [[ -f "$bot_backend_env" ]]; then
        supabase_url=$(grep "^SUPABASE_URL=" "$bot_backend_env" | cut -d'=' -f2- | tr -d '"')
        supabase_anon_key=$(grep "^SUPABASE_ANON_KEY=" "$bot_backend_env" | cut -d'=' -f2- | tr -d '"')
        supabase_project_id=$(grep "^SUPABASE_PROJECT_ID=" "$bot_backend_env" | cut -d'=' -f2- | tr -d '"')
    fi
    
    # Create frontend configuration with local overrides
    cat > "$target_file" << EOF
ENVIRONMENT=${env_type}-local
WHITELABEL=ante
TZ=Asia/Manila
API_URL=http://localhost:3000
SOCKET_URL=ws://localhost:4000
API_DELAY=1000
VITE_SOCKET_URL=ws://localhost:4000
VITE_GOOGLE_CLIENT_ID=755373784641-a3l7b95b29f5kp9tl389ltkkknsf41of.apps.googleusercontent.com
VITE_FACEBOOK_APP_ID=1088650310072618

# Sentry Configuration
VITE_SENTRY_DSN=https://edc5a3c642d23f46faa0ff29b0ca7169@o4509940554268672.ingest.us.sentry.io/4509947838529536
VITE_SENTRY_ENVIRONMENT=${env_type}-local

# Supabase Configuration (from bot environment)
SUPABASE_URL=${supabase_url}
SUPABASE_ANON_KEY=${supabase_anon_key}
SUPABASE_PROJECT_ID=${supabase_project_id}

# Vite-accessible Supabase configuration (VITE_ prefix required for frontend access)
VITE_SUPABASE_URL=${supabase_url}
VITE_SUPABASE_ANON_KEY=${supabase_anon_key}

# Notification System Configuration
USE_MOCK_NOTIFICATIONS=false
VITE_ENABLE_SUPABASE_REALTIME=true
EOF
    
    print_color $GREEN "✓ Frontend configuration processed"
}

# Function to switch to staging environment
switch_to_staging() {
    print_color $CYAN "Switching to STAGING environment..."
    
    # Check if bot environment files exist
    local bot_backend_env="$BOT_ENV_DIR/staging/backend.env"
    if [[ ! -f "$bot_backend_env" ]]; then
        print_color $RED "Error: Bot staging environment not found at $bot_backend_env"
        print_color $YELLOW "Please ensure bot environment files are set up correctly"
        exit 1
    fi
    
    # Process backend environment with local overrides
    process_backend_env "$bot_backend_env" "$BACKEND_ENV" "staging"
    
    # Process frontend environment with local overrides
    process_frontend_env "staging" "$FRONTEND_ENV"
    
    print_color $GREEN "✓ Switched to STAGING environment"
    echo ""
    
    # Restart services automatically
    print_color $CYAN "Restarting services..."
    cd "$PROJECT_ROOT"
    yarn dev
    
    echo ""
    show_status
}

# Function to switch to production environment
switch_to_production() {
    print_color $RED "⚠️  WARNING: Switching to PRODUCTION database!"
    read -p "Are you sure you want to use PRODUCTION database locally? (yes/no): " confirm
    
    if [[ "$confirm" != "yes" ]]; then
        print_color $YELLOW "Cancelled"
        exit 0
    fi
    
    print_color $CYAN "Switching to PRODUCTION environment..."
    
    # Check if bot environment files exist
    local bot_backend_env="$BOT_ENV_DIR/production/backend.env"
    if [[ ! -f "$bot_backend_env" ]]; then
        print_color $RED "Error: Bot production environment not found at $bot_backend_env"
        print_color $YELLOW "Please ensure bot environment files are set up correctly"
        exit 1
    fi
    
    # Process backend environment with local overrides
    process_backend_env "$bot_backend_env" "$BACKEND_ENV" "production"
    
    # Process frontend environment with local overrides
    process_frontend_env "production" "$FRONTEND_ENV"
    
    print_color $GREEN "✓ Switched to PRODUCTION environment"
    echo ""
    
    # Restart services automatically
    print_color $CYAN "Restarting services..."
    cd "$PROJECT_ROOT"
    yarn dev
    
    echo ""
    show_status
    echo ""
    print_color $RED "⚠️  IMPORTANT: You are now using PRODUCTION database!"
}

# Main script logic
case "$1" in
    staging)
        switch_to_staging
        ;;
    production)
        switch_to_production
        ;;
    status)
        show_status
        ;;
    *)
        print_color $CYAN "ANTE Environment Switcher"
        print_color $CYAN "========================="
        echo ""
        print_color $YELLOW "Usage: $0 [command]"
        echo ""
        print_color $GREEN "Commands:"
        echo "  staging     - Switch to staging database (ofnmfmwywkhosrmycltb)"
        echo "  production  - Switch to production database (ccdlrujemqfwclogysjv)"
        echo "  status      - Show current environment status"
        echo ""
        print_color $CYAN "Examples:"
        echo "  $0 staging      # Switch to staging"
        echo "  $0 production   # Switch to production (requires confirmation)"
        echo "  $0 status       # Check current environment"
        echo ""
        print_color $YELLOW "Note: API and Socket URLs always remain local (localhost)"
        exit 0
        ;;
esac