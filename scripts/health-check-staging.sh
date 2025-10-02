#!/usr/bin/env bash

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
STAGING_PATH="/home/jdev/ante"

print_message "Performing comprehensive health check of staging environment..."

# Check if Docker deployment or PM2
DEPLOYMENT_TYPE=""
if ssh "$STAGING_SERVER" "cd $STAGING_PATH && test -f docker-compose.staging.yml && docker compose -f docker-compose.staging.yml ps | grep -q Up" 2>/dev/null; then
    DEPLOYMENT_TYPE="docker"
    print_info "Detected Docker deployment"
else
    DEPLOYMENT_TYPE="pm2"
    print_info "Detected PM2 deployment"
fi

print_message "Running health checks for $DEPLOYMENT_TYPE deployment..."

ssh "$STAGING_SERVER" << EOF
    # Colors for remote output
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
    
    print_message() { echo -e "\${YELLOW}\$1\${NC}"; }
    print_error() { echo -e "\${RED}ERROR: \$1\${NC}"; }
    print_success() { echo -e "\${GREEN}SUCCESS: \$1\${NC}"; }
    print_info() { echo -e "\${BLUE}INFO: \$1\${NC}"; }
    
    FAILED_CHECKS=0
    
    check_service() {
        local name=\$1
        local url=\$2
        local expected_status=\$3
        
        print_info "Checking \$name at \$url..."
        
        if command -v curl &> /dev/null; then
            response=\$(curl -s -o /dev/null -w "%{http_code}" "\$url" 2>/dev/null || echo "000")
            if [ "\$response" = "\$expected_status" ]; then
                print_success "\$name is responding (HTTP \$response)"
            else
                print_error "\$name check failed (HTTP \$response, expected \$expected_status)"
                FAILED_CHECKS=\$((FAILED_CHECKS + 1))
            fi
        else
            print_error "curl not available for testing \$name"
            FAILED_CHECKS=\$((FAILED_CHECKS + 1))
        fi
    }
    
    print_message "=== System Health Check ==="
    
    # System resources
    print_info "System uptime: \$(uptime)"
    print_info "Memory usage:"
    free -h
    print_info "Disk usage:"
    df -h /
    print_info "CPU load: \$(cat /proc/loadavg)"
    
    if [ "$DEPLOYMENT_TYPE" = "docker" ]; then
        print_message "=== Docker Health Check ==="
        
        cd $STAGING_PATH
        
        # Check Docker daemon
        if systemctl is-active --quiet docker; then
            print_success "Docker daemon is running"
        else
            print_error "Docker daemon is not running"
            FAILED_CHECKS=\$((FAILED_CHECKS + 1))
        fi
        
        # Check Docker containers
        print_info "Docker container status:"
        docker compose -f docker-compose.staging.yml ps
        
        # Check individual container health
        containers=("ante-backend-staging" "ante-frontend-staging" "ante-redis-staging")
        for container in "\${containers[@]}"; do
            if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "\$container.*Up"; then
                print_success "Container \$container is running"
            else
                print_error "Container \$container is not running"
                FAILED_CHECKS=\$((FAILED_CHECKS + 1))
            fi
        done
        
        # Check container logs for errors
        print_info "Checking recent container logs for errors..."
        for container in "\${containers[@]}"; do
            if docker ps -q -f name="\$container" | head -n1 | xargs -r docker logs --tail=50 2>&1 | grep -i error | head -3; then
                print_error "Found errors in \$container logs"
            fi
        done
        
        # Test service endpoints
        check_service "Backend API Health" "http://localhost:3001/health" "200"
        check_service "Frontend" "http://localhost:9001" "200"
        
        # Check Redis connectivity
        if docker exec ante-redis-staging redis-cli ping | grep -q PONG; then
            print_success "Redis is responding"
        else
            print_error "Redis connection failed"
            FAILED_CHECKS=\$((FAILED_CHECKS + 1))
        fi
        
        # Check Nginx if running
        if docker ps -q -f name="ante-nginx-staging" | head -n1 | xargs -r docker exec nginx -t 2>/dev/null; then
            print_success "Nginx configuration is valid"
        fi
        
    else
        print_message "=== PM2 Health Check ==="
        
        # Check PM2 daemon
        if pm2 ping | grep -q pong; then
            print_success "PM2 daemon is running"
        else
            print_error "PM2 daemon is not responding"
            FAILED_CHECKS=\$((FAILED_CHECKS + 1))
        fi
        
        # Check PM2 processes
        print_info "PM2 process status:"
        pm2 list
        
        # Check specific processes
        if pm2 list | grep -q "ante-backend-staging.*online"; then
            print_success "Backend PM2 process is online"
        else
            print_error "Backend PM2 process is not online"
            FAILED_CHECKS=\$((FAILED_CHECKS + 1))
        fi
        
        # Test service endpoints
        check_service "Backend API Health" "http://localhost:3000/health" "200"
        
        # Check recent PM2 logs for errors
        print_info "Checking recent PM2 logs for errors..."
        if pm2 logs ante-backend-staging --lines 20 --nostream | grep -i error | head -3; then
            print_error "Found errors in PM2 logs"
        fi
    fi
    
    print_message "=== Database Health Check ==="
    
    # PostgreSQL
    if PGPASSWORD='aA52fJL3MtJiw8GqIWQNkvqc8hdfMZFvFlLw6O' psql -h localhost -U jdev -d ante -c "SELECT 1;" >/dev/null 2>&1; then
        print_success "PostgreSQL is accessible"
        
        # Check database size and connections
        db_size=\$(PGPASSWORD='aA52fJL3MtJiw8GqIWQNkvqc8hdfMZFvFlLw6O' psql -h localhost -U jdev -d ante -t -c "SELECT pg_size_pretty(pg_database_size('ante'));" | xargs)
        print_info "Database size: \$db_size"
        
        active_connections=\$(PGPASSWORD='aA52fJL3MtJiw8GqIWQNkvqc8hdfMZFvFlLw6O' psql -h localhost -U jdev -d ante -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname='ante';" | xargs)
        print_info "Active connections: \$active_connections"
    else
        print_error "PostgreSQL connection failed"
        FAILED_CHECKS=\$((FAILED_CHECKS + 1))
    fi
    
    # MongoDB
    if mongosh --host localhost:27017 --eval "db.runCommand('ping').ok" geer_ante >/dev/null 2>&1; then
        print_success "MongoDB is accessible"
    else
        print_error "MongoDB connection failed"
        FAILED_CHECKS=\$((FAILED_CHECKS + 1))
    fi
    
    print_message "=== Network Health Check ==="
    
    # Check open ports
    print_info "Checking open ports:"
    ss -tlnp | grep -E ":(80|443|3000|3001|4000|4001|5432|6379|6380|9000|9001|27017)" || print_info "No expected ports found"
    
    # DNS resolution check
    for domain in ante.geertest.com backend-ante.geertest.com socket-ante.geertest.com; do
        if nslookup "\$domain" >/dev/null 2>&1; then
            print_success "DNS resolution working for \$domain"
        else
            print_error "DNS resolution failed for \$domain"
            FAILED_CHECKS=\$((FAILED_CHECKS + 1))
        fi
    done
    
    print_message "=== SSL Certificate Check ==="
    
    # Check SSL certificates if they exist
    for domain in ante.geertest.com backend-ante.geertest.com socket-ante.geertest.com; do
        if [ -f "/etc/letsencrypt/live/\$domain/fullchain.pem" ]; then
            expiry=\$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/\$domain/fullchain.pem" | cut -d= -f2)
            print_success "SSL certificate exists for \$domain (expires: \$expiry)"
        else
            print_info "No SSL certificate found for \$domain"
        fi
    done
    
    print_message "=== Security Check ==="
    
    # Check for recent security updates
    print_info "System security status:"
    if command -v unattended-upgrades &> /dev/null; then
        print_info "Automatic security updates are available"
    fi
    
    # Check firewall status
    if command -v ufw &> /dev/null; then
        ufw_status=\$(sudo ufw status | head -1)
        print_info "Firewall status: \$ufw_status"
    fi
    
    print_message "=== Health Check Summary ==="
    
    if [ \$FAILED_CHECKS -eq 0 ]; then
        print_success "All health checks passed!"
        print_info "System is healthy and ready for production traffic"
    else
        print_error "Health check failed with \$FAILED_CHECKS issues"
        print_error "Please review and fix the issues before proceeding"
        exit 1
    fi
    
    print_message "=== Recommendations ==="
    print_info "1. Monitor logs regularly: pm2 logs or docker-compose logs"
    print_info "2. Check disk space weekly: df -h"
    print_info "3. Verify SSL certificate renewal monthly"
    print_info "4. Keep system packages updated"
    print_info "5. Monitor database performance and backup integrity"
EOF

if [ $? -eq 0 ]; then
    print_success "Health check completed successfully!"
    print_info "Staging environment is healthy and ready"
else
    print_error "Health check failed!"
    print_error "Please review the issues and fix them before proceeding"
    exit 1
fi