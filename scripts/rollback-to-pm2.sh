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

print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

print_success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

print_info() {
    echo -e "${BLUE}INFO: $1${NC}"
}

STAGING_SERVER="jdev@157.230.246.107"

print_message "EMERGENCY ROLLBACK: Switching back to PM2 on staging server"
print_error "This will stop Docker containers and revert to PM2 configuration"

# Ask for confirmation
read -p "Are you sure you want to rollback to PM2? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_message "Rollback cancelled"
    exit 1
fi

print_message "Executing rollback on staging server..."

ssh "$STAGING_SERVER" << 'EOF'
    set -e
    
    # Colors for remote output
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
    
    print_message() { echo -e "${YELLOW}$1${NC}"; }
    print_error() { echo -e "${RED}ERROR: $1${NC}"; }
    print_success() { echo -e "${GREEN}SUCCESS: $1${NC}"; }
    print_info() { echo -e "${BLUE}INFO: $1${NC}"; }
    
    print_message "Step 1: Stopping Docker containers..."
    cd /home/jdev/ante
    if [ -f docker-compose.staging.yml ]; then
        docker compose -f docker-compose.staging.yml down || true
        print_success "Docker containers stopped"
    else
        print_info "No Docker compose file found"
    fi
    
    print_message "Step 2: Stopping Nginx if running in Docker..."
    docker stop ante-nginx-staging 2>/dev/null || true
    docker rm ante-nginx-staging 2>/dev/null || true
    
    print_message "Step 3: Switching to PM2 configuration..."
    cd /home/jdev/projects/geer-ante
    
    # Check if PM2 process exists
    if pm2 list | grep -q "ante-backend-staging"; then
        print_info "PM2 process already running, restarting..."
        pm2 restart ante-backend-staging
        pm2 restart ante-frontend-staging 2>/dev/null || print_info "Frontend PM2 process not found"
    else
        print_info "Starting PM2 processes..."
        # Use existing ecosystem config or start manually
        if [ -f ecosystem.config.js ]; then
            pm2 start ecosystem.config.js --only ante-backend-staging
        else
            print_info "Starting backend manually..."
            cd backend
            pm2 start dist/src/main.js --name ante-backend-staging
        fi
    fi
    
    print_message "Step 4: Checking PM2 status..."
    pm2 list
    
    print_message "Step 5: Testing backend health..."
    sleep 5
    if curl -f http://localhost:3000/health &>/dev/null; then
        print_success "Backend is responding on port 3000"
    else
        print_error "Backend is not responding on port 3000"
    fi
    
    print_message "Step 6: Cleaning up Docker resources..."
    # Remove stopped containers
    docker container prune -f 2>/dev/null || true
    # Remove unused images
    docker image prune -f 2>/dev/null || true
    
    print_success "Rollback completed successfully!"
    print_info "PM2 processes are now handling the application"
    print_info "Backend running on: http://localhost:3000"
    print_info "Check PM2 status with: pm2 monit"
EOF

if [ $? -eq 0 ]; then
    print_success "Rollback completed successfully!"
    print_info "The application is now running under PM2"
    print_message "Please verify the application is working correctly:"
    print_info "1. Check PM2 status: ssh $STAGING_SERVER 'pm2 list'"
    print_info "2. Test the application endpoints"
    print_info "3. Monitor logs: ssh $STAGING_SERVER 'pm2 logs ante-backend-staging'"
else
    print_error "Rollback failed!"
    print_error "Please check the server manually and restore services"
    exit 1
fi