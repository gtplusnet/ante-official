#!/usr/bin/env bash

# ANTE Root Deploy Script - Staging
# Orchestrates deployment of all services to staging server
# Usage: ./deploy/deploy-staging.sh [service1] [service2] ...
# Location: ~/projects/ante/deploy/deploy-staging.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Function to print messages
print_message() { echo -e "${YELLOW}$1${NC}"; }
print_error() { echo -e "${RED}ERROR: $1${NC}"; }
print_success() { echo -e "${GREEN}SUCCESS: $1${NC}"; }
print_info() { echo -e "${BLUE}INFO: $1${NC}"; }
print_step() { echo -e "${CYAN}===> $1${NC}"; }
print_warning() { echo -e "${MAGENTA}   WARNING: $1${NC}"; }

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Available services and their deploy script paths
declare -A SERVICES=(
    ["backend"]="$PROJECT_ROOT/backend/deploy/deploy-staging.sh"
    ["frontend"]="$PROJECT_ROOT/frontends/frontend-main/deploy/deploy-staging.sh"
    ["gate-app"]="$PROJECT_ROOT/frontends/frontend-gate-app/deploy/deploy-staging.sh"
    ["guardian-app"]="$PROJECT_ROOT/frontends/frontend-guardian-app/deploy/deploy-staging.sh"
)

# Default deployment order (if no services specified)
DEFAULT_ORDER=("backend" "frontend" "gate-app" "guardian-app")

# Function to show usage
show_usage() {
    echo "Usage: $0 [service1] [service2] ..."
    echo ""
    echo "Available services:"
    echo "  backend      - Backend API and WebSocket services"
    echo "  frontend     - Main frontend application"
    echo "  gate-app     - Gate application frontend"
    echo "  guardian-app - Guardian mobile application"
    echo ""
    echo "Examples:"
    echo "  $0                    # Deploy all services in default order"
    echo "  $0 backend            # Deploy only backend"
    echo "  $0 frontend gate-app  # Deploy frontend and gate-app only"
    echo ""
    echo "Default order: ${DEFAULT_ORDER[*]}"
}

# Function to validate service exists
validate_service() {
    local service="$1"
    if [[ ! -v SERVICES["$service"] ]]; then
        print_error "Unknown service: $service"
        show_usage
        exit 1
    fi
    
    if [[ ! -f "${SERVICES[$service]}" ]]; then
        print_error "Deploy script not found for $service: ${SERVICES[$service]}"
        exit 1
    fi
}

# Function to deploy a single service
deploy_service() {
    local service="$1"
    local script_path="${SERVICES[$service]}"
    local service_dir=$(dirname "$script_path")
    
    print_step "Deploying $service..."
    print_info "  Script: $script_path"
    print_info "  Working directory: $service_dir"
    
    # Change to the service directory and run the deploy script
    cd "$service_dir"
    if bash "$script_path"; then
        print_success " $service deployment completed successfully"
        return 0
    else
        print_error "L $service deployment failed"
        return 1
    fi
}

# Parse command line arguments
DEPLOY_SERVICES=()
FAILED_SERVICES=()
SUCCESSFUL_SERVICES=()

# Show help if requested
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_usage
    exit 0
fi

