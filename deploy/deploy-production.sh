#!/usr/bin/env bash

# ANTE Root Deploy Script - Production
# Orchestrates deployment of all services to production server
# Usage: ./deploy/deploy-production.sh [service1] [service2] ...
# Location: ~/projects/ante/deploy/deploy-production.sh

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
print_warning() { echo -e "${MAGENTA}�  WARNING: $1${NC}"; }

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Parse command line arguments for force flag
FORCE_DEPLOY=false
DEPLOY_SERVICES_ARG=()

for arg in "$@"; do
    case $arg in
        --force|--skip-confirmation)
            FORCE_DEPLOY=true
            ;;
        *)
            DEPLOY_SERVICES_ARG+=("$arg")
            ;;
    esac
done

# Available services and their deploy script paths
declare -A SERVICES=(
    ["backend"]="$PROJECT_ROOT/backend/deploy/deploy-production.sh"
    ["frontend"]="$PROJECT_ROOT/frontends/frontend-main/deploy/deploy-production.sh"
    ["gate-app"]="$PROJECT_ROOT/frontends/frontend-gate-app/deploy/deploy-production.sh"
    ["guardian-app"]="$PROJECT_ROOT/frontends/frontend-guardian-app/deploy/deploy-production.sh"
)

# Default deployment order (if no services specified)
# Note: Backend should be deployed first to ensure API availability
DEFAULT_ORDER=("backend" "frontend" "gate-app" "guardian-app")

# Production safety warning
show_production_warning() {
    echo ""
    print_warning "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP"
    print_warning "                    =� PRODUCTION DEPLOYMENT =�                 "
    print_warning "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP"
    print_warning ""
    print_warning "You are about to deploy to the LIVE PRODUCTION environment!"
    print_warning ""
    print_warning "Production Details:"
    print_warning "  Server: 178.128.49.38 (jdev@178.128.49.38)"
    print_warning "  URLs: https://ante.ph, https://backend.ante.ph"
    print_warning "  Environment: LIVE PRODUCTION with REAL USERS"
    print_warning ""
    print_warning "This deployment will:"
    print_warning "  Affect live users and real data"
    print_warning "  Create automatic git backup tags"
    print_warning "  Require 'main' branch deployment"
    print_warning "  Run with zero-downtime deployment strategy"
    print_warning ""
    print_message "�  CRITICAL: Ensure all changes have been tested on staging!"
    echo ""
}

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
    echo ""
    echo "PRODUCTION REQUIREMENTS:"
    echo "  " Must be on 'main' branch"
    echo "  " Working directory must be clean"
    echo "  " All changes should be tested on staging first"
    echo "  " Automatic backup tags will be created"
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

