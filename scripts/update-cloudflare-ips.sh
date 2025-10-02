#!/bin/bash

# Cloudflare IP Range Update Script
# Updates nginx configuration with latest Cloudflare IP ranges
# Author: Claude Code Assistant
# Date: August 12, 2025

set -e

# Configuration
CLOUDFLARE_FILE_PATH="/etc/nginx/cloudflare-realip.conf"
TEMP_FILE="/tmp/cloudflare-realip.conf.tmp"
BACKUP_DIR="/etc/nginx/backups"
LOG_FILE="/var/log/cloudflare-ip-update.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    echo -e "${RED}ERROR: $1${NC}" >&2
    log "ERROR: $1"
    exit 1
}

# Success message
success() {
    echo -e "${GREEN}$1${NC}"
    log "SUCCESS: $1"
}

# Warning message
warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
    log "WARNING: $1"
}

# Check if running as root or with sudo
check_privileges() {
    if [[ $EUID -ne 0 ]]; then
        error_exit "This script must be run as root or with sudo"
    fi
}

# Create backup directory if it doesn't exist
create_backup_dir() {
    if [[ ! -d "$BACKUP_DIR" ]]; then
        mkdir -p "$BACKUP_DIR"
        log "Created backup directory: $BACKUP_DIR"
    fi
}

# Backup current configuration
backup_current_config() {
    if [[ -f "$CLOUDFLARE_FILE_PATH" ]]; then
        local backup_file="$BACKUP_DIR/cloudflare-realip.conf.$(date +%Y%m%d_%H%M%S)"
        cp "$CLOUDFLARE_FILE_PATH" "$backup_file"
        log "Backed up current configuration to: $backup_file"
    fi
}

# Download and verify Cloudflare IP ranges
download_ip_ranges() {
    log "Downloading Cloudflare IP ranges..."
    
    # Download IPv4 ranges
    local ipv4_ranges
    ipv4_ranges=$(curl -s -f --max-time 30 https://www.cloudflare.com/ips-v4) || error_exit "Failed to download IPv4 ranges"
    
    # Download IPv6 ranges
    local ipv6_ranges
    ipv6_ranges=$(curl -s -f --max-time 30 https://www.cloudflare.com/ips-v6) || error_exit "Failed to download IPv6 ranges"
    
    # Verify we got some data
    if [[ -z "$ipv4_ranges" || -z "$ipv6_ranges" ]]; then
        error_exit "Downloaded IP ranges are empty"
    fi
    
    # Count ranges
    local ipv4_count=$(echo "$ipv4_ranges" | wc -l)
    local ipv6_count=$(echo "$ipv6_ranges" | wc -l)
    
    log "Downloaded $ipv4_count IPv4 ranges and $ipv6_count IPv6 ranges"
    
    # Generate new configuration file
    cat > "$TEMP_FILE" << EOF
# Cloudflare IP ranges for real IP restoration
# Auto-generated on $(date)
# Source: https://www.cloudflare.com/ips-v4 and https://www.cloudflare.com/ips-v6

# IPv4 ranges
EOF
    
    echo "$ipv4_ranges" | while read -r ip; do
        echo "set_real_ip_from $ip;" >> "$TEMP_FILE"
    done
    
    cat >> "$TEMP_FILE" << EOF

# IPv6 ranges
EOF
    
    echo "$ipv6_ranges" | while read -r ip; do
        echo "set_real_ip_from $ip;" >> "$TEMP_FILE"
    done
    
    cat >> "$TEMP_FILE" << EOF

# Use CF-Connecting-IP header for real IP
real_ip_header CF-Connecting-IP;

# Enable recursive IP resolution
real_ip_recursive on;
EOF
    
    log "Generated new configuration file"
}

# Validate nginx configuration
validate_nginx_config() {
    log "Validating nginx configuration..."
    
    # Test nginx configuration
    if nginx -t 2>/dev/null; then
        success "Nginx configuration is valid"
        return 0
    else
        error_exit "Nginx configuration test failed"
    fi
}

# Deploy new configuration
deploy_config() {
    log "Deploying new configuration..."
    
    # Copy temp file to final location
    cp "$TEMP_FILE" "$CLOUDFLARE_FILE_PATH"
    
    # Set proper permissions
    chmod 644 "$CLOUDFLARE_FILE_PATH"
    chown root:root "$CLOUDFLARE_FILE_PATH"
    
    log "Deployed new configuration to $CLOUDFLARE_FILE_PATH"
}

# Reload nginx
reload_nginx() {
    log "Reloading nginx..."
    
    if systemctl reload nginx; then
        success "Nginx reloaded successfully"
    else
        error_exit "Failed to reload nginx"
    fi
}

# Cleanup temporary files
cleanup() {
    if [[ -f "$TEMP_FILE" ]]; then
        rm -f "$TEMP_FILE"
        log "Cleaned up temporary files"
    fi
}

# Main execution
main() {
    log "Starting Cloudflare IP range update..."
    
    # Check prerequisites
    check_privileges
    create_backup_dir
    
    # Backup current configuration
    backup_current_config
    
    # Download and generate new configuration
    download_ip_ranges
    
    # Validate configuration before deployment
    validate_nginx_config
    
    # Deploy new configuration
    deploy_config
    
    # Final validation with new config
    validate_nginx_config
    
    # Reload nginx
    reload_nginx
    
    # Cleanup
    cleanup
    
    success "Cloudflare IP range update completed successfully!"
    log "Update process completed"
}

# Handle script interruption
trap 'error_exit "Script interrupted"' INT TERM

# Run main function
main "$@"