# Determine which services to deploy
if [[ $# -eq 0 ]]; then
    # No arguments provided, deploy all services in default order
    DEPLOY_SERVICES=("${DEFAULT_ORDER[@]}")
    print_message "=€ Starting deployment of all services to staging"
else
    # Specific services provided
    DEPLOY_SERVICES=("$@")
    print_message "=€ Starting deployment of specified services to staging"
fi

print_info "Project Root: $PROJECT_ROOT"
print_info "Services to deploy: ${DEPLOY_SERVICES[*]}"
print_info ""

# Validate all requested services exist
for service in "${DEPLOY_SERVICES[@]}"; do
    validate_service "$service"
done

# Main deployment loop
TOTAL_SERVICES=${#DEPLOY_SERVICES[@]}
CURRENT_SERVICE=1

START_TIME=$(date +%s)

for service in "${DEPLOY_SERVICES[@]}"; do
    print_message ""
    print_message "= [$CURRENT_SERVICE/$TOTAL_SERVICES] Deploying: $service"
    print_message ""
    print_info ""
    
    SERVICE_START_TIME=$(date +%s)
    
    if deploy_service "$service"; then
        SUCCESSFUL_SERVICES+=("$service")
        SERVICE_END_TIME=$(date +%s)
        SERVICE_DURATION=$((SERVICE_END_TIME - SERVICE_START_TIME))
        print_success " $service completed in ${SERVICE_DURATION}s"
    else
        FAILED_SERVICES+=("$service")
        SERVICE_END_TIME=$(date +%s)
        SERVICE_DURATION=$((SERVICE_END_TIME - SERVICE_START_TIME))
        print_error "L $service failed after ${SERVICE_DURATION}s"
        
        # Ask user if they want to continue with remaining services
        if [[ $CURRENT_SERVICE -lt $TOTAL_SERVICES ]]; then
            print_warning "There are $((TOTAL_SERVICES - CURRENT_SERVICE)) services remaining."
            read -p "Continue with remaining deployments? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_message "Deployment stopped by user."
                break
            fi
        fi
    fi
    
    print_info ""
    ((CURRENT_SERVICE++))
done

# Final summary
END_TIME=$(date +%s)
TOTAL_DURATION=$((END_TIME - START_TIME))

print_message ""
print_message "=Ê DEPLOYMENT SUMMARY"
print_message ""

print_info "Total Duration: ${TOTAL_DURATION}s"
print_info "Services Requested: ${#DEPLOY_SERVICES[@]}"
print_info "Services Successful: ${#SUCCESSFUL_SERVICES[@]}"
print_info "Services Failed: ${#FAILED_SERVICES[@]}"
print_info ""

if [[ ${#SUCCESSFUL_SERVICES[@]} -gt 0 ]]; then
    print_success " Successful deployments:"
    for service in "${SUCCESSFUL_SERVICES[@]}"; do
        print_success "  " $service"
    done
    print_info ""
fi

if [[ ${#FAILED_SERVICES[@]} -gt 0 ]]; then
    print_error "L Failed deployments:"
    for service in "${FAILED_SERVICES[@]}"; do
        print_error "  " $service"
    done
    print_info ""
    
    print_warning "To retry failed services:"
    print_warning "  $0 ${FAILED_SERVICES[*]}"
    print_info ""
fi

# Service URLs (for successful deployments)
if [[ ${#SUCCESSFUL_SERVICES[@]} -gt 0 ]]; then
    print_info "< Service URLs:"
    for service in "${SUCCESSFUL_SERVICES[@]}"; do
        case $service in
            "backend")
                print_info "  " Backend API: https://backend-ante.geertest.com"
                print_info "  " Backend Socket: https://socket-ante.geertest.com"
                print_info "  " Backend Health: https://backend-ante.geertest.com/health"
                ;;
            "frontend")
                print_info "  " Main Frontend: https://ante.geertest.com"
                print_info "  " Frontend Login: https://ante.geertest.com/#/login"
                ;;
            "gate-app")
                print_info "  " Gate App: https://gate.geertest.com"
                ;;
            "guardian-app")
                print_info "  " Guardian App: https://guardian.geertest.com"
                print_info "  " Guardian Health: https://guardian.geertest.com/api/health"
                ;;
        esac
    done
fi

print_message ""

# Exit with appropriate code
if [[ ${#FAILED_SERVICES[@]} -eq 0 ]]; then
    print_success "<‰ All deployments completed successfully!"
    # Send completion notification
    ~/claude-notify.sh complete
    exit 0
else
    print_error "   Some deployments failed. Check logs above for details."
    # Send error notification
    ~/claude-notify.sh error
    exit 1
fi