# Function to check production readiness
check_production_readiness() {
    print_step "Production Readiness Checks"
    
    # Check git branch
    CURRENT_BRANCH=$(git -C "$PROJECT_ROOT" branch --show-current 2>/dev/null || echo "unknown")
    print_info "  � Current branch: $CURRENT_BRANCH"
    if [ "$CURRENT_BRANCH" != "main" ]; then
        print_error "L PRODUCTION DEPLOYMENT MUST BE FROM 'main' BRANCH"
        print_error "Current branch: $CURRENT_BRANCH"
        print_info "Please switch to main branch and ensure it's up to date:"
        print_info "  git checkout main"
        print_info "  git pull origin main"
        exit 1
    fi
    print_success "   On main branch"
    
    # Check for uncommitted changes
    if [[ -n $(git -C "$PROJECT_ROOT" status --porcelain) ]]; then
        print_error "L You have uncommitted changes in your working directory"
        print_error "Production deployments require a clean working directory"
        print_info "Please commit or stash your changes:"
        print_info "  git status"
        print_info "  git add . && git commit -m 'your message'"
        print_info "  # OR"
        print_info "  git stash"
        exit 1
    fi
    print_success "   Working directory is clean"
    
    # Sync with remote
    print_info "  � Syncing with origin/main..."
    cd "$PROJECT_ROOT"
    git fetch origin main
    
    # Check if local main is behind remote
    LOCAL_COMMIT=$(git rev-parse main)
    REMOTE_COMMIT=$(git rev-parse origin/main)
    if [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then
        print_warning "  � Local main branch is not up to date with origin/main"
        read -p "  Pull latest changes? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git pull origin main
            print_success "   Synchronized with origin/main"
        else
            print_error "Deployment cancelled. Please update your main branch first."
            exit 1
        fi
    else
        print_success "   Local main branch is up to date"
    fi
    
    print_success "   Production readiness checks passed"
    echo ""
}

# Function to deploy a single service
deploy_service() {
    local service="$1"
    local script_path="${SERVICES[$service]}"
    local service_dir=$(dirname "$script_path")
    
    print_step "Deploying $service to PRODUCTION..."
    print_info "  Script: $script_path"
    print_info "  Working directory: $service_dir"
    
    # Change to the service directory and run the deploy script
    cd "$service_dir"
    if bash "$script_path"; then
        print_success " $service PRODUCTION deployment completed successfully"
        return 0
    else
        print_error "L $service PRODUCTION deployment failed"
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

# Show production warning first
show_production_warning

# Production confirmation
read -p "Type 'PRODUCTION' to confirm you want to deploy to live production: " -r
echo
if [[ ! $REPLY == "PRODUCTION" ]]; then
    print_error "Production deployment cancelled"
    exit 1
fi

print_message "=� Starting PRODUCTION deployment of ANTE services"

# Determine which services to deploy
if [[ ${#DEPLOY_SERVICES_ARG[@]} -eq 0 ]]; then
    # No arguments provided, deploy all services in default order
    DEPLOY_SERVICES=("${DEFAULT_ORDER[@]}")
    print_message "=� Deploying all services to PRODUCTION in default order"
else
    # Specific services provided
    DEPLOY_SERVICES=("${DEPLOY_SERVICES_ARG[@]}")
    print_message "=� Deploying specified services to PRODUCTION"
fi

print_info "Project Root: $PROJECT_ROOT"
print_info "Services to deploy: ${DEPLOY_SERVICES[*]}"
print_info ""

# Validate all requested services exist
for service in "${DEPLOY_SERVICES[@]}"; do
    validate_service "$service"
done

# Run production readiness checks
check_production_readiness

# Final confirmation before starting deployments
echo ""
print_warning "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP"
print_warning "                     FINAL CONFIRMATION                         "
print_warning "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP"
print_warning ""
print_warning "About to deploy the following services to PRODUCTION:"
for service in "${DEPLOY_SERVICES[@]}"; do
    print_warning "  $service"
done
print_warning ""
print_warning "This will affect LIVE USERS on the production system!"
print_warning ""

if [[ $FORCE_DEPLOY == true ]]; then
    print_warning "FORCE MODE: Skipping confirmation (--force flag provided)"
    print_warning "Proceeding with deployment in 3 seconds..."
    sleep 3
else
    read -p "Type 'DEPLOY' to proceed with production deployment: " -r
    echo
    if [[ ! $REPLY == "DEPLOY" ]]; then
        print_error "Production deployment cancelled"
        exit 1
    fi
fi

# Main deployment loop
TOTAL_SERVICES=${#DEPLOY_SERVICES[@]}
CURRENT_SERVICE=1

START_TIME=$(date +%s)

for service in "${DEPLOY_SERVICES[@]}"; do
    print_message ""
    print_message "=� [$CURRENT_SERVICE/$TOTAL_SERVICES] PRODUCTION DEPLOYMENT: $service"
    print_message ""
    print_info ""
    
    SERVICE_START_TIME=$(date +%s)
    
    if deploy_service "$service"; then
        SUCCESSFUL_SERVICES+=("$service")
        SERVICE_END_TIME=$(date +%s)
        SERVICE_DURATION=$((SERVICE_END_TIME - SERVICE_START_TIME))
        print_success " $service PRODUCTION deployment completed in ${SERVICE_DURATION}s"
    else
        FAILED_SERVICES+=("$service")
        SERVICE_END_TIME=$(date +%s)
        SERVICE_DURATION=$((SERVICE_END_TIME - SERVICE_START_TIME))
        print_error "L $service PRODUCTION deployment failed after ${SERVICE_DURATION}s"
        
        # In production, failures are more critical
        print_error "=� PRODUCTION DEPLOYMENT FAILURE DETECTED!"
        print_error "This is a critical issue that needs immediate attention."
        
        # Ask user if they want to continue with remaining services
        if [[ $CURRENT_SERVICE -lt $TOTAL_SERVICES ]]; then
            print_warning "There are $((TOTAL_SERVICES - CURRENT_SERVICE)) services remaining."
            print_warning "Continuing might leave the system in an inconsistent state."
            read -p "Continue with remaining PRODUCTION deployments? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_message "Production deployment stopped by user."
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
print_message "=� PRODUCTION DEPLOYMENT SUMMARY"
print_message ""

print_info "Total Duration: ${TOTAL_DURATION}s"
print_info "Services Requested: ${#DEPLOY_SERVICES[@]}"
print_info "Services Successful: ${#SUCCESSFUL_SERVICES[@]}"
print_info "Services Failed: ${#FAILED_SERVICES[@]}"
print_info "Environment: PRODUCTION"
print_info "Deployment Time: $(date)"
print_info ""

if [[ ${#SUCCESSFUL_SERVICES[@]} -gt 0 ]]; then
    print_success " Successful PRODUCTION deployments:"
    for service in "${SUCCESSFUL_SERVICES[@]}"; do
        print_success "  " $service"
    done
    print_info ""
fi

if [[ ${#FAILED_SERVICES[@]} -gt 0 ]]; then
    print_error "L Failed PRODUCTION deployments:"
    for service in "${FAILED_SERVICES[@]}"; do
        print_error "  " $service"
    done
    print_info ""
    
    print_error "=� CRITICAL: Production deployment failures detected!"
    print_error "Immediate action required to resolve production issues."
    print_info ""
    print_warning "To retry failed services:"
    print_warning "  $0 ${FAILED_SERVICES[*]}"
    print_info ""
    print_warning "To check service status:"
    print_warning "  ssh jdev@178.128.49.38 'docker ps'"
    print_warning "  ssh jdev@178.128.49.38 'docker logs <container-name> --tail 50'"
    print_info ""
fi

# Production service URLs (for successful deployments)
if [[ ${#SUCCESSFUL_SERVICES[@]} -gt 0 ]]; then
    print_info "< PRODUCTION Service URLs:"
    for service in "${SUCCESSFUL_SERVICES[@]}"; do
        case $service in
            "backend")
                print_info "  " Backend API: https://backend.ante.ph"
                print_info "  " Backend Socket: https://socket.ante.ph"
                print_info "  " Backend Health: https://backend.ante.ph/health"
                ;;
            "frontend")
                print_info "  " Main Frontend: https://ante.ph"
                print_info "  " Frontend Login: https://ante.ph/#/login"
                print_info "  " Frontend Dashboard: https://ante.ph/#/member/dashboard"
                ;;
            "gate-app")
                print_info "  " Gate App: https://gate.ante.ph"
                ;;
            "guardian-app")
                print_info "  " Guardian App: https://guardian.ante.ph"
                print_info "  " Guardian Health: https://guardian.ante.ph/api/health"
                ;;
        esac
    done
    print_info ""
fi

# Production monitoring information
if [[ ${#SUCCESSFUL_SERVICES[@]} -gt 0 ]]; then
    print_info "=� Production Monitoring:"
    print_info "  " Server: ssh jdev@178.128.49.38"
    print_info "  " Docker Status: docker ps"
    print_info "  " Container Logs: docker logs <container-name> --tail 50"
    print_info "  " Service Health: curl https://<service-url>/health"
    print_info ""
fi

print_message ""

# Exit with appropriate code
if [[ ${#FAILED_SERVICES[@]} -eq 0 ]]; then
    print_success "<� ALL PRODUCTION DEPLOYMENTS COMPLETED SUCCESSFULLY!"
    print_success "( Production environment is updated and running"
    
    # Send completion notification
    ~/claude-notify.sh complete
    exit 0
else
    print_error "�  SOME PRODUCTION DEPLOYMENTS FAILED"
    print_error "=� IMMEDIATE ATTENTION REQUIRED"
    print_error "Check production services and resolve issues promptly"
    
    # Send error notification
    ~/claude-notify.sh error
    exit 1
fi